import { useMemo, useCallback } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useGraphStore } from '../../stores/useGraphStore';
import { yearToColor } from '../../utils/graphHelpers';

interface PlotPoint {
  id: string;
  title: string;
  publication_year: number;
  cited_by_count: number;
  is_seed: boolean;
  authors: string[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload as PlotPoint;
  return (
    <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 shadow-lg max-w-xs">
      <p className="font-semibold text-sm leading-snug">{data.title}</p>
      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
        {data.authors.slice(0, 2).join(', ')}{data.authors.length > 2 ? ' et al.' : ''}
      </p>
      <div className="flex gap-3 mt-1 text-xs text-[var(--color-text-secondary)]">
        <span>{data.publication_year}</span>
        <span>{data.cited_by_count.toLocaleString()} citations</span>
        {data.is_seed && <span className="text-[var(--color-primary)] font-medium">Seed</span>}
      </div>
    </div>
  );
}

export default function DateCitationPlot() {
  const { nodes, selectNode } = useGraphStore();

  const plotData = useMemo<PlotPoint[]>(() =>
    nodes
      .filter((n) => n.publication_year > 0)
      .map((n) => ({
        id: n.id,
        title: n.title,
        publication_year: n.publication_year,
        cited_by_count: Math.max(n.cited_by_count, 1), // min 1 for log scale
        is_seed: n.is_seed,
        authors: n.authors,
      })),
    [nodes]
  );

  const handleClick = useCallback((data: any) => {
    if (data?.id) {
      selectNode(data.id);
    }
  }, [selectNode]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)]">
        <p>No data to plot — build a graph first</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          type="number"
          dataKey="publication_year"
          name="Year"
          domain={['auto', 'auto']}
          tick={{ fontSize: 12 }}
          label={{ value: 'Publication Year', position: 'bottom', offset: 0, fontSize: 12 }}
        />
        <YAxis
          type="number"
          dataKey="cited_by_count"
          name="Citations"
          scale="log"
          domain={[1, 'auto']}
          tick={{ fontSize: 12 }}
          label={{ value: 'Citations (log)', angle: -90, position: 'insideLeft', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Scatter
          data={plotData}
          onClick={handleClick}
          cursor="pointer"
        >
          {plotData.map((entry) => (
            <Cell
              key={entry.id}
              fill={entry.is_seed ? '#4f46e5' : yearToColor(entry.publication_year)}
              r={entry.is_seed ? 8 : 5}
              strokeWidth={entry.is_seed ? 2 : 0}
              stroke={entry.is_seed ? '#ffffff' : 'none'}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
