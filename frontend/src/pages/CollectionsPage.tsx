import { useEffect, useState } from 'react';
import { FolderOpen, Plus, Trash2, ChevronRight } from 'lucide-react';
import { useCollectionStore } from '../stores/useCollectionStore';
import SearchResultCard from '../components/search/SearchResultCard';

export default function CollectionsPage() {
  const {
    collections,
    activeCollection,
    isLoading,
    fetchCollections,
    createCollection,
    loadCollection,
    deleteCollection,
    removePaper,
  } = useCollectionStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createCollection(newName, newDesc || undefined);
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
  };

  return (
    <div className="flex h-full">
      {/* Collection list sidebar */}
      <div className="w-72 border-r border-[var(--color-border)] flex flex-col">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-bold">Collections</h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="p-1.5 rounded hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {showCreate && (
          <div className="p-3 border-b border-[var(--color-border)] space-y-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Collection name"
              className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
            />
            <button
              onClick={handleCreate}
              className="w-full py-1.5 text-sm rounded bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)]"
            >
              Create
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {collections.map((c) => (
            <button
              key={c.id}
              onClick={() => loadCollection(c.id)}
              className={`w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-[var(--color-bg-tertiary)] transition-colors ${
                activeCollection?.id === c.id ? 'bg-[var(--color-bg-tertiary)]' : ''
              }`}
            >
              <FolderOpen className="w-4 h-4 shrink-0 text-[var(--color-text-secondary)]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{c.paper_count} papers</p>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0 text-[var(--color-text-secondary)]" />
            </button>
          ))}
          {collections.length === 0 && !isLoading && (
            <div className="p-4 text-center text-sm text-[var(--color-text-secondary)]">
              No collections yet. Create one to get started.
            </div>
          )}
        </div>
      </div>

      {/* Collection detail */}
      <div className="flex-1 overflow-y-auto">
        {activeCollection ? (
          <div className="max-w-3xl mx-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">{activeCollection.name}</h1>
                {activeCollection.description && (
                  <p className="text-sm text-[var(--color-text-secondary)]">{activeCollection.description}</p>
                )}
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  {activeCollection.paper_count} papers
                </p>
              </div>
              <button
                onClick={() => deleteCollection(activeCollection.id)}
                className="p-2 rounded text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {activeCollection.papers.map((cp) =>
                cp.paper ? (
                  <div key={cp.openalex_id} className="relative">
                    <SearchResultCard paper={cp.paper} />
                    <button
                      onClick={() => removePaper(activeCollection.id, cp.openalex_id)}
                      className="absolute top-2 right-2 p-1 rounded text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : null
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)]">
            <p>Select a collection to view its papers</p>
          </div>
        )}
      </div>
    </div>
  );
}
