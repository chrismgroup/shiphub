export type UserRole = 'client' | 'broker' | 'owner' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  company?: string | null;
  phone?: string | null;
  createdAt: string;
}

export type VesselStatus = 'available' | 'on_hire' | 'laid_up' | 'decommissioned';

export interface Vessel {
  id: number;
  ownerId: number;
  name: string;
  imoNumber?: string | null;
  vesselType: string;
  flag?: string | null;
  dwt?: string | null;
  grt?: string | null;
  yearBuilt?: number | null;
  loa?: string | null;
  beam?: string | null;
  draft?: string | null;
  classificationSociety?: string | null;
  tradingArea?: string | null;
  description?: string | null;
  status: VesselStatus;
  createdAt: string;
  updatedAt: string;
  ownerName?: string | null;
  firstPhotoPath?: string | null;
}

export interface VesselContact {
  id: number;
  vesselId: number;
  contactName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface VesselPhoto {
  id: number;
  vesselId: number;
  objectPath: string;
  sortOrder: number;
  uploadedAt: string;
}

export interface VesselDetail extends Vessel {
  contacts: VesselContact[];
  photos: VesselPhoto[];
}

export type CharterStatus =
  | 'enquiry'
  | 'negotiating'
  | 'active'
  | 'confirmed'
  | 'declined'
  | 'terminated';

export interface CharterParty {
  id: number;
  vesselId: number;
  chartererId: number;
  ownerId: number;
  rate?: string | null;
  rateCurrency: string;
  rateBasis?: string | null;
  laycanEarliest?: string | null;
  laycanLatest?: string | null;
  durationDays?: number | null;
  cargoPurpose?: string | null;
  terms?: string | null;
  status: CharterStatus;
  ownerConfirmedAt?: string | null;
  chartererConfirmedAt?: string | null;
  hireStart?: string | null;
  hireEnd?: string | null;
  createdAt: string;
  updatedAt: string;
  vesselName?: string | null;
  chartererName?: string | null;
  ownerName?: string | null;
}

export interface CharterOffer {
  id: number;
  charterId: number;
  actorId: number;
  actorRole: 'owner' | 'charterer';
  actorName?: string | null;
  supersedesOfferId?: number | null;
  rate?: string | null;
  rateCurrency: string;
  rateBasis?: string | null;
  laycanEarliest?: string | null;
  laycanLatest?: string | null;
  durationDays?: number | null;
  cargoPurpose?: string | null;
  terms?: string | null;
  createdAt: string;
}

export interface VesselNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  relatedId?: number | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface VesselFormData {
  name: string;
  imoNumber?: string;
  vesselType: string;
  flag?: string;
  dwt?: string;
  grt?: string;
  yearBuilt?: string;
  loa?: string;
  beam?: string;
  draft?: string;
  classificationSociety?: string;
  tradingArea?: string;
  description?: string;
  status?: VesselStatus;
  contacts?: Array<{
    contactName: string;
    phone?: string;
    email?: string;
    address?: string;
  }>;
}

export interface CharterFormData {
  rate?: string;
  rateCurrency?: string;
  rateBasis?: string;
  laycanEarliest?: string;
  laycanLatest?: string;
  durationDays?: string;
  cargoPurpose?: string;
  terms?: string;
}

export const VESSEL_TYPES = [
  'Bulk Carrier',
  'Tanker',
  'Container Ship',
  'General Cargo',
  'Offshore Supply Vessel',
  'Passenger',
  'Tugboat',
  'Flat Bottom Barge',
  'Ramp Barge',
  'Barge',
  'PSV',
  'OSV',
  'AHTS',
  'ASD',
  'Pilot Boat',
  'Crew Boat',
  'Workboat',
  'DSV',
  'FSPO',
  'FPSO',
  'FSO',
  'Survey Vessel',
  'Other',
] as const;

export const VESSEL_STATUSES: VesselStatus[] = [
  'available',
  'on_hire',
  'laid_up',
  'decommissioned',
];

export const CHARTER_CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN'] as const;

export const RATE_BASES = [
  'Per Day',
  'Per Month',
  'Lump Sum',
  'Per Metric Ton',
] as const;
