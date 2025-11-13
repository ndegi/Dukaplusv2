"use client"

import { useEffect } from "react"
import { offlineStore } from "@/lib/db/offline-store"
import { useSync } from "@/hooks/use-sync"

export function SyncManager() {
  const { syncTransactions } = useSync()

  useEffect(() => {
    // Initialize offline store
    offlineStore.init().catch((error) => {
      console.error("[DukaPlus] Failed to initialize offline store:", error)
    })
  }, [])

  useEffect(() => {
    syncTransactions()
  }, [syncTransactions])

  return null
}
