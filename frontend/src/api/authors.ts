import api from './client';
import type { PaperSummary } from './search';

export interface AuthorSearchResult {
  openalex_id: string;
  display_name: string;
  works_count: number;
  cited_by_count: number;
  institution: string | null;
}

export interface AuthorSearchResponse {
  count: number;
  results: AuthorSearchResult[];
}

export interface TrackedAuthorOut {
  id: number;
  openalex_id: string;
  display_name: string;
  works_count: number;
  cited_by_count: number;
  institution: string | null;
  last_known_work_date: string | null;
  created_at: string | null;
}

export interface AuthorWorksResponse {
  author: AuthorSearchResult;
  works: PaperSummary[];
  total_count: number;
  has_new: boolean;
  new_works: PaperSummary[];
}

export async function searchAuthors(q: string): Promise<AuthorSearchResponse> {
  const resp = await api.get<AuthorSearchResponse>('/authors/search', { params: { q } });
  return resp.data;
}

export async function getAuthorWorks(openalexId: string): Promise<AuthorWorksResponse> {
  const resp = await api.get<AuthorWorksResponse>(`/authors/${encodeURIComponent(openalexId)}/works`);
  return resp.data;
}

export async function listTrackedAuthors(): Promise<TrackedAuthorOut[]> {
  const resp = await api.get<TrackedAuthorOut[]>('/authors/tracked');
  return resp.data;
}

export async function trackAuthor(author: {
  openalex_id: string;
  display_name: string;
  works_count?: number;
  cited_by_count?: number;
  institution?: string;
}): Promise<TrackedAuthorOut> {
  const resp = await api.post<TrackedAuthorOut>('/authors/tracked', author);
  return resp.data;
}

export async function untrackAuthor(id: number): Promise<void> {
  await api.delete(`/authors/tracked/${id}`);
}
