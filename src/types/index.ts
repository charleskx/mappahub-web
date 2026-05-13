export interface User {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'owner' | 'admin' | 'employee'
  tenantId: string
  emailVerified: boolean
  twoFactorEnabled: boolean
}

export interface Tenant {
  id: string
  name: string
  slug: string
  email?: string
  active: boolean
  createdAt: string
  subscriptionStatus?: string | null
  planType?: string | null
  trialEndsAt?: string | null
  currentPeriodEnd?: string | null
}

export interface PinType {
  id: string
  tenantId: string
  name: string
  color: string
  createdAt: string
}

export interface Partner {
  id: string
  tenantId: string
  name: string
  address?: string | null
  city?: string | null
  state?: string | null
  lat?: number | null
  lng?: number | null
  visibility: 'public' | 'internal'
  pinTypeId?: string | null
  pinTypeName?: string | null
  pinTypeColor?: string | null
  geocodeStatus?: 'pending' | 'done' | 'failed' | null
  dynamicValues?: Record<string, string | null>
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface PartnerColumn {
  id: string
  tenantId: string
  key: string
  label: string
  dataType: string
  sortOrder: number
  visible: boolean
}

export interface ExportColumn {
  key: string
  label: string
  type: 'fixed' | 'dynamic'
}

export interface ImportJob {
  id: string
  tenantId: string
  status: 'pending' | 'processing' | 'done' | 'failed'
  fileName: string
  fileSize: number | null
  mode: 'full' | 'incremental'
  totalRows: number
  processedRows: number
  created: number
  updated: number
  removed: number
  failed: number
  parseErrors?: { row: number; message: string }[]
  rolledBackAt?: string | null
  createdAt: string
  finishedAt?: string | null
}

export interface ImportUploadResponse {
  jobId: string
  totalRows: number
  parseErrors: { row: number; message: string }[]
}

export interface ImportProgress {
  status: string
  totalRows: number
  processedRows: number
  created: number
  updated: number
  removed: number
  failed: number
}

export interface MapEntity {
  id: string
  tenantId: string
  name: string
  type: 'internal' | 'public'
  embedToken: string | null
  active: boolean
  filters?: Record<string, unknown> | null
  createdAt: string
}

export interface MapPin {
  id: string
  name: string
  address?: string | null
  lat?: number | null
  lng?: number | null
  city?: string | null
  state?: string | null
  visibility?: 'public' | 'internal'
  pinType?: { id: string; name: string; color: string } | null
}

export interface Subscription {
  planType: string
  status: 'active' | 'trialing' | 'canceled' | 'past_due'
  trialEndsAt?: string | null
  currentPeriodEnd?: string | null
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginResponse {
  accessToken?: string
  refreshToken?: string
  requiresTwoFactor?: boolean
  tempToken?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface ListPartnersInput {
  page?: number
  limit?: number
  visibility?: 'public' | 'internal'
  pinTypeId?: string
  geocodeStatus?: 'pending' | 'done' | 'failed'
}

export interface TenantSettings {
  defaultMapZoom?: number | null
  defaultMapLat?: number | null
  defaultMapLng?: number | null
  publicMapEnabled?: boolean
}
