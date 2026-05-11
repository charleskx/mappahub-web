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
  plan: string
  createdAt: string
  trialEndsAt?: string | null
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
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  lat?: number | null
  lng?: number | null
  active: boolean
  notes?: string | null
  pinTypeId?: string | null
  pinTypeName?: string | null
  pinTypeColor?: string | null
  geocodeStatus?: 'pending' | 'done' | 'failed' | null
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

export interface ImportJob {
  id: string
  tenantId: string
  status: 'pending' | 'processing' | 'done' | 'failed'
  fileName: string
  fileSize: number
  importedCount?: number | null
  errorCount?: number | null
  createdAt: string
  finishedAt?: string | null
}

export interface MapEntity {
  id: string
  tenantId: string
  name: string
  token: string
  active: boolean
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
  email?: string | null
  phone?: string | null
  pinTypeName?: string | null
  pinTypeColor?: string | null
}

export interface Subscription {
  plan: string
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
  search?: string
  pinTypeId?: string
}

export interface TenantSettings {
  mapsKey?: string | null
  publicMapEnabled?: boolean
}
