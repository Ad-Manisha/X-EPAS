from uuid import UUID, uuid4
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime

class PRReviewRequest(BaseModel):
    github_link: str


class FileDiff(BaseModel):
    filename: str
    status: str
    patch: str


class ReviewComment(BaseModel):
    """Model for a single review comment on a specific line."""
    path: str = Field(..., description="File path")
    line: int = Field(..., description="Line number in the diff")
    body: str = Field(..., description="Comment text")


class PRReview(BaseModel):
    """Model for PR evaluation response from Claude."""
    summary: str = Field(..., description="Summary of the PR changes and overall assessment")
    creativity_score: int = Field(..., ge=0, le=10, description="Creativity score from 0-10")
    efficiency_score: int = Field(..., ge=0, le=10, description="Efficiency score from 0-10")
    edge_case_handling_score: int = Field(..., ge=0, le=10, description="Edge case handling score from 0-10")
    review_comments: list[ReviewComment] = Field(default_factory=list, description="List of line-specific comments to post on the PR diff")