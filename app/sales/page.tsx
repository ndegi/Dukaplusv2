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

interface SalesInvoice {
  sales_id: string
  date: string
  time: string
  customer_name: string
  total_amount: number
  outstanding_amount: number
  discount_amount: number
  status: string
  mobile_number: string
  invoice_url: string
}

export default function SalesPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [receipts, setReceipts] = useState<SalesReceipt[]>([])
  const [invoices, setInvoices] = useState<SalesInvoice[]>([])
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"date" | "amount">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"receipts" | "invoices">("receipts")

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      fetchSalesReceipts()
      fetchSalesInvoices()
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

  const fetchSalesInvoices = async () => {
    try {
      const warehouseId = sessionStorage.getItem("selected_warehouse") || ""

      if (!warehouseId) {
        return
      }

      const response = await fetch(`/api/sales/invoices?warehouse_id=${encodeURIComponent(warehouseId)}`)
      const data = await response.json()

      if (response.ok && data.message?.sales_data) {
        setInvoices(data.message.sales_data)
      }
    } catch (err) {
      console.error("[DukaPlus] Error fetching sales invoices:", err)
    }
  }

  const currentData = activeTab === "receipts" ? receipts : invoices
  const sortedData = [...currentData].sort((a, b) => {
    let compareValue = 0

    if (sortBy === "date") {
      compareValue = new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime()
    } else {
      compareValue = a.total_amount - b.total_amount
    }

    return sortOrder === "asc" ? compareValue : -compareValue
  })

  const filteredData = sortedData.filter((item) => {
    const searchLower = searchTerm.toLowerCase()
    if (activeTab === "receipts") {
      const receipt = item as SalesReceipt
      return (
        receipt.sales_id.toLowerCase().includes(searchLower) ||
        receipt.customer.toLowerCase().includes(searchLower) ||
        receipt.sales_owner.toLowerCase().includes(searchLower)
      )
    } else {
      const invoice = item as SalesInvoice
      return (
        invoice.sales_id.toLowerCase().includes(searchLower) ||
        invoice.customer_name.toLowerCase().includes(searchLower)
      )
    }
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)

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
          <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                setActiveTab("receipts")
                setCurrentPage(1)
              }}
              className={`pb-3 px-2 font-semibold transition-colors ${
                activeTab === "receipts"
                  ? "border-b-2 border-green-500 text-green-600 dark:text-green-400"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Sales Receipts ({receipts.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("invoices")
                setCurrentPage(1)
              }}
              className={`pb-3 px-2 font-semibold transition-colors ${
                activeTab === "invoices"
                  ? "border-b-2 border-orange-500 text-orange-600 dark:text-orange-400"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Sales Invoices ({invoices.length})
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {activeTab === "receipts" ? "Sales Receipts" : "Sales Invoices"}
            </h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search receipts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-base px-3 py-2 text-sm flex-1 sm:w-64"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "amount")}
                className="input-base px-3 py-2 text-sm"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="btn-secondary px-3 py-2 text-sm"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>

          {isLoadingReceipts ? (
            <p className="text-slate-600 dark:text-slate-400">Loading sales data...</p>
          ) : filteredData.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400 text-center py-8">
              {searchTerm ? "No records match your search" : `No ${activeTab} found`}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto text-xs sm:text-sm">
                <table className="w-full">
                  <thead className="table-header">
                    <tr>
                      <th className="px-2 sm:px-4 py-3 text-left font-semibold">
                        {activeTab === "receipts" ? "Receipt ID" : "Invoice ID"}
                      </th>
                      <th className="px-2 sm:px-4 py-3 text-left font-semibold">Date & Time</th>
                      <th className="px-2 sm:px-4 py-3 text-left font-semibold">Customer</th>
                      <th className="px-2 sm:px-4 py-3 text-right font-semibold">Amount</th>
                      {activeTab === "invoices" && (
                        <th className="px-2 sm:px-4 py-3 text-right font-semibold">Outstanding</th>
                      )}
                      <th className="px-2 sm:px-4 py-3 text-right font-semibold">Discount</th>
                      {activeTab === "invoices" && (
                        <th className="px-2 sm:px-4 py-3 text-center font-semibold">Status</th>
                      )}
                      <th className="px-2 sm:px-4 py-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedData.map((item) => {
                      if (activeTab === "receipts") {
                        const receipt = item as SalesReceipt
                        return (
                          <tr key={receipt.sales_id} className="table-row">
                            <td className="px-2 sm:px-4 py-3 font-mono text-warning">{receipt.sales_id}</td>
                            <td className="px-2 sm:px-4 py-3 text-foreground text-xs sm:text-sm">
                              {receipt.date} {receipt.time}
                            </td>
                            <td className="px-2 sm:px-4 py-3 text-foreground">{receipt.customer}</td>
                            <td className="px-2 sm:px-4 py-3 text-right text-foreground font-semibold">
                              KES{" "}
                              {receipt.total_amount.toLocaleString("en-KE", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-2 sm:px-4 py-3 text-right text-muted-foreground">
                              KES{" "}
                              {receipt.discount_amount.toLocaleString("en-KE", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-2 sm:px-4 py-3 text-center flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewReceipt(receipt.receipt_url)}
                                className="action-btn-view p-2"
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
                                className="btn-success p-2 rounded"
                                title="Download Receipt"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      } else {
                        const invoice = item as SalesInvoice
                        return (
                          <tr key={invoice.sales_id} className="table-row">
                            <td className="px-2 sm:px-4 py-3 font-mono text-warning">{invoice.sales_id}</td>
                            <td className="px-2 sm:px-4 py-3 text-foreground text-xs sm:text-sm">
                              {invoice.date} {invoice.time}
                            </td>
                            <td className="px-2 sm:px-4 py-3 text-foreground">{invoice.customer_name}</td>
                            <td className="px-2 sm:px-4 py-3 text-right text-foreground font-semibold">
                              KES{" "}
                              {invoice.total_amount.toLocaleString("en-KE", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-2 sm:px-4 py-3 text-right text-red-600 dark:text-red-400 font-semibold">
                              KES{" "}
                              {invoice.outstanding_amount.toLocaleString("en-KE", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-2 sm:px-4 py-3 text-right text-muted-foreground">
                              KES{" "}
                              {invoice.discount_amount.toLocaleString("en-KE", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-2 sm:px-4 py-3 text-center">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                {invoice.status}
                              </span>
                            </td>
                            <td className="px-2 sm:px-4 py-3 text-center flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewReceipt(invoice.invoice_url)}
                                className="action-btn-view p-2"
                                title="View Invoice"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const link = document.createElement("a")
                                  link.href = invoice.invoice_url
                                  link.download = `invoice-${invoice.sales_id}.pdf`
                                  link.click()
                                }}
                                className="btn-success p-2 rounded"
                                title="Download Invoice"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      }
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length}{" "}
                    {activeTab}
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
