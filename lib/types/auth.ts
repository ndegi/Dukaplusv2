export interface TenantCredentials {
  apiKey: string
  apiSecret: string
  baseUrl: string
  sid: string
  username: string
  email: string
  fullName: string
}

export interface LoginResponse {
  success: boolean
  user?: {
    id: string
    name: string
    email: string
    mobile: string
    warehouse?: string
    role?: string
  }
  credentials?: TenantCredentials
  message?: string
}
