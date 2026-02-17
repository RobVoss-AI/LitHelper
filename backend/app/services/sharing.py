"""JSON bundle export/import for sharing collections with friends."""

import json
from typing import Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.collection import Collection, CollectionPaper
from app.models.paper import Paper


async def export_collection_bundle(collection_id: int, db: AsyncSession) -> Dict:
    """Export a collection as a JSON bundle with all paper data."""
    stmt = (
        select(Collection)
        .where(Collection.id == collection_id)
        .options(selectinload(Collection.papers))
    )
    result = await db.execute(stmt)
    coll = result.scalar_one_or_none()
    if not coll:
        return {}

    papers = []
    for cp in coll.papers:
        paper = await db.get(Paper, cp.paper_openalex_id)
        if paper:
            papers.append({
                "openalex_id": paper.openalex_id,
                "doi": paper.doi,
                "title": paper.title,
                "publication_year": paper.publication_year,
                "publication_date": paper.publication_date,
                "cited_by_count": paper.cited_by_count,
                "type": paper.type,
                "authorships_json": paper.authorships_json,
                "primary_location_json": paper.primary_location_json,
                "open_access_json": paper.open_access_json,
                "topics_json": paper.topics_json,
                "referenced_work_ids": paper.referenced_work_ids,
                "notes": cp.notes,
            })

    return {
        "format": "lithelper_bundle",
        "version": 1,
        "collection": {
            "name": coll.name,
            "description": coll.description,
        },
        "papers": papers,
    }


async def import_collection_bundle(bundle: Dict, db: AsyncSession) -> Optional[int]:
    """Import a JSON bundle, creating a collection with papers."""
    if bundle.get("format") != "lithelper_bundle":
        return None

    coll_data = bundle.get("collection", {})
    coll = Collection(
        name=coll_data.get("name", "Imported Collection"),
        description=coll_data.get("description"),
    )
    db.add(coll)
    await db.flush()

    papers_data = bundle.get("papers", [])
    for p in papers_data:
        oa_id = p.get("openalex_id", "")
        if not oa_id:
            continue

        # Upsert paper
        existing = await db.get(Paper, oa_id)
        if not existing:
            paper = Paper(
                openalex_id=oa_id,
                doi=p.get("doi"),
                title=p.get("title", "Untitled"),
                publication_year=p.get("publication_year"),
                publication_date=p.get("publication_date"),
                cited_by_count=p.get("cited_by_count", 0),
                type=p.get("type"),
                authorships_json=p.get("authorships_json"),
                primary_location_json=p.get("primary_location_json"),
                open_access_json=p.get("open_access_json"),
                topics_json=p.get("topics_json"),
                referenced_work_ids=p.get("referenced_work_ids"),
            )
            db.add(paper)

        cp = CollectionPaper(
            collection_id=coll.id,
            paper_openalex_id=oa_id,
            notes=p.get("notes"),
        )
        db.add(cp)

    await db.commit()
    return coll.id
