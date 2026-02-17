from fastapi import APIRouter, Depends

from models.github import PRReviewRequest, PRReview
from services.github_service import GitHubService
from models.github_pr import GithubLink
router = APIRouter(prefix="/github", tags=["github"])


def get_github_service() -> GitHubService:
    return GitHubService()


@router.post("/pr/files", response_model=GithubLink)
async def get_pr_files(
    request: PRReviewRequest,
    github_service: GitHubService = Depends(get_github_service)
):
    """Fetch files changed in a GitHub PR for review."""
    response = await github_service.get_pr_files(request.github_link)
    return response


@router.post("/pr/evaluate-and-comment")
async def evaluate_and_comment_pr(
    request: PRReviewRequest,
    github_service: GitHubService = Depends(get_github_service)
):
    """
    Evaluate a GitHub PR using Claude AI and automatically post review comments on specific lines in the diff.

    Returns:
    - review: The PR evaluation results with scores and line-specific comments
    - comments_posted: Boolean indicating if comments were posted
    - review_url: URL of the posted review (if posted)
    """
    # Evaluate the PR
    pr_review, pr_files = await github_service.evaluate_and_review_pr(request.github_link)

    # Parse the GitHub link to get owner, repo, pr_number
    owner, repo, pr_number = github_service.parse_pr_link(request.github_link)

    comments_posted = False
    review_url = None

    # Post review comments if there are any
    if pr_review.review_comments:
        review_response = await github_service.post_pr_review_comments(
            owner=owner,
            repo=repo,
            pr_number=pr_number,
            comments=pr_review.review_comments,
            pr_files=pr_files
        )
        comments_posted = True
        review_url = review_response.get("html_url")

    return {
        "review": pr_review,
        "comments_posted": comments_posted,
        "review_url": review_url,
        "total_comments": len(pr_review.review_comments)
    }