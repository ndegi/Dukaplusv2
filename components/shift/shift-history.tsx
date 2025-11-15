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
  details: ShiftDetail[] // renamed from payment_details to match API response
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
        console.log("[DukaPlus] Shift data received:", shiftsList)
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
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[800px]">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell text-left px-3 sm:px-4">Shift ID</th>
                <th className="table-header-cell text-left px-3 sm:px-4">Date</th>
                <th className="table-header-cell text-center px-3 sm:px-4">Status</th>
                <th className="table-header-cell text-left px-3 sm:px-4">Closed By</th>
                <th className="table-header-cell text-left px-3 sm:px-4">Payment Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredShifts.map((shift) => {
                const hasDetails = shift.details && Array.isArray(shift.details) && shift.details.length > 0
                return (
                  <tr key={shift.shift_name} className="table-row">
                    <td className="table-cell px-3 sm:px-4">
                      <span className="font-mono text-warning font-semibold text-xs sm:text-sm">{shift.shift_name}</span>
                    </td>
                    <td className="table-cell-secondary px-3 sm:px-4 text-xs sm:text-sm">{formatDate(shift.shift_date)}</td>
                    <td className="table-cell text-center px-3 sm:px-4">
                      <span
                        className={shift.status === 0 ? "badge-success text-xs" : "badge-disabled text-xs"}
                      >
                        {shift.status === 0 ? "Open" : "Closed"}
                      </span>
                    </td>
                    <td className="table-cell-secondary px-3 sm:px-4 text-xs sm:text-sm">{shift.closed_by || "-"}</td>
                    <td className="table-cell px-3 sm:px-4">
                      {hasDetails ? (
                        <div className="space-y-1">
                          <table className="w-full text-xs border border-border/50 rounded overflow-hidden">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left px-2 py-1 font-semibold text-foreground">Mode</th>
                                <th className="text-right px-2 py-1 font-semibold text-foreground">Opening</th>
                                <th className="text-right px-2 py-1 font-semibold text-foreground">Sales</th>
                                <th className="text-right px-2 py-1 font-semibold text-foreground">Expected</th>
                                <th className="text-right px-2 py-1 font-semibold text-foreground">Diff</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                              {shift.details.map((detail, index) => (
                                <tr key={index} className="hover:bg-muted/20">
                                  <td className="px-2 py-1.5 font-medium text-foreground">{detail.mode_of_payment}</td>
                                  <td className="px-2 py-1.5 text-right text-muted-foreground">{formatCurrency(detail.opening_amount ?? 0)}</td>
                                  <td className="px-2 py-1.5 text-right text-success">{formatCurrency(detail.total_sales ?? 0)}</td>
                                  <td className="px-2 py-1.5 text-right text-warning">{formatCurrency(detail.expected_closing_balance ?? 0)}</td>
                                  <td className={`px-2 py-1.5 text-right font-semibold ${
                                    (detail.difference ?? 0) === 0 ? 'text-muted-foreground' :
                                    (detail.difference ?? 0) > 0 ? 'text-success' : 'text-danger'
                                  }`}>
                                    {(detail.difference ?? 0) === 0 ? '-' : 
                                     `${formatCurrency(Math.abs(detail.difference ?? 0))} ${(detail.difference ?? 0) > 0 ? '↑' : '↓'}`
                                    }
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">No details</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
