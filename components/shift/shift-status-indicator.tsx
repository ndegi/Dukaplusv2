"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faClock, faCheckCircle } from "@fortawesome/free-solid-svg-icons"
import { OpenShiftModal } from "./open-shift-modal"
import { CloseShiftModal } from "./close-shift-modal"

interface ShiftStatusIndicatorProps {
  warehouseId: string
}

export function ShiftStatusIndicator({ warehouseId }: ShiftStatusIndicatorProps) {
  const [hasActiveShift, setHasActiveShift] = useState(false)
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkShiftStatus()
  }, [warehouseId])

  const checkShiftStatus = async () => {
    if (!warehouseId) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/shift/status?warehouse_id=${encodeURIComponent(warehouseId)}`)
      if (response.ok) {
        const data = await response.json()
        // API returns message: 1 if shift is open, 0 if closed
        const isOpen = data.message?.message === 1 || data.message === 1
        setHasActiveShift(isOpen)

        if (isOpen) {
          sessionStorage.setItem("active_shift_id", "active")
        } else {
          sessionStorage.removeItem("active_shift_id")
        }
      }
    } catch (error) {
      console.error("[DukaPlus] Failed to check shift status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
        <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-300">Checking...</span>
      </div>
    )
  }

  return (
    <>
      {hasActiveShift ? (
        <Button
          onClick={() => setShowCloseModal(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4" />
          <span className="hidden md:inline">Shift Open</span>
        </Button>
      ) : (
        <Button
          onClick={() => setShowOpenModal(true)}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium animate-pulse"
        >
          <FontAwesomeIcon icon={faClock} className="w-4 h-4" />
          <span className="hidden md:inline">Open Shift</span>
        </Button>
      )}

      {showOpenModal && (
        <OpenShiftModal
          onClose={() => setShowOpenModal(false)}
          onSuccess={() => {
            setShowOpenModal(false)
            checkShiftStatus()
          }}
        />
      )}

      {showCloseModal && (
        <CloseShiftModal
          onClose={() => setShowCloseModal(false)}
          onSuccess={() => {
            setShowCloseModal(false)
            checkShiftStatus()
          }}
          warehouseId={warehouseId}
        />
      )}
    </>
  )
}
