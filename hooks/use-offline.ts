"use client"

import { useEffect, useState } from "react"

interface OfflineStatus {
  isOnline: boolean
  hasUnsynced: boolean
  isSyncing: boolean
}

export function useOffline(): OfflineStatus {
  const [isOnline, setIsOnline] = useState(true)
  const [hasUnsynced, setHasUnsynced] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    // Check online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Initial check
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return { isOnline, hasUnsynced, isSyncing }
}
