from typing import List, Optional

from pydantic import BaseModel

from app.schemas.paper import PaperSummary


class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class CollectionPaperAdd(BaseModel):
    openalex_id: str
    notes: Optional[str] = None


class CollectionPaperInfo(BaseModel):
    openalex_id: str
    added_at: Optional[str] = None
    notes: Optional[str] = None
    paper: Optional[PaperSummary] = None

    model_config = {"from_attributes": True}


class CollectionSummary(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    paper_count: int = 0
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


class CollectionDetail(CollectionSummary):
    papers: List[CollectionPaperInfo] = []
