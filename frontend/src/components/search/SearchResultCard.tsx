import { ExternalLink, BookOpen, Lock, Network } from 'lucide-react';
import type { PaperSummary } from '../../api/search';
import AddToCollectionDropdown from '../shared/AddToCollectionDropdown';

interface Props {
  paper: PaperSummary;
  onClick?: () => void;
  onExplore?: (id: string) => void;
}

export default function SearchResultCard({ paper, onClick, onExplore }: Props) {
  const authorStr = paper.authors
    .slice(0, 3)
    .map((a) => a.author_name)
    .join(', ');
  const hasMore = paper.authors.length > 3;

  return (
    <div
      onClick={onClick}
      className="p-4 border border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-snug flex-1">{paper.title}</h3>
        <div className="flex items-center gap-1 shrink-0">
          {paper.is_open_access ? (
            <BookOpen className="w-4 h-4 text-[var(--color-accent)]" aria-label="Open Access" />
          ) : (
            <Lock className="w-4 h-4 text-[var(--color-text-secondary)]" aria-label="Closed Access" />
          )}
          {paper.doi && (
            <a
              href={paper.doi}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] mt-1">
        {authorStr}{hasMore ? ' et al.' : ''}
      </p>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
          {paper.publication_year && <span>{paper.publication_year}</span>}
          {paper.source_name && <span>{paper.source_name}</span>}
          <span className="font-medium">{paper.cited_by_count.toLocaleString()} citations</span>
          {paper.type && (
            <span className="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-xs">
              {paper.type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <AddToCollectionDropdown openalexId={paper.openalex_id} />
          {onExplore && (
            <button
              onClick={(e) => { e.stopPropagation(); onExplore(paper.openalex_id); }}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
            >
              <Network className="w-3.5 h-3.5" />
              Explore
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
