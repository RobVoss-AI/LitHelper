from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.discovery import DiscoveryRequest, DiscoveryResponse
from app.services.discovery import discover_co_citation, discover_bibliographic_coupling

router = APIRouter(tags=["discovery"])


@router.post("/discovery/multi-seed", response_model=DiscoveryResponse)
async def multi_seed_discovery(body: DiscoveryRequest, db: AsyncSession = Depends(get_db)):
    if body.strategy == "bibliographic_coupling":
        results = await discover_bibliographic_coupling(
            seed_ids=body.seed_ids,
            db=db,
            max_results=body.max_results,
            citing_sample_size=body.citing_sample_size,
        )
    else:
        results = await discover_co_citation(
            seed_ids=body.seed_ids,
            db=db,
            max_results=body.max_results,
            citing_sample_size=body.citing_sample_size,
        )

    return DiscoveryResponse(
        strategy=body.strategy,
        seed_count=len(body.seed_ids),
        results=results,
    )
