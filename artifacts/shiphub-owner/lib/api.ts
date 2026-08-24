import type { AuthResponse, CharterParty, User, Vessel, VesselDetail, VesselFormData, VesselStatus } from './types';

let tokenGetter: (() => string | null) | null = null;
export const setTokenGetter = (getter: (() => string | null) | null) => { tokenGetter = getter; };
const baseUrl = () => process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api` : '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = { 'Content-Type': 'application/json', ...(tokenGetter?.() ? { Authorization: `Bearer ${tokenGetter()}` } : {}), ...(options.headers ?? {}) };
  const response = await fetch(`${baseUrl()}${path}`, { ...options, headers });
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || payload.message || `Request failed (${response.status})`);
  return payload as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) => request<AuthResponse>('/vessels/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (data: { name: string; email: string; password: string; role: 'owner'; company?: string }) => request<AuthResponse>('/vessels/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  },
  vessels: {
    list: () => request<Vessel[]>('/vessels'),
    get: (id: number) => request<VesselDetail>(`/vessels/${id}`),
    create: (data: VesselFormData) => request<Vessel>('/vessels', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: VesselFormData) => request<Vessel>(`/vessels/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    patchStatus: (id: number, status: VesselStatus) => request<Vessel>(`/vessels/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id: number) => request<void>(`/vessels/${id}`, { method: 'DELETE' }),
  },
  charters: { list: () => request<CharterParty[]>('/charter-parties') },
};

export type { AuthResponse, User };