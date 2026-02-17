"""Zotero two-way sync service using pyzotero."""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from pyzotero import zotero
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.paper import Paper
from app.models.zotero import ZoteroConfig, ZoteroPaperMapping
from app.services.openalex import openalex_client


class ZoteroService:
    def __init__(self, api_key: str, library_id: str, library_type: str = "user"):
        self.zot = zotero.Zotero(library_id, library_type, api_key)

    def get_collections(self) -> List[Dict]:
        """Get all Zotero collections."""
        collections = self.zot.collections()
        return [
            {
                "key": c["key"],
                "name": c["data"]["name"],
                "parent": c["data"].get("parentCollection", None),
                "num_items": c["meta"].get("numItems", 0),
            }
            for c in collections
        ]

    def get_collection_items(self, collection_key: str) -> List[Dict]:
        """Get items from a Zotero collection."""
        items = self.zot.collection_items(collection_key, itemType="-attachment")
        return self._parse_items(items)

    def get_all_items(self, limit: int = 100) -> List[Dict]:
        """Get top-level items from library."""
        items = self.zot.top(limit=limit, itemType="-attachment")
        return self._parse_items(items)

    def _parse_items(self, items: list) -> List[Dict]:
        """Parse Zotero items into simplified dicts."""
        results = []
        for item in items:
            data = item.get("data", {})
            creators = data.get("creators", [])
            author_names = []
            for c in creators:
                name = c.get("name", "")
                if not name:
                    first = c.get("firstName", "")
                    last = c.get("lastName", "")
                    name = "{} {}".format(first, last).strip()
                if name:
                    author_names.append(name)

            results.append({
                "key": item.get("key", ""),
                "title": data.get("title", ""),
                "doi": data.get("DOI", ""),
                "year": data.get("date", "")[:4] if data.get("date") else "",
                "authors": author_names,
                "item_type": data.get("itemType", ""),
                "journal": data.get("publicationTitle", ""),
            })
        return results

    def create_item(self, paper: Paper) -> Optional[str]:
        """Create a Zotero item from a Paper. Returns the item key."""
        creators = []
        if paper.authorships_json:
            for a in paper.authorships_json:
                author = a.get("author", {})
                name = author.get("display_name", "")
                if name:
                    parts = name.rsplit(" ", 1)
                    if len(parts) == 2:
                        creators.append({
                            "creatorType": "author",
                            "firstName": parts[0],
                            "lastName": parts[1],
                        })
                    else:
                        creators.append({
                            "creatorType": "author",
                            "name": name,
                        })

        doi = paper.doi or ""
        if doi.startswith("https://doi.org/"):
            doi = doi[len("https://doi.org/"):]

        loc = paper.primary_location_json or {}
        source = loc.get("source") or {}

        item_data = {
            "itemType": "journalArticle",
            "title": paper.title or "",
            "creators": creators,
            "DOI": doi,
            "date": paper.publication_date or str(paper.publication_year or ""),
            "publicationTitle": source.get("display_name", ""),
        }

        try:
            resp = self.zot.create_items([item_data])
            if resp.get("successful"):
                first_key = list(resp["successful"].values())[0]["key"]
                return first_key
        except Exception:
            pass
        return None

    def add_item_to_collection(self, item_key: str, collection_key: str) -> bool:
        """Add an existing item to a collection."""
        try:
            self.zot.addto_collection(collection_key, [{"key": item_key}])
            return True
        except Exception:
            return False


async def resolve_zotero_items_via_openalex(
    items: List[Dict], db: AsyncSession,
) -> List[Tuple[Dict, Optional[str]]]:
    """
    Resolve Zotero items to OpenAlex IDs.
    Returns list of (zotero_item, openalex_id_or_None).
    """
    results: List[Tuple[Dict, Optional[str]]] = []

    for item in items:
        openalex_id = None
        doi = item.get("doi", "")
        title = item.get("title", "")

        # Try DOI first
        if doi:
            try:
                doi_url = doi if doi.startswith("http") else "https://doi.org/{}".format(doi)
                detail, raw = await openalex_client.get_work(doi_url)
                await openalex_client.cache_works([raw], db)
                openalex_id = detail.openalex_id
            except Exception:
                pass

        # Fallback: search by title
        if not openalex_id and title:
            try:
                search_resp, raw_works = await openalex_client.search_works(title, per_page=3)
                if raw_works:
                    await openalex_client.cache_works(raw_works, db)
                # Check for title match
                for r in search_resp.results:
                    if r.title and title.lower() in r.title.lower():
                        openalex_id = r.openalex_id
                        break
                # If no exact match, take first result
                if not openalex_id and search_resp.results:
                    openalex_id = search_resp.results[0].openalex_id
            except Exception:
                pass

        results.append((item, openalex_id))

    return results
