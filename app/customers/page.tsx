"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, ArrowUpDown, ChevronLeft, ChevronRight, DollarSign, FileText, CreditCard, List } from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { TableActionButtons } from "@/components/ui/table-action-buttons"
import { useCurrency } from "@/hooks/use-currency"
import { EnhancedPagination } from "@/components/reports/enhanced-pagination"

interface Customer {
  customer_id: string
  customer_name: string
  customer_group: string | null
  mobile_number: string
  paid_invoices: {
    count: number
    total: number
  }
  unpaid_invoices: {
    count: number
    total: number
  }
  advance_payments: {
    count: number
    total: number
  }
  total_sales: number
}

type SortField = keyof Pick<Customer, "customer_name" | "total_sales" | "mobile_number">
type SortOrder = "asc" | "desc"

export default function CustomersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { formatCurrency } = useCurrency()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("customer_name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [showForm, setShowForm] = useState(false)
  const [groups, setGroups] = useState<string[]>([])
  const [formData, setFormData] = useState({
    customer_name: "",
    mobile_number: "",
    customer_group: "Individual",
    sales_person: "Sales Team",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [showAdvancePayment, setShowAdvancePayment] = useState(false)
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null)
  const [advancePaymentData, setAdvancePaymentData] = useState({
    mode_of_payment: "Cash",
    amount_paid: "",
    reference_no: "",
    reference_date: "",
  })
  const [paymentModes, setPaymentModes] = useState<Array<{ mode_of_payment: string }>>([])
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [showAdvanceRefs, setShowAdvanceRefs] = useState(false)
  const [advanceRefs, setAdvanceRefs] = useState<any[]>([])
  const [advanceRefsLoading, setAdvanceRefsLoading] = useState(false)
  const [advanceRefsSearch, setAdvanceRefsSearch] = useState("")
  const [advanceRefsMode, setAdvanceRefsMode] = useState("")
  const [advanceRefsDateFrom, setAdvanceRefsDateFrom] = useState("")
  const [advanceRefsDateTo, setAdvanceRefsDateTo] = useState("")
  const [showAdvanceOnly, setShowAdvanceOnly] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    fetchCustomers()
    fetchGroups()
    fetchPaymentModes()
  }, [])

  const fetchPaymentModes = async () => {
    try {
      const res = await fetch("/api/payments/modes")
      const data = await res.json()
      setPaymentModes(data.modes || [])
      if (data.modes && data.modes.length > 0) {
        setAdvancePaymentData({ ...advancePaymentData, mode_of_payment: data.modes[0].mode_of_payment || "Cash" })
      }
    } catch (error) {
      console.error("[DukaPlus] Error fetching payment modes:", error)
      setPaymentModes([{ mode_of_payment: "Cash" }, { mode_of_payment: "Mpesa" }])
    }
  }

  const fetchCustomers = async () => {
    try {
      setPageLoading(true)
      const res = await fetch("/api/customers/list")
      const data = await res.json()
      setCustomers(data.customers || [])
    } catch (error) {
      console.error("[DukaPlus] Error fetching customers:", error)
    } finally {
      setPageLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/customers/groups")
      const data = await res.json()
      console.log("[DukaPlus] Customer groups data:", data)
      const groupsArray = data.message?.customer_groups || data.groups || []
      const parsedGroups = groupsArray
        .map((g: any) => (typeof g === "string" ? g : g?.customer_group))
        .filter((g: any) => g && typeof g === "string")
      console.log("[DukaPlus] Parsed groups:", parsedGroups)
      setGroups(parsedGroups.length > 0 ? parsedGroups : ["Individual", "Corporate", "Government"])
    } catch (error) {
      console.error("[DukaPlus] Error fetching groups:", error)
      setGroups(["Individual", "Corporate", "Government"])
    }
  }

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const endpoint = editingCustomer ? "/api/customers/update" : "/api/customers/create"
      const method = "POST"

      const payload = editingCustomer ? { customer_id: editingCustomer.customer_id, ...formData } : formData

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setFormData({
          customer_name: "",
          mobile_number: "",
          customer_group: groups[0] || "Individual",
          sales_person: "Sales Team",
        })
        setShowForm(false)
        setEditingCustomer(null)
        fetchCustomers()
      }
    } catch (error) {
      console.error("[DukaPlus] Error saving customer:", error)
    }
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      customer_name: customer.customer_name,
      mobile_number: customer.mobile_number,
      customer_group: customer.customer_group || groups[0] || "Individual",
      sales_person: "Sales Team",
    })
    setShowForm(true)
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSortField("customer_name")
    setSortOrder("asc")
    setCurrentPage(1)
  }

  const handleAdvancePayment = (customer: Customer) => {
    setSelectedCustomerForPayment(customer)
    setAdvancePaymentData({
      mode_of_payment: paymentModes[0]?.mode_of_payment || "Cash",
      amount_paid: "",
      reference_no: "",
      reference_date: "",
    })
    setShowAdvancePayment(true)
  }

  const handleViewAdvanceRefs = async (customer: Customer) => {
    setSelectedCustomerForPayment(customer)
    setShowAdvanceRefs(true)
    setAdvanceRefs([])
    setAdvanceRefsLoading(true)
    try {
      const res = await fetch(`/api/customers/advance-payment-entries?customer_id=${encodeURIComponent(customer.customer_id)}`)
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || "Failed to fetch advance payment references")
        setAdvanceRefsLoading(false)
        return
      }

      const entries = (data.message?.data || []).filter(
        (entry: any) =>
          entry.customer_id === customer.customer_id ||
          entry.customer_name === customer.customer_name,
      )
      setAdvanceRefs(entries)
    } catch (error) {
      console.error("[DukaPlus] Error fetching advance payment entries:", error)
      alert("Failed to fetch advance payment references")
    } finally {
      setAdvanceRefsLoading(false)
    }
  }

  const handleSubmitAdvancePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomerForPayment) return

    setIsSubmittingPayment(true)
    try {
      const res = await fetch("/api/customers/advance-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomerForPayment.customer_id,
          mode_of_payment: advancePaymentData.mode_of_payment,
          amount_paid: parseFloat(advancePaymentData.amount_paid),
          reference_no: advancePaymentData.reference_no || "",
          reference_date: advancePaymentData.reference_date,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setShowAdvancePayment(false)
        setSelectedCustomerForPayment(null)
        setAdvancePaymentData({ mode_of_payment: "Cash", amount_paid: "", reference_no: "", reference_date: "" })
        fetchCustomers() // Refresh the customer list
        alert(data.message?.message || "Advance payment posted successfully")
      } else {
        alert(data.error || "Failed to post advance payment")
      }
    } catch (error) {
      console.error("[DukaPlus] Error posting advance payment:", error)
      alert("Failed to post advance payment")
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  const handleGeneratePDF = async (customer: Customer) => {
    try {
      const res = await fetch(`/api/reports/unpaid-customer-statement?customer_id=${encodeURIComponent(customer.customer_id)}`)
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || "Failed to fetch customer statement")
        return
      }

      const statementData = data.message?.data || []
      const logo = data.message?.logo || ""

      // Generate PDF
      generateCustomerStatementPDF(customer, statementData, logo)
    } catch (error) {
      console.error("[DukaPlus] Error generating PDF:", error)
      alert("Failed to generate PDF")
    }
  }

  const generateCustomerStatementPDF = (customer: Customer, statementData: any[], logo: string) => {
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Customer Statement - ${customer.customer_name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { max-width: 150px; margin-bottom: 10px; }
            .customer-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total-row { font-weight: bold; }
            .text-right { text-align: right; }
            .items-table { margin-top: 10px; }
            .items-table th { background-color: #e8e8e8; }
          </style>
        </head>
        <body>
          <div class="header">
            ${logo ? `<img src="${logo}" alt="Logo" class="logo" />` : ""}
            <h1>Customer Statement</h1>
          </div>
          <div class="customer-info">
            <p><strong>Customer:</strong> ${customer.customer_name}</p>
            <p><strong>Customer ID:</strong> ${customer.customer_id}</p>
            <p><strong>Mobile:</strong> ${customer.mobile_number || "N/A"}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Grand Total</th>
                <th>Outstanding</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${statementData.map((item) => `
                <tr>
                  <td>${item.invoice_id || ""}</td>
                  <td>${item.date || ""}</td>
                  <td>${item.due_date || ""}</td>
                  <td class="text-right">${formatCurrency(item.grand_total || 0)}</td>
                  <td class="text-right">${formatCurrency(item.outstanding_amount || 0)}</td>
                  <td>${item.status || ""}</td>
                </tr>
                ${item.items && item.items.length > 0 ? `
                  <tr>
                    <td colspan="6">
                      <table class="items-table">
                        <thead>
                          <tr>
                            <th>Item Code</th>
                            <th>Item Name</th>
                            <th class="text-right">Qty</th>
                            <th class="text-right">Rate</th>
                            <th class="text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${item.items.map((itemRow: any) => `
                            <tr>
                              <td>${itemRow.item_code || ""}</td>
                              <td>${itemRow.item_name || ""}</td>
                              <td class="text-right">${itemRow.qty || 0}</td>
                              <td class="text-right">${formatCurrency(itemRow.rate || 0)}</td>
                              <td class="text-right">${formatCurrency(itemRow.amount || 0)}</td>
                            </tr>
                          `).join("")}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ` : ""}
              `).join("")}
            </tbody>
          </table>
          <div style="margin-top: 20px;">
            <p><strong>Total Outstanding:</strong> ${formatCurrency(statementData.reduce((sum, item) => sum + (item.outstanding_amount || 0), 0))}</p>
          </div>
        </body>
      </html>
    `

    // Open in new tab and print
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const filteredAndSorted = customers
    .filter(
      (c) =>
        ((c.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
          (c.mobile_number?.includes(searchQuery) ?? false)) &&
        (!showAdvanceOnly || (c.advance_payments?.total || 0) > 0),
    )
    .sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      const comparison = typeof aVal === "string" ? aVal.localeCompare(String(bVal)) : (aVal as number) - (bVal as number)
      return sortOrder === "asc" ? comparison : -comparison
    })

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredAndSorted.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  if (isLoading || !user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="page-title">Customers</h1>
            <p className="page-subtitle">Manage customer information and sales history</p>
          </div>
          <Button
            onClick={() => {
              setEditingCustomer(null)
              setFormData({
                customer_name: "",
                mobile_number: "",
                customer_group: groups[0] || "Individual",
                sales_person: "Sales Team",
              })
              setShowForm(true)
            }}
            className="btn-create w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="dialog-content sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="dialog-title">
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="form-label">Customer Name *</label>
                  <Input
                    placeholder="Enter customer name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="input-base"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Mobile Number</label>
                  <Input
                    placeholder="Enter phone number"
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="form-label">Customer Group</label>
                  <select
                    value={formData.customer_group}
                    onChange={(e) => setFormData({ ...formData, customer_group: e.target.value })}
                    className="w-full input-base"
                  >
                    {groups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Sales Person</label>
                  <Input
                    placeholder="Sales person name"
                    value={formData.sales_person}
                    onChange={(e) => setFormData({ ...formData, sales_person: e.target.value })}
                    className="input-base"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 flex-col sm:flex-row">
                <Button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingCustomer(null)
                  }}
                  className="btn-cancel w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" className="btn-success w-full sm:w-auto">
                  {editingCustomer ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showAdvancePayment} onOpenChange={setShowAdvancePayment}>
          <DialogContent className="dialog-content sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="dialog-title">Post Advance Payment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitAdvancePayment} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="form-label">Customer</label>
                  <Input
                    value={selectedCustomerForPayment?.customer_name || ""}
                    disabled
                    className="input-base bg-gray-50 dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="form-label">Mode of Payment *</label>
                  <select
                    value={advancePaymentData.mode_of_payment}
                    onChange={(e) => setAdvancePaymentData({ ...advancePaymentData, mode_of_payment: e.target.value })}
                    className="w-full input-base"
                    required
                  >
                    {paymentModes.length > 0 ? (
                      paymentModes.map((mode) => (
                        <option key={mode.mode_of_payment} value={mode.mode_of_payment}>
                          {mode.mode_of_payment}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Cash">Cash</option>
                        <option value="Mpesa">M-Pesa</option>
                        <option value="Card">Card</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="form-label">Amount Paid *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter amount"
                    value={advancePaymentData.amount_paid}
                    onChange={(e) => setAdvancePaymentData({ ...advancePaymentData, amount_paid: e.target.value })}
                    className="input-base"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Reference No</label>
                  <Input
                    type="text"
                    placeholder="Enter reference number"
                    value={advancePaymentData.reference_no || ""}
                    onChange={(e) => setAdvancePaymentData({ ...advancePaymentData, reference_no: e.target.value })}
                    className="input-base"
                  />
                </div>

                <div>
                  <label className="form-label">Reference Date</label>
                  <Input
                    type="date"
                    value={advancePaymentData.reference_date || ""}
                    onChange={(e) => setAdvancePaymentData({ ...advancePaymentData, reference_date: e.target.value })}
                    className="input-base"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 flex-col sm:flex-row">
                <Button
                  type="button"
                  onClick={() => {
                    setShowAdvancePayment(false)
                    setSelectedCustomerForPayment(null)
                  }}
                  className="btn-cancel w-full sm:w-auto"
                  disabled={isSubmittingPayment}
                >
                  Cancel
                </Button>
                <Button type="submit" className="btn-success w-full sm:w-auto" disabled={isSubmittingPayment}>
                  {isSubmittingPayment ? "Submitting..." : "Post Payment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showAdvanceRefs} onOpenChange={setShowAdvanceRefs}>
          <DialogContent className="dialog-content sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="dialog-title">Advance Payment References</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Customer: {selectedCustomerForPayment?.customer_name || "-"}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <Input
                      placeholder="Search references (ref id, mode, ref no)..."
                      value={advanceRefsSearch}
                      onChange={(e) => setAdvanceRefsSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={advanceRefsMode}
                    onChange={(e) => setAdvanceRefsMode(e.target.value)}
                    className="input-base w-full sm:w-40"
                  >
                    <option value="">All Modes</option>
                    {Array.from(new Set(advanceRefs.map((ref) => ref.mode_of_payment))).map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Input
                      type="date"
                      value={advanceRefsDateFrom}
                      onChange={(e) => setAdvanceRefsDateFrom(e.target.value)}
                      className="input-base"
                      title="From date"
                    />
                    <Input
                      type="date"
                      value={advanceRefsDateTo}
                      onChange={(e) => setAdvanceRefsDateTo(e.target.value)}
                      className="input-base"
                      title="To date"
                    />
                  </div>
                </div>
              </div>
              {advanceRefsLoading ? (
                <div className="p-4 text-center text-foreground">Loading...</div>
              ) : advanceRefs.length === 0 ? (
                <div className="p-4 text-center text-foreground">No advance payments found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="reports-table text-xs sm:text-sm">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Ref ID</th>
                        <th className="table-header-cell">Date</th>
                        <th className="table-header-cell">Mode</th>
                        <th className="table-header-cell text-right">Paid Amount</th>
                        <th className="table-header-cell">Ref No</th>
                        <th className="table-header-cell">Ref Date</th>
                        <th className="table-header-cell text-right">Unallocated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advanceRefs
                        .filter((ref) => {
                          const term = advanceRefsSearch.toLowerCase()
                          const matchesSearch =
                            term === "" ||
                            (ref.name || "").toLowerCase().includes(term) ||
                            (ref.mode_of_payment || "").toLowerCase().includes(term) ||
                            (ref.reference_no || "").toLowerCase().includes(term)

                          const matchesMode = !advanceRefsMode || ref.mode_of_payment === advanceRefsMode

                          const from = advanceRefsDateFrom ? new Date(advanceRefsDateFrom) : null
                          const to = advanceRefsDateTo ? new Date(advanceRefsDateTo) : null
                          const refDate = ref.posting_date ? new Date(ref.posting_date) : null

                          const matchesDate =
                            !from && !to
                              ? true
                              : refDate
                                ? (!from || refDate >= from) && (!to || refDate <= to)
                                : false

                          return matchesSearch && matchesMode && matchesDate
                        })
                        .map((ref) => (
                          <tr key={ref.name} className="table-row">
                            <td className="table-cell font-medium">{ref.name}</td>
                            <td className="table-cell-secondary">{ref.posting_date}</td>
                            <td className="table-cell-secondary">{ref.mode_of_payment}</td>
                            <td className="table-cell-secondary text-right text-blue-600 dark:text-blue-400 font-semibold">
                              {formatCurrency(ref.paid_amount || 0)}
                            </td>
                            <td className="table-cell-secondary">{ref.reference_no || "-"}</td>
                            <td className="table-cell-secondary">{ref.reference_date || "-"}</td>
                            <td className="table-cell-secondary text-right text-orange-600 dark:text-orange-400 font-semibold">
                              {formatCurrency(ref.unallocated_amount || 0)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-secondary" />
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-10"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-foreground whitespace-nowrap">
            <input
              type="checkbox"
              checked={showAdvanceOnly}
              onChange={(e) => setShowAdvanceOnly(e.target.checked)}
              className="h-4 w-4"
            />
            Filter Advance
          </label>
          {(searchQuery || showAdvanceOnly) && (
            <Button onClick={clearFilters} variant="outline" size="sm">
              Clear Filters
            </Button>
          )}
        </div>

        <Card className="card-base table-card overflow-hidden">
          {pageLoading ? (
            <div className="p-6 text-foreground text-center">Loading customers...</div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="p-6 text-foreground text-center">No customers found</div>
          ) : (
            <>
              <div className="overflow-x-auto text-xs sm:text-sm">
                <table className="reports-table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">
                        <button
                          onClick={() => toggleSort("customer_name")}
                          className="flex items-center gap-2 hover:text-foreground"
                        >
                          Customer Name
                          {sortField === "customer_name" && (
                            <ArrowUpDown
                              className="w-4 h-4"
                              style={{ transform: sortOrder === "desc" ? "scaleY(-1)" : "" }}
                            />
                          )}
                        </button>
                      </th>
                      <th className="table-header-cell">Phone</th>
                      <th className="table-header-cell">Group</th>
                      <th className="table-header-cell text-right">
                        <button
                          onClick={() => toggleSort("total_sales")}
                          className="flex items-center gap-2 hover:text-foreground ml-auto"
                        >
                          Total Sales
                          {sortField === "total_sales" && (
                            <ArrowUpDown
                              className="w-4 h-4"
                              style={{ transform: sortOrder === "desc" ? "scaleY(-1)" : "" }}
                            />
                          )}
                        </button>
                      </th>
                      <th className="table-header-cell text-right">Paid Total</th>
                      <th className="table-header-cell text-right">Unpaid Total</th>
                      <th className="table-header-cell text-right">Advance Payments</th>
                      <th className="table-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((customer) => (
                      <tr key={customer.customer_id} className="table-row">
                        <td className="table-cell font-medium">{customer.customer_name}</td>
                        <td className="table-cell-secondary">{customer.mobile_number}</td>
                        <td className="table-cell-secondary">{customer.customer_group || "-"}</td>
                        <td className="px-4 py-3 text-right text-orange-600 dark:text-orange-400 font-semibold">
                          {formatCurrency(customer.total_sales)}
                        </td>
                        <td className="table-cell-secondary text-right text-green-600 dark:text-green-400 font-semibold">
                          {formatCurrency(customer.paid_invoices?.total || 0)}
                        </td>
                        <td className="table-cell-secondary text-right text-red-600 dark:text-red-400 font-semibold">
                          {formatCurrency(customer.unpaid_invoices?.total || 0)}
                        </td>
                        <td className="table-cell-secondary text-right text-blue-600 dark:text-blue-400 font-semibold">
                          {formatCurrency(customer.advance_payments?.total || 0)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <TableActionButtons showEdit={true} onEdit={() => handleEditCustomer(customer)} size="sm" />
                            <Button
                              onClick={() => handleAdvancePayment(customer)}
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              title="Post Advance Payment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleViewAdvanceRefs(customer)}
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              title="View Advance Payment References"
                            >
                              <List className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleGeneratePDF(customer)}
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              title="Generate Statement PDF"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <EnhancedPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    totalRecords={filteredAndSorted.length}
                  />
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
