from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.collection import Collection, CollectionPaper
from app.models.paper import Paper
from app.models.zotero import ZoteroConfig, ZoteroPaperMapping
from app.services.zotero_service import ZoteroService, resolve_zotero_items_via_openalex

router = APIRouter(tags=["zotero"])


# --- Schemas ---

class ZoteroConfigIn(BaseModel):
    api_key: str
    library_id: str
    library_type: str = "user"


class ZoteroConfigOut(BaseModel):
    id: int
    library_id: str
    library_type: str
    last_sync_at: Optional[str] = None
    connected: bool = True


class ZoteroCollectionOut(BaseModel):
    key: str
    name: str
    parent: Optional[str] = None
    num_items: int = 0


class ZoteroPullRequest(BaseModel):
    zotero_collection_key: Optional[str] = None
    lithelper_collection_id: int


class ZoteroPushRequest(BaseModel):
    lithelper_collection_id: int
    zotero_collection_key: Optional[str] = None


class ZoteroSyncResult(BaseModel):
    total: int
    synced: int
    failed: int


# --- Helpers ---

async def _get_zotero_service(db: AsyncSession) -> ZoteroService:
    stmt = select(ZoteroConfig).order_by(ZoteroConfig.id.desc()).limit(1)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=400, detail="Zotero not configured")
    return ZoteroService(config.api_key, config.library_id, config.library_type)


# --- Endpoints ---

@router.get("/zotero/config", response_model=Optional[ZoteroConfigOut])
async def get_zotero_config(db: AsyncSession = Depends(get_db)):
    stmt = select(ZoteroConfig).order_by(ZoteroConfig.id.desc()).limit(1)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()
    if not config:
        return None
    return ZoteroConfigOut(
        id=config.id,
        library_id=config.library_id,
        library_type=config.library_type,
        last_sync_at=str(config.last_sync_at) if config.last_sync_at else None,
    )


@router.post("/zotero/config", response_model=ZoteroConfigOut)
async def set_zotero_config(body: ZoteroConfigIn, db: AsyncSession = Depends(get_db)):
    # Test connection
    try:
        svc = ZoteroService(body.api_key, body.library_id, body.library_type)
        svc.get_collections()  # Will fail if credentials are wrong
    except Exception as e:
        raise HTTPException(status_code=400, detail="Could not connect to Zotero: {}".format(str(e)))

    # Delete any existing config
    stmt = select(ZoteroConfig)
    result = await db.execute(stmt)
    for old in result.scalars().all():
        await db.delete(old)

    config = ZoteroConfig(
        api_key=body.api_key,
        library_id=body.library_id,
        library_type=body.library_type,
    )
    db.add(config)
    await db.commit()
    await db.refresh(config)
    return ZoteroConfigOut(
        id=config.id,
        library_id=config.library_id,
        library_type=config.library_type,
    )


@router.delete("/zotero/config")
async def remove_zotero_config(db: AsyncSession = Depends(get_db)):
    stmt = select(ZoteroConfig)
    result = await db.execute(stmt)
    for config in result.scalars().all():
        await db.delete(config)
    await db.commit()
    return {"ok": True}


@router.get("/zotero/collections", response_model=List[ZoteroCollectionOut])
async def list_zotero_collections(db: AsyncSession = Depends(get_db)):
    svc = await _get_zotero_service(db)
    collections = svc.get_collections()
    return [ZoteroCollectionOut(**c) for c in collections]


