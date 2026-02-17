from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.graph import GraphBuildRequest, GraphData, GraphExpandRequest
from app.services.citation_graph import graph_builder
from app.services.openalex import openalex_client

router = APIRouter(tags=["graph"])


@router.post("/graph/build", response_model=GraphData)
async def build_graph(
    request: GraphBuildRequest,
    db: AsyncSession = Depends(get_db),
):
    """Build a citation network graph from seed papers."""
    result = await graph_builder.build_graph(
        seed_ids=request.seed_ids,
        depth=min(request.depth, 3),
        max_nodes=min(request.max_nodes, 1000),
        direction=request.direction,
    )
    return result


@router.post("/graph/expand", response_model=GraphData)
async def expand_node(
    request: GraphExpandRequest,
    db: AsyncSession = Depends(get_db),
):
    """Expand a single node in the graph, returning new nodes and edges."""
    result = await graph_builder.expand_node(
        node_id=request.node_id,
        existing_ids=request.existing_ids,
        direction=request.direction,
    )
    return result
