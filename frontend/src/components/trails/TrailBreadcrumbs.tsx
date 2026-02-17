import { ChevronLeft, ChevronRight, Circle, CircleDot, Disc } from 'lucide-react';
import { useTrailStore } from '../../stores/useTrailStore';

const stepLabels: Record<string, string> = {
  search: 'Search',
  paper_view: 'Paper',
  citation_explore: 'Graph',
  discovery: 'Discovery',
};

export default function TrailBreadcrumbs() {
  const {
    activeTrail,
    currentStepIndex,
    isRecording,
    goBack,
    goForward,
    goToStep,
    canGoBack,
    canGoForward,
  } = useTrailStore();

  if (!activeTrail || activeTrail.steps.length === 0) return null;

  const steps = activeTrail.steps;
  // Show at most 7 steps centered around current
  const start = Math.max(0, currentStepIndex - 3);
  const end = Math.min(steps.length, start + 7);
  const visibleSteps = steps.slice(start, end);

  return (
    <div className="flex items-center gap-1 px-2 py-1 text-xs">
      {isRecording && (
        <span className="flex items-center gap-1 mr-2 text-red-500">
          <Disc className="w-3 h-3 animate-pulse" />
          Recording
        </span>
      )}
      <button
        onClick={goBack}
        disabled={!canGoBack()}
        className="p-0.5 rounded hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      {start > 0 && <span className="text-[var(--color-text-secondary)]">...</span>}

      {visibleSteps.map((step, i) => {
        const realIndex = start + i;
        const isCurrent = realIndex === currentStepIndex;
        const label = stepLabels[step.step_type] || step.step_type;
        const detail = step.payload?.query || step.payload?.title || '';
        return (
          <button
            key={step.id}
            onClick={() => goToStep(realIndex)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
              isCurrent
                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
            }`}
            title={detail ? label + ': ' + detail : label}
          >
            {isCurrent ? (
              <CircleDot className="w-2.5 h-2.5" />
            ) : (
              <Circle className="w-2.5 h-2.5" />
            )}
            <span className="max-w-[80px] truncate">{detail || label}</span>
          </button>
        );
      })}

      {end < steps.length && <span className="text-[var(--color-text-secondary)]">...</span>}

      <button
        onClick={goForward}
        disabled={!canGoForward()}
        className="p-0.5 rounded hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30 transition-colors"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
