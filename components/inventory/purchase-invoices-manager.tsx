"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Plus, ChevronDown, ChevronUp, FileText, DollarSign, Trash2 } from 'lucide-react'
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { TableActionButtons } from "@/components/ui/table-action-buttons"
import { DateRangeFilter } from "@/components/reports/date-range-filter"

interface PurchaseInvoice {
  name: string
  supplier: string
  status: string
  posting_date: string
  docstatus: number
  items: {
    item_code: string
    item_name: string
    qty: number
    rate: number
    amount: number
    warehouse: string
  }[]
}

interface PurchaseOrder {
  order_id: string
  supplier: string
  status: string
  grand_total: number
}

interface PaymentMode {
  mode_of_payment: string
}

interface Payment {
  id: number
  mode: string
  amount: string
}

export function PurchaseInvoicesManager() {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set())
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "submitted" | "paid" | "unpaid">("all")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    action: () => void
    variant: "danger" | "success"
  }>({
    open: false,
    title: "",
    description: "",
    action: () => {},
    variant: "success"
  })

  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([])
  const [payments, setPayments] = useState<Payment[]>([{ id: 1, mode: "Cash", amount: "" }])

  useEffect(() => {
    fetchInvoices()
    fetchOrders()
    fetchPaymentModes()
  }, [])

  const fetchInvoices = async () => {
    try {
      setIsLoading(true)
      const warehouseId = sessionStorage.getItem("selected_warehouse") || ""
      const response = await fetch(`/api/purchase-invoices?warehouse_id=${encodeURIComponent(warehouseId)}`)
      const data = await response.json()

      if (response.ok && data.message?.data) {
        setInvoices(data.message.data)
      } else {
        setMessage({ type: "error", text: data.message || "Failed to fetch purchase invoices" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error fetching purchase invoices" })
      console.error("[DukaPlus] Error fetching purchase invoices:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const warehouseId = sessionStorage.getItem("selected_warehouse") || ""
      if (!warehouseId) return

      const response = await fetch(`/api/purchase-orders?warehouse_id=${encodeURIComponent(warehouseId)}`)
      const data = await response.json()

      if (response.ok && data.message?.purchase_orders) {
        // Show orders that can be invoiced (not Draft, not Cancelled)
        const ordersToInvoice = data.message.purchase_orders.filter(
          (order: PurchaseOrder) => 
            order.status !== "Draft" && 
            order.status !== "Cancelled"
        )
        setOrders(ordersToInvoice)
      }
    } catch (error) {
      console.error("[DukaPlus] Error fetching purchase orders:", error)
    }
  }

  const fetchPaymentModes = async () => {
    try {
      const response = await fetch("/api/payments/modes")
      if (response.ok) {
        const data = await response.json()
        const modes = data.message?.modes_of_payments || data.modes || data.message?.mode_of_payments || []
        const modesList = Array.isArray(modes) ? modes : []
        setPaymentModes(modesList)
        
        // Set default payment mode to first in list
        if (modesList.length > 0) {
          setPayments([{ id: 1, mode: modesList[0].mode_of_payment, amount: "" }])
        }
      }
    } catch (error) {
      console.error("[DukaPlus] Failed to fetch payment modes:", error)
      // Fallback to hardcoded modes if API fails
      setPaymentModes([
        { mode_of_payment: "Cash" },
        { mode_of_payment: "Mpesa" },
      ])
    }
  }

  const handleCreateInvoice = async () => {
    if (!selectedOrderId) {
      setMessage({ type: "error", text: "Please select a purchase order" })
      return
    }

    setConfirmDialog({
      open: true,
      title: "Create Purchase Invoice?",
      description: `Create invoice for order ${selectedOrderId}?`,
      action: async () => {
        setIsSubmitting(true)
        setMessage(null)

        try {
          const response = await fetch("/api/purchase-invoices/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: selectedOrderId,
              purchase_invoice_id: "",
              items: [],
            }),
          })

          const data = await response.json()

          if (response.ok) {
            setMessage({ 
              type: "success", 
              text: data.message?.message || "Purchase invoice created successfully" 
            })
            setShowCreateForm(false)
            setSelectedOrderId("")
            fetchInvoices()
            fetchOrders()
          } else {
            setMessage({ type: "error", text: data.message?.message || "Failed to create purchase invoice" })
          }
        } catch (error) {
          setMessage({ type: "error", text: "Error creating purchase invoice" })
          console.error("[DukaPlus] Error creating purchase invoice:", error)
        } finally {
          setIsSubmitting(false)
        }
      },
      variant: "success",
    })
  }

  const handleSubmitInvoice = async (invoiceId: string) => {
    setConfirmDialog({
      open: true,
      title: "Submit Purchase Invoice?",
      description: `Submit invoice ${invoiceId}? This action cannot be undone.`,
      action: async () => {
        try {
          const response = await fetch("/api/purchase-invoices/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ purchase_invoice_id: invoiceId }),
          })

          const data = await response.json()

          if (response.ok) {
            setMessage({ type: "success", text: "Purchase invoice submitted successfully" })
            fetchInvoices()
          } else {
            setMessage({ type: "error", text: data.message?.message || "Failed to submit purchase invoice" })
          }
        } catch (error) {
          setMessage({ type: "error", text: "Error submitting purchase invoice" })
          console.error("[DukaPlus] Error submitting purchase invoice:", error)
        }
      },
      variant: "success",
    })
  }

  const handleCancelOrDeleteInvoice = async (invoiceId: string, docstatus: number) => {
    const isDraft = docstatus === 0
    
    setConfirmDialog({
      open: true,
      title: isDraft ? "Delete Purchase Invoice?" : "Cancel Purchase Invoice?",
      description: isDraft 
        ? `Delete draft invoice ${invoiceId}? This action cannot be undone.`
        : `Cancel invoice ${invoiceId}? This action cannot be undone.`,
      action: async () => {
        try {
          const response = await fetch("/api/purchase-invoices/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ purchase_invoice_id: invoiceId }),
          })

          const data = await response.json()

          if (response.ok) {
            setMessage({ type: "success", text: `Purchase invoice ${isDraft ? 'deleted' : 'cancelled'} successfully` })
            fetchInvoices()
          } else {
            setMessage({ type: "error", text: data.message?.message || `Failed to ${isDraft ? 'delete' : 'cancel'} purchase invoice` })
          }
        } catch (error) {
          setMessage({ type: "error", text: `Error ${isDraft ? 'deleting' : 'canceling'} purchase invoice` })
          console.error("[DukaPlus] Error:", error)
        }
      },
      variant: "danger",
    })
  }

  const handlePaymentSubmit = async () => {
    if (!selectedInvoice) return

    // Calculate total and validate payments
    const validPayments = payments.filter(p => parseFloat(p.amount) > 0)
    
    if (validPayments.length === 0) {
      setMessage({ type: "error", text: "Please enter at least one payment amount" })
      return
    }

    const totalPayment = validPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)

    setConfirmDialog({
      open: true,
      title: "Record Payment?",
      description: `Record payment of KES ${totalPayment.toFixed(2)} for invoice ${selectedInvoice}?`,
      action: async () => {
        try {
          // Format payments according to API spec
          const formattedPayments = validPayments.map(p => ({
            mode_of_payment: p.mode,
            amount: parseFloat(p.amount)
          }))

          const response = await fetch("/api/purchase-invoices/payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              purchase_invoice_id: selectedInvoice,
              payments: formattedPayments,
            }),
          })

          const data = await response.json()

          if (response.ok) {
            setMessage({ type: "success", text: "Payment recorded successfully" })
            setShowPaymentModal(false)
            setSelectedInvoice(null)
            setPayments([{ id: 1, mode: paymentModes[0]?.mode_of_payment || "Cash", amount: "" }])
            fetchInvoices()
          } else {
            setMessage({ type: "error", text: data.message || "Failed to record payment" })
          }
        } catch (error) {
          setMessage({ type: "error", text: "Error recording payment" })
          console.error("[DukaPlus] Error recording payment:", error)
        }
      },
      variant: "success",
    })
  }

  const addPayment = () => {
    const newId = Math.max(...payments.map(p => p.id), 0) + 1
    setPayments([
      ...payments,
      { id: newId, mode: paymentModes[0]?.mode_of_payment || "Cash", amount: "" }
    ])
  }

  const removePayment = (id: number) => {
    if (payments.length > 1) {
      setPayments(payments.filter(p => p.id !== id))
    }
  }

  const updatePayment = (id: number, field: 'mode' | 'amount', value: string) => {
    setPayments(payments.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  const getTotalPayment = () => {
    return payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft":
        return <span className="badge-warning">Draft</span>
      case "unpaid":
        return <span className="badge-danger">Unpaid</span>
      case "paid":
        return <span className="badge-success">Paid</span>
      case "partially paid":
        return <span className="badge-warning">Partially Paid</span>
      default:
        return <span className="badge-secondary">{status}</span>
    }
  }

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplier.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      invoice.status.toLowerCase().replace(" ", "_") === statusFilter

    const invoiceDate = new Date(invoice.posting_date)
    const matchesDateRange = invoiceDate >= dateRange.from && invoiceDate <= dateRange.to

    return matchesSearch && matchesStatus && matchesDateRange
  })

  const toggleInvoiceExpansion = (invoiceId: string) => {
    setExpandedInvoices(prev => {
      const newSet = new Set(prev)
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId)
      } else {
        newSet.add(invoiceId)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-6">
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.action}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.title.includes("Delete") ? "Delete" : confirmDialog.title.includes("Cancel") ? "Cancel Invoice" : "Confirm"}
      />

      {message && (
        <div
          className={
            message.type === "success" ? "alert-success flex items-start gap-2" : "alert-error flex items-start gap-2"
          }
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
          )}
          <p className={message.type === "success" ? "text-success text-sm" : "text-danger text-sm"}>{message.text}</p>
        </div>
      )}

      <div className="card-base p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Purchase Invoices
          </h2>
          <Button 
            onClick={() => {
              setShowCreateForm(!showCreateForm)
              setSelectedOrderId("")
            }} 
            className="btn-create"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showCreateForm ? "Cancel" : "New Invoice"}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-base flex-1 px-3 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input-base px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="partially_paid">Partially Paid</option>
          </select>
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
        </div>

        {showCreateForm && (
          <div className="mb-6 p-4 border border-border rounded-lg bg-muted/50">
            <h3 className="text-lg font-semibold text-foreground mb-4">Create Purchase Invoice</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Purchase Order *</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full input-base"
                >
                  <option value="">Select purchase order</option>
                  {orders.map((order) => (
                    <option key={order.order_id} value={order.order_id}>
                      {order.order_id} - {order.supplier} (KES {order.grand_total.toFixed(2)}) - {order.status}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a purchase order to create an invoice
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateInvoice} 
                  disabled={isSubmitting || !selectedOrderId} 
                  className="btn-create flex-1"
                >
                  {isSubmitting ? "Creating..." : "Create Invoice"}
                </Button>
                <Button 
                  onClick={() => {
                    setShowCreateForm(false)
                    setSelectedOrderId("")
                  }} 
                  disabled={isSubmitting} 
                  className="btn-cancel flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-foreground p-6 text-center">Loading purchase invoices...</p>
        ) : filteredInvoices.length === 0 ? (
          <p className="text-foreground text-center py-8">
            {searchTerm || statusFilter !== "all" ? "No invoices match your filters" : "No purchase invoices found"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell w-10"></th>
                  <th className="table-header-cell text-left">Invoice ID</th>
                  <th className="table-header-cell text-left">Supplier</th>
                  <th className="table-header-cell text-left">Date</th>
                  <th className="table-header-cell text-left">Status</th>
                  <th className="table-header-cell text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInvoices.map((invoice) => {
                  const isExpanded = expandedInvoices.has(invoice.name)
                  const isDraft = invoice.docstatus === 0
                  const isUnpaid = invoice.status.toLowerCase() === "unpaid"
                  
                  return (
                    <>
                      <tr key={invoice.name} className="table-row">
                        <td className="px-2 sm:px-4 py-3">
                          {invoice.items && invoice.items.length > 0 && (
                            <button
                              onClick={() => toggleInvoiceExpansion(invoice.name)}
                              className="p-1 hover:bg-muted rounded transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-foreground" />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="table-cell font-mono text-warning text-sm">{invoice.name}</td>
                        <td className="table-cell">{invoice.supplier}</td>
                        <td className="table-cell">{invoice.posting_date}</td>
                        <td className="table-cell">{getStatusBadge(invoice.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {isDraft && (
                              <TableActionButtons
                                showSubmit={true}
                                showCancel={true}
                                onSubmit={() => handleSubmitInvoice(invoice.name)}
                                onCancel={() => handleCancelOrDeleteInvoice(invoice.name, invoice.docstatus)}
                                docstatus={invoice.docstatus}
                                status={invoice.status}
                              />
                            )}
                            {isUnpaid && (
                              <>
                                <Button
                                  onClick={() => {
                                    setSelectedInvoice(invoice.name)
                                    setShowPaymentModal(true)
                                  }}
                                  size="sm"
                                  className="btn-success"
                                >
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  Pay
                                </Button>
                                <TableActionButtons
                                  showCancel={true}
                                  onCancel={() => handleCancelOrDeleteInvoice(invoice.name, invoice.docstatus)}
                                  docstatus={invoice.docstatus}
                                  status={invoice.status}
                                />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && invoice.items && invoice.items.length > 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-2 bg-muted/30">
                            <div className="p-4">
                              <h4 className="font-semibold text-sm mb-2 text-foreground">Items:</h4>
                              <table className="w-full text-xs">
                                <thead className="bg-muted">
                                  <tr>
                                    <th className="table-header-cell text-left">Item Code</th>
                                    <th className="table-header-cell text-left">Item Name</th>
                                    <th className="table-header-cell text-right">Quantity</th>
                                    <th className="table-header-cell text-right">Rate</th>
                                    <th className="table-header-cell text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {invoice.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-border">
                                      <td className="p-2 font-mono text-foreground">{item.item_code}</td>
                                      <td className="p-2 text-foreground">{item.item_name}</td>
                                      <td className="p-2 text-right text-foreground">{item.qty}</td>
                                      <td className="p-2 text-right text-foreground">
                                        KES {item.rate.toFixed(2)}
                                      </td>
                                      <td className="p-2 text-right font-semibold text-foreground">
                                        KES {item.amount.toFixed(2)}
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
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-border flex-shrink-0">
              <h2 className="text-xl font-bold text-foreground">Record Payment</h2>
              <p className="text-sm text-muted-foreground mt-1">Invoice: {selectedInvoice}</p>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground">Payment Methods</label>
                <Button 
                  type="button" 
                  onClick={addPayment} 
                  size="sm" 
                  className="btn-success text-xs h-8 px-3"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>

              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="p-3 border border-border rounded-lg space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="form-label text-xs">Payment Mode</label>
                        <select
                          value={payment.mode}
                          onChange={(e) => updatePayment(payment.id, 'mode', e.target.value)}
                          className="input-base w-full text-sm"
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
                            </>
                          )}
                        </select>
                      </div>
                      {payments.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removePayment(payment.id)}
                          size="sm"
                          variant="ghost"
                          className="action-btn-delete h-8 w-8 p-0 self-end"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div>
                      <label className="form-label text-xs">Amount (KES)</label>
                      <input
                        type="number"
                        value={payment.amount}
                        onChange={(e) => updatePayment(payment.id, 'amount', e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="input-base w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-semibold text-foreground">
                  Total Payment: KES {getTotalPayment().toFixed(2)}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-2 flex-shrink-0">
              <Button 
                onClick={() => {
                  setShowPaymentModal(false)
                  setSelectedInvoice(null)
                  setPayments([{ id: 1, mode: paymentModes[0]?.mode_of_payment || "Cash", amount: "" }])
                }} 
                className="btn-cancel flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePaymentSubmit} 
                className="btn-success flex-1"
                disabled={getTotalPayment() <= 0}
              >
                Record Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
