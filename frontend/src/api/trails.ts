import api from './client';

export interface TrailStepOut {
  id: number;
  step_order: number;
  step_type: string;
  payload: Record<string, any> | null;
  result_snapshot: Record<string, any> | null;
  created_at: string | null;
}

export interface TrailSummary {
  id: number;
  name: string | null;
  step_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface TrailDetail extends TrailSummary {
  steps: TrailStepOut[];
}

export async function listTrails(): Promise<TrailSummary[]> {
  const resp = await api.get<TrailSummary[]>('/trails');
  return resp.data;
}

export async function createTrail(name?: string): Promise<TrailDetail> {
  const resp = await api.post<TrailDetail>('/trails', { name });
  return resp.data;
}

export async function getTrail(id: number): Promise<TrailDetail> {
  const resp = await api.get<TrailDetail>(`/trails/${id}`);
  return resp.data;
}

export async function deleteTrail(id: number): Promise<void> {
  await api.delete(`/trails/${id}`);
}

export async function addTrailStep(
  trailId: number,
  stepType: string,
  payload?: Record<string, any>,
  resultSnapshot?: Record<string, any>,
): Promise<TrailStepOut> {
  const resp = await api.post<TrailStepOut>(`/trails/${trailId}/steps`, {
    step_type: stepType,
    payload,
    result_snapshot: resultSnapshot,
  });
  return resp.data;
}
