import api from './client';
import type { PaperDetail, SearchResponse } from './search';

export async function getPaper(openalexId: string): Promise<PaperDetail> {
  const resp = await api.get<PaperDetail>(`/papers/${encodeURIComponent(openalexId)}`);
  return resp.data;
}

export async function getPaperReferences(
  openalexId: string,
  page = 1,
  perPage = 50
): Promise<SearchResponse> {
  const resp = await api.get<SearchResponse>(
    `/papers/${encodeURIComponent(openalexId)}/references`,
    { params: { page, per_page: perPage } }
  );
  return resp.data;
}

export async function getPaperCitations(
  openalexId: string,
  page = 1,
  perPage = 50
): Promise<SearchResponse> {
  const resp = await api.get<SearchResponse>(
    `/papers/${encodeURIComponent(openalexId)}/citations`,
    { params: { page, per_page: perPage } }
  );
  return resp.data;
}
