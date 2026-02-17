import api from './client';

export interface ImportResult {
  total: number;
  resolved: number;
  failed: number;
  resolved_ids: string[];
  failed_entries: string[];
}

export async function exportCollection(collectionId: number, format: string = 'bibtex'): Promise<string> {
  const resp = await api.post('/export', { collection_id: collectionId, format }, {
    responseType: 'text',
    headers: { Accept: 'text/plain' },
  });
  return resp.data as unknown as string;
}

export async function importFile(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const resp = await api.post<ImportResult>('/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return resp.data;
}
