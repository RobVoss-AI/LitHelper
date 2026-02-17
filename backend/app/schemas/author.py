from typing import List, Optional

from pydantic import BaseModel

from app.schemas.paper import PaperSummary


class AuthorSearchResult(BaseModel):
    openalex_id: str
    display_name: str
    works_count: int = 0
    cited_by_count: int = 0
    institution: Optional[str] = None


class AuthorSearchResponse(BaseModel):
    count: int
    results: List[AuthorSearchResult]


class TrackedAuthorOut(BaseModel):
    id: int
    openalex_id: str
    display_name: str
    works_count: int = 0
    cited_by_count: int = 0
    institution: Optional[str] = None
    last_known_work_date: Optional[str] = None
    created_at: Optional[str] = None


class TrackAuthorRequest(BaseModel):
    openalex_id: str
    display_name: str
    works_count: int = 0
    cited_by_count: int = 0
    institution: Optional[str] = None


class AuthorWorksResponse(BaseModel):
    author: AuthorSearchResult
    works: List[PaperSummary]
    total_count: int
    has_new: bool = False
    new_works: List[PaperSummary] = []
