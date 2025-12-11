"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { AlertCircle, Search, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCurrency } from "@/lib/contexts/currency-context"

interface Transaction {
  id: string
  date: string
  amount: number
  items: number
  paymentMethod: string
  reference?: string
  user: string
}

export function SalesHistory() {
  const { currency } = useCurrency()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalSales, setTotalSales] = useState(0)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })
  const [showDatePicker, setShowDatePicker] = useState(false)

  useEffect(() => {
    fetchTransactions()
  }, [])

  useEffect(() => {
    const filtered = transactions.filter((transaction) => {
      const matchesSearch =
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())

      const transactionDate = new Date(transaction.date)
      const matchesDate = transactionDate >= dateRange.from && transactionDate <= dateRange.to

      return matchesSearch && matchesDate
    })
    setFilteredTransactions(filtered)
  }, [searchTerm, transactions, dateRange])

  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/sales/transactions")

      if (response.ok) {
        const data = await response.json()
        const transactionsList = (data.transactions || []).map((item: any) => ({
          id: item.name,
          date: item.creation || new Date().toISOString(),
          amount: item.total || 0,
          items: item.items_count || 0,
          paymentMethod: item.payment_method || "cash",
          reference: item.payment_reference,
          user: item.owner || "System",
        }))
        setTransactions(transactionsList)

        const total = transactionsList.reduce((sum: number, t: Transaction) => sum + t.amount, 0)
        setTotalSales(total)

        setError(null)
      } else {
        setError("Failed to fetch transactions")
      }
    } catch (err) {
      setError("An error occurred while fetching transactions")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    const to = new Date()
    to.setHours(23, 59, 59, 999)
    const from = new Date()
    from.setDate(from.getDate() - 30)
    from.setHours(0, 0, 0, 0)
    setDateRange({ from, to })
  }

  const hasActiveFilters = () => {
    if (searchTerm) return true

    // Check if date range is different from default (last 30 days)
    const defaultTo = new Date()
    defaultTo.setHours(23, 59, 59, 999)
    const defaultFrom = new Date()
    defaultFrom.setDate(defaultFrom.getDate() - 30)
    defaultFrom.setHours(0, 0, 0, 0)

    // Compare dates by day, ignoring time differences
    const fromDifferent = dateRange.from.toDateString() !== defaultFrom.toDateString()
    const toDifferent = dateRange.to.toDateString() !== defaultTo.toDateString()

    return fromDifferent || toDifferent
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <p className="text-slate-400 text-sm mb-1">Total Transactions</p>
          <p className="text-3xl font-bold text-white">{transactions.length}</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <p className="text-slate-400 text-sm mb-1">Total Sales</p>
          <p className="text-3xl font-bold text-orange-400">
            {currency} {totalSales.toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <p className="text-slate-400 text-sm mb-1">Average Transaction</p>
          <p className="text-3xl font-bold text-green-400">
            {currency} {(transactions.length > 0 ? totalSales / transactions.length : 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search by transaction ID or payment method..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-700 border-slate-600 text-white"
          />
        </div>
        <div className="relative">
          <Button
            onClick={() => setShowDatePicker(!showDatePicker)}
            variant="outline"
            className="border-slate-600 bg-slate-700 hover:bg-slate-600 text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            <span className="text-sm">
              {dateRange.from.toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
              {dateRange.to.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </Button>

          {showDatePicker && (
            <div className="absolute top-full right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 p-4 space-y-3 min-w-64">
              <button
                onClick={() => {
                  const to = new Date()
                  to.setHours(23, 59, 59, 999)
                  const from = new Date()
                  from.setDate(from.getDate() - 7)
                  from.setHours(0, 0, 0, 0)
                  setDateRange({ from, to })
                  setShowDatePicker(false)
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-sm text-slate-300"
              >
                Last 7 days
              </button>
              <button
                onClick={() => {
                  const to = new Date()
                  to.setHours(23, 59, 59, 999)
                  const from = new Date()
                  from.setDate(from.getDate() - 30)
                  from.setHours(0, 0, 0, 0)
                  setDateRange({ from, to })
                  setShowDatePicker(false)
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-sm text-slate-300"
              >
                Last 30 days
              </button>
              <button
                onClick={() => {
                  const to = new Date()
                  to.setHours(23, 59, 59, 999)
                  const from = new Date()
                  from.setDate(from.getDate() - 90)
                  from.setHours(0, 0, 0, 0)
                  setDateRange({ from, to })
                  setShowDatePicker(false)
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-sm text-slate-300"
              >
                Last 90 days
              </button>
              <div className="border-t border-slate-700 pt-3 space-y-2">
                <p className="text-xs text-slate-400 font-semibold uppercase">Custom Range</p>
                <div>
                  <label className="text-xs text-slate-400">From</label>
                  <Input
                    type="date"
                    value={dateRange.from.toISOString().split("T")[0]}
                    onChange={(e) => {
                      const from = new Date(e.target.value)
                      from.setHours(0, 0, 0, 0)
                      setDateRange({ ...dateRange, from })
                    }}
                    className="bg-slate-700 border-slate-600 text-white text-sm h-8"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">To</label>
                  <Input
                    type="date"
                    value={dateRange.to.toISOString().split("T")[0]}
                    onChange={(e) => {
                      const to = new Date(e.target.value)
                      to.setHours(23, 59, 59, 999)
                      setDateRange({ ...dateRange, to })
                    }}
                    className="bg-slate-700 border-slate-600 text-white text-sm h-8"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowDatePicker(false)}
                className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-sm text-slate-300 border-t border-slate-700 pt-2"
              >
                Close
              </button>
            </div>
          )}
        </div>
        {hasActiveFilters() && (
          <Button
            onClick={clearFilters}
            variant="outline"
            className="border-slate-600 bg-slate-700 hover:bg-slate-600 text-white"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Transactions Table */}
      <div className="card-base table-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading transactions...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="reports-table">
              <thead>
                <tr>
                  <th className="table-header-cell">
                    Transaction ID
                  </th>
                  <th className="table-header-cell">
                    Date & Time
                  </th>
                  <th className="table-header-cell">
                    Items
                  </th>
                  <th className="table-header-cell">
                    Amount
                  </th>
                  <th className="table-header-cell">
                    Method
                  </th>
                  <th className="table-header-cell">
                    User
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="table-row">
                    <td className="table-cell font-medium font-mono">{transaction.id}</td>
                    <td className="table-cell-secondary">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(transaction.date).toLocaleString()}
                      </div>
                    </td>
                    <td className="table-cell-secondary">{transaction.items}</td>
                    <td className="table-cell text-warning font-semibold">
                      {currency}{" "}
                      {transaction.amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="table-cell">
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-300 text-xs font-medium">
                        {transaction.paymentMethod}
                      </span>
                    </td>
                    <td className="table-cell-secondary">{transaction.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
