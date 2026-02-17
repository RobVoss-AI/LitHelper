from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.collection import Collection, CollectionPaper
from app.models.paper import Paper
from app.schemas.collection import (
    CollectionCreate, CollectionUpdate, CollectionPaperAdd,
    CollectionSummary, CollectionDetail, CollectionPaperInfo,
)
from app.schemas.paper import AuthorShip, PaperSummary

router = APIRouter(tags=["collections"])


def _paper_to_summary(paper: Paper) -> PaperSummary:
    authors = []
    if paper.authorships_json:
        for a in paper.authorships_json:
            author = a.get("author", {})
            institutions = a.get("institutions", [])
            authors.append(AuthorShip(
                author_id=author.get("id"),
                author_name=author.get("display_name", ""),
                institution=institutions[0].get("display_name") if institutions else None,
            ))
    oa = paper.open_access_json or {}
    loc = paper.primary_location_json or {}
    source = loc.get("source") or {}
    return PaperSummary(
        openalex_id=paper.openalex_id,
        doi=paper.doi,
        title=paper.title,
        publication_year=paper.publication_year,
        cited_by_count=paper.cited_by_count,
        authors=authors,
        type=paper.type,
        is_open_access=oa.get("is_oa", False),
        source_name=source.get("display_name"),
    )


@router.get("/collections", response_model=List[CollectionSummary])
async def list_collections(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(
            Collection.id,
            Collection.name,
            Collection.description,
            Collection.created_at,
            sqlfunc.count(CollectionPaper.id).label("paper_count"),
        )
        .outerjoin(CollectionPaper)
        .group_by(Collection.id)
        .order_by(Collection.updated_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()
    return [
        CollectionSummary(
            id=r.id,
            name=r.name,
            description=r.description,
            paper_count=r.paper_count,
            created_at=str(r.created_at) if r.created_at else None,
        )
        for r in rows
    ]


@router.post("/collections", response_model=CollectionSummary)
async def create_collection(body: CollectionCreate, db: AsyncSession = Depends(get_db)):
    coll = Collection(name=body.name, description=body.description)
    db.add(coll)
    await db.commit()
    await db.refresh(coll)
    return CollectionSummary(
        id=coll.id,
        name=coll.name,
        description=coll.description,
        paper_count=0,
        created_at=str(coll.created_at) if coll.created_at else None,
    )


@router.get("/collections/{collection_id}", response_model=CollectionDetail)
async def get_collection(collection_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Collection)
        .where(Collection.id == collection_id)
        .options(selectinload(Collection.papers).selectinload(CollectionPaper.paper))
    )
    result = await db.execute(stmt)
    coll = result.scalar_one_or_none()
    if not coll:
        raise HTTPException(status_code=404, detail="Collection not found")

    papers_info = []
    for cp in coll.papers:
        info = CollectionPaperInfo(
            openalex_id=cp.paper_openalex_id,
            added_at=str(cp.added_at) if cp.added_at else None,
            notes=cp.notes,
            paper=_paper_to_summary(cp.paper) if cp.paper else None,
        )
        papers_info.append(info)

    return CollectionDetail(
        id=coll.id,
        name=coll.name,
        description=coll.description,
        paper_count=len(papers_info),
        created_at=str(coll.created_at) if coll.created_at else None,
        papers=papers_info,
    )


@router.put("/collections/{collection_id}", response_model=CollectionSummary)
async def update_collection(
    collection_id: int, body: CollectionUpdate, db: AsyncSession = Depends(get_db)
):
    coll = await db.get(Collection, collection_id)
    if not coll:
        raise HTTPException(status_code=404, detail="Collection not found")
    if body.name is not None:
        coll.name = body.name
    if body.description is not None:
        coll.description = body.description
    await db.commit()
    await db.refresh(coll)
    count_stmt = select(sqlfunc.count(CollectionPaper.id)).where(
        CollectionPaper.collection_id == collection_id
    )
    paper_count = (await db.execute(count_stmt)).scalar() or 0
    return CollectionSummary(
        id=coll.id,
        name=coll.name,
        description=coll.description,
        paper_count=paper_count,
        created_at=str(coll.created_at) if coll.created_at else None,
    )


@router.delete("/collections/{collection_id}")
async def delete_collection(collection_id: int, db: AsyncSession = Depends(get_db)):
    coll = await db.get(Collection, collection_id)
    if not coll:
        raise HTTPException(status_code=404, detail="Collection not found")
    await db.delete(coll)
    await db.commit()
    return {"ok": True}


@router.post("/collections/{collection_id}/papers", response_model=CollectionPaperInfo)
async def add_paper_to_collection(
    collection_id: int, body: CollectionPaperAdd, db: AsyncSession = Depends(get_db)
):
    coll = await db.get(Collection, collection_id)
    if not coll:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Check if already added
    stmt = select(CollectionPaper).where(
        CollectionPaper.collection_id == collection_id,
        CollectionPaper.paper_openalex_id == body.openalex_id,
    )
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Paper already in collection")

    cp = CollectionPaper(
        collection_id=collection_id,
        paper_openalex_id=body.openalex_id,
        notes=body.notes,
    )
    db.add(cp)
    await db.commit()
    await db.refresh(cp)
    return CollectionPaperInfo(
        openalex_id=cp.paper_openalex_id,
        added_at=str(cp.added_at) if cp.added_at else None,
        notes=cp.notes,
    )


@router.delete("/collections/{collection_id}/papers/{openalex_id}")
async def remove_paper_from_collection(
    collection_id: int, openalex_id: str, db: AsyncSession = Depends(get_db)
):
    stmt = select(CollectionPaper).where(
        CollectionPaper.collection_id == collection_id,
        CollectionPaper.paper_openalex_id == openalex_id,
    )
    cp = (await db.execute(stmt)).scalar_one_or_none()
    if not cp:
        raise HTTPException(status_code=404, detail="Paper not in collection")
    await db.delete(cp)
    await db.commit()
    return {"ok": True}
