from typing import Dict, List, Optional

from pydantic import BaseModel


class AuthorShip(BaseModel):
    author_id: Optional[str] = None
    author_name: str = ""
    institution: Optional[str] = None


class PaperSummary(BaseModel):
    openalex_id: str
    doi: Optional[str] = None
    title: str
    publication_year: Optional[int] = None
    cited_by_count: int = 0
    authors: List[AuthorShip] = []
    type: Optional[str] = None
    is_open_access: bool = False
    source_name: Optional[str] = None

    model_config = {"from_attributes": True}


class PaperDetail(PaperSummary):
    publication_date: Optional[str] = None
    abstract_inverted_index: Optional[Dict] = None
    topics: List[Dict] = []
    referenced_work_ids: List[str] = []


class SearchMeta(BaseModel):
    count: int
    page: int
    per_page: int


class SearchResponse(BaseModel):
    meta: SearchMeta
    results: List[PaperSummary]
