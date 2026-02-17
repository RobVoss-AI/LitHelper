import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/search/SearchBar';
import SearchResults from '../components/search/SearchResults';
import { useGraphStore } from '../stores/useGraphStore';
import { useSearchStore } from '../stores/useSearchStore';
import { useTrailStore } from '../stores/useTrailStore';
import { useEffect, useRef } from 'react';

export default function SearchPage() {
  const navigate = useNavigate();
  const loadGraph = useGraphStore((s) => s.loadGraph);
  const query = useSearchStore((s) => s.query);
  const recordStep = useTrailStore((s) => s.recordStep);
  const lastRecordedQuery = useRef('');

  // Record search steps
  useEffect(() => {
    if (query && query !== lastRecordedQuery.current) {
      lastRecordedQuery.current = query;
      recordStep('search', { query });
    }
  }, [query, recordStep]);

  const handleExplore = (id: string) => {
    recordStep('citation_explore', { paper_id: id });
    loadGraph([id]);
    navigate('/graph');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Search Papers</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Search 250M+ academic works via OpenAlex
        </p>
      </div>
      <SearchBar />
      <SearchResults onExplore={handleExplore} />
    </div>
  );
}
