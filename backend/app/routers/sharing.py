from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.sharing import export_collection_bundle, import_collection_bundle

router = APIRouter(tags=["sharing"])


@router.get("/sharing/export/{collection_id}")
async def export_bundle(collection_id: int, db: AsyncSession = Depends(get_db)):
    """Export a collection as a JSON bundle for sharing."""
    bundle = await export_collection_bundle(collection_id, db)
    if not bundle:
        raise HTTPException(status_code=404, detail="Collection not found")
    return JSONResponse(content=bundle)


@router.post("/sharing/import")
async def import_bundle(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """Import a JSON bundle from a friend."""
    import json
    content = (await file.read()).decode("utf-8")
    try:
        bundle = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")

    collection_id = await import_collection_bundle(bundle, db)
    if collection_id is None:
        raise HTTPException(status_code=400, detail="Invalid bundle format")
    return {"ok": True, "collection_id": collection_id}
