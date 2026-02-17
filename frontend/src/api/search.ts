import api from './client';

export interface AuthorShip {
  author_id: string | null;
  author_name: string;
  institution: string | null;
}

export interface PaperSummary {
  openalex_id: string;
  doi: string | null;
  title: string;
  publication_year: number | null;
  cited_by_count: number;
  authors: AuthorShip[];
  type: string | null;
  is_open_access: boolean;
  source_name: string | null;
}

export interface PaperDetail extends PaperSummary {
  publication_date: string | null;
  abstract_inverted_index: Record<string, number[]> | null;
  topics: { name: string; score: number }[];
  referenced_work_ids: string[];
}

export interface SearchMeta {
  count: number;
  page: number;
  per_page: number;
}

export interface SearchResponse {
  meta: SearchMeta;
  results: PaperSummary[];
}

export interface SearchParams {
  q: string;
  year_min?: number;
  year_max?: number;
  type?: string;
  sort?: string;
  page?: number;
  per_page?: number;
}

export async function searchWorks(params: SearchParams): Promise<SearchResponse> {
  const resp = await api.get<SearchResponse>('/search/works', { params });
  return resp.data;
}

export async function getPaper(openalexId: string): Promise<PaperDetail> {
  const resp = await api.get<PaperDetail>(`/papers/${encodeURIComponent(openalexId)}`);
  return resp.data;
}
