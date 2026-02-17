import api from './client';

export interface GraphNode {
  id: string;
  title: string;
  publication_year: number;
  cited_by_count: number;
  authors: string[];
  is_seed: boolean;
  depth: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphBuildParams {
  seed_ids: string[];
  depth?: number;
  max_nodes?: number;
  direction?: 'references' | 'citations' | 'both';
}

export interface GraphExpandParams {
  node_id: string;
  existing_ids: string[];
  direction?: string;
}

export async function buildGraph(params: GraphBuildParams): Promise<GraphData> {
  const resp = await api.post<GraphData>('/graph/build', params);
  return resp.data;
}

export async function expandNode(params: GraphExpandParams): Promise<GraphData> {
  const resp = await api.post<GraphData>('/graph/expand', params);
  return resp.data;
}
