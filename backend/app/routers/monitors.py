from datetime import datetime, timezone
from typing import List, Set

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.monitor import MonitoredSearch, MonitoredSearchResult
from app.schemas.monitor import (
    MonitorCreate, MonitorSummary, MonitorDetail, MonitorResultOut,
)
from app.services.openalex import openalex_client

router = APIRouter(tags=["monitors"])


@router.get("/monitors", response_model=List[MonitorSummary])
async def list_monitors(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(
            MonitoredSearch.id,
            MonitoredSearch.name,
            MonitoredSearch.query,
            MonitoredSearch.check_interval_hours,
            MonitoredSearch.last_checked_at,
            MonitoredSearch.known_result_count,
            MonitoredSearch.created_at,
            sqlfunc.count(MonitoredSearchResult.id).filter(
                MonitoredSearchResult.is_read == False  # noqa: E712
            ).label("unread_count"),
        )
        .outerjoin(MonitoredSearchResult)
        .group_by(MonitoredSearch.id)
        .order_by(MonitoredSearch.updated_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()
    return [
        MonitorSummary(
            id=r.id,
            name=r.name,
            query=r.query,
            check_interval_hours=r.check_interval_hours,
            last_checked_at=str(r.last_checked_at) if r.last_checked_at else None,
            known_result_count=r.known_result_count,
            unread_count=r.unread_count,
            created_at=str(r.created_at) if r.created_at else None,
        )
        for r in rows
    ]


@router.post("/monitors", response_model=MonitorSummary)
async def create_monitor(body: MonitorCreate, db: AsyncSession = Depends(get_db)):
    monitor = MonitoredSearch(
        name=body.name,
        query=body.query,
        filters=body.filters,
        check_interval_hours=body.check_interval_hours,
    )
    db.add(monitor)
    await db.commit()
    await db.refresh(monitor)
    return MonitorSummary(
        id=monitor.id,
        name=monitor.name,
        query=monitor.query,
        check_interval_hours=monitor.check_interval_hours,
        known_result_count=0,
        unread_count=0,
        created_at=str(monitor.created_at) if monitor.created_at else None,
    )


@router.get("/monitors/{monitor_id}", response_model=MonitorDetail)
async def get_monitor(monitor_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(MonitoredSearch)
        .where(MonitoredSearch.id == monitor_id)
        .options(selectinload(MonitoredSearch.results))
    )
    result = await db.execute(stmt)
    monitor = result.scalar_one_or_none()
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")

    results_out = [
        MonitorResultOut(
            id=r.id,
            paper_openalex_id=r.paper_openalex_id,
            paper_title=r.paper_title,
            is_read=r.is_read,
            found_at=str(r.found_at) if r.found_at else None,
        )
        for r in sorted(monitor.results, key=lambda x: x.found_at or datetime.min, reverse=True)
    ]
    unread = sum(1 for r in results_out if not r.is_read)

    return MonitorDetail(
        id=monitor.id,
        name=monitor.name,
        query=monitor.query,
        check_interval_hours=monitor.check_interval_hours,
        last_checked_at=str(monitor.last_checked_at) if monitor.last_checked_at else None,
        known_result_count=monitor.known_result_count,
        unread_count=unread,
        created_at=str(monitor.created_at) if monitor.created_at else None,
        filters=monitor.filters,
        results=results_out,
    )


@router.delete("/monitors/{monitor_id}")
async def delete_monitor(monitor_id: int, db: AsyncSession = Depends(get_db)):
    monitor = await db.get(MonitoredSearch, monitor_id)
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    await db.delete(monitor)
    await db.commit()
    return {"ok": True}


@router.post("/monitors/{monitor_id}/check", response_model=MonitorDetail)
async def check_monitor(monitor_id: int, db: AsyncSession = Depends(get_db)):
    """Force-check a monitored search for new results."""
    stmt = (
        select(MonitoredSearch)
        .where(MonitoredSearch.id == monitor_id)
        .options(selectinload(MonitoredSearch.results))
    )
    result = await db.execute(stmt)
    monitor = result.scalar_one_or_none()
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")

    # Get current known paper IDs
    known_ids: Set[str] = {r.paper_openalex_id for r in monitor.results}

    # Search OpenAlex
    filters = monitor.filters or {}
    resp, raw_works = await openalex_client.search_works(
        query=monitor.query,
        year_min=filters.get("year_min"),
        year_max=filters.get("year_max"),
        work_type=filters.get("type"),
        per_page=50,
    )
    await openalex_client.cache_works(raw_works, db)

    # Find new results
    new_count = 0
    for paper in resp.results:
        if paper.openalex_id not in known_ids:
            new_result = MonitoredSearchResult(
                monitor_id=monitor.id,
                paper_openalex_id=paper.openalex_id,
                paper_title=paper.title,
            )
            db.add(new_result)
            new_count += 1

    monitor.last_checked_at = datetime.now(timezone.utc)
    monitor.known_result_count = resp.meta.count
    await db.commit()

    # Reload for response
    return await get_monitor(monitor_id, db)


@router.post("/monitors/{monitor_id}/results/{result_id}/read")
async def mark_result_read(monitor_id: int, result_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.get(MonitoredSearchResult, result_id)
    if not result or result.monitor_id != monitor_id:
        raise HTTPException(status_code=404, detail="Result not found")
    result.is_read = True
    await db.commit()
    return {"ok": True}
