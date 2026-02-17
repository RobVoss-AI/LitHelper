import api from './client';
import type { PaperSummary } from './search';

export interface CollectionSummary {
  id: number;
  name: string;
  description: string | null;
  paper_count: number;
  created_at: string | null;
}

export interface CollectionPaperInfo {
  openalex_id: string;
  added_at: string | null;
  notes: string | null;
  paper: PaperSummary | null;
}

export interface CollectionDetail extends CollectionSummary {
  papers: CollectionPaperInfo[];
}

export async function listCollections(): Promise<CollectionSummary[]> {
  const resp = await api.get<CollectionSummary[]>('/collections');
  return resp.data;
}

export async function createCollection(name: string, description?: string): Promise<CollectionSummary> {
  const resp = await api.post<CollectionSummary>('/collections', { name, description });
  return resp.data;
}

export async function getCollection(id: number): Promise<CollectionDetail> {
  const resp = await api.get<CollectionDetail>(`/collections/${id}`);
  return resp.data;
}

export async function updateCollection(id: number, data: { name?: string; description?: string }): Promise<CollectionSummary> {
  const resp = await api.put<CollectionSummary>(`/collections/${id}`, data);
  return resp.data;
}

export async function deleteCollection(id: number): Promise<void> {
  await api.delete(`/collections/${id}`);
}

export async function addPaperToCollection(collectionId: number, openalexId: string, notes?: string): Promise<void> {
  await api.post(`/collections/${collectionId}/papers`, { openalex_id: openalexId, notes });
}

export async function removePaperFromCollection(collectionId: number, openalexId: string): Promise<void> {
  await api.delete(`/collections/${collectionId}/papers/${encodeURIComponent(openalexId)}`);
}
