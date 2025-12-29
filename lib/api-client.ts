import { cookies } from "next/headers"

interface TenantCredentials {
  apiKey: string
  apiSecret: string
  baseUrl: string
}

async function getTenantCredentials(): Promise<TenantCredentials | null> {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value
    if (!credentialsCookie) return null
    return JSON.parse(credentialsCookie)
  } catch {
    return null
  }
}

function createAuthHeader(apiKey: string, apiSecret: string): string {
  const credentials = `${apiKey}:${apiSecret}`
  return `token ${credentials}`
}

export async function dukaPlusApi(endpoint: string, options: RequestInit = {}) {
  const credentials = await getTenantCredentials()

  if (!credentials) {
    throw new Error("No tenant credentials found. User must login first.")
  }

  const url = `${credentials.baseUrl}${endpoint}`
  const authHeader = createAuthHeader(credentials.apiKey, credentials.apiSecret)

  const headers = {
    "Content-Type": "application/json",
    Authorization: authHeader,
    ...options.headers,
  }

  console.log("[DukaPlus] API Request:", { url, method: options.method || "GET" })

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized - Invalid credentials or session expired")
    }
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `API request failed: ${response.status}`)
  }

  return response.json()
}
