import axios from 'axios'
import type {
  AuthTokens,
  ExportColumn,
  ImportJob,
  ImportUploadResponse,
  ListPartnersInput,
  LoginResponse,
  MapEntity,
  MapPin,
  PaginatedResponse,
  Partner,
  PartnerColumn,
  PinType,
  Subscription,
  Tenant,
  TenantSettings,
  User,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const http = axios.create({ baseURL: BASE_URL })

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

http.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }
    original._retry = true
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      clearTokens()
      window.location.href = '/'
      return Promise.reject(error)
    }
    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(http(original))
        })
      })
    }
    isRefreshing = true
    try {
      const { data } = await axios.post<AuthTokens>(`${BASE_URL}/auth/refresh`, { refreshToken })
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      refreshQueue.forEach((cb) => cb(data.accessToken))
      refreshQueue = []
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return http(original)
    } catch {
      clearTokens()
      window.location.href = '/'
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)

function clearTokens() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

function storeTokens(tokens: AuthTokens) {
  localStorage.setItem('accessToken', tokens.accessToken)
  localStorage.setItem('refreshToken', tokens.refreshToken)
}

function decodeJwtSub(token: string): string | null {
  try {
    return JSON.parse(atob(token.split('.')[1])).sub as string
  } catch {
    return null
  }
}

