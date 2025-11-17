"use client"

import { useEffect, useState } from "react"
import type { TenantCredentials } from "@/lib/types/auth"

interface User {
  id: string
  name: string
  email: string
  mobile: string
  warehouse: string
  role: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
  credentials: TenantCredentials | null
  logout: () => Promise<void>
}

export function useAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null)
  const [credentials, setCredentials] = useState<TenantCredentials | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("[DukaPlus] Checking auth status...")
        const response = await fetch("/api/auth/me")
        console.log("[DukaPlus] Auth me response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("[DukaPlus] User authenticated:", data.user?.id)
          setUser(data.user)
          const storedCredentials = sessionStorage.getItem("tenant_credentials")
          if (storedCredentials) {
            setCredentials(JSON.parse(storedCredentials))
          }
        } else if (response.status === 401) {
          console.log("[DukaPlus] User not authenticated (401)")
          setUser(null)
          setCredentials(null)
          sessionStorage.removeItem("tenant_credentials")
        } else {
          console.log("[DukaPlus] Auth check failed with status:", response.status)
          setUser(null)
          setCredentials(null)
        }
      } catch (err) {
        console.error("[DukaPlus] Auth check failed:", err)
        setUser(null)
        setCredentials(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      setCredentials(null)
      sessionStorage.removeItem("tenant_credentials")
    } catch (err) {
      setError("Logout failed")
      throw err
    }
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    credentials,
    logout,
  }
}
