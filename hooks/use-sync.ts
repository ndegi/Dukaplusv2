"use client"

import { useCallback, useEffect, useRef } from "react"
import { offlineStore } from "@/lib/db/offline-store"

export function useSync() {
  const syncIntervalRef = useRef<NodeJS.Timeout>()

  const syncTransactions = useCallback(async () => {
    if (!navigator.onLine) return

    try {
      const unsyncedTransactions = await offlineStore.getUnsyncedTransactions()

      for (const transaction of unsyncedTransactions) {
        try {
          const response = await fetch("/api/sales/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transaction.data),
          })

          if (response.ok) {
            await offlineStore.markTransactionSynced(transaction.id)
            console.log(`[DukaPlus] Synced transaction: ${transaction.id}`)
          }
        } catch (error) {
          console.error(`[DukaPlus] Failed to sync transaction ${transaction.id}:`, error)
        }
      }
    } catch (error) {
      console.error("[DukaPlus] Sync error:", error)
    }
  }, [])

  useEffect(() => {
    // Initial sync on mount
    if (navigator.onLine) {
      syncTransactions()
    }

    // Set up periodic sync
    syncIntervalRef.current = setInterval(() => {
      if (navigator.onLine) {
        syncTransactions()
      }
    }, 30000) // Sync every 30 seconds

    const handleOnline = () => {
      console.log("[DukaPlus] Going online - triggering sync")
      syncTransactions()
    }

    window.addEventListener("online", handleOnline)

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
      window.removeEventListener("online", handleOnline)
    }
  }, [syncTransactions])

  return { syncTransactions }
}
