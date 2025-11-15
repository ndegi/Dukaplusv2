"use client"

import { useState, useEffect } from "react"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { AlertCircle, Search, Filter } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  payment_details: ShiftDetail[]
}

export function ShiftHistory({ warehouseId }: { warehouseId: string }) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [filteredShifts, setFilteredShifts] = useState<Shift[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all")

  useEffect(() => {
    fetchShifts()
  }, [warehouseId])

  useEffect(() => {
    let filtered = shifts

    if (statusFilter !== "all") {
      filtered = filtered.filter(shift => 
        statusFilter === "open" ? shift.status === 0 : shift.status === 1
      )
    }

    if (searchTerm) {
      filtered = filtered.filter(shift =>
        shift.shift_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (shift.closed_by && shift.closed_by.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredShifts(filtered)
  }, [shifts, searchTerm, statusFilter])

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
        <AlertCircle className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-danger" />
        <p className="text-danger">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by shift name or closed by..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-base"
          />
        </div>
        <div className="sm:w-48">
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="input-base">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shifts</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredShifts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No shifts match your search criteria
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell text-left">Shift ID</th>
                <th className="table-header-cell text-left">Date</th>
                <th className="table-header-cell text-center">Status</th>
                <th className="table-header-cell text-left">Closed By</th>
                <th className="table-header-cell text-right">Payment Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredShifts.map((shift) => (
                <tr key={shift.shift_name} className="table-row">
                  <td className="table-cell">
                    <span className="font-mono text-warning font-semibold">{shift.shift_name}</span>
                  </td>
                  <td className="table-cell-secondary">{formatDate(shift.shift_date)}</td>
                  <td className="table-cell text-center">
                    <span
                      className={shift.status === 0 ? "badge-success" : "badge-disabled"}
                    >
                      {shift.status === 0 ? "Open" : "Closed"}
                    </span>
                  </td>
                  <td className="table-cell-secondary">{shift.closed_by || "-"}</td>
                  <td className="table-cell">
                    {shift.payment_details && shift.payment_details.length > 0 ? (
                      <div className="space-y-2">
                        {shift.payment_details.map((detail, index) => (
                          <div key={index} className="text-right bg-muted/30 rounded p-2">
                            <div className="font-semibold text-foreground text-sm">{detail.mode_of_payment}</div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>
                                <span>Opening: </span>
                                <span className="text-foreground">{formatCurrency(detail.opening_amount || 0)}</span>
                              </div>
                              <div>
                                <span>Sales: </span>
                                <span className="text-success">{formatCurrency(detail.total_sales || 0)}</span>
                              </div>
                              <div>
                                <span>Expected: </span>
                                <span className="text-warning">{formatCurrency(detail.expected_closing_balance || 0)}</span>
                              </div>
                              {(detail.difference || 0) !== 0 && (
                                <div>
                                  <span>Diff: </span>
                                  <span className={(detail.difference || 0) > 0 ? 'text-success' : 'text-danger'}>
                                    {formatCurrency(Math.abs(detail.difference || 0))} {(detail.difference || 0) > 0 ? '↑' : '↓'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No details</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
