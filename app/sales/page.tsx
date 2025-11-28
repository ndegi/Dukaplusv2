"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { WhatsAppSendDialog } from "@/components/ui/whatsapp-send-dialog"
import { TableActionButtons } from "@/components/ui/table-action-buttons"
import { Input } from "@/components/ui/input"
import { useCurrency } from "@/lib/contexts/currency-context"
import { useAuth } from "@/hooks/use-auth"
import { AlertCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar } from "lucide-react"

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
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const [queueCustomer, setQueueCustomer] = useState<string>("walk-in")
  const [customerItems, setCustomerItems] = useState<{ label: string; value: string }[]>([])
  const [walkInCustomer, setWalkInCustomer] = useState<string>("")
  const [customersData, setCustomersData] = useState<any>(null)
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    action: () => void
  }>({
    open: false,
    title: "",
    description: "",
    action: () => {},
  })
  const [isCancelling, setIsCancelling] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const { currency } = useCurrency()

  useEffect(() => {
    const fetchWalkInCustomer = async () => {
      try {
        const response = await fetch("/api/sales/walk-in-customer")
        const data = await response.json()
        if (data.walk_in_customer) {
          setWalkInCustomer(data.walk_in_customer)
        }
      } catch (error) {
        console.error("Failed to fetch walk-in customer:", error)
      }
    }

    const fetchAllCustomers = async () => {
      try {
        const response = await fetch("/api/sales/customers")
        const data = await response.json()
        setCustomersData(data)
      } catch (error) {
        console.error("Failed to fetch customers:", error)
      }
    }

    fetchWalkInCustomer()
    fetchAllCustomers()
  }, [])

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

  useEffect(() => {
    if (customersData?.message?.customers) {
      const formattedCustomers = customersData.message.customers.map((customer: any) => ({
        label: `${customer.customer_name} (${customer.mobile_number})`,
        value: customer.customer_id,
      }))
      setCustomerItems(formattedCustomers)
      setQueueCustomer("walk-in")
    }
  }, [customersData])

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
      setError(null)
      const warehouseId = sessionStorage.getItem("selected_warehouse") || ""

      if (!warehouseId) {
        return
      }

      const response = await fetch(`/api/sales/invoices?warehouse_id=${encodeURIComponent(warehouseId)}`)
      const data = await response.json()

      if (!response.ok) {
        console.error("[DukaPlus] Sales invoices API error:", data)
        setError(data.message?.message || "Failed to fetch sales invoices")
        return
      }

      if (data.message?.sales_data && Array.isArray(data.message.sales_data)) {
        setInvoices(data.message.sales_data)
        setError(null)
      } else if (Array.isArray(data.message)) {
        setInvoices(data.message)
        setError(null)
      } else {
        console.error("[DukaPlus] Unexpected sales invoices response structure:", data)
        setError("Invalid response format from server")
      }
    } catch (err) {
      console.error("[DukaPlus] Error fetching sales invoices:", err)
      setError("Error fetching sales invoices")
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
    const itemDate = new Date(`${item.date} ${item.time}`)
    const matchesDate = itemDate >= dateRange.from && itemDate <= dateRange.to

    if (activeTab === "receipts") {
      const receipt = item as SalesReceipt
      const matchesSearch =
        receipt.sales_id.toLowerCase().includes(searchLower) ||
        receipt.customer.toLowerCase().includes(searchLower) ||
        receipt.sales_owner.toLowerCase().includes(searchLower)
      return matchesSearch && matchesDate
    } else {
      const invoice = item as SalesInvoice
      const matchesSearch =
        invoice.sales_id.toLowerCase().includes(searchLower) ||
        invoice.customer_name.toLowerCase().includes(searchLower)
      return matchesSearch && matchesDate
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

  const handleCancelReceipt = async (salesId: string) => {
    setConfirmDialog({
      open: true,
      title: "Cancel Receipt?",
      description: `Are you sure you want to cancel receipt ${salesId}? This action cannot be undone.`,
      action: async () => {
        try {
          setIsCancelling(true)
          const response = await fetch("/api/sales/receipt/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sales_receipt_id: salesId }),
          })

          if (response.ok) {
            fetchSalesReceipts()
            fetchSalesInvoices()
          } else {
            const data = await response.json()
            setError(data.message?.message || "Failed to cancel receipt")
          }
        } catch (err) {
          setError("Error cancelling receipt")
          console.error("[DukaPlus] Error:", err)
        } finally {
          setIsCancelling(false)
        }
      },
    })
  }

  const handleCancelInvoice = async (salesId: string) => {
    setConfirmDialog({
      open: true,
      title: "Cancel Invoice?",
      description: `Are you sure you want to cancel invoice ${salesId}? This action cannot be undone.`,
      action: async () => {
        try {
          setIsCancelling(true)
          const response = await fetch("/api/sales/invoice/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sales_invoice_id: salesId }),
          })

          if (response.ok) {
            fetchSalesReceipts()
            fetchSalesInvoices()
          } else {
            const data = await response.json()
            setError(data.message?.message || "Failed to cancel invoice")
          }
        } catch (err) {
          setError("Error cancelling invoice")
          console.error("[DukaPlus] Error:", err)
        } finally {
          setIsCancelling(false)
        }
      },
    })
  }

  const handleSendWhatsApp = async (salesId: string, type: "receipt" | "invoice", defaultPhone?: string) => {
    setWhatsAppDialog({
      open: true,
      salesId,
      type,
      defaultPhone,
    })
  }

  const sendToWhatsApp = async (phoneNumber: string) => {
    try {
      const response = await fetch("/api/sales/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sales_id: whatsAppDialog.salesId,
          mobile_number: phoneNumber,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message?.message || "Failed to send")
      }

      setError(null)
      alert(`${whatsAppDialog.type === "receipt" ? "Receipt" : "Invoice"} sent successfully to ${phoneNumber}`)
    } catch (err) {
      console.error("[DukaPlus] Error sending to WhatsApp:", err)
      throw err
    }
  }

  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const getStatusBadgeColor = (status: string) => {
    const normalizedStatus = status.toLowerCase()
    if (normalizedStatus === "paid" || normalizedStatus === "completed") {
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
    } else if (normalizedStatus.includes("partly") || normalizedStatus === "partial") {
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
    } else if (normalizedStatus === "unpaid" || normalizedStatus === "pending") {
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
    } else if (normalizedStatus === "overdue") {
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
    }
    return "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400"
  }

  const [whatsAppDialog, setWhatsAppDialog] = useState<{
    open: boolean
    salesId: string
    type: "receipt" | "invoice"
    defaultPhone?: string
  }>({
    open: false,
    salesId: "",
    type: "receipt",
  })

  if (isLoading || !user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 px-2 sm:px-0">
        <ConfirmationDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
          title={confirmDialog.title}
          description={confirmDialog.description}
          onConfirm={confirmDialog.action}
          variant="danger"
          confirmText="Yes, Cancel"
        />

        <WhatsAppSendDialog
          open={whatsAppDialog.open}
          onOpenChange={(open) => setWhatsAppDialog({ ...whatsAppDialog, open })}
          onSend={sendToWhatsApp}
          title={`Send ${whatsAppDialog.type === "receipt" ? "Receipt" : "Invoice"} via WhatsApp`}
          description="Enter the customer's phone number with country code (e.g. +254712345678)"
          defaultPhone={whatsAppDialog.defaultPhone}
        />

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
              <div className="relative">
                <Button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  variant="outline"
                  className="border-border hover:bg-muted w-full sm:w-auto justify-start text-left font-normal"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-xs sm:text-sm">
                    {dateRange.from.toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
                    {dateRange.to.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </Button>

                {showDatePicker && (
                  <div className="absolute top-full right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 p-4 space-y-3 min-w-64">
                    <button
                      onClick={() => {
                        const to = new Date()
                        const from = new Date()
                        from.setDate(from.getDate() - 7)
                        setDateRange({ from, to })
                        setShowDatePicker(false)
                      }}
                      className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm"
                    >
                      Last 7 days
                    </button>
                    <button
                      onClick={() => {
                        const to = new Date()
                        const from = new Date()
                        from.setDate(from.getDate() - 30)
                        setDateRange({ from, to })
                        setShowDatePicker(false)
                      }}
                      className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm"
                    >
                      Last 30 days
                    </button>
                    <button
                      onClick={() => {
                        const to = new Date()
                        const from = new Date()
                        from.setDate(from.getDate() - 90)
                        setDateRange({ from, to })
                        setShowDatePicker(false)
                      }}
                      className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm"
                    >
                      Last 90 days
                    </button>
                    <div className="border-t border-border pt-3 space-y-2">
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Custom Range</p>
                      <div>
                        <label className="text-xs text-muted-foreground">From</label>
                        <Input
                          type="date"
                          value={dateRange.from.toISOString().split("T")[0]}
                          onChange={(e) => setDateRange({ ...dateRange, from: new Date(e.target.value) })}
                          className="input-base text-sm h-8"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">To</label>
                        <Input
                          type="date"
                          value={dateRange.to.toISOString().split("T")[0]}
                          onChange={(e) => setDateRange({ ...dateRange, to: new Date(e.target.value) })}
                          className="input-base text-sm h-8"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm border-t border-border pt-2"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
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
            <p className="text-foreground p-6 text-center">Loading sales data...</p>
          ) : filteredData.length === 0 ? (
            <p className="text-foreground text-center py-8">
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
                                {currency}{" "}
                                {receipt.total_amount.toLocaleString("en-KE", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-2 sm:px-4 py-3 text-right text-muted-foreground">
                                {currency}{" "}
                                {receipt.discount_amount.toLocaleString("en-KE", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-2 sm:px-4 py-3 text-center">
                                <TableActionButtons
                                  showView={true}
                                  showDownload={true}
                                  showSendWhatsApp={true}
                                  showCancel={true}
                                  onView={() => handleViewReceipt(receipt.receipt_url)}
                                  onDownload={() => {
                                    const link = document.createElement("a")
                                    link.href = receipt.receipt_url
                                    link.download = `receipt-${receipt.sales_id}.pdf`
                                    link.click()
                                  }}
                                  onSendWhatsApp={() => handleSendWhatsApp(receipt.sales_id, "receipt")}
                                  onCancel={() => handleCancelReceipt(receipt.sales_id)}
                                  size="sm"
                                />
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
                                            <td className="p-2 font-mono text-muted-foreground">
                                              {lineItem.item_code}
                                            </td>
                                            <td className="p-2 text-foreground">{lineItem.item_name}</td>
                                            <td className="p-2 text-right text-foreground">{lineItem.quantity}</td>
                                            <td className="p-2 text-right text-muted-foreground">
                                              {currency} {lineItem.rate.toFixed(2)}
                                            </td>
                                            <td className="p-2 text-right font-semibold text-foreground">
                                              {currency} {lineItem.amount.toFixed(2)}
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
                                {currency}{" "}
                                {invoice.total_amount.toLocaleString("en-KE", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-2 sm:px-4 py-3 text-right text-red-600 dark:text-red-400 font-semibold">
                                {currency}{" "}
                                {invoice.outstanding_amount.toLocaleString("en-KE", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-2 sm:px-4 py-3 text-right text-muted-foreground">
                                {currency}{" "}
                                {invoice.discount_amount.toLocaleString("en-KE", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-2 sm:px-4 py-3 text-center">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(invoice.status)}`}
                                >
                                  {invoice.status}
                                </span>
                              </td>
                              <td className="px-2 sm:px-4 py-3 text-center">
                                <TableActionButtons
                                  showView={true}
                                  showDownload={true}
                                  showSendWhatsApp={true}
                                  showPay={invoice.outstanding_amount > 0}
                                  showCancel={true}
                                  onView={() => handleViewReceipt(invoice.invoice_url)}
                                  onDownload={() => {
                                    const link = document.createElement("a")
                                    link.href = invoice.invoice_url
                                    link.download = `invoice-${invoice.sales_id}.pdf`
                                    link.click()
                                  }}
                                  onSendWhatsApp={() =>
                                    handleSendWhatsApp(invoice.sales_id, "invoice", invoice.mobile_number)
                                  }
                                  onPay={() => handleCompletePayment(invoice)}
                                  onCancel={() => handleCancelInvoice(invoice.sales_id)}
                                  size="sm"
                                />
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
                                            <td className="p-2 font-mono text-muted-foreground">
                                              {lineItem.item_code}
                                            </td>
                                            <td className="p-2 text-foreground">{lineItem.item_name}</td>
                                            <td className="p-2 text-right text-foreground">{lineItem.quantity}</td>
                                            <td className="p-2 text-right text-muted-foreground">
                                              {currency} {lineItem.rate.toFixed(2)}
                                            </td>
                                            <td className="p-2 text-right font-semibold text-foreground">
                                              {currency} {lineItem.amount.toFixed(2)}
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
    </DashboardLayout>
  )
}
