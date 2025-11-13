"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AlertCircle, Download, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SalesReceipt {
  sales_id: string
  date: string
  time: string
  customer: string
  total_amount: number
  discount_amount: number
  receipt_url: string
  sales_owner: string
}

export default function SalesPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [receipts, setReceipts] = useState<SalesReceipt[]>([])
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"date" | "amount">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      fetchSalesReceipts()
    }
  }, [user])

  const fetchSalesReceipts = async () => {
    try {
      setIsLoadingReceipts(true)
      const warehouseId = sessionStorage.getItem("selected_warehouse") || ""

      if (!warehouseId) {
        setError("Please select a warehouse first")
        setIsLoadingReceipts(false)
        return
      }

      const response = await fetch(`/api/sales-receipts?warehouse_id=${encodeURIComponent(warehouseId)}`)
      const data = await response.json()

      if (response.ok && data.message?.sales_data) {
        setReceipts(data.message.sales_data)
        setError(null)
      } else {
        setError(data.message?.message || "Failed to fetch sales receipts")
      }
    } catch (err) {
      setError("Error fetching sales receipts")
      console.error("[DukaPlus] Error fetching sales receipts:", err)
    } finally {
      setIsLoadingReceipts(false)
    }
  }

  const sortedReceipts = [...receipts].sort((a, b) => {
    let compareValue = 0

    if (sortBy === "date") {
      compareValue = new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime()
    } else {
      compareValue = a.total_amount - b.total_amount
    }

    return sortOrder === "asc" ? compareValue : -compareValue
  })

  const totalPages = Math.ceil(sortedReceipts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedReceipts = sortedReceipts.slice(startIndex, endIndex)

  const handleViewReceipt = (url: string) => {
    window.open(url, "_blank")
  }

  if (isLoading || !user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 px-2 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">Sales History</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            View all completed sales transactions
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Sales Receipts</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "amount")}
                className="flex-1 sm:flex-none bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded px-3 py-2 text-sm"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded px-3 py-2 text-sm transition-colors"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>

          {isLoadingReceipts ? (
            <p className="text-slate-600 dark:text-slate-400">Loading sales receipts...</p>
          ) : sortedReceipts.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400 text-center py-8">No sales receipts found</p>
          ) : (
            <>
              <div className="overflow-x-auto text-xs sm:text-sm">
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-2 sm:px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-200">
                        Receipt ID
                      </th>
                      <th className="px-2 sm:px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-200">
                        Date & Time
                      </th>
                      <th className="px-2 sm:px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-200">
                        Customer
                      </th>
                      <th className="px-2 sm:px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-200">
                        Amount
                      </th>
                      <th className="px-2 sm:px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-200">
                        Discount
                      </th>
                      <th className="px-2 sm:px-4 py-3 text-center font-semibold text-slate-900 dark:text-slate-200">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {paginatedReceipts.map((receipt) => (
                      <tr
                        key={receipt.sales_id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="px-2 sm:px-4 py-3 font-mono text-orange-600 dark:text-orange-400">
                          {receipt.sales_id}
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-slate-900 dark:text-slate-200 text-xs sm:text-sm">
                          {receipt.date} {receipt.time}
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-slate-900 dark:text-slate-200">{receipt.customer}</td>
                        <td className="px-2 sm:px-4 py-3 text-right text-slate-900 dark:text-slate-200 font-semibold">
                          KES {receipt.total_amount.toFixed(2)}
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                          KES {receipt.discount_amount.toFixed(2)}
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-center flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewReceipt(receipt.receipt_url)}
                            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded p-2 transition-colors"
                            title="View Receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const link = document.createElement("a")
                              link.href = receipt.receipt_url
                              link.download = `receipt-${receipt.sales_id}.pdf`
                              link.click()
                            }}
                            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white rounded p-2 transition-colors"
                            title="Download Receipt"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {startIndex + 1} to {Math.min(endIndex, sortedReceipts.length)} of {sortedReceipts.length}{" "}
                    receipts
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let page
                        if (totalPages <= 5) {
                          page = i + 1
                        } else if (currentPage <= 3) {
                          page = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i
                        } else {
                          page = currentPage - 2 + i
                        }
                        return (
                          <Button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            className={currentPage === page ? "bg-orange-500 hover:bg-orange-600" : ""}
                          >
                            {page}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
