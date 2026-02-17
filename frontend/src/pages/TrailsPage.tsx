import { useEffect, useState } from 'react';
import { Play, Square, Trash2, Clock, ChevronRight } from 'lucide-react';
import { useTrailStore } from '../stores/useTrailStore';

const stepLabels: Record<string, string> = {
  search: 'Search',
  paper_view: 'Paper View',
  citation_explore: 'Citation Explore',
  discovery: 'Discovery',
};

export default function TrailsPage() {
  const {
    trails,
    activeTrail,
    isRecording,
    fetchTrails,
    startTrail,
    stopRecording,
    loadTrail,
    deleteTrail,
  } = useTrailStore();

  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchTrails();
  }, [fetchTrails]);

  const handleStart = async () => {
    await startTrail(newName || undefined);
    setNewName('');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border)]">
        <h1 className="text-xl font-bold mb-1">Search Trails</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Record your exploration paths and navigate back through your research journey.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* Recording controls */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
            {isRecording ? (
              <>
                <div className="flex items-center gap-2 text-sm flex-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>
                    Recording: <strong>{activeTrail?.name || 'Unnamed trail'}</strong>
                    {' '}({activeTrail?.steps.length || 0} steps)
                  </span>
                </div>
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  <Square className="w-3.5 h-3.5" />
                  Stop
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Trail name (optional)"
                  className="flex-1 px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
                  onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                />
                <button
                  onClick={handleStart}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  Start Recording
                </button>
              </>
            )}
          </div>

          {/* Active trail detail */}
          {activeTrail && activeTrail.steps.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-semibold text-sm">
                Current Trail: {activeTrail.name || 'Unnamed'}
              </h2>
              <div className="border border-[var(--color-border)] rounded-lg divide-y divide-[var(--color-border)]">
                {activeTrail.steps.map((step, i) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 px-4 py-2 text-sm"
                  >
                    <span className="text-xs font-mono text-[var(--color-text-secondary)] w-6">
                      {i + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-bg-tertiary)]">
                      {stepLabels[step.step_type] || step.step_type}
                    </span>
                    <span className="flex-1 truncate text-[var(--color-text-secondary)]">
                      {step.payload?.query || step.payload?.title || step.payload?.paper_id || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trail history */}
          <div className="space-y-2">
            <h2 className="font-semibold text-sm">Saved Trails ({trails.length})</h2>
            {trails.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)] py-4 text-center">
                No trails yet. Start recording to track your explorations.
              </p>
            ) : (
              <div className="space-y-2">
                {trails.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors cursor-pointer hover:border-[var(--color-primary)] ${
                      activeTrail?.id === t.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                        : 'border-[var(--color-border)]'
                    }`}
                    onClick={() => loadTrail(t.id)}
                  >
                    <Clock className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {t.name || 'Unnamed trail'}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {t.step_count} steps
                        {t.updated_at && ' \u00B7 ' + new Date(t.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTrail(t.id);
                      }}
                      className="p-1 rounded text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
