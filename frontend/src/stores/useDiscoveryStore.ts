import { create } from 'zustand';
import { runMultiSeedDiscovery } from '../api/discovery';
import type { DiscoveryResult } from '../api/discovery';
import type { PaperSummary } from '../api/search';

interface DiscoveryState {
  seeds: PaperSummary[];
  results: DiscoveryResult[];
  strategy: string;
  isLoading: boolean;
  error: string | null;

  addSeed: (paper: PaperSummary) => void;
  removeSeed: (openalexId: string) => void;
  clearSeeds: () => void;
  setStrategy: (strategy: string) => void;
  runDiscovery: () => Promise<void>;
}

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  seeds: [],
  results: [],
  strategy: 'co_citation',
  isLoading: false,
  error: null,

  addSeed: (paper) => {
    const { seeds } = get();
    if (seeds.some((s) => s.openalex_id === paper.openalex_id)) return;
    set({ seeds: [...seeds, paper], results: [], error: null });
  },

  removeSeed: (openalexId) => {
    set((state) => ({
      seeds: state.seeds.filter((s) => s.openalex_id !== openalexId),
      results: [],
    }));
  },

  clearSeeds: () => set({ seeds: [], results: [], error: null }),

  setStrategy: (strategy) => set({ strategy, results: [] }),

  runDiscovery: async () => {
    const { seeds, strategy } = get();
    if (seeds.length === 0) return;
    set({ isLoading: true, error: null });
    try {
      const resp = await runMultiSeedDiscovery(
        seeds.map((s) => s.openalex_id),
        strategy,
      );
      set({ results: resp.results, isLoading: false });
    } catch {
      set({ error: 'Discovery failed. Try again.', isLoading: false });
    }
  },
}));
