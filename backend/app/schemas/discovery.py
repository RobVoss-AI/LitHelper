from typing import List, Optional

from pydantic import BaseModel

from app.schemas.paper import PaperSummary


class DiscoveryRequest(BaseModel):
    seed_ids: List[str]
    strategy: str = "co_citation"  # "co_citation" | "bibliographic_coupling"
    max_results: int = 30
    citing_sample_size: int = 100


class DiscoveryResult(BaseModel):
    paper: PaperSummary
    score: float
    overlap_seeds: int
    reason: Optional[str] = None


class DiscoveryResponse(BaseModel):
    strategy: str
    seed_count: int
    results: List[DiscoveryResult]
