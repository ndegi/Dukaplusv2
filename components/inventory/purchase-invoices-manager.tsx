"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle,
  Plus,
  ChevronDown,
  ChevronUp,
  FileText,
  Trash2,
} from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { TableActionButtons } from "@/components/ui/table-action-buttons";
import { DateRangeFilter } from "@/components/reports/date-range-filter";
import { EnhancedPagination } from "@/components/reports/enhanced-pagination";
import { useCurrency } from "@/lib/contexts/currency-context";

interface PurchaseInvoice {
  name: string;
  supplier: string;
  status: string;
  posting_date: string;
  docstatus: number;
  outstanding_amount: number;
  total_amount: any;
  items: {
    item_code: string;
    item_name: string;
    qty: number;
    rate: number;
    amount: number;
    warehouse: string;
  }[];
  purchase_order?: string;
  order_id?: string;
}

interface PurchaseOrder {
  order_id: string;
  supplier: string;
  status: string;
  grand_total: number;
}

interface PaymentMode {
  mode_of_payment: string;
}

interface Payment {
  id: number;
  mode: string;
  amount: string;
}

export function PurchaseInvoicesManager() {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPaymentView, setShowPaymentView] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(
    new Set()
  );
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "submitted" | "paid" | "unpaid" | "Overdue"
  >("all");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant: "danger" | "success";
  }>({
    open: false,
    title: "",
    description: "",
    action: () => {},
    variant: "success",
  });

  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [payments, setPayments] = useState<Payment[]>([
    { id: 1, mode: "Cash", amount: "" },
  ]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(
    null
  );

  const { currency } = useCurrency();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchInvoices();
    fetchOrders();
    fetchPaymentModes();
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const warehouseId = sessionStorage.getItem("selected_warehouse") || "";
      const response = await fetch(
        `/api/purchase-invoices?warehouse_id=${encodeURIComponent(warehouseId)}`
      );
      const data = await response.json();

      if (response.ok && data.message?.data) {
        setInvoices(data.message.data);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to fetch purchase invoices",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error fetching purchase invoices" });
      console.error("[DukaPlus] Error fetching purchase invoices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const warehouseId = sessionStorage.getItem("selected_warehouse") || "";
      if (!warehouseId) return;

      const response = await fetch(
        `/api/purchase-orders?warehouse_id=${encodeURIComponent(warehouseId)}`
      );
      const data = await response.json();

      if (response.ok && data.message?.purchase_orders) {
        const ordersToInvoice = data.message.purchase_orders.filter(
          (order: PurchaseOrder) =>
            order.status !== "Draft" && order.status !== "Cancelled"
        );
        setOrders(ordersToInvoice);
      }
    } catch (error) {
      console.error("[DukaPlus] Error fetching purchase orders:", error);
    }
  };

  const fetchPaymentModes = async () => {
    try {
      const response = await fetch("/api/payments/modes");
      if (response.ok) {
        const data = await response.json();
        const modes =
          data.message?.modes_of_payments ||
          data.modes ||
          data.message?.mode_of_payments ||
          [];
        const modesList = Array.isArray(modes) ? modes : [];
        setPaymentModes(modesList);
        // Set default payment mode to first in list
        if (modesList.length > 0) {
          setPayments([
            { id: 1, mode: modesList[0].mode_of_payment, amount: "" },
          ]);
        }
      }
    } catch (error) {
      console.error("[DukaPlus] Failed to fetch payment modes:", error);
      // Fallback to hardcoded modes if API fails
      setPaymentModes([
        { mode_of_payment: "Cash" },
        { mode_of_payment: "Mpesa" },
      ]);
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedOrderId) {
      setMessage({ type: "error", text: "Please select a purchase order" });
      return;
    }

    setConfirmDialog({
      open: true,
      title: "Create Purchase Invoice?",
      description: `Create invoice for order ${selectedOrderId}?`,
      action: async () => {
        setIsSubmitting(true);
        setMessage(null);

        try {
          const response = await fetch("/api/purchase-invoices/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: selectedOrderId,
              purchase_invoice_id: "",
              items: [],
            }),
          });

          const data = await response.json();

          if (response.ok) {
            setMessage({
              type: "success",
              text:
                data.message?.message ||
                "Purchase invoice created successfully",
            });
            setShowCreateForm(false);
            setSelectedOrderId("");
            fetchInvoices();
            fetchOrders();
          } else {
            setMessage({
              type: "error",
              text:
                data.message?.message || "Failed to create purchase invoice",
            });
          }
        } catch (error) {
          setMessage({
            type: "error",
            text: "Error creating purchase invoice",
          });
          console.error("[DukaPlus] Error creating purchase invoice:", error);
        } finally {
          setIsSubmitting(false);
        }
      },
      variant: "success",
    });
  };

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
          });

          const data = await response.json();

          if (response.ok) {
            setMessage({
              type: "success",
              text: "Purchase invoice submitted successfully",
            });
            fetchInvoices();
          } else {
            setMessage({
              type: "error",
              text: data.message || "Failed to submit purchase invoice",
            });
          }
        } catch (error) {
          setMessage({
            type: "error",
            text: "Error submitting purchase invoice",
          });
          console.error("[DukaPlus] Error submitting purchase invoice:", error);
        }
      },
      variant: "success",
    });
  };

  const handleCancelInvoice = async (invoiceId: string) => {
    setConfirmDialog({
      open: true,
      title: "Cancel Purchase Invoice?",
      description: `Cancel invoice ${invoiceId}? This action cannot be undone.`,
      action: async () => {
        try {
          const response = await fetch("/api/purchase-invoices/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ purchase_invoice_id: invoiceId }),
          });

          const data = await response.json();

          if (response.ok) {
            setMessage({
              type: "success",
              text: "Purchase invoice cancelled successfully",
            });
            fetchInvoices();
          } else {
            setMessage({
              type: "error",
              text: data.message || "Failed to cancel purchase invoice",
            });
          }
        } catch (error) {
          setMessage({
            type: "error",
            text: "Error cancelling purchase invoice",
          });
          console.error("[DukaPlus] Error cancelling purchase invoice:", error);
        }
      },
      variant: "danger",
    });
  };

  const handlePaymentSubmit = async () => {
    if (!selectedInvoice) return;

    // Calculate total and validate payments
    const validPayments = payments.filter(
      (p) => Number.parseFloat(p.amount) > 0
    );

    if (validPayments.length === 0) {
      setMessage({
        type: "error",
        text: "Please enter at least one payment amount",
      });
      return;
    }

    const totalPayment = validPayments.reduce(
      (sum, p) => sum + Number.parseFloat(p.amount),
      0
    );

    setConfirmDialog({
      open: true,
      title: "Record Payment?",
      description: `Record payment of ${currency} ${totalPayment.toFixed(
        2
      )} for invoice ${selectedInvoice}?`,
      action: async () => {
        try {
          // Format payments according to API spec
          const formattedPayments = validPayments.map((p) => ({
            mode_of_payment: p.mode,
            amount: Number.parseFloat(p.amount),
          }));

          const response = await fetch("/api/purchase-invoices/payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              purchase_invoice_id: selectedInvoice,
              payments: formattedPayments,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            setMessage({
              type: "success",
              text: "Payment recorded successfully",
            });
            setShowPaymentView(false);
            setSelectedInvoice(null);
            setPayments([
              {
                id: 1,
                mode: paymentModes[0]?.mode_of_payment || "Cash",
                amount: "",
              },
            ]);
            fetchInvoices();
          } else {
            setMessage({
              type: "error",
              text: data.message || "Failed to record payment",
            });
          }
        } catch (error) {
          setMessage({ type: "error", text: "Error recording payment" });
          console.error("[DukaPlus] Error recording payment:", error);
        }
      },
      variant: "success",
    });
  };

  const addPayment = () => {
    const newId = Math.max(...payments.map((p) => p.id), 0) + 1;
    setPayments([
      ...payments,
      {
        id: newId,
        mode: paymentModes[0]?.mode_of_payment || "Cash",
        amount: "",
      },
    ]);
  };

  const removePayment = (id: number) => {
    if (payments.length > 1) {
      setPayments(payments.filter((p) => p.id !== id));
    }
  };

  const updatePayment = (
    id: number,
    field: "mode" | "amount",
    value: string
  ) => {
    setPayments(
      payments.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const getTotalPayment = () => {
    return payments.reduce(
      (sum, p) => sum + (Number.parseFloat(p.amount) || 0),
      0
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft":
        return <span className="badge-warning">Draft</span>;
      case "unpaid":
        return <span className="badge-danger">Unpaid</span>;
      case "paid":
        return <span className="badge-success">Paid</span>;
      case "overdue":
        <span className="badge-danger">Overdue</span>;
        return <span className="badge-danger">Overdue</span>;
      case "partially paid":
        return <span className="badge-warning">Partially Paid</span>;
      default:
        return <span className="badge-secondary">{status}</span>;
    }
  };

  const renderOutstandingAmount = (amount: number | string) => {
    const parsed =
      typeof amount === "string" ? Number.parseFloat(amount) : amount;
    const value = Number.isFinite(parsed) ? parsed : 0;
    const isCleared = value <= 0;
    const badgeClass = isCleared ? "badge-success" : "badge-warning";

    return (
      <span className={badgeClass}>
        {currency} {value.toFixed(2)}
      </span>
    );
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplier.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      invoice.status.toLowerCase().replace(" ", "_") === statusFilter;

    const invoiceDate = new Date(invoice.posting_date);
    const matchesDateRange =
      invoiceDate >= dateRange.from && invoiceDate <= dateRange.to;

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  const toggleInvoiceExpansion = (invoiceId: string) => {
    setExpandedInvoices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  };

  const handleEditInvoice = async (invoice: PurchaseInvoice) => {
    try {
      const warehouseId = sessionStorage.getItem("selected_warehouse") || "";

      if (!warehouseId) {
        setMessage({ type: "error", text: "No warehouse selected" });
        return;
      }

      const response = await fetch(
        `/api/purchase-invoices?warehouse_id=${encodeURIComponent(warehouseId)}`
      );
      const data = await response.json();

      if (response.ok && data.message?.data) {
        const fullInvoice = data.message.data.find(
          (inv: PurchaseInvoice) => inv.name === invoice.name
        );

        if (fullInvoice) {
          const invoiceToEdit = {
            ...fullInvoice,
            name: fullInvoice.name, // Explicitly preserve invoice ID
            order_id: fullInvoice.order_id || fullInvoice.purchase_order || "",
          };
          console.log("[DukaPlus] Loading invoice for edit:", invoiceToEdit);
          setEditingInvoice(invoiceToEdit as any);
          setShowEditForm(true);
          setMessage(null);
        } else {
          setMessage({ type: "error", text: "Invoice not found" });
        }
      } else {
        setMessage({ type: "error", text: "Failed to load invoice details" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error loading invoice details" });
      console.error("[DukaPlus] Error loading invoice:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingInvoice) return;

    const orderId = editingInvoice.order_id || editingInvoice.purchase_order;

    if (!orderId) {
      setMessage({ type: "error", text: "order_id is required" });
      console.error(
        "[DukaPlus] Missing order_id in editingInvoice:",
        editingInvoice
      );
      return;
    }

    const purchaseInvoiceId = editingInvoice.name;

    if (!purchaseInvoiceId) {
      setMessage({ type: "error", text: "Invoice ID is missing" });
      console.error(
        "[DukaPlus] Missing name/ID in editingInvoice:",
        editingInvoice
      );
      return;
    }

    setConfirmDialog({
      open: true,
      title: "Save Invoice Changes?",
      description: `Save changes to invoice ${editingInvoice.name}?`,
      action: async () => {
        setIsSubmitting(true);
        setMessage(null);

        try {
          const payload = {
            order_id: orderId,
            purchase_invoice_id: purchaseInvoiceId, // This should be the invoice name like "ACC-PINV-2025-00013"
            items: editingInvoice.items.map((item) => ({
              item_code: item.item_code,
              qty: Number(item.qty) || 0,
            })),
          };

          console.log(
            "[DukaPlus] Updating invoice with payload:",
            JSON.stringify(payload, null, 2)
          );

          const response = await fetch("/api/purchase-invoices/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const data = await response.json();

          console.log("[DukaPlus] API response:", data);

          if (response.ok) {
            setMessage({
              type: "success",
              text:
                data.message?.message ||
                "Purchase invoice updated successfully",
            });
            setShowEditForm(false);
            setEditingInvoice(null);
            fetchInvoices();
          } else {
            setMessage({
              type: "error",
              text:
                data.message?.message || "Failed to update purchase invoice",
            });
          }
        } catch (error) {
          setMessage({
            type: "error",
            text: "Error updating purchase invoice",
          });
          console.error("[DukaPlus] Error updating purchase invoice:", error);
        } finally {
          setIsSubmitting(false);
        }
      },
      variant: "success",
    });
  };

  const updateInvoiceItem = (itemCode: string, qty: number) => {
    if (!editingInvoice) return;

    setEditingInvoice({
      ...editingInvoice,
      items: editingInvoice.items.map((item) =>
        item.item_code === itemCode ? { ...item, qty } : item
      ),
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateRange({
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date(),
    });
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.action}
        variant={confirmDialog.variant}
        confirmText={
          confirmDialog.title.includes("Delete")
            ? "Delete"
            : confirmDialog.title.includes("Cancel")
            ? "Cancel Invoice"
            : "Confirm"
        }
      />

      {message && (
        <div
          className={
            message.type === "success"
              ? "alert-success flex items-start gap-2"
              : "alert-error flex items-start gap-2"
          }
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
          )}
          <p
            className={
              message.type === "success"
                ? "text-success text-sm"
                : "text-danger text-sm"
            }
          >
            {message.text}
          </p>
        </div>
      )}

      <div className="card-base table-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Purchase Invoices
          </h2>
          <Button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setSelectedOrderId("");
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
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          {(searchTerm ||
            statusFilter !== "all" ||
            dateRange.from.getTime() !==
              new Date(
                new Date().setDate(new Date().getDate() - 30)
              ).getTime()) && (
            <Button onClick={clearFilters} variant="outline" size="sm">
              Clear Filters
            </Button>
          )}
        </div>

        {showCreateForm && (
          <div className="mb-6 p-6 border-2 border-primary/20 rounded-lg bg-card shadow-sm">
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Create Purchase Invoice
            </h3>

            <div className="space-y-4">
              <div>
                <label className="form-label">Purchase Order *</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full input-base h-9 text-sm"
                >
                  <option value="">Select purchase order</option>
                  {orders.map((order) => (
                    <option key={order.order_id} value={order.order_id}>
                      {order.order_id} - {order.supplier} ({currency}{" "}
                      {order.grand_total.toFixed(2)}) - {order.status}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a purchase order to create an invoice
                </p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setSelectedOrderId("");
                  }}
                  disabled={isSubmitting}
                  className="btn-cancel flex-1 h-9 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInvoice}
                  disabled={isSubmitting || !selectedOrderId}
                  className="btn-create flex-1 h-9 text-sm"
                >
                  {isSubmitting ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditForm && editingInvoice && (
          <div className="mb-6 p-6 border-2 border-primary/20 rounded-lg bg-card shadow-sm">
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Edit Purchase Invoice: {editingInvoice.name}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Purchase Order</label>
                  <input
                    type="text"
                    value={
                      editingInvoice.order_id ||
                      editingInvoice.purchase_order ||
                      ""
                    }
                    readOnly
                    className="w-full input-base h-9 text-sm bg-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="form-label">Supplier</label>
                  <input
                    type="text"
                    value={editingInvoice.supplier}
                    readOnly
                    className="w-full input-base h-9 text-sm bg-muted cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Date</label>
                <input
                  type="text"
                  value={new Date(
                    editingInvoice.posting_date
                  ).toLocaleDateString()}
                  readOnly
                  className="w-full input-base h-9 text-sm bg-muted cursor-not-allowed"
                />
              </div>

              <div>
                <label className="form-label mb-3">Items</label>

                {/* Table Header */}
                <div className="hidden md:grid md:grid-cols-[1fr_150px_150px_150px] gap-2 mb-2 px-3 py-1.5 bg-muted/50 rounded-md border border-border">
                  <div className="text-xs font-semibold text-muted-foreground uppercase">
                    Product
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase text-center">
                    Quantity
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase text-right">
                    Rate
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase text-right">
                    Amount
                  </div>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {editingInvoice.items.map((item) => (
                    <div
                      key={item.item_code}
                      className="grid grid-cols-1 md:grid-cols-[1fr_150px_150px_150px] gap-2 p-3 border border-border rounded-md bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div>
                        <label className="md:hidden text-xs font-medium text-muted-foreground mb-1 block">
                          Product
                        </label>
                        <div className="font-medium text-sm">
                          {item.item_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.item_code}
                        </div>
                      </div>
                      <div>
                        <label className="md:hidden text-xs font-medium text-muted-foreground mb-1 block">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.qty || 0}
                          onChange={(e) =>
                            updateInvoiceItem(
                              item.item_code,
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full input-base h-9 text-sm text-center"
                        />
                      </div>
                      <div>
                        <label className="md:hidden text-xs font-medium text-muted-foreground mb-1 block">
                          Rate
                        </label>
                        <div className="h-9 flex items-center justify-end text-sm font-medium">
                          {currency} {item.rate.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <label className="md:hidden text-xs font-medium text-muted-foreground mb-1 block">
                          Amount
                        </label>
                        <div className="h-9 flex items-center justify-end text-sm font-semibold">
                          {currency} {item.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total:</span>
                    <span className="text-lg font-bold text-primary">
                      {currency}{" "}
                      {editingInvoice.items
                        .reduce((sum, item) => sum + item.amount, 0)
                        .toLocaleString("en-KE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingInvoice(null);
                  }}
                  disabled={isSubmitting}
                  className="btn-cancel flex-1 h-9 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSubmitting}
                  className="btn-create flex-1 h-9 text-sm"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showPaymentView && selectedInvoice && (
          <div className="mb-6 p-4 border border-border rounded-lg bg-muted/50">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Record Payment
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Invoice: {selectedInvoice}
                </p>
                {(() => {
                  const currentInvoice = invoices.find(
                    (inv) => inv.name === selectedInvoice
                  );
                  if (currentInvoice?.items) {
                    const totalAmount = currentInvoice.items.reduce(
                      (sum, item) => sum + item.amount,
                      0
                    );
                    return (
                      <p className="text-sm font-semibold text-warning mt-1">
                        Invoice Total: {currency} {totalAmount.toFixed(2)}
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
              <button
                onClick={() => {
                  setShowPaymentView(false);
                  setSelectedInvoice(null);
                }}
                className="p-2 hover:bg-muted rounded transition-colors"
                title="Close"
              >
                <ChevronUp className="w-5 h-5 text-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground">
                  Payment Methods
                </label>
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
                  <div
                    key={payment.id}
                    className="p-3 border border-border rounded-lg space-y-3"
                  >
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="form-label text-xs">
                          Payment Mode
                        </label>
                        <select
                          value={payment.mode}
                          onChange={(e) =>
                            updatePayment(payment.id, "mode", e.target.value)
                          }
                          className="input-base w-full text-sm"
                        >
                          {paymentModes.length > 0 ? (
                            paymentModes.map((mode) => (
                              <option
                                key={mode.mode_of_payment}
                                value={mode.mode_of_payment}
                              >
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
                      <label className="form-label text-xs">
                        Amount ({currency})
                      </label>
                      <input
                        type="number"
                        value={payment.amount}
                        onChange={(e) =>
                          updatePayment(payment.id, "amount", e.target.value)
                        }
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
                  Total Payment: {currency} {getTotalPayment().toFixed(2)}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => {
                    setShowPaymentView(false);
                    setSelectedInvoice(null);
                    setPayments([
                      {
                        id: 1,
                        mode: paymentModes[0]?.mode_of_payment || "Cash",
                        amount: "",
                      },
                    ]);
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

        {isLoading ? (
          <p className="text-foreground p-6 text-center">
            Loading purchase invoices...
          </p>
        ) : filteredInvoices.length === 0 ? (
          <p className="text-foreground text-center py-8">
            {searchTerm || statusFilter !== "all"
              ? "No invoices match your filters"
              : "No purchase invoices found"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="reports-table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell w-10"></th>
                  <th className="table-header-cell text-left">Invoice ID</th>
                  <th className="table-header-cell text-left">Supplier</th>
                  <th className="table-header-cell text-left">Date</th>
                  <th className="table-header-cell text-left">Total</th>
                  <th className="table-header-cell text-left">Outstanding</th>
                  <th className="table-header-cell text-left">Status</th>
                  <th className="table-header-cell text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedInvoices.map((invoice) => {
                  const isExpanded = expandedInvoices.has(invoice.name);
                  const isDraft = invoice.docstatus === 0;
                  const isUnpaid = invoice.status.toLowerCase() === "unpaid";

                  return (
                    <>
                      <tr key={invoice.name} className="table-row">
                        <td className="px-2 sm:px-4 py-3">
                          {invoice.items && invoice.items.length > 0 && (
                            <button
                              onClick={() =>
                                toggleInvoiceExpansion(invoice.name)
                              }
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
                        <td className="table-cell font-mono text-warning text-sm">
                          {invoice.name}
                        </td>
                        <td className="table-cell">{invoice.supplier}</td>
                        <td className="table-cell">{invoice.posting_date}</td>
                        <td className="table-cell">
                          {currency} {invoice.total_amount}
                        </td>
                        <td className="table-cell">
                          {renderOutstandingAmount(invoice.outstanding_amount)}
                        </td>
                        <td className="table-cell">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="table-cell text-center">
                          <TableActionButtons
                            showEdit={invoice.docstatus === 0}
                            onEdit={() => handleEditInvoice(invoice)}
                            showSubmit={invoice.docstatus === 0}
                            onSubmit={() => handleSubmitInvoice(invoice.name)}
                            showPay={invoice.status !== "Paid"}
                            onPay={() => {
                              setSelectedInvoice(invoice.name);
                              setShowPaymentView(true);
                            }}
                            showCancel={true}
                            onCancel={() => handleCancelInvoice(invoice.name)}
                            size="sm"
                          />
                        </td>
                      </tr>
                      {isExpanded &&
                        invoice.items &&
                        invoice.items.length > 0 && (
                          <tr>
                            <td colSpan={8} className="px-4 py-2 bg-muted/30">
                              <div className="p-4">
                                <div className="overflow-x-auto">
                                  <table className="reports-table text-xs min-w-[640px]">
                                    <thead className="bg-muted">
                                      <tr>
                                        <th className="table-header-cell text-left">
                                          Item Code
                                        </th>
                                        <th className="table-header-cell text-left">
                                          Item Name
                                        </th>
                                        <th className="table-header-cell text-right">
                                          Quantity
                                        </th>
                                        <th className="table-header-cell text-right">
                                          Rate
                                        </th>
                                        <th className="table-header-cell text-right">
                                          Amount
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {invoice.items.map((item, idx) => (
                                        <tr
                                          key={idx}
                                          className="border-b border-border"
                                        >
                                          <td className="p-2 font-mono text-foreground">
                                            {item.item_code}
                                          </td>
                                          <td className="p-2 text-foreground">
                                            {item.item_name}
                                          </td>
                                          <td className="p-2 text-right text-foreground">
                                            {item.qty}
                                          </td>
                                          <td className="p-2 text-right text-foreground">
                                            {currency} {item.rate.toFixed(2)}
                                          </td>
                                          <td className="p-2 text-right font-semibold text-foreground">
                                            {currency} {item.amount.toFixed(2)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                    </>
                  );
                })}
              </tbody>
            </table>
            {totalPages > 1 && (
              <EnhancedPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                startIndex={startIndex}
                endIndex={endIndex}
                totalRecords={filteredInvoices.length}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
