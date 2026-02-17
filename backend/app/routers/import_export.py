from typing import List, Optional

from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.collection import CollectionPaper
from app.services.import_export import export_bibtex, export_ris, parse_bibtex, parse_ris
from app.services.openalex import openalex_client

router = APIRouter(tags=["import_export"])


class ExportRequest(BaseModel):
    collection_id: int
    format: str = "bibtex"  # "bibtex" or "ris"


class ImportResult(BaseModel):
    total: int
    resolved: int
    failed: int
    resolved_ids: List[str]
    failed_entries: List[str]


@router.post("/export", response_class=PlainTextResponse)
async def export_collection(body: ExportRequest, db: AsyncSession = Depends(get_db)):
    """Export a collection's papers as BibTeX or RIS."""
    stmt = select(CollectionPaper.paper_openalex_id).where(
        CollectionPaper.collection_id == body.collection_id
    )
    result = await db.execute(stmt)
    paper_ids = [r[0] for r in result.all()]

    if body.format == "ris":
        content = await export_ris(paper_ids, db)
        return PlainTextResponse(content, media_type="application/x-research-info-systems")
    else:
        content = await export_bibtex(paper_ids, db)
        return PlainTextResponse(content, media_type="application/x-bibtex")


@router.post("/import", response_model=ImportResult)
async def import_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Import a BibTeX or RIS file and resolve entries via OpenAlex."""
    content = (await file.read()).decode("utf-8", errors="ignore")

    # Detect format
    entries = []
    if file.filename and file.filename.endswith(".ris"):
        entries = parse_ris(content)
    else:
        entries = parse_bibtex(content)

    resolved_ids = []
    failed_entries = []

    for entry in entries:
        doi = entry.get("doi", "")
        title = entry.get("title", "")
        openalex_id = None

        # Try DOI
        if doi:
            try:
                doi_url = doi if doi.startswith("http") else "https://doi.org/{}".format(doi)
                detail, raw = await openalex_client.get_work(doi_url)
                await openalex_client.cache_works([raw], db)
                openalex_id = detail.openalex_id
            except Exception:
                pass

        # Fallback: title search
        if not openalex_id and title:
            try:
                search_resp, raw_works = await openalex_client.search_works(title, per_page=3)
                if raw_works:
                    await openalex_client.cache_works(raw_works, db)
                for r in search_resp.results:
                    if r.title and title.lower()[:30] in r.title.lower():
                        openalex_id = r.openalex_id
                        break
                if not openalex_id and search_resp.results:
                    openalex_id = search_resp.results[0].openalex_id
            except Exception:
                pass

        if openalex_id:
            resolved_ids.append(openalex_id)
        else:
            failed_entries.append(title or doi or entry.get("key", "unknown"))

    return ImportResult(
        total=len(entries),
        resolved=len(resolved_ids),
        failed=len(failed_entries),
        resolved_ids=resolved_ids,
        failed_entries=failed_entries,
    )
