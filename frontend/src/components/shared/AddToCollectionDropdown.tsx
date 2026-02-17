import { useState, useEffect, useRef } from 'react';
import { FolderPlus, Check, Plus } from 'lucide-react';
import { useCollectionStore } from '../../stores/useCollectionStore';

interface Props {
  openalexId: string;
}

export default function AddToCollectionDropdown({ openalexId }: Props) {
  const { collections, fetchCollections, addPaper, createCollection } = useCollectionStore();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [addedTo, setAddedTo] = useState<Set<number>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && collections.length === 0) {
      fetchCollections();
    }
  }, [open, collections.length, fetchCollections]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleAdd = async (collectionId: number) => {
    try {
      await addPaper(collectionId, openalexId);
      setAddedTo((prev) => new Set(prev).add(collectionId));
    } catch {
      // 409 = already in collection, treat as success
      setAddedTo((prev) => new Set(prev).add(collectionId));
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newName.trim()) return;
    await createCollection(newName.trim());
    setNewName('');
    setCreating(false);
    // Re-fetch to get the new collection
    await fetchCollections();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="flex items-center gap-1 text-xs px-2 py-1 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
        aria-label="Add to collection"
      >
        <FolderPlus className="w-3.5 h-3.5" />
        Save
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-[var(--color-border)]">
            <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Add to collection</p>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {collections.map((c) => (
              <button
                key={c.id}
                onClick={() => handleAdd(c.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                <span className="flex-1 truncate">{c.name}</span>
                {addedTo.has(c.id) && <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />}
              </button>
            ))}
            {collections.length === 0 && (
              <p className="px-3 py-2 text-xs text-[var(--color-text-secondary)]">No collections yet</p>
            )}
          </div>

          <div className="border-t border-[var(--color-border)]">
            {creating ? (
              <div className="p-2 flex gap-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateAndAdd()}
                  placeholder="Name"
                  className="flex-1 px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
                  autoFocus
                />
                <button
                  onClick={handleCreateAndAdd}
                  className="px-2 py-1 text-xs rounded bg-[var(--color-primary)] text-white"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New collection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
