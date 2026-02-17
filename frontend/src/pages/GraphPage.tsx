import { useState } from 'react';
import { Network, ScatterChart as ScatterIcon, Columns } from 'lucide-react';
import { useGraphStore } from '../stores/useGraphStore';
import CitationGraph from '../components/graph/CitationGraph';
import GraphControls from '../components/graph/GraphControls';
import DateCitationPlot from '../components/scatter/DateCitationPlot';
import PaperDetail from '../components/paper/PaperDetail';

type ViewMode = 'graph' | 'scatter' | 'split';

export default function GraphPage() {
  const { selectedNodeId, selectNode, loadGraph } = useGraphStore();
  const [viewMode, setViewMode] = useState<ViewMode>('graph');

  const handleExplore = (id: string) => {
    loadGraph([id]);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between">
        <GraphControls />
        <div className="flex items-center gap-1 pr-3">
          <button
            onClick={() => setViewMode('graph')}
            className={`p-2 rounded transition-colors ${viewMode === 'graph' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'}`}
            aria-label="Graph view"
          >
            <Network className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('scatter')}
            className={`p-2 rounded transition-colors ${viewMode === 'scatter' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'}`}
            aria-label="Scatter view"
          >
            <ScatterIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`p-2 rounded transition-colors ${viewMode === 'split' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'}`}
            aria-label="Split view"
          >
            <Columns className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          {viewMode === 'graph' && (
            <div className="flex-1">
              <CitationGraph />
            </div>
          )}
          {viewMode === 'scatter' && (
            <div className="flex-1">
              <DateCitationPlot />
            </div>
          )}
          {viewMode === 'split' && (
            <>
              <div className="flex-1 border-b border-[var(--color-border)]">
                <CitationGraph />
              </div>
              <div className="flex-1">
                <DateCitationPlot />
              </div>
            </>
          )}
        </div>
        {selectedNodeId && (
          <div className="w-96 border-l border-[var(--color-border)] overflow-hidden">
            <PaperDetail
              openalexId={selectedNodeId}
              onClose={() => selectNode(null)}
              onExplore={handleExplore}
            />
          </div>
        )}
      </div>
    </div>
  );
}
