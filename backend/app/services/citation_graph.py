import asyncio
from typing import Dict, List, Set, Tuple

from app.schemas.graph import GraphData, GraphEdge, GraphNode
from app.services.openalex import openalex_client


class CitationGraphBuilder:
    """Builds citation network graphs via BFS traversal of the OpenAlex citation network."""

    async def build_graph(
        self,
        seed_ids: List[str],
        depth: int = 1,
        max_nodes: int = 500,
        direction: str = "both",
    ) -> GraphData:
        nodes: Dict[str, GraphNode] = {}
        edges: List[GraphEdge] = []
        seen_edges: Set[Tuple[str, str]] = set()

        # Fetch seed papers
        seed_parsed, seed_raw = await openalex_client.batch_get_works(seed_ids)
        for paper in seed_parsed:
            nodes[paper.openalex_id] = GraphNode(
                id=paper.openalex_id,
                title=paper.title,
                publication_year=paper.publication_year or 0,
                cited_by_count=paper.cited_by_count,
                authors=[a.author_name for a in paper.authors[:3]],
                is_seed=True,
                depth=0,
            )

        # BFS traversal
        frontier = list(nodes.keys())
        for current_depth in range(1, depth + 1):
            if len(nodes) >= max_nodes:
                break

            next_frontier: List[str] = []
            tasks = []

            for node_id in frontier:
                if direction in ("references", "both"):
                    tasks.append(self._get_references(node_id))
                if direction in ("citations", "both"):
                    tasks.append(self._get_citations(node_id))

            results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in results:
                if isinstance(result, Exception):
                    continue

                source_id, target_ids, edge_direction = result

                for target_id in target_ids:
                    if len(nodes) >= max_nodes:
                        break

                    # Add edge
                    if edge_direction == "references":
                        edge_key = (source_id, target_id)
                    else:
                        edge_key = (target_id, source_id)

                    if edge_key not in seen_edges:
                        seen_edges.add(edge_key)
                        edges.append(GraphEdge(source=edge_key[0], target=edge_key[1]))

                    # Track new nodes to fetch
                    if target_id not in nodes:
                        next_frontier.append(target_id)
                        # Placeholder node — will be enriched below
                        nodes[target_id] = GraphNode(
                            id=target_id,
                            title="Loading...",
                            depth=current_depth,
                        )

            # Enrich new nodes with actual metadata
            new_ids = [nid for nid in next_frontier if nodes[nid].title == "Loading..."]
            if new_ids:
                # Deduplicate
                unique_ids = list(set(new_ids))[:max_nodes - len([n for n in nodes.values() if n.title != "Loading..."])]
                if unique_ids:
                    enriched, _ = await openalex_client.batch_get_works(unique_ids)
                    for paper in enriched:
                        if paper.openalex_id in nodes:
                            nodes[paper.openalex_id] = GraphNode(
                                id=paper.openalex_id,
                                title=paper.title,
                                publication_year=paper.publication_year or 0,
                                cited_by_count=paper.cited_by_count,
                                authors=[a.author_name for a in paper.authors[:3]],
                                is_seed=False,
                                depth=current_depth,
                            )

            frontier = list(set(next_frontier))

        # Remove placeholder nodes that weren't enriched
        final_nodes = [n for n in nodes.values() if n.title != "Loading..."]
        final_node_ids = {n.id for n in final_nodes}
        final_edges = [e for e in edges if e.source in final_node_ids and e.target in final_node_ids]

        return GraphData(nodes=final_nodes, edges=final_edges)

    async def expand_node(
        self,
        node_id: str,
        existing_ids: List[str],
        direction: str = "both",
        max_new: int = 20,
    ) -> GraphData:
        """Expand a single node, returning only new nodes and edges."""
        new_nodes: Dict[str, GraphNode] = {}
        new_edges: List[GraphEdge] = []
        existing_set = set(existing_ids)

        tasks = []
        if direction in ("references", "both"):
            tasks.append(self._get_references(node_id))
        if direction in ("citations", "both"):
            tasks.append(self._get_citations(node_id))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        new_ids: List[str] = []
        for result in results:
            if isinstance(result, Exception):
                continue
            source_id, target_ids, edge_dir = result
            for tid in target_ids:
                if edge_dir == "references":
                    edge = GraphEdge(source=source_id, target=tid)
                else:
                    edge = GraphEdge(source=tid, target=source_id)
                new_edges.append(edge)

                if tid not in existing_set and tid not in new_nodes:
                    new_ids.append(tid)
                    if len(new_ids) >= max_new:
                        break

        # Fetch metadata for new nodes
        if new_ids:
            enriched, _ = await openalex_client.batch_get_works(new_ids[:max_new])
            for paper in enriched:
                new_nodes[paper.openalex_id] = GraphNode(
                    id=paper.openalex_id,
                    title=paper.title,
                    publication_year=paper.publication_year or 0,
                    cited_by_count=paper.cited_by_count,
                    authors=[a.author_name for a in paper.authors[:3]],
                    is_seed=False,
                    depth=1,
                )

        # Filter edges to only include known nodes
        all_known = existing_set | set(new_nodes.keys())
        final_edges = [e for e in new_edges if e.source in all_known and e.target in all_known]

        return GraphData(nodes=list(new_nodes.values()), edges=final_edges)

    async def _get_references(self, openalex_id: str) -> Tuple[str, List[str], str]:
        """Get referenced work IDs for a paper."""
        try:
            detail, _ = await openalex_client.get_work(openalex_id)
            return (openalex_id, detail.referenced_work_ids[:30], "references")
        except Exception:
            return (openalex_id, [], "references")

    async def _get_citations(self, openalex_id: str) -> Tuple[str, List[str], str]:
        """Get citing work IDs for a paper."""
        try:
            resp, _ = await openalex_client.get_work_citations(openalex_id, per_page=30)
            ids = [p.openalex_id for p in resp.results]
            return (openalex_id, ids, "citations")
        except Exception:
            return (openalex_id, [], "citations")


graph_builder = CitationGraphBuilder()
