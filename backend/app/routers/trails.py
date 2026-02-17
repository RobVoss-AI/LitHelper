from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.trail import SearchTrail, SearchTrailStep
from app.schemas.trail import (
    TrailCreate, TrailSummary, TrailDetail, TrailStepOut, TrailAddStep,
)

router = APIRouter(tags=["trails"])


@router.get("/trails", response_model=List[TrailSummary])
async def list_trails(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(
            SearchTrail.id,
            SearchTrail.name,
            SearchTrail.created_at,
            SearchTrail.updated_at,
            sqlfunc.count(SearchTrailStep.id).label("step_count"),
        )
        .outerjoin(SearchTrailStep)
        .group_by(SearchTrail.id)
        .order_by(SearchTrail.updated_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()
    return [
        TrailSummary(
            id=r.id,
            name=r.name,
            step_count=r.step_count,
            created_at=str(r.created_at) if r.created_at else None,
            updated_at=str(r.updated_at) if r.updated_at else None,
        )
        for r in rows
    ]


@router.post("/trails", response_model=TrailDetail)
async def create_trail(body: TrailCreate, db: AsyncSession = Depends(get_db)):
    trail = SearchTrail(name=body.name)
    db.add(trail)
    await db.commit()
    await db.refresh(trail)
    return TrailDetail(
        id=trail.id,
        name=trail.name,
        step_count=0,
        created_at=str(trail.created_at) if trail.created_at else None,
        updated_at=str(trail.updated_at) if trail.updated_at else None,
        steps=[],
    )


@router.get("/trails/{trail_id}", response_model=TrailDetail)
async def get_trail(trail_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(SearchTrail)
        .where(SearchTrail.id == trail_id)
        .options(selectinload(SearchTrail.steps))
    )
    result = await db.execute(stmt)
    trail = result.scalar_one_or_none()
    if not trail:
        raise HTTPException(status_code=404, detail="Trail not found")

    steps = [
        TrailStepOut(
            id=s.id,
            step_order=s.step_order,
            step_type=s.step_type,
            payload=s.payload,
            result_snapshot=s.result_snapshot,
            created_at=str(s.created_at) if s.created_at else None,
        )
        for s in trail.steps
    ]
    return TrailDetail(
        id=trail.id,
        name=trail.name,
        step_count=len(steps),
        created_at=str(trail.created_at) if trail.created_at else None,
        updated_at=str(trail.updated_at) if trail.updated_at else None,
        steps=steps,
    )


@router.delete("/trails/{trail_id}")
async def delete_trail(trail_id: int, db: AsyncSession = Depends(get_db)):
    trail = await db.get(SearchTrail, trail_id)
    if not trail:
        raise HTTPException(status_code=404, detail="Trail not found")
    await db.delete(trail)
    await db.commit()
    return {"ok": True}


@router.post("/trails/{trail_id}/steps", response_model=TrailStepOut)
async def add_trail_step(
    trail_id: int, body: TrailAddStep, db: AsyncSession = Depends(get_db)
):
    trail = await db.get(SearchTrail, trail_id)
    if not trail:
        raise HTTPException(status_code=404, detail="Trail not found")

    # Get next step order
    stmt = select(sqlfunc.max(SearchTrailStep.step_order)).where(
        SearchTrailStep.trail_id == trail_id
    )
    max_order = (await db.execute(stmt)).scalar() or 0

    step = SearchTrailStep(
        trail_id=trail_id,
        step_order=max_order + 1,
        step_type=body.step_type,
        payload=body.payload,
        result_snapshot=body.result_snapshot,
    )
    db.add(step)
    await db.commit()
    await db.refresh(step)
    return TrailStepOut(
        id=step.id,
        step_order=step.step_order,
        step_type=step.step_type,
        payload=step.payload,
        result_snapshot=step.result_snapshot,
        created_at=str(step.created_at) if step.created_at else None,
    )
