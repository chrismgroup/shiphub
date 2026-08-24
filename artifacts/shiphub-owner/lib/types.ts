export type UserRole = 'client' | 'broker' | 'owner' | 'admin';
export type VesselStatus = 'available' | 'on_hire' | 'laid_up' | 'decommissioned';
export type CharterStatus = 'enquiry' | 'negotiating' | 'active' | 'confirmed' | 'declined' | 'terminated';
export interface User { id: number; name: string; email: string; role: UserRole; company?: string | null; phone?: string | null; createdAt: string }
export interface AuthResponse { token: string; user: User }
export interface Vessel { id: number; ownerId: number; name: string; vesselType: string; flag?: string | null; status: VesselStatus; createdAt: string; updatedAt: string }
export interface VesselDetail extends Vessel { imoNumber?: string | null; dwt?: string | null; grt?: string | null; yearBuilt?: number | null; loa?: string | null; beam?: string | null; draft?: string | null; classificationSociety?: string | null; tradingArea?: string | null; description?: string | null; contacts: Array<{ contactName: string; phone?: string | null; email?: string | null; address?: string | null }> }
export interface VesselFormData { name: string; vesselType: string; imoNumber?: string; flag?: string; dwt?: string; grt?: string; yearBuilt?: string; loa?: string; beam?: string; draft?: string; classificationSociety?: string; tradingArea?: string; description?: string; status?: VesselStatus; contacts?: Array<{ contactName: string; phone?: string; email?: string; address?: string }> }
export interface CharterParty { id: number; vesselId: number; ownerId: number; chartererId: number; vesselName?: string | null; chartererName?: string | null; status: CharterStatus; createdAt: string; updatedAt: string }
export const VESSEL_TYPES = ['Bulk Carrier', 'Tanker', 'Container Ship', 'General Cargo', 'Offshore Supply Vessel', 'Passenger', 'Tugboat', 'Other'] as const;
export const VESSEL_STATUSES: VesselStatus[] = ['available', 'on_hire', 'laid_up', 'decommissioned'];