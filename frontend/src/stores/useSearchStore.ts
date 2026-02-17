import { create } from 'zustand';
import { searchWorks } from '../api/search';
import type { PaperSummary, SearchMeta } from '../api/search';

interface SearchFilters {
  yearMin?: number;
  yearMax?: number;
  type?: string;
}

interface SearchState {
  query: string;
  filters: SearchFilters;
  results: PaperSummary[];
  meta: SearchMeta | null;
  isLoading: boolean;
  error: string | null;

  setQuery: (q: string) => void;
  setFilters: (f: Partial<SearchFilters>) => void;
  executeSearch: (page?: number) => Promise<void>;
  clearResults: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  filters: {},
  results: [],
  meta: null,
  isLoading: false,
  error: null,

  setQuery: (query) => set({ query }),

  setFilters: (f) => set((state) => ({
    filters: { ...state.filters, ...f },
  })),

  executeSearch: async (page = 1) => {
    const { query, filters } = get();
    if (!query.trim()) return;

    set({ isLoading: true, error: null });
    try {
      const resp = await searchWorks({
        q: query,
        year_min: filters.yearMin,
        year_max: filters.yearMax,
        type: filters.type,
        page,
        per_page: 25,
      });
      set({
        results: page === 1 ? resp.results : [...get().results, ...resp.results],
        meta: resp.meta,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.message || 'Search failed',
        isLoading: false,
      });
    }
  },

  clearResults: () => set({ results: [], meta: null, error: null }),
}));
