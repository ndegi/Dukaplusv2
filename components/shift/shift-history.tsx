"use client"

import { useState, useEffect } from "react"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { AlertCircle } from 'lucide-react'

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

interface Shift {
  shift_name: string
  shift_date: string
  creation: string
  status: number // 0 = open, 1 = closed
  closed_by: string | null
  details: ShiftDetail[]
}

export function ShiftHistory({ warehouseId }: { warehouseId: string }) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchShifts()
  }, [warehouseId])

  const fetchShifts = async () => {
    if (!warehouseId) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/shift/list?warehouse_id=${encodeURIComponent(warehouseId)}`)
      
      if (response.ok) {
        const data = await response.json()
        const shiftsList = data.message?.shifts || []
        setShifts(shiftsList)
      } else {
        setError("Failed to load shifts")
      }
    } catch (err) {
      console.error("[DukaPlus] Failed to fetch shifts:", err)
      setError("An error occurred while loading shifts")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground">Loading shifts...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert-error">
        <AlertCircle className="w-5 h-5 text-danger" />
        <p className="text-danger">{error}</p>
      </div>
    )
  }

  if (shifts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground">No shifts found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {shifts.map((shift) => (
        <div key={shift.shift_name} className="card-base p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-mono text-lg font-bold text-warning">{shift.shift_name}</h3>
              <p className="text-sm text-foreground">{formatDate(shift.shift_date)}</p>
            </div>
            <div
              className={
                shift.status === 0
                  ? "badge-success"
                  : "badge-disabled"
              }
            >
              {shift.status === 0 ? "Open" : "Closed"}
            </div>
          </div>

          {shift.closed_by && (
            <p className="text-sm text-foreground mb-3">Closed by: {shift.closed_by}</p>
          )}

          <div className="border-t border-border pt-3">
            <h4 className="text-sm font-semibold text-foreground mb-3">Payment Details</h4>
            <div className="space-y-4">
              {shift.details && shift.details.length > 0 ? (
                shift.details.map((detail, index) => (
                  <div key={index} className="border border-border rounded-lg p-3">
                    <h5 className="font-semibold text-foreground mb-2">{detail.mode_of_payment}</h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-foreground opacity-70">Opening:</span>
                        <span className="ml-2 text-foreground font-semibold">
                          {formatCurrency(detail.opening_amount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-foreground opacity-70">Sales:</span>
                        <span className="ml-2 text-success font-semibold">
                          {formatCurrency(detail.total_sales)}
                        </span>
                      </div>
                      <div>
                        <span className="text-foreground opacity-70">Credit Paid:</span>
                        <span className="ml-2 text-success font-semibold">
                          {formatCurrency(detail.total_credit_paid)}
                        </span>
                      </div>
                      <div>
                        <span className="text-foreground opacity-70">Expenses:</span>
                        <span className="ml-2 text-danger font-semibold">
                          {formatCurrency(detail.total_expense)}
                        </span>
                      </div>
                      <div>
                        <span className="text-foreground opacity-70">Expected:</span>
                        <span className="ml-2 text-warning font-semibold">
                          {formatCurrency(detail.expected_closing_balance)}
                        </span>
                      </div>
                      <div>
                        <span className="text-foreground opacity-70">Actual:</span>
                        <span className="ml-2 text-foreground font-semibold">
                          {formatCurrency(detail.actual_closing_amount)}
                        </span>
                      </div>
                      {detail.difference !== 0 && (
                        <div className="col-span-2 mt-1 pt-2 border-t border-border">
                          <span className="text-foreground opacity-70">Difference:</span>
                          <span className={`ml-2 font-bold ${detail.difference > 0 ? 'text-success' : 'text-danger'}`}>
                            {formatCurrency(Math.abs(detail.difference))} {detail.difference > 0 ? '(Over)' : '(Short)'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-foreground">No payment details available</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
