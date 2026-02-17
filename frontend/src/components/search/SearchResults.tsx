import { useSearchStore } from '../../stores/useSearchStore';
import SearchResultCard from './SearchResultCard';

interface Props {
  onExplore?: (id: string) => void;
}

export default function SearchResults({ onExplore }: Props) {
  const { results, meta, isLoading, error, executeSearch } = useSearchStore();

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
        {error}
      </div>
    );
  }

  if (results.length === 0 && !isLoading) {
    return null;
  }

  const hasMore = meta && meta.page * meta.per_page < meta.count;

  return (
    <div className="space-y-3">
      {meta && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          {meta.count.toLocaleString()} results found
        </p>
      )}

      {results.map((paper) => (
        <SearchResultCard key={paper.openalex_id} paper={paper} onExplore={onExplore} />
      ))}

      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {hasMore && !isLoading && (
        <button
          onClick={() => executeSearch((meta?.page || 1) + 1)}
          className="w-full py-2 text-sm text-[var(--color-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-colors"
        >
          Load more results
        </button>
      )}
    </div>
  );
}
