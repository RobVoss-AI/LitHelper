import { useEffect, useState } from 'react';
import { ExternalLink, BookOpen, Lock, X } from 'lucide-react';
import { getPaper } from '../../api/papers';
import type { PaperDetail as PaperDetailType } from '../../api/search';
import { reconstructAbstract } from '../../utils/abstractReconstructor';
import AddToCollectionDropdown from '../shared/AddToCollectionDropdown';

interface Props {
  openalexId: string;
  onClose: () => void;
  onExplore?: (id: string) => void;
}

export default function PaperDetail({ openalexId, onClose, onExplore }: Props) {
  const [paper, setPaper] = useState<PaperDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPaper(openalexId)
      .then(setPaper)
      .catch(() => setPaper(null))
      .finally(() => setLoading(false));
  }, [openalexId]);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="p-4 text-[var(--color-text-secondary)]">Paper not found</div>
    );
  }

  const abstract = reconstructAbstract(paper.abstract_inverted_index);

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-bold leading-snug">{paper.title}</h2>
        <button onClick={onClose} className="p-1 hover:bg-[var(--color-bg-tertiary)] rounded shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        {paper.publication_year && <span className="font-medium">{paper.publication_year}</span>}
        {paper.source_name && <span>{paper.source_name}</span>}
        <span className="font-medium">{paper.cited_by_count.toLocaleString()} citations</span>
        {paper.is_open_access ? (
          <BookOpen className="w-4 h-4 text-[var(--color-accent)]" />
        ) : (
          <Lock className="w-4 h-4" />
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Authors</h3>
        <div className="flex flex-wrap gap-1">
          {paper.authors.map((a, i) => (
            <span key={i} className="text-sm px-2 py-0.5 bg-[var(--color-bg-tertiary)] rounded">
              {a.author_name}
              {a.institution && (
                <span className="text-[var(--color-text-secondary)]"> ({a.institution})</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {abstract && (
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Abstract</h3>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{abstract}</p>
        </div>
      )}

      {paper.topics.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Topics</h3>
          <div className="flex flex-wrap gap-1">
            {paper.topics.map((t, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded">
                {t.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-2">
        {paper.doi && (
          <a
            href={paper.doi}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            DOI
          </a>
        )}
        {onExplore && (
          <button
            onClick={() => onExplore(paper.openalex_id)}
            className="text-sm px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors"
          >
            Explore Citations
          </button>
        )}
        <AddToCollectionDropdown openalexId={paper.openalex_id} />
      </div>
    </div>
  );
}
