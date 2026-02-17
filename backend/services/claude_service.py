import json
from anthropic import Anthropic
from fastapi import HTTPException

from config import get_settings
from models.github import PRReview, FileDiff


class ClaudeService:
    def __init__(self):
        self.settings = get_settings()
        self.client = Anthropic(api_key=self.settings.anthropic_api_key)
        self.model = "claude-3-haiku-20240307"

    def _build_evaluation_prompt(self, pr_files: list[FileDiff]) -> str:
        """Build the prompt for PR evaluation."""

        # Format the file diffs for the prompt
        files_content = []
        for file in pr_files:
            files_content.append(f"""
File: {file.filename}
Status: {file.status}
Changes:
{file.patch if file.patch else "No patch available"}
---
""")

        files_text = "\n".join(files_content)

        prompt = f"""You are an expert code reviewer. Analyze the following Pull Request changes and provide a detailed evaluation.

PR Files and Changes:
{files_text}

Evaluate this PR based on the following criteria and provide your response in valid JSON format:

1. **Summary**: Provide a comprehensive summary of what this PR does, the approach taken, and overall quality assessment (2-4 sentences)

2. **Creativity Score (0-10)**: Rate the creativity and innovation in the solution
   - 0-3: Basic/mundane implementation, no creative problem-solving
   - 4-6: Standard approach with some thoughtful decisions
   - 7-8: Creative solution with innovative patterns or techniques
   - 9-10: Exceptional creativity, novel approach that elegantly solves complex problems

3. **Efficiency Score (0-10)**: Rate the code efficiency and performance considerations
   - 0-3: Inefficient code, performance issues, poor algorithm choices
   - 4-6: Acceptable efficiency, standard implementations
   - 7-8: Well-optimized code, good algorithm choices, considers performance
   - 9-10: Highly optimized, excellent performance considerations, minimal resource usage

4. **Edge Case Handling Score (0-10)**: Rate how well edge cases and error scenarios are handled
   - 0-3: No edge case handling, likely to break with unexpected input
   - 4-6: Basic error handling, covers common cases
   - 7-8: Good coverage of edge cases, proper validation and error handling
   - 9-10: Comprehensive edge case handling, defensive programming, handles all scenarios

5. **Review Comments**: **CRITICAL INSTRUCTIONS FOR LINE NUMBERS**

   You must ONLY comment on lines that are in the diff (marked with '+' at the start).

   For each issue, look at the patch and find a line that starts with '+' that contains the problematic code.
   Use that EXACT line's number.

   Example patch:
   ```
   @@ -10,4 +10,7 @@
    const greeting = "hello";
   -const x = 1;
   +const count = 0;
   +const isActive = true;
    return greeting;
   ```

   In this example:
   - Line 12 in new file: `const count = 0;` (this is a + line, you CAN comment on this)
   - Line 13 in new file: `const isActive = true;` (this is a + line, you CAN comment on this)
   - Line 11: `const greeting = "hello";` (this is a context line with space, SKIP THIS)
   - Line 14: `return greeting;` (this is a context line, SKIP THIS)

   Each comment must include:
   - path: The file path exactly as shown
   - line: The line number of a '+' line from the patch (NEW file line number)
   - body: The constructive comment text

   **DO NOT comment on:**
   - Lines that start with ' ' (space) - these are unchanged context lines
   - Lines that start with '-' - these are deleted lines
   - Lines that are not in the patch at all

   If the code is excellent with no issues, return an empty array.

**IMPORTANT**: Return ONLY valid JSON in exactly this format, no additional text:
{{
  "summary": "your detailed summary here",
  "creativity_score": 7,
  "efficiency_score": 8,
  "edge_case_handling_score": 6,
  "review_comments": [
    {{
      "path": "src/example.py",
      "line": 12,
      "body": "Consider adding validation for count to ensure it's non-negative"
    }}
  ]
}}

FINAL WARNING: Each line number MUST be from a line that starts with '+' in the patch. Verify each line number before including it."""

        return prompt

    async def evaluate_pr(self, pr_files: list[FileDiff]) -> PRReview:
        """
        Evaluate a PR using Claude API and return structured review.

        Args:
            pr_files: List of file diffs from the PR

        Returns:
            PRReview object with evaluation scores and comments

        Raises:
            HTTPException: If Claude API call fails or response is invalid
        """
        if not pr_files:
            raise HTTPException(
                status_code=400,
                detail="No files to evaluate in the PR"
            )

        prompt = self._build_evaluation_prompt(pr_files)

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                temperature=0.3,  # Lower temperature for more consistent scoring
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            # Extract the response text
            response_text = message.content[0].text

            # Parse JSON response
            try:
                response_data = json.loads(response_text)
            except json.JSONDecodeError:
                # Try to extract JSON if Claude added extra text
                import re
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    response_data = json.loads(json_match.group())
                else:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to parse Claude response as JSON: {response_text}"
                    )

            # Validate and create PRReview object
            pr_review = PRReview(**response_data)
            return pr_review

        except Exception as e:
            if isinstance(e, HTTPException):
                raise
            raise HTTPException(
                status_code=500,
                detail=f"Claude API error: {str(e)}"
            )