@router.post("/zotero/pull", response_model=ZoteroSyncResult)
async def pull_from_zotero(body: ZoteroPullRequest, db: AsyncSession = Depends(get_db)):
    """Pull items from Zotero collection → resolve via OpenAlex → add to LitHelper collection."""
    svc = await _get_zotero_service(db)

    # Get Zotero items
    if body.zotero_collection_key:
        items = svc.get_collection_items(body.zotero_collection_key)
    else:
        items = svc.get_all_items(limit=200)

    # Verify target collection exists
    coll = await db.get(Collection, body.lithelper_collection_id)
    if not coll:
        raise HTTPException(status_code=404, detail="LitHelper collection not found")

    # Resolve via OpenAlex
    resolved = await resolve_zotero_items_via_openalex(items, db)

    synced = 0
    failed = 0
    for zotero_item, openalex_id in resolved:
        if openalex_id:
            # Check if already in collection
            stmt = select(CollectionPaper).where(
                CollectionPaper.collection_id == body.lithelper_collection_id,
                CollectionPaper.paper_openalex_id == openalex_id,
            )
            existing = (await db.execute(stmt)).scalar_one_or_none()
            if not existing:
                cp = CollectionPaper(
                    collection_id=body.lithelper_collection_id,
                    paper_openalex_id=openalex_id,
                )
                db.add(cp)

            # Save mapping
            mapping_stmt = select(ZoteroPaperMapping).where(
                ZoteroPaperMapping.paper_openalex_id == openalex_id,
                ZoteroPaperMapping.zotero_item_key == zotero_item["key"],
            )
            existing_map = (await db.execute(mapping_stmt)).scalar_one_or_none()
            if not existing_map:
                mapping = ZoteroPaperMapping(
                    paper_openalex_id=openalex_id,
                    zotero_item_key=zotero_item["key"],
                    zotero_collection_key=body.zotero_collection_key,
                )
                db.add(mapping)
            synced += 1
        else:
            failed += 1

    # Update last sync
    config_stmt = select(ZoteroConfig).order_by(ZoteroConfig.id.desc()).limit(1)
    config = (await db.execute(config_stmt)).scalar_one_or_none()
    if config:
        config.last_sync_at = datetime.now(timezone.utc)

    await db.commit()

    return ZoteroSyncResult(total=len(items), synced=synced, failed=failed)


@router.post("/zotero/push", response_model=ZoteroSyncResult)
async def push_to_zotero(body: ZoteroPushRequest, db: AsyncSession = Depends(get_db)):
    """Push papers from a LitHelper collection to Zotero."""
    svc = await _get_zotero_service(db)

    # Get collection papers
    stmt = select(CollectionPaper).where(
        CollectionPaper.collection_id == body.lithelper_collection_id
    )
    result = await db.execute(stmt)
    cps = result.scalars().all()

    synced = 0
    failed = 0

    for cp in cps:
        # Check if already mapped
        mapping_stmt = select(ZoteroPaperMapping).where(
            ZoteroPaperMapping.paper_openalex_id == cp.paper_openalex_id,
        )
        existing_map = (await db.execute(mapping_stmt)).scalar_one_or_none()

        if existing_map:
            # Already in Zotero, add to collection if specified
            if body.zotero_collection_key:
                svc.add_item_to_collection(existing_map.zotero_item_key, body.zotero_collection_key)
            synced += 1
            continue

        # Create new Zotero item
        paper = await db.get(Paper, cp.paper_openalex_id)
        if not paper:
            failed += 1
            continue

        item_key = svc.create_item(paper)
        if item_key:
            # Add to collection if specified
            if body.zotero_collection_key:
                svc.add_item_to_collection(item_key, body.zotero_collection_key)

            # Save mapping
            mapping = ZoteroPaperMapping(
                paper_openalex_id=cp.paper_openalex_id,
                zotero_item_key=item_key,
                zotero_collection_key=body.zotero_collection_key,
            )
            db.add(mapping)
            synced += 1
        else:
            failed += 1

    # Update last sync
    config_stmt = select(ZoteroConfig).order_by(ZoteroConfig.id.desc()).limit(1)
    config = (await db.execute(config_stmt)).scalar_one_or_none()
    if config:
        config.last_sync_at = datetime.now(timezone.utc)

    await db.commit()

    return ZoteroSyncResult(total=len(cps), synced=synced, failed=failed)
