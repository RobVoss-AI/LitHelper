import api from './client';

export interface ZoteroConfigOut {
  id: number;
  library_id: string;
  library_type: string;
  last_sync_at: string | null;
  connected: boolean;
}

export interface ZoteroCollectionOut {
  key: string;
  name: string;
  parent: string | null;
  num_items: number;
}

export interface ZoteroSyncResult {
  total: number;
  synced: number;
  failed: number;
}

export async function getZoteroConfig(): Promise<ZoteroConfigOut | null> {
  const resp = await api.get<ZoteroConfigOut | null>('/zotero/config');
  return resp.data;
}

export async function setZoteroConfig(data: {
  api_key: string;
  library_id: string;
  library_type?: string;
}): Promise<ZoteroConfigOut> {
  const resp = await api.post<ZoteroConfigOut>('/zotero/config', data);
  return resp.data;
}

export async function removeZoteroConfig(): Promise<void> {
  await api.delete('/zotero/config');
}

export async function listZoteroCollections(): Promise<ZoteroCollectionOut[]> {
  const resp = await api.get<ZoteroCollectionOut[]>('/zotero/collections');
  return resp.data;
}

export async function pullFromZotero(data: {
  zotero_collection_key?: string;
  lithelper_collection_id: number;
}): Promise<ZoteroSyncResult> {
  const resp = await api.post<ZoteroSyncResult>('/zotero/pull', data);
  return resp.data;
}

export async function pushToZotero(data: {
  lithelper_collection_id: number;
  zotero_collection_key?: string;
}): Promise<ZoteroSyncResult> {
  const resp = await api.post<ZoteroSyncResult>('/zotero/push', data);
  return resp.data;
}
