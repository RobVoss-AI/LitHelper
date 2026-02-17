from typing import List

from pydantic import BaseModel


class GraphNode(BaseModel):
    id: str
    title: str
    publication_year: int = 0
    cited_by_count: int = 0
    authors: List[str] = []
    is_seed: bool = False
    depth: int = 0


class GraphEdge(BaseModel):
    source: str
    target: str


class GraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


class GraphBuildRequest(BaseModel):
    seed_ids: List[str]
    depth: int = 1
    max_nodes: int = 500
    direction: str = "both"  # "references", "citations", or "both"


class GraphExpandRequest(BaseModel):
    node_id: str
    existing_ids: List[str] = []
    direction: str = "both"
