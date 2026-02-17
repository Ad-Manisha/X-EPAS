from datetime import datetime
from uuid import UUID, uuid4

from beanie import Document
from pydantic import Field

from models.github import FileDiff

class GithubLink(Document):
    id: UUID = Field(default_factory=uuid4)
    github_link: str
    owner: str
    repo: str
    pr_number: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    pr_files: list[FileDiff] = Field(default_factory=list)
    class Settings:
        collection = "github_links"