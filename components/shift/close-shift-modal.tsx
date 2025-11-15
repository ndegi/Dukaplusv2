"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle } from 'lucide-react'

interface PaymentMode {
  mode_of_payment: string
}

interface ShiftDetails {
  mode_of_payment: string
  closing_amount: number
}

interface CloseShiftModalProps {
  onClose: () => void
  onSuccess: () => void
  warehouseId: string
}

export function CloseShiftModal({ onClose, onSuccess, warehouseId }: CloseShiftModalProps) {
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([])
  const [shiftDetails, setShiftDetails] = useState<ShiftDetails[]>([])
  const [shiftName, setShiftName] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      // Fetch payment modes
      const modesResponse = await fetch("/api/payments/modes")
      if (modesResponse.ok) {
        const modesData = await modesResponse.json()
        console.log("[DukaPlus] Close shift - fetched modes:", modesData)
        const modes = modesData.modes || []
        setPaymentModes(modes)

        if (modes.length > 0) {
          setShiftDetails(modes.map((mode: PaymentMode) => ({ 
            mode_of_payment: mode.mode_of_payment, 
            closing_amount: 0 
          })))
        }
      }

      // Fetch current shifts to get the shift name
      const shiftsResponse = await fetch(`/api/shift/list?warehouse_id=${encodeURIComponent(warehouseId)}`)
      if (shiftsResponse.ok) {
        const shiftsData = await shiftsResponse.json()
        const shifts = shiftsData.message?.shifts || []
        
        // Find the open shift (status = 0)
        const openShift = shifts.find((shift: any) => shift.status === 0)
        if (openShift) {
          setShiftName(openShift.shift_name)
        }
      }
    } catch (error) {
      console.error("[DukaPlus] Failed to fetch initial data:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleCloseShift = async () => {
    if (!shiftName) {
      setMessage({ type: "error", text: "Could not find active shift to close" })
      return
    }

    try {
      setIsLoading(true)
      setMessage(null)

      const credentials = JSON.parse(sessionStorage.getItem("tenant_credentials") || "{}")

      const response = await fetch("/api/shift/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift_name: shiftName,
          closed_by: credentials.user_name,
          shift_details: shiftDetails,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: "Shift closed successfully" })
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        setMessage({ type: "error", text: data.message || "Failed to close shift" })
      }
    } catch (error) {
      console.error("[DukaPlus] Error closing shift:", error)
      setMessage({ type: "error", text: "An error occurred while closing shift" })
    } finally {
      setIsLoading(false)
    }
  }

  const updateShiftDetail = (modeOfPayment: string, amount: number) => {
    setShiftDetails(
      shiftDetails.map((detail) =>
        detail.mode_of_payment === modeOfPayment ? { ...detail, closing_amount: amount } : detail,
      ),
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card-base max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-6 py-4 border-b border-border">
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Close Shift</h2>
          {shiftName && <p className="text-xs sm:text-sm text-muted-foreground mt-1">Shift: {shiftName}</p>}
        </div>

        <div className="px-4 sm:px-6 py-4">
          {message && (
            <div
              className={
                message.type === "success"
                  ? "alert-success flex items-start gap-2 mb-4"
                  : "alert-error flex items-start gap-2 mb-4"
              }
            >
              {message.type === "success" ? (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-success flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-danger flex-shrink-0" />
              )}
              <p className={message.type === "success" ? "text-success text-xs sm:text-sm" : "text-danger text-xs sm:text-sm"}>
                {message.text}
              </p>
            </div>
          )}

          {isLoadingData ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">Loading shift data...</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {paymentModes.length > 0 
                  ? `Enter closing amounts for all ${paymentModes.length} payment modes:`
                  : "Enter closing amounts for each payment mode:"}
              </p>
              {shiftDetails.length > 0 ? (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                  {shiftDetails.map((detail) => (
                    <div key={detail.mode_of_payment} className="space-y-1.5 sm:space-y-2">
                      <label className="form-label text-xs sm:text-sm">{detail.mode_of_payment}</label>
                      <Input
                        type="number"
                        value={detail.closing_amount}
                        onChange={(e) => updateShiftDetail(detail.mode_of_payment, Number(e.target.value))}
                        placeholder="0.00"
                        step="0.01"
                        className="input-base text-sm"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs sm:text-sm">No payment modes available. Please check your connection.</p>
              )}
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border flex flex-col sm:flex-row gap-2 sm:gap-3 sticky bottom-0 bg-background">
          <Button
            onClick={handleCloseShift}
            disabled={isLoading || isLoadingData || !shiftName || shiftDetails.length === 0}
            className="w-full sm:flex-1 btn-danger text-sm"
          >
            {isLoading ? "Closing..." : "Close Shift"}
          </Button>
          <Button onClick={onClose} disabled={isLoading} className="w-full sm:flex-1 btn-cancel text-sm">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
