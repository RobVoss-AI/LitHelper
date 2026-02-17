from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.paper import SearchResponse
from app.services.openalex import openalex_client

router = APIRouter(tags=["search"])


@router.get("/search/works", response_model=SearchResponse)
async def search_works(
    q: str = Query(..., min_length=1, description="Search query"),
    year_min: Optional[int] = Query(None, description="Minimum publication year"),
    year_max: Optional[int] = Query(None, description="Maximum publication year"),
    type: Optional[str] = Query(None, description="Work type filter (article, preprint, etc.)"),
    sort: str = Query("relevance_score:desc", description="Sort order"),
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Search for academic papers via OpenAlex."""
    parsed, raw_works = await openalex_client.search_works(
        query=q,
        year_min=year_min,
        year_max=year_max,
        work_type=type,
        sort=sort,
        page=page,
        per_page=per_page,
    )
    # Cache results in local DB
    await openalex_client.cache_works(raw_works, db)
    return parsed
