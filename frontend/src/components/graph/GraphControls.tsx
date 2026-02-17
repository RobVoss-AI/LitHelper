import { useGraphStore } from '../../stores/useGraphStore';

export default function GraphControls() {
  const { depth, direction, maxNodes, setDepth, setDirection, setMaxNodes, seedIds, loadGraph } = useGraphStore();

  const handleRebuild = () => {
    if (seedIds.length > 0) {
      loadGraph(seedIds);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-3 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">Depth</label>
        <select
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value))}
          className="text-sm px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">Direction</label>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value as any)}
          className="text-sm px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
        >
          <option value="both">Both</option>
          <option value="references">References only</option>
          <option value="citations">Citations only</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">Max nodes</label>
        <select
          value={maxNodes}
          onChange={(e) => setMaxNodes(Number(e.target.value))}
          className="text-sm px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
        >
          <option value={100}>100</option>
          <option value={250}>250</option>
          <option value={500}>500</option>
          <option value={1000}>1000</option>
        </select>
      </div>

      <button
        onClick={handleRebuild}
        disabled={seedIds.length === 0}
        className="text-sm px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] disabled:opacity-50 transition-colors"
      >
        Rebuild
      </button>
    </div>
  );
}
