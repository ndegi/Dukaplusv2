"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle } from "lucide-react"
import { useCurrency } from "@/hooks/use-currency"

interface PaymentMode {
  mode_of_payment: string
}

interface ShiftDetail {
  mode_of_payment: string
  opening_amount: number
  total_sales: number
  total_credit_paid: number
  total_expense: number
  expected_closing_balance: number
  actual_closing_amount: number
  difference: number
}

interface ShiftDetails {
  mode_of_payment: string
  closing_amount: number
  expected_amount?: number
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
  const { formatCurrency } = useCurrency()

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      // Fetch payment modes
      const modesResponse = await fetch("/api/payments/modes")
      let modesData = null
      if (modesResponse.ok) {
        modesData = await modesResponse.json()
        console.log("[DukaPlus] Close shift - fetched modes:", modesData)
        const modes = modesData.modes || []
        setPaymentModes(modes)
      }

      // Fetch current shifts to get the shift name and expected amounts
      const shiftsResponse = await fetch(`/api/shift/list?warehouse_id=${encodeURIComponent(warehouseId)}`)
      if (shiftsResponse.ok) {
        const shiftsData = await shiftsResponse.json()
        console.log("[DukaPlus] Close shift - fetched shifts:", shiftsData)
        const shifts = shiftsData.message?.shifts || []

        // Find the open shift (status = 0)
        const openShift = shifts.find((shift: any) => shift.status === 0)
        if (openShift) {
          setShiftName(openShift.shift_name)

          const shiftDetailsFromApi = openShift.details || []
          console.log("[DukaPlus] Close shift - shift details:", shiftDetailsFromApi)

          if (shiftDetailsFromApi.length > 0) {
            // Map shift details to include expected amounts
            const detailsWithExpected = shiftDetailsFromApi.map((detail: ShiftDetail) => ({
              mode_of_payment: detail.mode_of_payment,
              closing_amount: 0,
              expected_amount: detail.expected_closing_balance || 0,
            }))
            setShiftDetails(detailsWithExpected)
          } else if (modesData) {
            // Fallback to payment modes if no shift details
            const modes = modesData.modes || []
            setShiftDetails(
              modes.map((mode: PaymentMode) => ({
                mode_of_payment: mode.mode_of_payment,
                closing_amount: 0,
                expected_amount: 0,
              })),
            )
          }
        } else {
          // No open shift found, use payment modes
          if (modesData) {
            const modes = modesData.modes || []
            setShiftDetails(
              modes.map((mode: PaymentMode) => ({
                mode_of_payment: mode.mode_of_payment,
                closing_amount: 0,
                expected_amount: 0,
              })),
            )
          } else {
            const modesResponse2 = await fetch("/api/payments/modes")
            if (modesResponse2.ok) {
              const modesData2 = await modesResponse2.json()
              const modes = modesData2.modes || []
              setShiftDetails(
                modes.map((mode: PaymentMode) => ({
                  mode_of_payment: mode.mode_of_payment,
                  closing_amount: 0,
                  expected_amount: 0,
                })),
              )
            }
          }
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
        sessionStorage.removeItem("active_shift_id")

        setMessage({ type: "success", text: "Shift closed successfully" })
        window.dispatchEvent(new Event("shiftClosed"))
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
              <p
                className={
                  message.type === "success" ? "text-success text-xs sm:text-sm" : "text-danger text-xs sm:text-sm"
                }
              >
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
                {shiftDetails.length > 0
                  ? `Enter actual closing amounts for all ${shiftDetails.length} payment modes:`
                  : "Enter closing amounts for each payment mode:"}
              </p>
              {shiftDetails.length > 0 ? (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                  {shiftDetails.map((detail) => (
                    <div key={detail.mode_of_payment} className="space-y-1.5 sm:space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="form-label text-xs sm:text-sm font-semibold">{detail.mode_of_payment}</label>
                        <span className="text-xs text-muted-foreground">
                          Expected:{" "}
                          <span className="font-semibold text-foreground">
                            {formatCurrency(detail.expected_amount ?? 0)}
                          </span>
                        </span>
                      </div>
                      <Input
                        type="number"
                        value={detail.closing_amount}
                        onChange={(e) => updateShiftDetail(detail.mode_of_payment, Number(e.target.value))}
                        placeholder="Enter actual amount"
                        step="0.01"
                        className="input-base text-sm"
                      />
                      {detail.closing_amount > 0 && (
                        <p
                          className={`text-xs ${
                            detail.closing_amount === detail.expected_amount
                              ? "text-success"
                              : Math.abs(detail.closing_amount - (detail.expected_amount ?? 0)) < 1
                                ? "text-warning"
                                : "text-danger"
                          }`}
                        >
                          {formatCurrency(detail.closing_amount - (detail.expected_amount ?? 0))}
                        </p>
                      )}
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
