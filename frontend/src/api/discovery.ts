import api from './client';
import type { PaperSummary } from './search';

export interface DiscoveryResult {
  paper: PaperSummary;
  score: number;
  overlap_seeds: number;
  reason: string | null;
}

export interface DiscoveryResponse {
  strategy: string;
  seed_count: number;
  results: DiscoveryResult[];
}

export async function runMultiSeedDiscovery(
  seedIds: string[],
  strategy: string = 'co_citation',
  maxResults: number = 30,
): Promise<DiscoveryResponse> {
  const resp = await api.post<DiscoveryResponse>('/discovery/multi-seed', {
    seed_ids: seedIds,
    strategy,
    max_results: maxResults,
  });
  return resp.data;
}
