import { useCallback, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useGraphStore } from '../../stores/useGraphStore';
import { yearToColor, citationToSize } from '../../utils/graphHelpers';

export default function CitationGraph() {
  const { nodes, edges, isLoading, selectNode, expandGraphNode } = useGraphStore();
  const graphRef = useRef<any>(null);

  const graphData = useMemo(() => ({
    nodes: nodes.map((n) => ({
      ...n,
      val: citationToSize(n.cited_by_count),
      color: n.is_seed ? '#4f46e5' : yearToColor(n.publication_year),
    })),
    links: edges.map((e) => ({
      source: e.source,
      target: e.target,
    })),
  }), [nodes, edges]);

  const handleNodeClick = useCallback((node: any) => {
    selectNode(node.id);
  }, [selectNode]);

  const handleNodeRightClick = useCallback((node: any) => {
    expandGraphNode(node.id);
  }, [expandGraphNode]);

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const size = node.val || 4;
    const fontSize = Math.max(10 / globalScale, 1.5);

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = node.color || '#6b7280';
    ctx.fill();

    if (node.is_seed) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }

    // Draw label if zoomed in enough
    if (globalScale > 1.5) {
      const label = node.title.length > 40 ? node.title.substring(0, 40) + '...' : node.title;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'var(--color-text, #111827)';
      ctx.fillText(label, node.x, node.y + size + 2);
    }
  }, []);

  if (nodes.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)]">
        <p>Search for a paper and click "Explore Citations" to build a graph</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Building graph...</span>
        </div>
      )}
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeId="id"
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          const size = node.val || 4;
          ctx.beginPath();
          ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkColor={() => 'rgba(156, 163, 175, 0.3)'}
        linkWidth={0.5}
        onNodeClick={handleNodeClick}
        onNodeRightClick={handleNodeRightClick}
        cooldownTicks={100}
        dagMode="td"
        dagLevelDistance={50}
      />
      <div className="absolute bottom-4 left-4 z-10 text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg)]/80 px-2 py-1 rounded">
        {nodes.length} nodes, {edges.length} edges | Right-click to expand | Scroll to zoom
      </div>
    </div>
  );
}
