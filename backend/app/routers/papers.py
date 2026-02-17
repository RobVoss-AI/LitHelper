from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.paper import PaperDetail, SearchResponse
from app.services.openalex import openalex_client

router = APIRouter(tags=["papers"])


@router.get("/papers/{openalex_id}", response_model=PaperDetail)
async def get_paper(
    openalex_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get full paper detail by OpenAlex ID."""
    try:
        parsed, raw = await openalex_client.get_work(openalex_id)
        await openalex_client.cache_works([raw], db)
        return parsed
    except Exception as e:
        raise HTTPException(status_code=404, detail="Paper not found: {}".format(str(e)))


@router.get("/papers/{openalex_id}/references", response_model=SearchResponse)
async def get_paper_references(
    openalex_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get papers referenced by this paper (outgoing citations)."""
    # First get the paper to find its referenced_work_ids
    paper_detail, _ = await openalex_client.get_work(openalex_id)
    ref_ids = paper_detail.referenced_work_ids

    if not ref_ids:
        from app.schemas.paper import SearchMeta
        return SearchResponse(
            meta=SearchMeta(count=0, page=1, per_page=per_page),
            results=[],
        )

    # Paginate through the reference IDs
    start = (page - 1) * per_page
    page_ids = ref_ids[start:start + per_page]

    if not page_ids:
        from app.schemas.paper import SearchMeta
        return SearchResponse(
            meta=SearchMeta(count=len(ref_ids), page=page, per_page=per_page),
            results=[],
        )

    parsed, raw = await openalex_client.batch_get_works(page_ids)
    await openalex_client.cache_works(raw, db)

    from app.schemas.paper import SearchMeta
    return SearchResponse(
        meta=SearchMeta(count=len(ref_ids), page=page, per_page=per_page),
        results=parsed,
    )


@router.get("/papers/{openalex_id}/citations", response_model=SearchResponse)
async def get_paper_citations(
    openalex_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get papers that cite this paper (incoming citations)."""
    parsed, raw = await openalex_client.get_work_citations(
        openalex_id, page=page, per_page=per_page
    )
    await openalex_client.cache_works(raw, db)
    return parsed
