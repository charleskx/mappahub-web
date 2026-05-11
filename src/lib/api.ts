import axios from 'axios'
import type {
  AuthTokens,
  ImportJob,
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

export const api = {
  auth: {
    async login(email: string, password: string, totpCode?: string): Promise<LoginResponse> {
      const { data } = await http.post<LoginResponse>('/auth/login', { email, password, totpCode })
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
    async register(name: string, email: string, password: string, company: string) {
      const { data } = await http.post('/auth/register', { name, email, password, company })
      return data
    },
    async forgotPassword(email: string) {
      await http.post('/auth/forgot-password', { email })
    },
    async verifyEmail(token: string) {
      await http.get(`/auth/verify-email?token=${token}`)
    },
    async resendVerification(email: string) {
      await http.post('/auth/resend-verification', { email })
    },
    async me(): Promise<User> {
      const { data } = await http.get<User>('/auth/me')
      return data
    },
    async logout() {
      const refreshToken = localStorage.getItem('refreshToken')
      try {
        await http.post('/auth/logout', { refreshToken })
      } finally {
        clearTokens()
      }
    },
  },

  partners: {
    async list(params?: ListPartnersInput): Promise<PaginatedResponse<Partner>> {
      const { data } = await http.get<PaginatedResponse<Partner>>('/partners', { params })
      return data
    },
    async getById(id: string): Promise<Partner> {
      const { data } = await http.get<Partner>(`/partners/${id}`)
      return data
    },
    async create(payload: Partial<Partner>): Promise<Partner> {
      const { data } = await http.post<Partner>('/partners', payload)
      return data
    },
    async update(id: string, payload: Partial<Partner>): Promise<Partner> {
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
  },

  pinTypes: {
    async list(): Promise<PinType[]> {
      const { data } = await http.get<PinType[]>('/pin-types')
      return data
    },
    async create(payload: { name: string; color: string }): Promise<PinType> {
      const { data } = await http.post<PinType>('/pin-types', payload)
      return data
    },
    async update(id: string, payload: Partial<PinType>): Promise<PinType> {
      const { data } = await http.patch<PinType>(`/pin-types/${id}`, payload)
      return data
    },
    async delete(id: string) {
      await http.delete(`/pin-types/${id}`)
    },
  },

  importJobs: {
    async list(): Promise<ImportJob[]> {
      const { data } = await http.get<ImportJob[]>('/import')
      return data
    },
    async getById(id: string): Promise<ImportJob> {
      const { data } = await http.get<ImportJob>(`/import/${id}`)
      return data
    },
    async upload(file: File, onProgress?: (pct: number) => void): Promise<EventSource | null> {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await http.post<ImportJob>('/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
        },
      })
      if (data?.id) {
        const token = localStorage.getItem('accessToken') ?? ''
        const es = new EventSource(`${BASE_URL}/import/${data.id}/progress?token=${token}`)
        return es
      }
      return null
    },
    progressUrl(id: string): string {
      const token = localStorage.getItem('accessToken') ?? ''
      return `${BASE_URL}/import/${id}/progress?token=${token}`
    },
  },

  export: {
    async download(format: string): Promise<Blob> {
      const { data } = await http.post(
        '/export',
        { format },
        { responseType: 'blob' },
      )
      return data as Blob
    },
  },

  maps: {
    async list(): Promise<MapEntity[]> {
      const { data } = await http.get<MapEntity[]>('/maps')
      return data
    },
    async getById(id: string): Promise<MapEntity> {
      const { data } = await http.get<MapEntity>(`/maps/${id}`)
      return data
    },
    async create(name: string): Promise<MapEntity> {
      const { data } = await http.post<MapEntity>('/maps', { name })
      return data
    },
    async update(id: string, payload: Partial<MapEntity>): Promise<MapEntity> {
      const { data } = await http.patch<MapEntity>(`/maps/${id}`, payload)
      return data
    },
    async delete(id: string) {
      await http.delete(`/maps/${id}`)
    },
    async pins(): Promise<MapPin[]> {
      const { data } = await http.get<MapPin[]>('/maps/pins')
      return data
    },
    async publicPins(token: string): Promise<{ map: MapEntity; pins: MapPin[]; mapsKey: string }> {
      const { data } = await axios.get(`${BASE_URL}/maps/public/${token}`)
      return data
    },
  },

  team: {
    async list(): Promise<User[]> {
      const { data } = await http.get<User[]>('/users')
      return data
    },
    async invite(email: string, role: string) {
      await http.post('/users/invite', { email, role })
    },
    async remove(userId: string) {
      await http.delete(`/users/${userId}`)
    },
    async updateRole(userId: string, role: string) {
      await http.patch(`/users/${userId}`, { role })
    },
  },

  billing: {
    async get(): Promise<Subscription> {
      const { data } = await http.get<Subscription>('/billing/subscription')
      return data
    },
    async checkout(plan: string): Promise<{ url: string }> {
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
      const { data } = await http.get<TenantSettings>('/settings')
      return data
    },
    async update(payload: Partial<TenantSettings>): Promise<TenantSettings> {
      const { data } = await http.patch<TenantSettings>('/settings', payload)
      return data
    },
    async updateProfile(payload: { name: string }): Promise<User> {
      const { data } = await http.patch<User>('/auth/me', payload)
      return data
    },
    async changePassword(currentPassword: string, newPassword: string) {
      await http.post('/auth/change-password', { currentPassword, newPassword })
    },
    async setup2fa(): Promise<{ qrCode: string; secret: string }> {
      const { data } = await http.post<{ qrCode: string; secret: string }>('/auth/2fa/setup')
      return data
    },
    async verify2fa(code: string): Promise<{ recoveryCodes: string[] }> {
      const { data } = await http.post<{ recoveryCodes: string[] }>('/auth/2fa/verify', { code })
      return data
    },
    async disable2fa(code: string) {
      await http.delete('/auth/2fa', { data: { code } })
    },
    async getTenant(): Promise<Tenant> {
      const { data } = await http.get<Tenant>('/tenants/me')
      return data
    },
    async updateTenant(payload: Partial<Tenant>) {
      const { data } = await http.patch('/tenants/me', payload)
      return data
    },
  },

  superAdmin: {
    async tenants(params?: { search?: string; page?: number }): Promise<PaginatedResponse<Tenant & { partnerCount: number; userCount: number; active: boolean }>> {
      const { data } = await http.get('/admin/tenants', { params })
      return data
    },
    async users(params?: { search?: string; page?: number }): Promise<PaginatedResponse<User & { tenantName: string }>> {
      const { data } = await http.get('/admin/users', { params })
      return data
    },
    async impersonate(tenantId: string) {
      const { data } = await http.post(`/admin/tenants/${tenantId}/impersonate`)
      return data
    },
  },
}
