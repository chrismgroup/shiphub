import type { CharterFormData, CharterParty, User, Vessel, VesselDetail, VesselFormData, VesselPhoto, VesselStatus } from './types';
let getter: (() => string | null) | null = null;
export const setTokenGetter = (fn: (() => string | null) | null) => { getter = fn; };
const base = () => process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api` : '/api';
export const vesselPhotoUrl = (objectPath:string) => objectPath.startsWith('/objects/vessel-photos/')
 ? `${base()}/vessel-photos/${objectPath.slice('/objects/'.length)}` : objectPath;
export type PhotoUploadProgress = (percentage: number) => void;
const PHOTO_UPLOAD_TIMEOUT_MS = 60_000;
const PHOTO_UPLOAD_ATTEMPTS = 2;
export const createPhotoUploadKey = () =>
  `photo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12).padEnd(10, '0')}`;

class PhotoUploadNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PhotoUploadNetworkError';
  }
}

function uploadPhotoRequest(
  id: number,
  blob: Blob,
  contentType: 'image/jpeg' | 'image/png' | 'image/webp',
  uploadKey: string,
  onProgress?: PhotoUploadProgress,
): Promise<VesselPhoto> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      callback();
    };

    try {
      xhr.open('POST', `${base()}/vessels/${id}/photos/upload`);
      xhr.timeout = PHOTO_UPLOAD_TIMEOUT_MS;
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.setRequestHeader('X-Upload-Key', uploadKey);
      const token = getter?.();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
        }
      };
      xhr.onload = () => {
        let payload: unknown;
        try {
          payload = xhr.responseText ? JSON.parse(xhr.responseText) : undefined;
        } catch {
          payload = undefined;
        }

        const record =
          payload && typeof payload === 'object'
            ? (payload as { error?: string; message?: string })
            : {};
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100);
          finish(() => resolve(payload as VesselPhoto));
          return;
        }

        if (xhr.status === 0) {
          finish(() => reject(new PhotoUploadNetworkError('Photo upload was interrupted.')));
          return;
        }

        if (xhr.status >= 500) {
          finish(() =>
            reject(
              new Error(
                'The photo reached the server, but saving it to this vessel failed. Tap Retry to try again.',
              ),
            ),
          );
          return;
        }

        finish(() =>
          reject(
            new Error(record.error || record.message || `Request failed (${xhr.status})`),
          ),
        );
      };
      xhr.onerror = () =>
        finish(() => reject(new PhotoUploadNetworkError('Photo upload was interrupted.')));
      xhr.ontimeout = () =>
        finish(() => reject(new PhotoUploadNetworkError('Photo upload timed out.')));
      xhr.onabort = () =>
        finish(() => reject(new PhotoUploadNetworkError('Photo upload was interrupted.')));
      xhr.send(blob);
    } catch {
      finish(() => reject(new PhotoUploadNetworkError('Photo upload was interrupted.')));
    }
  });
}

async function uploadPhotoWithRetry(
  id: number,
  blob: Blob,
  contentType: 'image/jpeg' | 'image/png' | 'image/webp',
  uploadKey: string,
  onProgress?: PhotoUploadProgress,
): Promise<VesselPhoto> {
  for (let attempt = 0; attempt < PHOTO_UPLOAD_ATTEMPTS; attempt += 1) {
    try {
      return await uploadPhotoRequest(id, blob, contentType, uploadKey, onProgress);
    } catch (error) {
      const isLastAttempt = attempt === PHOTO_UPLOAD_ATTEMPTS - 1;
      if (!(error instanceof PhotoUploadNetworkError) || isLastAttempt) {
        if (error instanceof PhotoUploadNetworkError) {
          throw new Error(
            'Photo upload was interrupted after one automatic retry. Check your connection and tap Retry to try again.',
          );
        }
        throw error;
      }
      onProgress?.(0);
    }
  }

  throw new Error('Photo upload failed.');
}

async function request<T>(path:string, options:RequestInit = {}): Promise<T> {
  const token = getter?.(); const headers: Record<string,string> = {'Content-Type':'application/json'};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${base()}${path}`, {...options, headers:{...headers, ...(options.headers as Record<string,string>)}});
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => ({error: response.statusText}));
  if (!response.ok) throw new Error(payload.error || payload.message || `Request failed (${response.status})`);
  return payload as T;
}
export const api = {
 auth:{ login:(email:string,password:string)=>request<{token:string;user:User}>('/vessels/auth/login',{method:'POST',body:JSON.stringify({email,password})}), register:(data:{name:string;email:string;password:string;role:'owner';company?:string;phone?:string})=>request<{token:string;user:User}>('/vessels/auth/register',{method:'POST',body:JSON.stringify(data)}) },
  vessels:{ list:()=>request<Vessel[]>('/vessels'), get:(id:number)=>request<VesselDetail>(`/vessels/${id}`), create:(data:VesselFormData)=>request<Vessel>('/vessels',{method:'POST',body:JSON.stringify(data)}), update:(id:number,data:VesselFormData)=>request<Vessel>(`/vessels/${id}`,{method:'PUT',body:JSON.stringify(data)}), delete:(id:number)=>request<void>(`/vessels/${id}`,{method:'DELETE'}), patchStatus:(id:number,status:VesselStatus)=>request<Vessel>(`/vessels/${id}/status`,{method:'PATCH',body:JSON.stringify({status})}), photos:{upload:(id:number,blob:Blob,contentType:'image/jpeg'|'image/png'|'image/webp',uploadKey:string,onProgress?:PhotoUploadProgress)=>uploadPhotoWithRetry(id,blob,contentType,uploadKey,onProgress), reorder:(id:number,photoIds:number[])=>request<VesselPhoto[]>(`/vessels/${id}/photos/reorder`,{method:'PATCH',body:JSON.stringify({photoIds})}), delete:(id:number,photoId:number)=>request<void>(`/vessels/${id}/photos/${photoId}`,{method:'DELETE'})} },
 charters:{list:()=>request<CharterParty[]>('/charter-parties'),get:(id:number)=>request<CharterParty>(`/charter-parties/${id}`),update:(id:number,data:CharterFormData)=>request<CharterParty>(`/charter-parties/${id}`,{method:'PUT',body:JSON.stringify(data)}),confirm:(id:number)=>request<CharterParty>(`/charter-parties/${id}/confirm`,{method:'POST'}),decline:(id:number)=>request<CharterParty>(`/charter-parties/${id}/decline`,{method:'POST'}),terminate:(id:number)=>request<CharterParty>(`/charter-parties/${id}/terminate`,{method:'POST'})},
 admin:{users:()=>request<User[]>('/vessel-admin/users'),changeRole:(id:number,role:string)=>request<User>(`/vessel-admin/users/${id}/role`,{method:'PATCH',body:JSON.stringify({role})})}
};