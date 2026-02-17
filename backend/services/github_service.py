import httpx
from fastapi import HTTPException

from config import get_settings
from models.github import FileDiff, PRReview, ReviewComment
from models.github_pr import GithubLink
from services.claude_service import ClaudeService


class GitHubService:
    def __init__(self):
        self.settings = get_settings()
        self.api_base_url = self.settings.github_api_base_url
        self.claude_service = ClaudeService()

    def parse_pr_link(self, github_link: str) -> tuple[str, str, str]:
        """Parse GitHub PR URL to extract owner, repo, and PR number."""
        parts = github_link.rstrip("/").split("/")
        if len(parts) < 7 or parts[5] != "pull":
            raise HTTPException(
                status_code=400,
                detail="Invalid GitHub PR URL format. Expected: https://github.com/owner/repo/pull/number",
            )
        owner = parts[3]
        repo = parts[4]
        pr_number = parts[6]
        return owner, repo, pr_number

    def build_pr_files_url(self, owner: str, repo: str, pr_number: str) -> str:
        """Build the GitHub API URL for fetching PR files."""
        return f"{self.api_base_url}/repos/{owner}/{repo}/pulls/{pr_number}/files"

    async def get_pr_files(
        self, github_link: str
    ) -> tuple[str, str, str, list[FileDiff]]:
        """Fetch PR files from GitHub API."""
        owner, repo, pr_number = self.parse_pr_link(github_link)
        api_url = self.build_pr_files_url(owner, repo, pr_number)

        headers = {
            "Authorization": f"Bearer {self.settings.github_pat_token}",
            "Accept": "application/vnd.github.text+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(api_url, headers=headers)

            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="PR not found")
            if response.status_code == 401:
                print(response.json())
                raise HTTPException(status_code=401, detail="Invalid GitHub token")
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"GitHub API error: {response.text}",
                )

            pr_files = response.json()

        files = [
            FileDiff(
                filename=file["filename"],
                status=file["status"],
                patch=file.get("patch", ""),
            )
            for file in pr_files
        ]
        fetched_github_diff = await GithubLink(
            github_link=github_link,
            owner=owner,
            repo=repo,
            pr_number=pr_number,
            pr_files=files,
        ).insert()

        return fetched_github_diff

    async def evaluate_and_review_pr(
        self, github_link: str
    ) -> tuple[PRReview, list[FileDiff]]:
        """
        Fetch PR files and evaluate them using Claude API.

        Args:
            github_link: GitHub PR URL

        Returns:
            Tuple of (PRReview object with evaluation scores and comments, list of FileDiff objects)
        """
        # Fetch PR files
        fetched_github_diff = await self.get_pr_files(github_link)

        # Evaluate using Claude
        pr_review = await self.claude_service.evaluate_pr(fetched_github_diff.pr_files)

        return pr_review, fetched_github_diff.pr_files

    async def get_latest_commit_sha(self, owner: str, repo: str, pr_number: str) -> str:
        """
        Get the latest commit SHA from a PR.

        Args:
            owner: Repository owner
            repo: Repository name
            pr_number: PR number

        Returns:
            Latest commit SHA
        """
        api_url = f"{self.api_base_url}/repos/{owner}/{repo}/pulls/{pr_number}"

        headers = {
            "Authorization": f"Bearer {self.settings.github_pat_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(api_url, headers=headers)

            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="PR not found")
            if response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid GitHub token")
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"GitHub API error: {response.text}",
                )

            pr_data = response.json()
            return pr_data["head"]["sha"]

    def _calculate_diff_position(self, patch: str, target_line: int) -> int | None:
        """
        Calculate the position in the diff for a given line number.
        Position is the number of lines down from the first @@ hunk header.

        Args:
            patch: The diff patch content
            target_line: The line number in the new file

        Returns:
            The position in the diff, or None if not found
        """
        if not patch:
            return None

        lines = patch.split("\n")
        position = 0
        current_new_line = 0
        in_hunk = False
        last_valid_position = None
        closest_line = 0

        for line in lines:
            # Check for hunk header (e.g., @@ -10,5 +10,8 @@)
            if line.startswith("@@"):
                in_hunk = True
                # Extract the starting line number for new file
                # Format: @@ -old_start,old_lines +new_start,new_lines @@
                import re

                match = re.search(r"\+(\d+)", line)
                if match:
                    current_new_line = int(match.group(1)) - 1
                position = 0
                continue

            if in_hunk:
                position += 1

                # Lines starting with '+' are additions (new file)
                if line.startswith("+"):
                    current_new_line += 1
                    # Exact match
                    if current_new_line == target_line:
                        return position
                    # Track closest match for fallback
                    if abs(current_new_line - target_line) < abs(
                        closest_line - target_line
                    ):
                        closest_line = current_new_line
                        last_valid_position = position
                # Lines starting with ' ' (space) are context lines (in both files)
                elif line.startswith(" ") or (
                    not line.startswith("-") and len(line) > 0
                ):
                    current_new_line += 1
                    # Also check context lines for exact match
                    if current_new_line == target_line:
                        return position
                    # Track closest match
                    if abs(current_new_line - target_line) < abs(
                        closest_line - target_line
                    ):
                        closest_line = current_new_line
                        last_valid_position = position
                # Lines starting with '-' are deletions (old file only), don't increment new line

        # If no exact match found but we have a close match within 5 lines, use it
        if last_valid_position and abs(closest_line - target_line) <= 5:
            return last_valid_position

        return None

    async def post_general_pr_comment(
        self, owner: str, repo: str, pr_number: str, comment: str
    ) -> dict:
        """
        Post a general comment on the PR (not on a specific line).

        Args:
            owner: Repository owner
            repo: Repository name
            pr_number: PR number
            comment: Comment text

        Returns:
            GitHub API response
        """
        api_url = (
            f"{self.api_base_url}/repos/{owner}/{repo}/issues/{pr_number}/comments"
        )

        headers = {
            "Authorization": f"Bearer {self.settings.github_pat_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        payload = {"body": comment}

        async with httpx.AsyncClient() as client:
            response = await client.post(api_url, headers=headers, json=payload)

            if response.status_code not in [200, 201]:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"GitHub API error: {response.text}",
                )

            return response.json()

    async def post_pr_review_comments(
        self,
        owner: str,
        repo: str,
        pr_number: str,
        comments: list[ReviewComment],
        pr_files: list[FileDiff],
    ) -> dict:
        """
        Post review comments on specific lines in a PR diff.
        If line-specific comments fail, falls back to posting a general comment.

        Args:
            owner: Repository owner
            repo: Repository name
            pr_number: PR number
            comments: List of ReviewComment objects with path, line, and body
            pr_files: List of FileDiff objects to calculate diff positions

        Returns:
            GitHub API response
        """
        if not comments:
            return {"message": "No comments to post"}

        # Get the latest commit SHA
        commit_sha = await self.get_latest_commit_sha(owner, repo, pr_number)

        api_url = f"{self.api_base_url}/repos/{owner}/{repo}/pulls/{pr_number}/reviews"

        headers = {
            "Authorization": f"Bearer {self.settings.github_pat_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        # Format comments for GitHub API using line + side (simpler than position)
        github_comments = []

        for comment in comments:
            github_comments.append(
                {
                    "path": comment.path,
                    "line": comment.line,
                    "side": "RIGHT",  # RIGHT side means the new version after changes
                    "body": comment.body,
                }
            )
            print(f"✓ Using line {comment.line} for {comment.path}")

        print(f"Posting {len(github_comments)} inline comments in single review")

        payload = {
            "commit_id": commit_sha,
            "body": "AI Code Review by xEPAS",
            "event": "COMMENT",
            "comments": github_comments,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(api_url, headers=headers, json=payload)

            # If line-specific comments fail, fall back to general comment
            if response.status_code == 422:
                print(f"422 Error posting inline comments: {response.text}")
                # Format all comments as a single general comment
                general_comment = "## AI Code Review by xEPAS\n\n"
                for comment in comments:
                    general_comment += (
                        f"**{comment.path}:L{comment.line}**\n{comment.body}\n\n"
                    )

                return await self.post_general_pr_comment(
                    owner, repo, pr_number, general_comment
                )

            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="PR not found")
            if response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid GitHub token")
            if response.status_code not in [200, 201]:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"GitHub API error: {response.text}",
                )

            print(f"✓ Successfully posted {len(github_comments)} inline comments")
            result = response.json()

            return result