export const api = {
  auth: {
    async login(email: string, password: string): Promise<LoginResponse> {
      const { data } = await http.post<LoginResponse>('/auth/login', { email, password })
      if (data.accessToken && data.refreshToken) {
        storeTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
      }
      return data
    },

    async loginWithTotp(tempToken: string, code: string): Promise<AuthTokens> {
      const { data } = await http.post<AuthTokens>('/auth/2fa/login', { tempToken, code })
      storeTokens(data)
      return data
    },

    async register(name: string, email: string, password: string, tenantName: string) {
      const { data } = await http.post('/auth/register', { name, email, password, tenantName })
      return data
    },

    async forgotPassword(email: string) {
      await http.post('/auth/forgot-password', { email })
    },

    async resetPassword(token: string, password: string) {
      await http.post('/auth/reset-password', { token, password })
    },

    async verifyEmail(token: string) {
      await http.get(`/auth/verify`, { params: { token } })
    },

    async me(): Promise<User> {
      const token = localStorage.getItem('accessToken')
      if (!token) throw new Error('No token')
      const userId = decodeJwtSub(token)
      if (!userId) throw new Error('Invalid token')
      const { data } = await http.get<Record<string, unknown>>(`/users/${userId}`)
      return {
        id: data.id as string,
        name: data.name as string,
        email: data.email as string,
        role: data.role as User['role'],
        tenantId: data.tenantId as string,
        emailVerified: data.emailVerified as boolean,
        twoFactorEnabled: (data.totpEnabled ?? data.twoFactorEnabled) as boolean,
      }
    },

    async logout() {
      const refreshToken = localStorage.getItem('refreshToken')
      try {
        await http.post('/auth/logout', { refreshToken })
      } finally {
        clearTokens()
      }
    },

    async setup2fa(): Promise<{ qrCode: string; secret: string }> {
      const { data } = await http.post<{ qrCode: string; secret: string }>('/auth/2fa/setup')
      return data
    },

    async verify2fa(code: string): Promise<{ success: true; recoveryCodes: string[] }> {
      const { data } = await http.post<{ success: true; recoveryCodes: string[] }>('/auth/2fa/verify', { code })
      return data
    },

    async disable2fa(code: string) {
      await http.delete('/auth/2fa', { data: { code } })
    },

    async loginWithRecoveryCode(tempToken: string, code: string): Promise<void> {
      const { data } = await http.post<{ accessToken: string; refreshToken: string }>('/auth/2fa/recover', { tempToken, code })
      storeTokens(data)
    },
  },

  users: {
    async list(): Promise<User[]> {
      const { data } = await http.get<User[]>('/users/')
      return data
    },
    async getById(id: string): Promise<User> {
      const { data } = await http.get<User>(`/users/${id}`)
      return data
    },
    async update(id: string, payload: { name?: string; role?: string }): Promise<User> {
      const { data } = await http.patch<User>(`/users/${id}`, payload)
      return data
    },
    async invite(email: string, name: string, role: 'admin' | 'employee'): Promise<User> {
      const { data } = await http.post<User>('/users/invite', { email, name, role })
      return data
    },
    async remove(id: string) {
      await http.delete(`/users/${id}`)
    },
  },

  partners: {
    async list(params?: ListPartnersInput): Promise<PaginatedResponse<Partner>> {
      const { data } = await http.get<PaginatedResponse<Partner>>('/partners/', { params })
      return data
    },
    async getById(id: string): Promise<Partner> {
      const { data } = await http.get<Partner>(`/partners/${id}`)
      return data
    },
    async create(payload: {
      name: string
      address: string
      pinTypeId?: string
      visibility?: 'public' | 'internal'
      dynamicValues?: Record<string, string>
    }): Promise<Partner> {
      const { data } = await http.post<Partner>('/partners/', payload)
      return data
    },
    async update(
      id: string,
      payload: {
        name?: string
        address?: string
        pinTypeId?: string | null
        visibility?: 'public' | 'internal'
        dynamicValues?: Record<string, string>
      },
    ): Promise<Partner> {
      const { data } = await http.patch<Partner>(`/partners/${id}`, payload)
      return data
    },
    async delete(id: string) {
      await http.delete(`/partners/${id}`)
    },
    async getColumns(): Promise<PartnerColumn[]> {
      const { data } = await http.get<PartnerColumn[]>('/partners/columns')
      return data
    },
    async pins(filters?: {
      city?: string
      state?: string
      visibility?: 'public' | 'internal'
      pinTypeId?: string
      geocodeStatus?: 'pending' | 'done' | 'failed'
    }): Promise<MapPin[]> {
      const { data } = await http.get<MapPin[]>('/partners/pins', { params: filters })
      return data
    },
  },

  pinTypes: {
    async list(): Promise<PinType[]> {
      const { data } = await http.get<PinType[]>('/pin-types/')
      return data
    },
    async create(payload: { name: string; color: string }): Promise<PinType> {
      const { data } = await http.post<PinType>('/pin-types/', payload)
      return data
    },
    async update(id: string, payload: { name?: string; color?: string }): Promise<PinType> {
      const { data } = await http.patch<PinType>(`/pin-types/${id}`, payload)
      return data
    },
    async delete(id: string) {
      await http.delete(`/pin-types/${id}`)
    },
  },

  maps: {
    async list(): Promise<MapEntity[]> {
      const { data } = await http.get<MapEntity[]>('/maps/')
      return data
    },
    async getById(id: string): Promise<MapEntity> {
      const { data } = await http.get<MapEntity>(`/maps/${id}`)
      return data
    },
    async create(payload: {
      name: string
      type: 'internal' | 'public'
      filters?: Record<string, unknown>
    }): Promise<MapEntity> {
      const { data } = await http.post<MapEntity>('/maps/', payload)
      return data
    },
    async update(
      id: string,
      payload: { name?: string; filters?: Record<string, unknown>; active?: boolean },
    ): Promise<MapEntity> {
      const { data } = await http.patch<MapEntity>(`/maps/${id}`, payload)
      return data
    },
    async delete(id: string) {
      await http.delete(`/maps/${id}`)
    },
    async pins(
      mapId: string,
      filters?: {
        city?: string
        state?: string
        visibility?: 'public' | 'internal'
        pinTypeId?: string
        geocodeStatus?: 'pending' | 'done' | 'failed'
      },
    ): Promise<MapPin[]> {
      const { data } = await http.get<MapPin[]>(`/maps/${mapId}/pins`, { params: filters })
      return data
    },
    async generateEmbedToken(mapId: string): Promise<{ embedToken: string }> {
      const { data } = await http.post<{ embedToken: string }>(`/maps/${mapId}/embed-token`)
      return data
    },
    async getEmbed(mapId: string, type: 'iframe' | 'script' = 'iframe'): Promise<{ snippet: string }> {
      const { data } = await http.get<{ snippet: string }>(`/maps/${mapId}/embed`, {
        params: { type },
      })
      return data
    },
    async publicPins(
      token: string,
      filters?: { city?: string; state?: string; pinTypeId?: string },
    ): Promise<MapPin[]> {
      const { data } = await axios.get<MapPin[]>(`${BASE_URL}/maps/public/${token}/pins`, {
        params: filters,
      })
      return data
    },
    async publicLocalities(token: string, state?: string): Promise<{ cities: string[]; states: string[] }> {
      const { data } = await axios.get(`${BASE_URL}/maps/public/${token}/localities`, {
        params: state ? { state } : undefined,
      })
      return data
    },
    async publicPinTypes(token: string): Promise<{ id: string; name: string; color: string }[]> {
      const { data } = await axios.get(`${BASE_URL}/maps/public/${token}/pin-types`)
      return data
    },
    async publicConfig(token: string): Promise<Record<string, never>> {
      const { data } = await axios.get(`${BASE_URL}/maps/public/${token}/config`)
      return data
    },
  },

  import: {
    async upload(
      file: File,
      mode: 'full' | 'incremental' = 'full',
      onProgress?: (pct: number) => void,
    ): Promise<ImportUploadResponse> {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await http.post<ImportUploadResponse>('/import/upload', formData, {
        params: { mode },
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
        },
      })
      return data
    },
    async list(): Promise<ImportJob[]> {
      const { data } = await http.get<ImportJob[]>('/import/')
      return data
    },
    async getById(id: string): Promise<ImportJob> {
      const { data } = await http.get<ImportJob>(`/import/${id}`)
      return data
    },
    progressUrl(id: string): string {
      const token = localStorage.getItem('accessToken') ?? ''
      return `${BASE_URL}/import/${id}/progress?token=${token}`
    },
  },

  export: {
    async getColumns(): Promise<ExportColumn[]> {
      const { data } = await http.get<{ columns: ExportColumn[] }>('/export/columns')
      return data.columns
    },
    async download(columns: string[], format: 'xlsx' | 'csv' = 'xlsx'): Promise<Blob> {
      const { data } = await http.post(
        '/export/',
        { columns, format },
        { responseType: 'blob' },
      )
      return data as Blob
    },
  },

  billing: {
    async get(): Promise<Subscription> {
      const { data } = await http.get<Subscription>('/billing/subscription')
      return data
    },
    async checkout(plan: 'monthly' | 'annual'): Promise<{ url: string }> {
      const { data } = await http.post<{ url: string }>('/billing/checkout', { plan })
      return data
    },
    async portal(): Promise<{ url: string }> {
      const { data } = await http.post<{ url: string }>('/billing/portal')
      return data
    },
  },

  settings: {
    async get(): Promise<TenantSettings> {
      const { data } = await http.get<TenantSettings>('/tenant/settings')
      return data
    },
    async update(payload: Partial<TenantSettings>): Promise<TenantSettings> {
      const { data } = await http.put<TenantSettings>('/tenant/settings', payload)
      return data
    },
  },

  dashboard: {
    async stats(): Promise<{
      partners: {
        total: number
        thisMonth: number
        lastMonth: number
        geocodedDone: number
        geocodedFailed: number
        geocodedPct: number
        public: number
        internal: number
      }
      imports: { total: number; thisMonth: number; lastMonth: number }
      geo: {
        byState: { state: string; count: number }[]
        byCity: { city: string; state: string; count: number }[]
        byPinType: { id: string; name: string; color: string; count: number }[]
      }
      recentImports: {
        id: string
        fileName: string
        status: string
        mode: string
        totalRows: number
        created: number
        updated: number
        removed: number
        failed: number
        createdAt: string
        finishedAt: string | null
        userName: string
      }[]
      partnersByMonth: { month: string; count: number }[]
    }> {
      const { data } = await http.get('/dashboard/stats')
      return data
    },
  },

  notifications: {
    async list(): Promise<Array<{
      id: string
      type: 'import_done' | 'import_failed' | 'geocoding_failures' | 'trial_expiring'
      title: string
      desc: string
      createdAt: string
    }>> {
      const { data } = await http.get('/notifications')
      return data
    },
  },

  admin: {
    async tenants(): Promise<Tenant[]> {
      const { data } = await http.get<Tenant[]>('/admin/tenants')
      return data
    },
    async getTenant(id: string): Promise<Tenant> {
      const { data } = await http.get<Tenant>(`/admin/tenants/${id}`)
      return data
    },
    async blockTenant(id: string) {
      await http.patch(`/admin/tenants/${id}/block`)
    },
    async unblockTenant(id: string) {
      await http.patch(`/admin/tenants/${id}/unblock`)
    },
    async tenantImports(tenantId: string): Promise<ImportJob[]> {
      const { data } = await http.get<ImportJob[]>(`/admin/tenants/${tenantId}/imports`)
      return data
    },
    async rollbackImport(tenantId: string, jobId: string): Promise<void> {
      await http.post(`/admin/tenants/${tenantId}/imports/${jobId}/rollback`)
    },
    async metrics(): Promise<unknown> {
      const { data } = await http.get('/admin/metrics')
      return data
    },
  },

  // backward-compat aliases used by existing pages — remove when pages are updated
  importJobs: {
    list: () => api.import.list(),
    getById: (id: string) => api.import.getById(id),
    progressUrl: (id: string) => api.import.progressUrl(id),
    upload: (file: File, onProgress?: (pct: number) => void) =>
      api.import.upload(file, 'full', onProgress),
  },

  team: {
    list: () => api.users.list(),
    invite: (email: string, name: string, role: 'admin' | 'employee') =>
      api.users.invite(email, name, role),
    remove: (id: string) => api.users.remove(id),
    updateRole: (id: string, role: string) => api.users.update(id, { role }),
  },

  superAdmin: {
    tenants: () => api.admin.tenants(),
  },
}
