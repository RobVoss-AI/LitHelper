import { create } from 'zustand';
import {
  listCollections,
  createCollection,
  getCollection,
  deleteCollection,
  addPaperToCollection,
  removePaperFromCollection,
} from '../api/collections';
import type { CollectionSummary, CollectionDetail } from '../api/collections';

interface CollectionState {
  collections: CollectionSummary[];
  activeCollection: CollectionDetail | null;
  isLoading: boolean;

  fetchCollections: () => Promise<void>;
  createCollection: (name: string, description?: string) => Promise<void>;
  loadCollection: (id: number) => Promise<void>;
  deleteCollection: (id: number) => Promise<void>;
  addPaper: (collectionId: number, openalexId: string) => Promise<void>;
  removePaper: (collectionId: number, openalexId: string) => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  activeCollection: null,
  isLoading: false,

  fetchCollections: async () => {
    set({ isLoading: true });
    try {
      const collections = await listCollections();
      set({ collections, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createCollection: async (name, description) => {
    await createCollection(name, description);
    await get().fetchCollections();
  },

  loadCollection: async (id) => {
    set({ isLoading: true });
    try {
      const detail = await getCollection(id);
      set({ activeCollection: detail, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  deleteCollection: async (id) => {
    await deleteCollection(id);
    set({ activeCollection: null });
    await get().fetchCollections();
  },

  addPaper: async (collectionId, openalexId) => {
    await addPaperToCollection(collectionId, openalexId);
    // Refresh if viewing this collection
    const active = get().activeCollection;
    if (active && active.id === collectionId) {
      await get().loadCollection(collectionId);
    }
    await get().fetchCollections();
  },

  removePaper: async (collectionId, openalexId) => {
    await removePaperFromCollection(collectionId, openalexId);
    const active = get().activeCollection;
    if (active && active.id === collectionId) {
      await get().loadCollection(collectionId);
    }
    await get().fetchCollections();
  },
}));
