import { useEffect, useState } from 'react';
import { Search, UserPlus, UserMinus, ChevronRight, BookOpen } from 'lucide-react';
import {
  searchAuthors,
  listTrackedAuthors,
  trackAuthor,
  untrackAuthor,
  getAuthorWorks,
} from '../api/authors';
import type { AuthorSearchResult, TrackedAuthorOut, AuthorWorksResponse } from '../api/authors';
import SearchResultCard from '../components/search/SearchResultCard';

export default function AuthorsPage() {
  const [tracked, setTracked] = useState<TrackedAuthorOut[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AuthorSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [authorWorks, setAuthorWorks] = useState<AuthorWorksResponse | null>(null);
  const [loadingWorks, setLoadingWorks] = useState(false);

  const fetchTracked = async () => {
    try {
      const authors = await listTrackedAuthors();
      setTracked(authors);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchTracked();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const resp = await searchAuthors(searchQuery);
      setSearchResults(resp.results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleTrack = async (author: AuthorSearchResult) => {
    try {
      await trackAuthor({
        openalex_id: author.openalex_id,
        display_name: author.display_name,
        works_count: author.works_count,
        cited_by_count: author.cited_by_count,
        institution: author.institution || undefined,
      });
      await fetchTracked();
      setSearchResults([]);
      setSearchQuery('');
      setShowSearch(false);
    } catch {
      // 409 = already tracked
    }
  };

  const handleUntrack = async (id: number) => {
    await untrackAuthor(id);
    await fetchTracked();
    if (selectedAuthor) {
      const author = tracked.find((a) => a.id === id);
      if (author && author.openalex_id === selectedAuthor) {
        setSelectedAuthor(null);
        setAuthorWorks(null);
      }
    }
  };

  const handleViewWorks = async (openalexId: string) => {
    setSelectedAuthor(openalexId);
    setLoadingWorks(true);
    try {
      const resp = await getAuthorWorks(openalexId);
      setAuthorWorks(resp);
    } catch {
      setAuthorWorks(null);
    } finally {
      setLoadingWorks(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border)]">
        <h1 className="text-xl font-bold mb-1">Author Tracking</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Follow authors and get notified of new publications.
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Author list */}
        <div className="w-80 border-r border-[var(--color-border)] flex flex-col">
          <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
            <span className="text-sm font-medium">Tracked ({tracked.length})</span>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)]"
            >
              <UserPlus className="w-3 h-3" />
              Track
            </button>
          </div>

          {showSearch && (
            <div className="p-3 border-b border-[var(--color-border)] space-y-2">
              <div className="flex gap-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search authors..."
                  className="flex-1 px-2 py-1.5 text-xs rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
                  autoFocus
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-2 py-1.5 text-xs rounded bg-[var(--color-primary)] text-white disabled:opacity-50"
                >
                  <Search className="w-3 h-3" />
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {searchResults.map((a) => (
                    <button
                      key={a.openalex_id}
                      onClick={() => handleTrack(a)}
                      className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-[var(--color-bg-tertiary)]"
                    >
                      <p className="font-medium truncate">{a.display_name}</p>
                      <p className="text-[var(--color-text-secondary)]">
                        {a.institution || 'Unknown'} &middot; {a.works_count} works
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {tracked.map((a) => (
              <div
                key={a.id}
                className={`flex items-center gap-2 px-3 py-3 border-b border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-bg-tertiary)] transition-colors ${
                  selectedAuthor === a.openalex_id ? 'bg-[var(--color-bg-tertiary)]' : ''
                }`}
                onClick={() => handleViewWorks(a.openalex_id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.display_name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {a.institution || 'Unknown'} &middot; {a.works_count} works &middot; {a.cited_by_count.toLocaleString()} cites
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUntrack(a.id);
                  }}
                  className="p-1 rounded text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-50"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-secondary)] shrink-0" />
              </div>
            ))}
            {tracked.length === 0 && (
              <div className="p-4 text-center text-sm text-[var(--color-text-secondary)]">
                No tracked authors. Search and track an author to follow their work.
              </div>
            )}
          </div>
        </div>

        {/* Author works */}
        <div className="flex-1 overflow-y-auto">
          {loadingWorks ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : authorWorks ? (
            <div className="max-w-3xl mx-auto p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold">{authorWorks.author.display_name}</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {authorWorks.author.institution || ''} &middot;{' '}
                  {authorWorks.total_count} total works &middot;{' '}
                  {authorWorks.author.cited_by_count.toLocaleString()} citations
                </p>
              </div>

              {authorWorks.has_new && authorWorks.new_works.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-[var(--color-accent)]">
                    <BookOpen className="w-4 h-4" />
                    New Publications ({authorWorks.new_works.length})
                  </h3>
                  <div className="space-y-2">
                    {authorWorks.new_works.map((w) => (
                      <div key={w.openalex_id} className="ring-2 ring-[var(--color-accent)]/30 rounded-lg">
                        <SearchResultCard paper={w} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Recent Works</h3>
                <div className="space-y-2">
                  {authorWorks.works.map((w) => (
                    <SearchResultCard key={w.openalex_id} paper={w} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)]">
              <p>Select a tracked author to view their publications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
