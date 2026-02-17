import { useState } from 'react';
import { Search, X, Sparkles, Zap } from 'lucide-react';
import { useDiscoveryStore } from '../stores/useDiscoveryStore';
import { searchWorks } from '../api/search';
import type { PaperSummary } from '../api/search';
import SearchResultCard from '../components/search/SearchResultCard';
import AddToCollectionDropdown from '../components/shared/AddToCollectionDropdown';

export default function DiscoveryPage() {
  const {
    seeds,
    results,
    strategy,
    isLoading,
    error,
    addSeed,
    removeSeed,
    clearSeeds,
    setStrategy,
    runDiscovery,
  } = useDiscoveryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PaperSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const resp = await searchWorks(searchQuery);
      setSearchResults(resp.results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddSeed = (paper: PaperSummary) => {
    addSeed(paper);
    setSearchResults([]);
    setSearchQuery('');
    setShowSearch(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <h1 className="text-xl font-bold mb-1">Multi-Seed Discovery</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Add seed papers, then discover related work using co-citation or bibliographic coupling.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Seed papers section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">Seed Papers ({seeds.length})</h2>
              <div className="flex gap-2">
                {seeds.length > 0 && (
                  <button
                    onClick={clearSeeds}
                    className="text-xs px-2 py-1 rounded text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="flex items-center gap-1 text-xs px-3 py-1 rounded bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors"
                >
                  <Search className="w-3 h-3" />
                  Add seed
                </button>
              </div>
            </div>

            {/* Seed chips */}
            {seeds.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {seeds.map((s) => (
                  <div
                    key={s.openalex_id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-sm"
                  >
                    <span className="max-w-[250px] truncate">{s.title}</span>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      ({s.publication_year})
                    </span>
                    <button
                      onClick={() => removeSeed(s.openalex_id)}
                      className="ml-1 p-0.5 rounded-full hover:bg-[var(--color-primary)]/20"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-[var(--color-text-secondary)] border border-dashed border-[var(--color-border)] rounded-lg">
                No seed papers yet. Click "Add seed" to search for papers.
              </div>
            )}

            {/* Inline search */}
            {showSearch && (
              <div className="border border-[var(--color-border)] rounded-lg p-3 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search for a paper to add as seed..."
                    className="flex-1 px-3 py-2 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
                    autoFocus
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching}
                    className="px-4 py-2 text-sm rounded bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] disabled:opacity-50"
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {searchResults.map((p) => (
                      <button
                        key={p.openalex_id}
                        onClick={() => handleAddSeed(p)}
                        className="w-full text-left px-3 py-2 text-sm rounded hover:bg-[var(--color-bg-tertiary)] transition-colors"
                      >
                        <p className="font-medium truncate">{p.title}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {p.authors.slice(0, 2).map((a) => a.author_name).join(', ')}
                          {p.publication_year ? ' (' + p.publication_year + ')' : ''}
                          {' \u00B7 '}{p.cited_by_count.toLocaleString()} citations
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Strategy selection + run */}
          {seeds.length > 0 && (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Strategy:</label>
                <select
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  className="px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
                >
                  <option value="co_citation">Co-Citation Analysis</option>
                  <option value="bibliographic_coupling">Bibliographic Coupling</option>
                </select>
              </div>
              <button
                onClick={runDiscovery}
                disabled={isLoading || seeds.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Discovering...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Discover Related Papers
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="px-4 py-2 rounded bg-red-50 text-red-600 text-sm">{error}</div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-[var(--color-accent)]" />
                Discovered Papers ({results.length})
              </h2>
              <div className="space-y-3">
                {results.map((r) => (
                  <div key={r.paper.openalex_id} className="relative">
                    <SearchResultCard paper={r.paper} />
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium">
                        Score: {(r.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    {r.reason && (
                      <p className="mt-1 ml-4 text-xs text-[var(--color-text-secondary)]">
                        {r.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
