from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.author import TrackedAuthor
from app.schemas.author import (
    AuthorSearchResult, AuthorSearchResponse, TrackedAuthorOut,
    TrackAuthorRequest, AuthorWorksResponse,
)
from app.services.openalex import openalex_client

router = APIRouter(tags=["authors"])


@router.get("/authors/search", response_model=AuthorSearchResponse)
async def search_authors(q: str, page: int = 1, per_page: int = 25):
    data = await openalex_client.search_authors(q, page=page, per_page=per_page)
    meta = data.get("meta", {})
    results = []
    for a in data.get("results", []):
        institutions = a.get("last_known_institutions") or []
        inst_name = institutions[0].get("display_name") if institutions else None
        results.append(AuthorSearchResult(
            openalex_id=a.get("id", ""),
            display_name=a.get("display_name", ""),
            works_count=a.get("works_count", 0),
            cited_by_count=a.get("cited_by_count", 0),
            institution=inst_name,
        ))
    return AuthorSearchResponse(count=meta.get("count", 0), results=results)


@router.get("/authors/{openalex_id}/works", response_model=AuthorWorksResponse)
async def get_author_works(
    openalex_id: str,
    page: int = 1,
    per_page: int = 25,
    db: AsyncSession = Depends(get_db),
):
    # Get author info
    author_data = await openalex_client.search_authors("", page=1, per_page=1)
    # Fetch author works
    resp, raw_works = await openalex_client.get_author_works(
        openalex_id, page=page, per_page=per_page,
    )
    await openalex_client.cache_works(raw_works, db)

    # Check for new works if author is tracked
    stmt = select(TrackedAuthor).where(TrackedAuthor.openalex_id == openalex_id)
    tracked = (await db.execute(stmt)).scalar_one_or_none()

    has_new = False
    new_works = []
    if tracked and tracked.last_known_work_date:
        for w in resp.results:
            # Simple date comparison: works from after last known date
            if w.publication_year and tracked.last_known_work_date:
                try:
                    last_year = int(tracked.last_known_work_date[:4])
                    if w.publication_year > last_year:
                        new_works.append(w)
                        has_new = True
                except (ValueError, IndexError):
                    pass

    author_info = AuthorSearchResult(
        openalex_id=openalex_id,
        display_name=tracked.display_name if tracked else "Author",
        works_count=tracked.works_count if tracked else 0,
        cited_by_count=tracked.cited_by_count if tracked else 0,
        institution=tracked.institution if tracked else None,
    )

    return AuthorWorksResponse(
        author=author_info,
        works=resp.results,
        total_count=resp.meta.count,
        has_new=has_new,
        new_works=new_works,
    )


@router.get("/authors/tracked", response_model=List[TrackedAuthorOut])
async def list_tracked_authors(db: AsyncSession = Depends(get_db)):
    stmt = select(TrackedAuthor).order_by(TrackedAuthor.display_name)
    result = await db.execute(stmt)
    authors = result.scalars().all()
    return [
        TrackedAuthorOut(
            id=a.id,
            openalex_id=a.openalex_id,
            display_name=a.display_name,
            works_count=a.works_count,
            cited_by_count=a.cited_by_count,
            institution=a.institution,
            last_known_work_date=a.last_known_work_date,
            created_at=str(a.created_at) if a.created_at else None,
        )
        for a in authors
    ]


@router.post("/authors/tracked", response_model=TrackedAuthorOut)
async def track_author(body: TrackAuthorRequest, db: AsyncSession = Depends(get_db)):
    # Check if already tracked
    stmt = select(TrackedAuthor).where(TrackedAuthor.openalex_id == body.openalex_id)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Author already tracked")

    # Get latest work date
    resp, raw_works = await openalex_client.get_author_works(
        body.openalex_id, page=1, per_page=1,
    )
    last_date = None
    if resp.results:
        w = resp.results[0]
        if w.publication_year:
            last_date = str(w.publication_year)

    author = TrackedAuthor(
        openalex_id=body.openalex_id,
        display_name=body.display_name,
        works_count=body.works_count,
        cited_by_count=body.cited_by_count,
        institution=body.institution,
        last_known_work_date=last_date,
    )
    db.add(author)
    await db.commit()
    await db.refresh(author)
    return TrackedAuthorOut(
        id=author.id,
        openalex_id=author.openalex_id,
        display_name=author.display_name,
        works_count=author.works_count,
        cited_by_count=author.cited_by_count,
        institution=author.institution,
        last_known_work_date=author.last_known_work_date,
        created_at=str(author.created_at) if author.created_at else None,
    )


@router.delete("/authors/tracked/{author_id}")
async def untrack_author(author_id: int, db: AsyncSession = Depends(get_db)):
    author = await db.get(TrackedAuthor, author_id)
    if not author:
        raise HTTPException(status_code=404, detail="Tracked author not found")
    await db.delete(author)
    await db.commit()
    return {"ok": True}
