"use client"

import { useOffline } from "@/hooks/use-offline"
import { Wifi, WifiOff, CloudSun as CloudSync } from "lucide-react"

export function OfflineIndicator() {
  const { isOnline, hasUnsynced, isSyncing } = useOffline()

  if (isOnline && !hasUnsynced) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOnline ? (
        <div className="bg-red-900/90 border border-red-700 rounded-lg px-4 py-3 flex items-center gap-3 backdrop-blur-sm">
          <WifiOff className="w-5 h-5 text-red-300" />
          <div>
            <p className="text-sm font-semibold text-red-100">Offline Mode</p>
            <p className="text-xs text-red-200">Changes will sync when online</p>
          </div>
        </div>
      ) : hasUnsynced ? (
        <div className="bg-yellow-900/90 border border-yellow-700 rounded-lg px-4 py-3 flex items-center gap-3 backdrop-blur-sm">
          {isSyncing ? (
            <CloudSync className="w-5 h-5 text-yellow-300 animate-spin" />
          ) : (
            <Wifi className="w-5 h-5 text-yellow-300" />
          )}
          <div>
            <p className="text-sm font-semibold text-yellow-100">Syncing Data</p>
            <p className="text-xs text-yellow-200">{isSyncing ? "Syncing..." : "Pending sync"}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
