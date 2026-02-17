"""Multi-seed discovery via co-citation analysis and bibliographic coupling."""

import asyncio
from collections import Counter
from typing import Dict, List, Optional, Set, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.paper import Paper
from app.schemas.discovery import DiscoveryResult
from app.schemas.paper import PaperSummary
from app.services.openalex import openalex_client


async def _get_paper_refs(openalex_id: str, db: AsyncSession) -> Optional[List[str]]:
    """Get referenced_work_ids from cache or API."""
    paper = await db.get(Paper, openalex_id)
    if paper and paper.referenced_work_ids:
        return paper.referenced_work_ids
    # Fetch from API and cache
    try:
        detail, raw = await openalex_client.get_work(openalex_id)
        await openalex_client.cache_works([raw], db)
        return detail.referenced_work_ids
    except Exception:
        return None


async def discover_co_citation(
    seed_ids: List[str],
    db: AsyncSession,
    max_results: int = 30,
    citing_sample_size: int = 100,
) -> List[DiscoveryResult]:
    """
    Co-citation analysis: find papers frequently referenced alongside seed papers.

    Algorithm:
    1. For each seed, fetch papers that cite it (citing papers).
    2. For each citing paper, collect its referenced_work_ids.
    3. Count how often each referenced paper appears across all citing papers.
    4. Exclude seeds themselves. Rank by frequency.
    5. Fetch details for top candidates and return.
    """
    seed_set: Set[str] = set(seed_ids)
    # Track which seeds each candidate is co-cited with
    candidate_seeds: Dict[str, Set[str]] = {}
    candidate_count: Counter = Counter()

    async def process_seed(seed_id: str) -> None:
        try:
            resp, raw_works = await openalex_client.get_work_citations(
                seed_id, page=1, per_page=min(citing_sample_size, 200)
            )
            await openalex_client.cache_works(raw_works, db)

            for work in raw_works:
                refs = work.get("referenced_works") or []
                for ref_id in refs:
                    if ref_id not in seed_set:
                        candidate_count[ref_id] += 1
                        if ref_id not in candidate_seeds:
                            candidate_seeds[ref_id] = set()
                        candidate_seeds[ref_id].add(seed_id)
        except Exception:
            pass

    # Fetch citing papers for all seeds concurrently
    await asyncio.gather(*[process_seed(sid) for sid in seed_ids])

    # Rank candidates: prefer those co-cited with more seeds, then by raw count
    ranked = sorted(
        candidate_count.items(),
        key=lambda x: (len(candidate_seeds.get(x[0], set())), x[1]),
        reverse=True,
    )
    top_ids = [cid for cid, _ in ranked[:max_results]]

    if not top_ids:
        return []

    # Fetch paper details
    summaries, raw_works = await openalex_client.batch_get_works(top_ids)
    await openalex_client.cache_works(raw_works, db)

    summary_map: Dict[str, PaperSummary] = {s.openalex_id: s for s in summaries}
    total_seeds = len(seed_ids)

    results: List[DiscoveryResult] = []
    for cid, count in ranked[:max_results]:
        paper = summary_map.get(cid)
        if not paper:
            continue
        overlap = len(candidate_seeds.get(cid, set()))
        score = (overlap / total_seeds) * 0.7 + min(count / 100.0, 1.0) * 0.3
        results.append(DiscoveryResult(
            paper=paper,
            score=round(score, 4),
            overlap_seeds=overlap,
            reason="Co-cited with {}/{} seeds ({} citing papers)".format(
                overlap, total_seeds, count
            ),
        ))

    return results


async def discover_bibliographic_coupling(
    seed_ids: List[str],
    db: AsyncSession,
    max_results: int = 30,
    citing_sample_size: int = 100,
) -> List[DiscoveryResult]:
    """
    Bibliographic coupling: find papers that share references with seed papers.

    Algorithm:
    1. Collect all referenced_work_ids from seed papers.
    2. Find the most common references (shared by multiple seeds).
    3. For each top shared reference, find papers that also cite it.
    4. Score candidates by how many shared references they also cite.
    """
    seed_set: Set[str] = set(seed_ids)

    # Step 1: Collect references from all seeds
    all_refs: List[Tuple[str, List[str]]] = []  # (seed_id, refs)
    tasks = [_get_paper_refs(sid, db) for sid in seed_ids]
    ref_results = await asyncio.gather(*tasks)

    for sid, refs in zip(seed_ids, ref_results):
        if refs:
            all_refs.append((sid, refs))

    if not all_refs:
        return []

    # Step 2: Count reference frequency across seeds
    ref_counter: Counter = Counter()
    for _, refs in all_refs:
        for ref_id in refs:
            if ref_id not in seed_set:
                ref_counter[ref_id] += 1

    # Take top shared references (those appearing in multiple seeds)
    # If only 1 seed, take its top references by just using all of them
    top_refs = [ref_id for ref_id, count in ref_counter.most_common(50)]

    if not top_refs:
        return []

    # Step 3: For top shared references, find papers that also cite them
    candidate_refs: Dict[str, Set[str]] = {}  # candidate_id -> set of shared refs it cites

    async def find_citers_of_ref(ref_id: str) -> None:
        try:
            # Find papers that reference this work
            resp = await openalex_client.client.get("/works", params={
                "filter": "cites:{}".format(ref_id),
                "per_page": min(citing_sample_size, 200),
                "sort": "cited_by_count:desc",
                "select": "id,referenced_works",
            })
            resp.raise_for_status()
            data = resp.json()
            for work in data.get("results", []):
                wid = work.get("id", "")
                if wid and wid not in seed_set:
                    if wid not in candidate_refs:
                        candidate_refs[wid] = set()
                    candidate_refs[wid].add(ref_id)
        except Exception:
            pass

    # Process in batches to avoid overwhelming the API
    batch_size = 10
    for i in range(0, len(top_refs), batch_size):
        batch = top_refs[i:i + batch_size]
        await asyncio.gather(*[find_citers_of_ref(rid) for rid in batch])

    # Step 4: Score candidates by number of shared references they cite
    seed_ref_set = set(top_refs)
    ranked = sorted(
        candidate_refs.items(),
        key=lambda x: len(x[1]),
        reverse=True,
    )
    top_ids = [cid for cid, _ in ranked[:max_results]]

    if not top_ids:
        return []

    # Fetch paper details
    summaries, raw_works = await openalex_client.batch_get_works(top_ids)
    await openalex_client.cache_works(raw_works, db)

    summary_map: Dict[str, PaperSummary] = {s.openalex_id: s for s in summaries}
    total_shared_refs = len(seed_ref_set)

    results: List[DiscoveryResult] = []
    for cid, shared in ranked[:max_results]:
        paper = summary_map.get(cid)
        if not paper:
            continue
        overlap = len(shared)
        score = overlap / max(total_shared_refs, 1)
        results.append(DiscoveryResult(
            paper=paper,
            score=round(score, 4),
            overlap_seeds=overlap,
            reason="Shares {}/{} key references with seeds".format(
                overlap, total_shared_refs
            ),
        ))

    return results
