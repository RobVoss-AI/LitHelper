import api from './client';

export interface MonitorSummary {
  id: number;
  name: string;
  query: string;
  check_interval_hours: number;
  last_checked_at: string | null;
  known_result_count: number;
  unread_count: number;
  created_at: string | null;
}

export interface MonitorResultOut {
  id: number;
  paper_openalex_id: string;
  paper_title: string | null;
  is_read: boolean;
  found_at: string | null;
}

export interface MonitorDetail extends MonitorSummary {
  filters: Record<string, any> | null;
  results: MonitorResultOut[];
}

export async function listMonitors(): Promise<MonitorSummary[]> {
  const resp = await api.get<MonitorSummary[]>('/monitors');
  return resp.data;
}

export async function createMonitor(data: {
  name: string;
  query: string;
  filters?: Record<string, any>;
  check_interval_hours?: number;
}): Promise<MonitorSummary> {
  const resp = await api.post<MonitorSummary>('/monitors', data);
  return resp.data;
}

export async function getMonitor(id: number): Promise<MonitorDetail> {
  const resp = await api.get<MonitorDetail>(`/monitors/${id}`);
  return resp.data;
}

export async function deleteMonitor(id: number): Promise<void> {
  await api.delete(`/monitors/${id}`);
}

export async function checkMonitor(id: number): Promise<MonitorDetail> {
  const resp = await api.post<MonitorDetail>(`/monitors/${id}/check`);
  return resp.data;
}

export async function markResultRead(monitorId: number, resultId: number): Promise<void> {
  await api.post(`/monitors/${monitorId}/results/${resultId}/read`);
}
