import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.paper import Paper
from app.schemas.paper import AuthorShip, PaperDetail, PaperSummary, SearchMeta, SearchResponse


class OpenAlexClient:
    BASE_URL = "https://api.openalex.org"
    DEFAULT_SELECT = [
        "id", "doi", "title", "publication_year", "publication_date",
        "cited_by_count", "authorships", "primary_location", "open_access",
        "type", "referenced_works", "topics", "abstract_inverted_index",
    ]

    def __init__(self):
        headers = {"User-Agent": "LitHelper/0.1 (mailto:{})".format(settings.openalex_email)}
        if settings.openalex_email:
            headers["From"] = settings.openalex_email
        self.client = httpx.AsyncClient(
            base_url=self.BASE_URL,
            headers=headers,
            timeout=30.0,
        )

    async def close(self):
        await self.client.aclose()

    def _parse_authorships(self, authorships: Optional[List[Dict]]) -> List[AuthorShip]:
        if not authorships:
            return []
        result = []
        for a in authorships:
            author = a.get("author", {})
            institutions = a.get("institutions", [])
            result.append(AuthorShip(
                author_id=author.get("id"),
                author_name=author.get("display_name", ""),
                institution=institutions[0].get("display_name") if institutions else None,
            ))
        return result

    def _parse_work(self, work: Dict) -> PaperSummary:
        primary_loc = work.get("primary_location") or {}
        source = primary_loc.get("source") or {}
        oa = work.get("open_access") or {}
        return PaperSummary(
            openalex_id=work.get("id", ""),
            doi=work.get("doi"),
            title=work.get("title", "Untitled"),
            publication_year=work.get("publication_year"),
            cited_by_count=work.get("cited_by_count", 0),
            authors=self._parse_authorships(work.get("authorships")),
            type=work.get("type"),
            is_open_access=oa.get("is_oa", False),
            source_name=source.get("display_name"),
        )

    def _parse_work_detail(self, work: Dict) -> PaperDetail:
        primary_loc = work.get("primary_location") or {}
        source = primary_loc.get("source") or {}
        oa = work.get("open_access") or {}
        topics = work.get("topics") or []
        ref_works = work.get("referenced_works") or []

        return PaperDetail(
            openalex_id=work.get("id", ""),
            doi=work.get("doi"),
            title=work.get("title", "Untitled"),
            publication_year=work.get("publication_year"),
            publication_date=work.get("publication_date"),
            cited_by_count=work.get("cited_by_count", 0),
            authors=self._parse_authorships(work.get("authorships")),
            type=work.get("type"),
            is_open_access=oa.get("is_oa", False),
            source_name=source.get("display_name"),
            abstract_inverted_index=work.get("abstract_inverted_index"),
            topics=[{"name": t.get("display_name", ""), "score": t.get("score", 0)} for t in topics[:5]],
            referenced_work_ids=ref_works,
        )

    def _work_to_db_paper(self, work: Dict) -> Paper:
        return Paper(
            openalex_id=work.get("id", ""),
            doi=work.get("doi"),
            title=work.get("title", "Untitled"),
            publication_year=work.get("publication_year"),
            publication_date=work.get("publication_date"),
            cited_by_count=work.get("cited_by_count", 0),
            type=work.get("type"),
            abstract_inverted_index=work.get("abstract_inverted_index"),
            authorships_json=work.get("authorships"),
            primary_location_json=work.get("primary_location"),
            open_access_json=work.get("open_access"),
            topics_json=work.get("topics"),
            referenced_work_ids=work.get("referenced_works"),
            fetched_at=datetime.now(timezone.utc),
        )

    async def search_works(
        self,
        query: str,
        year_min: Optional[int] = None,
        year_max: Optional[int] = None,
        work_type: Optional[str] = None,
        sort: str = "relevance_score:desc",
        page: int = 1,
        per_page: int = 25,
    ) -> Tuple[SearchResponse, List[Dict]]:
        """Search OpenAlex works. Returns (parsed response, raw work dicts for caching)."""
        params: Dict = {
            "search": query,
            "sort": sort,
            "page": page,
            "per_page": per_page,
            "select": ",".join(self.DEFAULT_SELECT),
        }

        filters = []
        if year_min:
            filters.append("publication_year:>{}".format(year_min - 1))
        if year_max:
            filters.append("publication_year:<{}".format(year_max + 1))
        if work_type:
            filters.append("type:{}".format(work_type))
        if filters:
            params["filter"] = ",".join(filters)

        resp = await self.client.get("/works", params=params)
        resp.raise_for_status()
        data = resp.json()

        meta = data.get("meta", {})
        results = data.get("results", [])

        parsed = SearchResponse(
            meta=SearchMeta(
                count=meta.get("count", 0),
                page=meta.get("page", page),
                per_page=meta.get("per_page", per_page),
            ),
            results=[self._parse_work(w) for w in results],
        )
        return parsed, results

    async def get_work(self, openalex_id: str) -> Tuple[PaperDetail, Dict]:
        """Get a single work by OpenAlex ID or DOI. Returns (parsed, raw dict)."""
        resp = await self.client.get("/works/{}".format(openalex_id), params={
            "select": ",".join(self.DEFAULT_SELECT),
        })
        resp.raise_for_status()
        work = resp.json()
        return self._parse_work_detail(work), work

    async def get_work_citations(
        self, openalex_id: str, page: int = 1, per_page: int = 50
    ) -> Tuple[SearchResponse, List[Dict]]:
        """Get works that cite this paper."""
        params = {
            "filter": "cites:{}".format(openalex_id),
            "sort": "cited_by_count:desc",
            "page": page,
            "per_page": per_page,
            "select": ",".join(self.DEFAULT_SELECT),
        }
        resp = await self.client.get("/works", params=params)
        resp.raise_for_status()
        data = resp.json()
        meta = data.get("meta", {})
        results = data.get("results", [])

        parsed = SearchResponse(
            meta=SearchMeta(count=meta.get("count", 0), page=page, per_page=per_page),
            results=[self._parse_work(w) for w in results],
        )
        return parsed, results

    async def batch_get_works(self, openalex_ids: List[str]) -> Tuple[List[PaperSummary], List[Dict]]:
        """Fetch multiple works by ID in batches of 50 using OR filter."""
        all_parsed: List[PaperSummary] = []
        all_raw: List[Dict] = []

        batches = [openalex_ids[i:i + 50] for i in range(0, len(openalex_ids), 50)]

        async def fetch_batch(ids: List[str]) -> List[Dict]:
            id_filter = "|".join(ids)
            resp = await self.client.get("/works", params={
                "filter": "openalex:{}".format(id_filter),
                "per_page": 50,
                "select": ",".join(self.DEFAULT_SELECT),
            })
            resp.raise_for_status()
            data = resp.json()
            return data.get("results", [])

        batch_results = await asyncio.gather(*[fetch_batch(b) for b in batches])
        for results in batch_results:
            for w in results:
                all_parsed.append(self._parse_work(w))
                all_raw.append(w)

        return all_parsed, all_raw

    async def search_authors(
        self, query: str, page: int = 1, per_page: int = 25
    ) -> Dict:
        """Search OpenAlex authors."""
        resp = await self.client.get("/authors", params={
            "search": query,
            "page": page,
            "per_page": per_page,
            "select": "id,display_name,works_count,cited_by_count,last_known_institutions,works_api_url",
        })
        resp.raise_for_status()
        return resp.json()

    async def get_author_works(
        self, author_id: str, sort: str = "publication_year:desc", page: int = 1, per_page: int = 25
    ) -> Tuple[SearchResponse, List[Dict]]:
        """Get works by a specific author."""
        params = {
            "filter": "authorships.author.id:{}".format(author_id),
            "sort": sort,
            "page": page,
            "per_page": per_page,
            "select": ",".join(self.DEFAULT_SELECT),
        }
        resp = await self.client.get("/works", params=params)
        resp.raise_for_status()
        data = resp.json()
        meta = data.get("meta", {})
        results = data.get("results", [])

        parsed = SearchResponse(
            meta=SearchMeta(count=meta.get("count", 0), page=page, per_page=per_page),
            results=[self._parse_work(w) for w in results],
        )
        return parsed, results

    async def cache_works(self, raw_works: List[Dict], db: AsyncSession):
        """Upsert raw work dicts into the local paper cache."""
        for work in raw_works:
            oa_id = work.get("id", "")
            if not oa_id:
                continue
            existing = await db.get(Paper, oa_id)
            paper = self._work_to_db_paper(work)
            if existing:
                for attr in [
                    "doi", "title", "publication_year", "publication_date",
                    "cited_by_count", "type", "abstract_inverted_index",
                    "authorships_json", "primary_location_json", "open_access_json",
                    "topics_json", "referenced_work_ids", "fetched_at",
                ]:
                    setattr(existing, attr, getattr(paper, attr))
            else:
                db.add(paper)
        await db.commit()


# Singleton client instance
openalex_client = OpenAlexClient()
