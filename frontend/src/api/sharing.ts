import api from './client';

export async function exportBundle(collectionId: number): Promise<any> {
  const resp = await api.get(`/sharing/export/${collectionId}`);
  return resp.data;
}

export async function importBundle(file: File): Promise<{ ok: boolean; collection_id: number }> {
  const formData = new FormData();
  formData.append('file', file);
  const resp = await api.post<{ ok: boolean; collection_id: number }>('/sharing/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return resp.data;
}
