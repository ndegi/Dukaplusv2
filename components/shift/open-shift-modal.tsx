"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle } from "lucide-react"

interface PaymentMode {
  mode_of_payment: string
}

interface ShiftDetails {
  mode_of_payment: string
  opening_amount: number
}

export function OpenShiftModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([])
  const [shiftDetails, setShiftDetails] = useState<ShiftDetails[]>([])
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingModes, setIsLoadingModes] = useState(true)

  useEffect(() => {
    fetchPaymentModes()
  }, [])

  const fetchPaymentModes = async () => {
    try {
      const response = await fetch("/api/payments/modes")
      if (response.ok) {
        const data = await response.json()
        console.log("[DukaPlus] Open shift - fetched modes:", data)
        setPaymentModes(data.modes || [])
        if (data.modes && data.modes.length > 0) {
          setShiftDetails(
            data.modes.map((mode: PaymentMode) => ({
              mode_of_payment: mode.mode_of_payment,
              opening_amount: 0,
            })),
          )
        }
      }
    } catch (error) {
      console.error("[DukaPlus] Failed to fetch payment modes:", error)
    } finally {
      setIsLoadingModes(false)
    }
  }

  const handleOpenShift = async () => {
    try {
      setIsLoading(true)
      setMessage(null)

      const warehouse = sessionStorage.getItem("selected_warehouse")
      const credentials = JSON.parse(sessionStorage.getItem("tenant_credentials") || "{}")

      const response = await fetch("/api/shift/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouse_id: warehouse,
          opened_by: credentials.user_name,
          shift_details: shiftDetails,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        sessionStorage.setItem("active_shift_id", data.message?.shift_name || "active")

        setMessage({ type: "success", text: "Shift opened successfully" })
        window.dispatchEvent(new Event("shiftOpened"))
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        setMessage({ type: "error", text: data.message || "Failed to open shift" })
      }
    } catch (error) {
      console.error("[DukaPlus] Error opening shift:", error)
      setMessage({ type: "error", text: "An error occurred while opening shift" })
    } finally {
      setIsLoading(false)
    }
  }

  const updateShiftDetail = (modeOfPayment: string, amount: number) => {
    setShiftDetails(
      shiftDetails.map((detail) =>
        detail.mode_of_payment === modeOfPayment ? { ...detail, opening_amount: amount } : detail,
      ),
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card-base max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-6 py-4 border-b border-border">
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Open Shift</h2>
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
              <p
                className={
                  message.type === "success" ? "text-success text-xs sm:text-sm" : "text-danger text-xs sm:text-sm"
                }
              >
                {message.text}
              </p>
            </div>
          )}

          {isLoadingModes ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">Loading payment modes...</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {paymentModes.length > 0
                  ? `Enter opening amounts for all ${paymentModes.length} payment modes:`
                  : "Enter opening amounts for each payment mode:"}
              </p>
              {shiftDetails.length > 0 ? (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                  {shiftDetails.map((detail) => (
                    <div key={detail.mode_of_payment} className="space-y-1.5 sm:space-y-2">
                      <label className="form-label text-xs sm:text-sm font-semibold">{detail.mode_of_payment}</label>
                      <Input
                        type="number"
                        value={detail.opening_amount}
                        onChange={(e) => updateShiftDetail(detail.mode_of_payment, Number(e.target.value))}
                        placeholder="0.00"
                        step="0.01"
                        className="input-base text-sm"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs sm:text-sm">
                  No payment modes available. Please check your connection.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border flex flex-col sm:flex-row gap-2 sm:gap-3 sticky bottom-0 bg-background">
          <Button
            onClick={handleOpenShift}
            disabled={isLoading || isLoadingModes || shiftDetails.length === 0}
            className="w-full sm:flex-1 btn-success text-sm"
          >
            {isLoading ? "Opening..." : "Open Shift"}
          </Button>
          <Button onClick={onClose} disabled={isLoading} className="w-full sm:flex-1 btn-cancel text-sm">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
