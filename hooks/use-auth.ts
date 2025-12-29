"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
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

const SESSION_TIMEOUT = 6 * 60 * 60 * 1000 // 6 hours in milliseconds
const LAST_ACTIVITY_KEY = "last_activity_timestamp"

export function useAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null)
  const [credentials, setCredentials] = useState<TenantCredentials | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

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
          sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
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

  useEffect(() => {
    if (!user) return

    const checkSessionTimeout = () => {
      const lastActivity = sessionStorage.getItem(LAST_ACTIVITY_KEY)
      if (!lastActivity) return

      const elapsed = Date.now() - parseInt(lastActivity, 10)
      if (elapsed > SESSION_TIMEOUT) {
        console.log("[DukaPlus] Session timeout triggered after 6 hours of inactivity")
        handleSessionExpired()
      }
    }

    const handleUserActivity = () => {
      sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
    }

    // Check session timeout every 60 seconds
    const timeoutInterval = setInterval(checkSessionTimeout, 60000)

    // Track user activity (click, keypress, mouse movement)
    const events = ["click", "keydown", "mousemove", "scroll", "touchstart"]
    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true })
    })

    return () => {
      clearInterval(timeoutInterval)
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity)
      })
    }
  }, [user])

  const handleSessionExpired = async () => {
    console.log("[DukaPlus] Logging out due to session expiration")
    await logout()
    router.push("/login?sessionExpired=true")
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      setCredentials(null)
      sessionStorage.removeItem("tenant_credentials")
      sessionStorage.removeItem("selected_warehouse")
      sessionStorage.removeItem("selected_warehouse_name")
      sessionStorage.removeItem(LAST_ACTIVITY_KEY)
      localStorage.clear()
      console.log("[DukaPlus] All storage cleared on logout")
    } catch (err) {
      setError("Logout failed")
      console.error("[DukaPlus] Logout error:", err)
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
