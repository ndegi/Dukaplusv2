import type { TenantCredentials } from "@/lib/types/auth"

let tenantCredentials: TenantCredentials | null = null

export function setTenantCredentials(credentials: TenantCredentials) {
  tenantCredentials = credentials
}

export function getTenantCredentials(): TenantCredentials | null {
  return tenantCredentials
}

export function clearTenantCredentials() {
  tenantCredentials = null
}

export function getAuthHeader(): string | null {
  if (!tenantCredentials) return null
  const credentials = `${tenantCredentials.apiKey}:${tenantCredentials.apiSecret}`
  return `token ${credentials}`
}

export function getTenantBaseUrl(): string | null {
  return tenantCredentials?.baseUrl || null
}
