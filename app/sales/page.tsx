"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { AlertCircle, Download, Eye, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
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
  receipt_items?: Array<{
    item_code: string
    item_name: string
    quantity: number
    rate: number
    amount: number
  }>
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
  invoice_items?: Array<{
    item_code: string
    item_name: string
    quantity: number
    rate: number
    amount: number
  }>
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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [itemToCancel, setItemToCancel] = useState<{ id: string; type: "receipt" | "invoice" } | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

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
      console.error("[v0] Error fetching sales receipts:", err)
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
      console.error("[v0] Error fetching sales invoices:", err)
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

  const handleCompletePayment = async (invoice: SalesInvoice) => {
    sessionStorage.setItem(
      "pending_invoice_payment",
      JSON.stringify({
        sales_id: invoice.sales_id,
        outstanding_amount: invoice.outstanding_amount,
        customer_name: invoice.customer_name,
        mobile_number: invoice.mobile_number,
      }),
    )
    router.push("/pos")
  }

  const handleCancelInvoice = async (salesId: string) => {
    try {
      setIsCancelling(true)
      const response = await fetch("/api/sales/invoice/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sales_invoice_id: salesId }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowCancelConfirm(false)
        setItemToCancel(null)
        fetchSalesReceipts()
        fetchSalesInvoices()
      } else {
        setError(data.message?.message || "Failed to cancel invoice")
      }
    } catch (err) {
      setError("Error cancelling invoice")
      console.error("[v0] Error cancelling invoice:", err)
    } finally {
      setIsCancelling(false)
    }
  }

  const handleShowCancelConfirm = (salesId: string, type: "receipt" | "invoice") => {
    setItemToCancel({ id: salesId, type })
    setShowCancelConfirm(true)
  }

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
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
                      <th className="px-2 sm:px-4 py-3 text-left font-semibold w-10"></th>
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
                        const isExpanded = expandedRows.has(receipt.sales_id)
                        return (
                          <>
                            <tr key={receipt.sales_id} className="table-row">
                              {receipt.receipt_items && receipt.receipt_items.length > 0 && (
                                <td className="px-2 sm:px-4 py-3">
                                  <button
                                    onClick={() => toggleRowExpansion(receipt.sales_id)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </button>
                                </td>
                              )}
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
                                <button
                                  onClick={() => handleShowCancelConfirm(receipt.sales_id, "receipt")}
                                  className="btn-cancel p-2 rounded text-xs"
                                  title="Cancel Receipt"
                                >
                                  Cancel
                                </button>
                              </td>
                            </tr>
                            {isExpanded && receipt.receipt_items && receipt.receipt_items.length > 0 && (
                              <tr>
                                <td colSpan={7} className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50">
                                  <div className="p-4">
                                    <h4 className="font-semibold text-sm mb-2 text-foreground">Items:</h4>
                                    <table className="w-full text-xs">
                                      <thead className="bg-slate-100 dark:bg-slate-800">
                                        <tr>
                                          <th className="text-left p-2 font-semibold">Item Code</th>
                                          <th className="text-left p-2 font-semibold">Item Name</th>
                                          <th className="text-right p-2 font-semibold">Quantity</th>
                                          <th className="text-right p-2 font-semibold">Rate</th>
                                          <th className="text-right p-2 font-semibold">Amount</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {receipt.receipt_items.map((lineItem, idx) => (
                                          <tr key={idx} className="border-b border-slate-200 dark:border-slate-700">
                                            <td className="p-2 font-mono text-muted-foreground">{lineItem.item_code}</td>
                                            <td className="p-2 text-foreground">{lineItem.item_name}</td>
                                            <td className="p-2 text-right text-foreground">{lineItem.quantity}</td>
                                            <td className="p-2 text-right text-muted-foreground">
                                              KES {lineItem.rate.toFixed(2)}
                                            </td>
                                            <td className="p-2 text-right font-semibold text-foreground">
                                              KES {lineItem.amount.toFixed(2)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        )
                      } else {
                        const invoice = item as SalesInvoice
                        const isExpanded = expandedRows.has(invoice.sales_id)
                        return (
                          <>
                            <tr key={invoice.sales_id} className="table-row">
                              {invoice.invoice_items && invoice.invoice_items.length > 0 && (
                                <td className="px-2 sm:px-4 py-3">
                                  <button
                                    onClick={() => toggleRowExpansion(invoice.sales_id)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </button>
                                </td>
                              )}
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
                                {invoice.outstanding_amount > 0 && (
                                  <button
                                    onClick={() => handleCompletePayment(invoice)}
                                    className="btn-warning p-2 rounded text-xs"
                                    title="Complete Payment"
                                  >
                                    Pay
                                  </button>
                                )}
                                <button
                                  onClick={() => handleShowCancelConfirm(invoice.sales_id, "invoice")}
                                  className="btn-cancel p-2 rounded text-xs"
                                  title="Cancel Invoice"
                                >
                                  Cancel
                                </button>
                              </td>
                            </tr>
                            {isExpanded && invoice.invoice_items && invoice.invoice_items.length > 0 && (
                              <tr>
                                <td colSpan={9} className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50">
                                  <div className="p-4">
                                    <h4 className="font-semibold text-sm mb-2 text-foreground">Items:</h4>
                                    <table className="w-full text-xs">
                                      <thead className="bg-slate-100 dark:bg-slate-800">
                                        <tr>
                                          <th className="text-left p-2 font-semibold">Item Code</th>
                                          <th className="text-left p-2 font-semibold">Item Name</th>
                                          <th className="text-right p-2 font-semibold">Quantity</th>
                                          <th className="text-right p-2 font-semibold">Rate</th>
                                          <th className="text-right p-2 font-semibold">Amount</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {invoice.invoice_items.map((lineItem, idx) => (
                                          <tr key={idx} className="border-b border-slate-200 dark:border-slate-700">
                                            <td className="p-2 font-mono text-muted-foreground">{lineItem.item_code}</td>
                                            <td className="p-2 text-foreground">{lineItem.item_name}</td>
                                            <td className="p-2 text-right text-foreground">{lineItem.quantity}</td>
                                            <td className="p-2 text-right text-muted-foreground">
                                              KES {lineItem.rate.toFixed(2)}
                                            </td>
                                            <td className="p-2 text-right font-semibold text-foreground">
                                              KES {lineItem.amount.toFixed(2)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
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

      {showCancelConfirm && itemToCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">
                Cancel {itemToCancel.type === "receipt" ? "Receipt" : "Invoice"}
              </h2>
            </div>

            <div className="p-6">
              <p className="text-foreground">
                Are you sure you want to cancel {itemToCancel.type === "receipt" ? "receipt" : "invoice"}{" "}
                <span className="font-mono font-semibold text-warning">{itemToCancel.id}</span>?
              </p>
              <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
            </div>

            <div className="p-6 border-t border-border flex gap-2">
              <button
                onClick={() => {
                  setShowCancelConfirm(false)
                  setItemToCancel(null)
                }}
                className="btn-secondary flex-1"
                disabled={isCancelling}
              >
                No, Keep It
              </button>
              <button
                onClick={() => handleCancelInvoice(itemToCancel.id)}
                className="btn-cancel flex-1"
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
