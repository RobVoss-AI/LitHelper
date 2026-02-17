import { create } from 'zustand';
import { buildGraph, expandNode } from '../api/citations';
import type { GraphNode, GraphEdge } from '../api/citations';

interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  seedIds: string[];
  depth: number;
  maxNodes: number;
  direction: 'references' | 'citations' | 'both';
  selectedNodeId: string | null;
  isLoading: boolean;
  error: string | null;

  loadGraph: (seedIds: string[], depth?: number) => Promise<void>;
  expandGraphNode: (nodeId: string) => Promise<void>;
  selectNode: (id: string | null) => void;
  setDepth: (d: number) => void;
  setDirection: (d: 'references' | 'citations' | 'both') => void;
  setMaxNodes: (n: number) => void;
  clearGraph: () => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  seedIds: [],
  depth: 1,
  maxNodes: 500,
  direction: 'both',
  selectedNodeId: null,
  isLoading: false,
  error: null,

  loadGraph: async (seedIds, depth) => {
    const state = get();
    const d = depth ?? state.depth;
    set({ isLoading: true, error: null, seedIds });
    try {
      const data = await buildGraph({
        seed_ids: seedIds,
        depth: d,
        max_nodes: state.maxNodes,
        direction: state.direction,
      });
      set({
        nodes: data.nodes,
        edges: data.edges,
        isLoading: false,
        depth: d,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to build graph', isLoading: false });
    }
  },

  expandGraphNode: async (nodeId) => {
    const state = get();
    set({ isLoading: true, error: null });
    try {
      const data = await expandNode({
        node_id: nodeId,
        existing_ids: state.nodes.map((n) => n.id),
        direction: state.direction,
      });
      set({
        nodes: [...state.nodes, ...data.nodes],
        edges: [...state.edges, ...data.edges],
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to expand node', isLoading: false });
    }
  },

  selectNode: (id) => set({ selectedNodeId: id }),
  setDepth: (d) => set({ depth: d }),
  setDirection: (d) => set({ direction: d }),
  setMaxNodes: (n) => set({ maxNodes: n }),
  clearGraph: () => set({ nodes: [], edges: [], seedIds: [], selectedNodeId: null, error: null }),
}));
