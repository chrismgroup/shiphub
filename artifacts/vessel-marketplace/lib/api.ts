import type {
  AuthResponse,
  CharterAgreement,
  CharterOffer,
  CharterFormData,
  CharterParty,
  User,
  Vessel,
  VesselDetail,
  VesselFormData,
  VesselNotification,
  VesselPhoto,
  VesselStatus,
} from './types';

// Token provider — set by AuthContext on login
let _tokenGetter: (() => string | null) | null = null;
let _unauthorizedHandler: (() => void) | null = null;

export function setTokenGetter(fn: (() => string | null) | null) {
  _tokenGetter = fn;
}

export function setUnauthorizedHandler(fn: (() => void) | null) {
  _unauthorizedHandler = fn;
}

/** Returns the current auth token (used by the WebSocket hook). */
export function getToken(): string | null {
  return _tokenGetter?.() ?? null;
}
function getBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api`;
  return '/api';
}

export function vesselPhotoUrl(objectPath: string): string {
  return objectPath.startsWith('/objects/vessel-photos/')
    ? `${getBaseUrl()}/vessel-photos/${objectPath.slice('/objects/'.length)}`
    : objectPath;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = _tokenGetter?.();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({ error: res.statusText }));

  if (!res.ok) {
    if (res.status === 401) {
      _unauthorizedHandler?.();
    }
    const msg =
      res.status === 401
        ? 'Your ShipHub session has expired. Please sign in again and resubmit your enquiry.'
        : data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

// ── AUTH ─────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<AuthResponse>('/vessels/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    register: (data: {
      name: string;
      email: string;
      password: string;
      role?: string;
      company?: string;
      phone?: string;
    }) =>
      request<AuthResponse>('/vessels/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ── VESSELS ──────────────────────────────────────────────────────────────

  vessels: {
    list: (params?: {
      vesselType?: string;
      status?: string;
      tradingArea?: string;
      search?: string;
    }) => {
      const q = new URLSearchParams();
      if (params?.vesselType && params.vesselType !== 'All')
        q.set('vesselType', params.vesselType);
      if (params?.status && params.status !== 'All')
        q.set('status', params.status);
      if (params?.tradingArea) q.set('tradingArea', params.tradingArea);
      if (params?.search) q.set('search', params.search);
      const qs = q.toString();
      return request<Vessel[]>(`/vessels${qs ? `?${qs}` : ''}`);
    },

    get: (id: number) => request<VesselDetail>(`/vessels/${id}`),

    create: (data: VesselFormData) =>
      request<Vessel>('/vessels', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number, data: VesselFormData) =>
      request<Vessel>(`/vessels/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    patchStatus: (id: number, status: VesselStatus) =>
      request<Vessel>(`/vessels/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),

    photos: {
      list: (id: number) => request<VesselPhoto[]>(`/vessels/${id}/photos`),
      reorder: (vesselId: number, photoIds: number[]) =>
        request<VesselPhoto[]>(`/vessels/${vesselId}/photos/reorder`, {
          method: 'PATCH',
          body: JSON.stringify({ photoIds }),
        }),
      delete: (vesselId: number, photoId: number) =>
        request<void>(`/vessels/${vesselId}/photos/${photoId}`, {
          method: 'DELETE',
        }),
    },
  },

  // ── CHARTER PARTIES ───────────────────────────────────────────────────────

  charters: {
    create: (vesselId: number, data: CharterFormData) =>
      request<CharterParty>(`/vessels/${vesselId}/charter`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    list: () => request<CharterParty[]>('/charter-parties'),

    get: (id: number) => request<CharterParty>(`/charter-parties/${id}`),

    offers: (id: number) => request<CharterOffer[]>(`/charter-parties/${id}/offers`),

    agreement: (id: number) => request<CharterAgreement>(`/charter-parties/${id}/agreement`),

    update: (id: number, data: CharterFormData) =>
      request<CharterParty>(`/charter-parties/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    confirm: (id: number) =>
      request<CharterParty>(`/charter-parties/${id}/confirm`, {
        method: 'POST',
      }),

    decline: (id: number) =>
      request<CharterParty>(`/charter-parties/${id}/decline`, {
        method: 'POST',
      }),

    terminate: (id: number) =>
      request<CharterParty>(`/charter-parties/${id}/terminate`, {
        method: 'POST',
      }),

    activate: (id: number, data?: { hireStart?: string; hireEnd?: string }) =>
      request<CharterParty>(`/charter-parties/${id}/activate`, {
        method: 'POST',
        body: JSON.stringify(data ?? {}),
      }),
  },

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────

  notifications: {
    list: () => request<VesselNotification[]>('/vessel-notifications'),

    markRead: (id: number) =>
      request<VesselNotification>(`/vessel-notifications/${id}/read`, {
        method: 'PATCH',
      }),

    markAllRead: () =>
      request<{ ok: boolean }>('/vessel-notifications/read-all', {
        method: 'POST',
      }),
  },

  // ── ADMIN ─────────────────────────────────────────────────────────────────

  admin: {
    users: () =>
      request<User[]>('/vessel-admin/users'),

    changeRole: (userId: number, role: string) =>
      request<User>(`/vessel-admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
  },
};
