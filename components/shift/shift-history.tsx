"use client"

import { useState, useEffect } from "react"
import { useCurrency } from "@/lib/contexts/currency-context"
import { AlertCircle, Search, Filter, Calendar } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

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
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const { currency } = useCurrency()
  const formatMoney = (value: number | undefined | null) =>
    `${currency} ${Number(value ?? 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  useEffect(() => {
    fetchShifts()
  }, [warehouseId])

  useEffect(() => {
    let filtered = shifts

    // Filter by date range
    filtered = filtered.filter(shift => {
      const shiftDate = new Date(shift.shift_date)
      return shiftDate >= dateRange.from && shiftDate <= dateRange.to
    })

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
  }, [shifts, searchTerm, statusFilter, dateRange])

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
        <div className="relative">
          <Button
            onClick={() => setShowDatePicker(!showDatePicker)}
            variant="outline"
            className="border-border hover:bg-muted w-full sm:w-auto justify-start text-left font-normal"
          >
            <Calendar className="w-4 h-4 mr-2" />
            <span className="text-xs sm:text-sm">
              {dateRange.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {dateRange.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </Button>

          {showDatePicker && (
            <div className="absolute top-full right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 p-4 space-y-3 min-w-64">
              <button onClick={() => {
                const to = new Date()
                const from = new Date()
                from.setDate(from.getDate() - 7)
                setDateRange({ from, to })
                setShowDatePicker(false)
              }} className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm">
                Last 7 days
              </button>
              <button onClick={() => {
                const to = new Date()
                const from = new Date()
                from.setDate(from.getDate() - 30)
                setDateRange({ from, to })
                setShowDatePicker(false)
              }} className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm">
                Last 30 days
              </button>
              <button onClick={() => {
                const to = new Date()
                const from = new Date()
                from.setDate(from.getDate() - 90)
                setDateRange({ from, to })
                setShowDatePicker(false)
              }} className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm">
                Last 90 days
              </button>
              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase">Custom Range</p>
                <div>
                  <label className="text-xs text-muted-foreground">From</label>
                  <Input type="date" value={dateRange.from.toISOString().split('T')[0]} onChange={(e) => setDateRange({ ...dateRange, from: new Date(e.target.value) })} className="input-base text-sm h-8" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">To</label>
                  <Input type="date" value={dateRange.to.toISOString().split('T')[0]} onChange={(e) => setDateRange({ ...dateRange, to: new Date(e.target.value) })} className="input-base text-sm h-8" />
                </div>
              </div>
              <button onClick={() => setShowDatePicker(false)} className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm border-t border-border pt-2">
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {filteredShifts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No shifts match your search criteria
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="reports-table min-w-[800px]">
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
                    <td className="table-cell-secondary px-3 sm:px-4 text-xs sm:text-sm">{new Date(shift.shift_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                    <td className="table-cell text-center px-3 sm:px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${shift.status === 0
                            ? "bg-green-500/20 text-green-700 dark:text-green-400"
                            : "bg-slate-500/20 text-slate-700 dark:text-slate-300"
                          }`}
                      >
                        {shift.status === 0 ? "Open" : "Closed"}
                      </span>
                    </td>
                    <td className="table-cell-secondary px-3 sm:px-4 text-xs sm:text-sm">{shift.closed_by || "-"}</td>
                    <td className="table-cell px-3 sm:px-4">
                      {hasDetails ? (
                        <div className="space-y-1">
                          <table className="reports-table text-xs border border-border/60 rounded-lg overflow-hidden bg-background min-w-[720px]">
                            <thead className="bg-slate-100 dark:bg-slate-700 border-b border-border/60">
                              <tr>
                                <th className="text-left px-3 py-2 font-semibold text-foreground">Mode</th>
                                <th className="text-right px-3 py-2 font-semibold text-blue-600 dark:text-blue-400">Opening</th>
                                <th className="text-right px-3 py-2 font-semibold text-green-600 dark:text-green-400">Sales</th>
                                <th className="text-right px-3 py-2 font-semibold text-teal-600 dark:text-teal-400">Credit Paid</th>
                                <th className="text-right px-3 py-2 font-semibold text-amber-600 dark:text-amber-400">Expense</th>
                                <th className="text-right px-3 py-2 font-semibold text-orange-600 dark:text-orange-400">Expected</th>
                                <th className="text-right px-3 py-2 font-semibold text-indigo-600 dark:text-indigo-400">Closing</th>
                                <th className="text-right px-3 py-2 font-semibold text-foreground">Diff</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                              {shift.details.map((detail, index) => (
                                <tr key={index} className="hover:bg-muted/20">
                                  <td className="px-3 py-2 font-medium text-foreground">{detail.mode_of_payment}</td>
                                  <td className="px-3 py-2 text-right text-blue-600 dark:text-blue-400 font-semibold">
                                    {formatMoney(detail.opening_amount)}
                                  </td>
                                  <td className="px-3 py-2 text-right text-green-600 dark:text-green-400 font-semibold">
                                    {formatMoney(detail.total_sales)}
                                  </td>
                                  <td className="px-3 py-2 text-right text-teal-600 dark:text-teal-400 font-semibold">
                                    {formatMoney(detail.total_credit_paid)}
                                  </td>
                                  <td className="px-3 py-2 text-right text-amber-600 dark:text-amber-400 font-semibold">
                                    {formatMoney(detail.total_expense)}
                                  </td>
                                  <td className="px-3 py-2 text-right text-orange-600 dark:text-orange-400 font-semibold">
                                    {formatMoney(detail.expected_closing_balance)}
                                  </td>
                                  <td className="px-3 py-2 text-right text-indigo-600 dark:text-indigo-400 font-semibold">
                                    {formatMoney(detail.actual_closing_amount)}
                                  </td>
                                  <td
                                    className={`px-3 py-2 text-right font-semibold rounded ${Number(detail.difference ?? 0).toFixed(2) === "0.00"
                                        ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                        : Number(detail.difference ?? 0) > 0
                                          ? "bg-green-500/15 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                          : "bg-red-500/15 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                                      }`}
                                  >
                                    {Number(detail.difference ?? 0).toFixed(2) === "0.00"
                                      ? "—"
                                      : `${formatMoney(Math.abs(Number(detail.difference ?? 0)))} ${Number(detail.difference ?? 0) > 0 ? "↑" : "↓"
                                      }`}
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
