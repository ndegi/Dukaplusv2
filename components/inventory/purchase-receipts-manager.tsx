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

interface PurchaseReceipt {
  name: string;
  supplier: string;
  status: string;
  posting_date: string;
  set_warehouse: string;
  items: {
    item_code: string;
    item_name: string;
    qty: number;
    rate: number;
    amount: number;
  }[];
}

interface PurchaseOrder {
  order_id: string;
  supplier: string;
  items: Array<{
    item_code: string;
    item_name: string;
    qty: number;
    rate: number;
    amount: number;
  }>;
  grand_total: number;
  status: string;
  docstatus: number;
}

interface Product {
  id: string;
  name: string;
}

interface ReceiptItem {
  item_code: string;
  qty: number;
}

export function PurchaseReceiptsManager() {
  const [receipts, setReceipts] = useState<PurchaseReceipt[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedReceipts, setExpandedReceipts] = useState<Set<string>>(
    new Set()
  );
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [editingReceiptId, setEditingReceiptId] = useState("");
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([
    { item_code: "", qty: 1 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "submitted"
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
  const [productSearchTerms, setProductSearchTerms] = useState<string[]>([""]);
  const [showProductDropdowns, setShowProductDropdowns] = useState<boolean[]>([
    false,
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { currency } = useCurrency();

  useEffect(() => {
    const warehouseId = sessionStorage.getItem("selected_warehouse") || "";
    setSelectedWarehouse(warehouseId);
    fetchReceipts();
    fetchPurchaseOrders();
    fetchProducts();
  }, []);

  const fetchReceipts = async () => {
    try {
      setIsLoading(true);
      const warehouseId = sessionStorage.getItem("selected_warehouse") || "";
      const response = await fetch(
        `/api/purchase-receipts?warehouse_id=${encodeURIComponent(warehouseId)}`
      );
      const data = await response.json();

      if (data.message?.status === 200 && data.message?.data) {
        const receiptsData = data.message.data.map((receipt: any) => ({
          ...receipt,
        }));
        setReceipts(receiptsData);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to fetch purchase receipts",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error fetching purchase receipts" });
      console.error("Error fetching purchase receipts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const warehouseId = sessionStorage.getItem("selected_warehouse") || "";

      if (!warehouseId) {
        console.error("[DukaPlus] No warehouse selected");
        return;
      }

      const response = await fetch(
        `/api/purchase-orders?warehouse_id=${encodeURIComponent(warehouseId)}`
      );
      const data = await response.json();

      if (
        response.status === 401 ||
        (data.message &&
          typeof data.message === "string" &&
          data.message.includes("Unauthorized"))
      ) {
        sessionStorage.clear();
        window.location.href = "/login";
        return;
      }

      if (response.ok && data.message?.purchase_orders) {
        setOrders(data.message.purchase_orders);
        setError(null);
      } else {
        setError(data.message?.message || "Failed to fetch purchase orders");
      }
    } catch (err) {
      setError("Error fetching purchase orders");
      console.error("[DukaPlus] Error fetching purchase orders:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const warehouseId = sessionStorage.getItem("selected_warehouse") || "";
      const response = await fetch(
        `/api/inventory/products?warehouse_id=${encodeURIComponent(
          warehouseId
        )}`
      );
      const data = await response.json();

      if (response.ok && data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("[DukaPlus] Error fetching products:", error);
    }
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = orders.find((o) => o.order_id === orderId);
    if (order && order.items) {
      setReceiptItems(
        order.items.map((item) => ({
          item_code: item.item_code,
          qty: item.qty,
        }))
      );
      // Set product display names for read-only view
      setProductSearchTerms(order.items.map((item) => item.item_name));
      setShowProductDropdowns(order.items.map(() => false));
    } else {
      setReceiptItems([{ item_code: "", qty: 1 }]);
      setProductSearchTerms([""]);
      setShowProductDropdowns([false]);
    }
  };

  const handleCreateOrUpdateReceipt = async () => {
    if (!selectedOrderId) {
      setMessage({ type: "error", text: "Please select a purchase order" });
      return;
    }

    if (receiptItems.some((item) => !item.item_code || item.qty <= 0)) {
      setMessage({
        type: "error",
        text: "Please fill all item details correctly",
      });
      return;
    }

    const actionText = editingReceiptId ? "update" : "create";

    setConfirmDialog({
      open: true,
      title: `${editingReceiptId ? "Update" : "Create"} Purchase Receipt?`,
      description: `This will ${actionText} a purchase receipt for order ${selectedOrderId} with ${receiptItems.length} item(s).`,
      action: async () => {
        setIsSubmitting(true);
        setMessage(null);

        try {
          const response = await fetch("/api/purchase-receipts/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: selectedOrderId,
              purchase_receipt_id: editingReceiptId,
              items: receiptItems,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            setMessage({
              type: "success",
              text:
                data.message?.message ||
                `Purchase receipt ${
                  editingReceiptId ? "updated" : "created"
                } successfully`,
            });
            setShowCreateForm(false);
            setSelectedOrderId("");
            setEditingReceiptId("");
            setReceiptItems([{ item_code: "", qty: 1 }]);
            setProductSearchTerms([""]);
            setShowProductDropdowns([false]);
            fetchReceipts();
            fetchPurchaseOrders(); // Refresh orders to update available orders
          } else {
            setMessage({
              type: "error",
              text:
                data.message?.message ||
                `Failed to ${actionText} purchase receipt`,
            });
          }
        } catch (error) {
          setMessage({
            type: "error",
            text: `Error ${actionText}ing purchase receipt`,
          });
          console.error(
            `[DukaPlus] Error ${actionText}ing purchase receipt:`,
            error
          );
        } finally {
          setIsSubmitting(false);
        }
      },
      variant: "success",
    });
  };

  const handleSubmitReceipt = async (receiptId: string) => {
    setConfirmDialog({
      open: true,
      title: "Submit Purchase Receipt?",
      description: `Submit receipt ${receiptId}? This will update inventory. This action cannot be undone.`,
      action: async () => {
        try {
          const response = await fetch("/api/purchase-receipts/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ purchase_receipt_id: receiptId }),
          });

          const data = await response.json();

          if (response.ok) {
            setMessage({
              type: "success",
              text: "Purchase receipt submitted successfully",
            });
            fetchReceipts();
          } else {
            setMessage({
              type: "error",
              text:
                data.message?.message || "Failed to submit purchase receipt",
            });
          }
        } catch (error) {
          setMessage({
            type: "error",
            text: "Error submitting purchase receipt",
          });
          console.error("[DukaPlus] Error submitting purchase receipt:", error);
        }
      },
      variant: "success",
    });
  };

  const handleCancelOrDeleteReceipt = async (
    receiptId: string,
    status: string
  ) => {
    const isDraft = status.toLowerCase() === "draft";

    setConfirmDialog({
      open: true,
      title: isDraft ? "Delete Purchase Receipt?" : "Cancel Purchase Receipt?",
      description: isDraft
        ? `Delete draft receipt ${receiptId}? This action cannot be undone.`
        : `Cancel receipt ${receiptId}? This action cannot be undone.`,
      action: async () => {
        try {
          const response = await fetch("/api/purchase-receipts/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ purchase_receipt_id: receiptId }),
          });

          if (response.ok) {
            setMessage({
              type: "success",
              text: `Purchase receipt ${
                isDraft ? "deleted" : "cancelled"
              } successfully`,
            });
            fetchReceipts();
          } else {
            const data = await response.json();
            setMessage({
              type: "error",
              text:
                data.message?.message ||
                `Failed to ${isDraft ? "delete" : "cancel"} receipt`,
            });
          }
        } catch (err) {
          setMessage({
            type: "error",
            text: `Error ${isDraft ? "deleting" : "canceling"} receipt`,
          });
          console.error("[DukaPlus] Error:", err);
        }
      },
      variant: "danger",
    });
  };

  const handleEditReceipt = (receipt: PurchaseReceipt) => {
    setEditingReceiptId(receipt.name);
    setReceiptItems(
      receipt.items.map((item) => ({
        item_code: item.item_code,
        qty: item.qty,
      }))
    );
    setShowCreateForm(true);
    // Try to find matching order (might not exist if already fully received)
    const matchingOrder = orders.find(
      (order) => order.supplier === receipt.supplier
    );
    if (matchingOrder) {
      setSelectedOrderId(matchingOrder.order_id);
    }
    setProductSearchTerms(receipt.items.map((item) => item.item_name));
    setShowProductDropdowns(receipt.items.map(() => false));
  };

  const addReceiptItem = () => {
    if (selectedOrderId) {
      setMessage({
        type: "error",
        text: "Cannot add items. Items are from the selected purchase order.",
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setReceiptItems([...receiptItems, { item_code: "", qty: 1 }]);
    setProductSearchTerms([...productSearchTerms, ""]);
    setShowProductDropdowns([...showProductDropdowns, false]);
  };

  const removeReceiptItem = (index: number) => {
    if (selectedOrderId) {
      setMessage({
        type: "error",
        text: "Cannot remove items. Items are from the selected purchase order.",
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setReceiptItems(receiptItems.filter((_, i) => i !== index));
    setProductSearchTerms(productSearchTerms.filter((_, i) => i !== index));
    setShowProductDropdowns(showProductDropdowns.filter((_, i) => i !== index));
  };

  const selectProduct = (index: number, productId: string) => {
    if (selectedOrderId) {
      return;
    }

    const existingItemIndex = receiptItems.findIndex(
      (item, idx) => idx !== index && item.item_code === productId
    );

    if (existingItemIndex !== -1) {
      const newItems = [...receiptItems];
      newItems[existingItemIndex].qty += 1;
      setReceiptItems(newItems.filter((_, idx) => idx !== index));
      setProductSearchTerms(
        productSearchTerms.filter((_, idx) => idx !== index)
      );
      setShowProductDropdowns(
        showProductDropdowns.filter((_, idx) => idx !== index)
      );
      const product = products.find((p) => p.id === productId);
      setMessage({
        type: "error",
        text: `"${
          product?.name || productId
        }" already in list. Quantity increased.`,
      });
      setTimeout(() => setMessage(null), 3000);
    } else {
      updateReceiptItem(index, "item_code", productId);
      const product = products.find((p) => p.id === productId);
      const newTerms = [...productSearchTerms];
      newTerms[index] = product ? product.name : productId;
      setProductSearchTerms(newTerms);
      const newShow = [...showProductDropdowns];
      newShow[index] = false;
      setShowProductDropdowns(newShow);
    }
  };

  const updateReceiptItem = (
    index: number,
    field: keyof ReceiptItem,
    value: string | number
  ) => {
    const updated = [...receiptItems];
    updated[index] = {
      ...updated[index],
      [field]: field === "qty" ? Number(value) : value,
    };
    setReceiptItems(updated);
  };

  const toggleReceiptExpansion = (receiptId: string) => {
    setExpandedReceipts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(receiptId)) {
        newSet.delete(receiptId);
      } else {
        newSet.add(receiptId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            Draft
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            Submitted
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            Completed
          </span>
        );
      case "to bill":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
            To Bill
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch =
      receipt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.supplier.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "draft" && receipt.status.toLowerCase() === "draft") ||
      (statusFilter === "submitted" &&
        receipt.status.toLowerCase() === "submitted");

    const receiptDate = new Date(receipt.posting_date);
    const matchesDateRange =
      receiptDate >= dateRange.from && receiptDate <= dateRange.to;

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const getFilteredProducts = (searchTerm: string) => {
    if (!searchTerm) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReceipts = filteredReceipts.slice(startIndex, endIndex);

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
            ? "Cancel Receipt"
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

      {error && (
        <div className="alert-error flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      <div className="card-base table-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Purchase Receipts
          </h2>
          <Button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setEditingReceiptId("");
              setSelectedOrderId("");
              setReceiptItems([{ item_code: "", qty: 1 }]);
              setProductSearchTerms([""]);
              setShowProductDropdowns([false]);
            }}
            className="btn-create"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showCreateForm ? "Cancel" : "New Receipt"}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search receipts..."
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
            <option value="submitted">Submitted</option>
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
              {editingReceiptId
                ? "Edit Purchase Receipt"
                : "Create Purchase Receipt"}
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="form-label">Purchase Order *</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => handleOrderSelect(e.target.value)}
                  className="w-full input-base h-9 text-sm"
                  disabled={!!editingReceiptId}
                >
                  <option value="">Select purchase order</option>
                  {orders.map((order) => (
                    <option key={order.order_id} value={order.order_id}>
                      {order.order_id} - {order.supplier}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Only submitted orders available for receiving
                </p>
              </div>

              <div className="flex items-end">
                <div className="w-full">
                  <label className="form-label">Grand Total</label>
                  <div className="h-9 px-3 rounded-md border border-input bg-muted flex items-center text-sm font-semibold">
                    {currency}{" "}
                    {selectedOrderId
                      ? orders
                          .find((o) => o.order_id === selectedOrderId)
                          ?.grand_total.toLocaleString("en-KE", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"
                      : "0.00"}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="form-label mb-0">Items</label>
                {!selectedOrderId && (
                  <button
                    onClick={addReceiptItem}
                    className="btn-success h-8 text-xs px-3"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Item
                  </button>
                )}
              </div>
              {selectedOrderId && (
                <p className="text-xs text-muted-foreground mb-3 italic">
                  Items from purchase order. You can only adjust quantities.
                </p>
              )}

              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-[1fr_120px_60px] gap-2 mb-2 px-3 py-1.5 bg-muted/50 rounded-md border border-border">
                <div className="text-xs font-semibold text-muted-foreground uppercase">
                  Product
                </div>
                <div className="text-xs font-semibold text-muted-foreground uppercase text-center">
                  Quantity
                </div>
                <div className="text-xs font-semibold text-muted-foreground uppercase text-center">
                  Action
                </div>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {receiptItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-[1fr_120px_60px] gap-2 p-2 border border-border rounded-md bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="relative">
                      <label className="md:hidden text-xs font-medium text-muted-foreground mb-1 block">
                        Product
                      </label>
                      {selectedOrderId ? (
                        <input
                          type="text"
                          value={productSearchTerms[index] || ""}
                          readOnly
                          className="w-full input-base h-9 text-sm bg-muted cursor-not-allowed"
                        />
                      ) : (
                        <>
                          <input
                            type="text"
                            placeholder="Search product..."
                            value={productSearchTerms[index] || ""}
                            onChange={(e) => {
                              const newTerms = [...productSearchTerms];
                              newTerms[index] = e.target.value;
                              setProductSearchTerms(newTerms);
                              const newShow = [...showProductDropdowns];
                              newShow[index] = true;
                              setShowProductDropdowns(newShow);
                            }}
                            onFocus={() => {
                              const newShow = [...showProductDropdowns];
                              newShow[index] = true;
                              setShowProductDropdowns(newShow);
                            }}
                            className="w-full input-base h-9 text-sm"
                          />
                          {showProductDropdowns[index] &&
                            getFilteredProducts(productSearchTerms[index])
                              .length > 0 && (
                              <div className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto bg-card border border-border rounded-md shadow-lg">
                                {getFilteredProducts(
                                  productSearchTerms[index]
                                ).map((product) => (
                                  <button
                                    key={product.id}
                                    type="button"
                                    onClick={() =>
                                      selectProduct(index, product.id)
                                    }
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                                  >
                                    <div className="font-medium">
                                      {product.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {product.id}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                        </>
                      )}
                    </div>

                    <div>
                      <label className="md:hidden text-xs font-medium text-muted-foreground mb-1 block">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) =>
                          updateReceiptItem(index, "qty", e.target.value)
                        }
                        className="w-full input-base h-9 text-sm text-center"
                      />
                    </div>

                    <div className="flex items-end md:items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeReceiptItem(index)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        disabled={selectedOrderId}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingReceiptId("");
                  setSelectedOrderId("");
                  setReceiptItems([{ item_code: "", qty: 1 }]);
                  setProductSearchTerms([""]);
                  setShowProductDropdowns([false]);
                }}
                className="btn-cancel flex-1 h-9 text-sm"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrUpdateReceipt}
                disabled={isSubmitting || !selectedOrderId}
                className="btn-create flex-1 h-9 text-sm"
              >
                {isSubmitting
                  ? "Saving..."
                  : editingReceiptId
                  ? "Update Receipt"
                  : "Create Receipt"}
              </button>
            </div>
          </div>
        )}

        {isLoading || isLoadingOrders ? (
          <p className="text-foreground p-6 text-center">
            Loading purchase receipts...
          </p>
        ) : filteredReceipts.length === 0 ? (
          <p className="p-6 text-center text-foreground text-sm">
            No purchase receipts found
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="reports-table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell w-10"></th>
                    <th className="table-header-cell text-left uppercase">
                      Receipt ID
                    </th>
                    <th className="table-header-cell text-left uppercase">
                      Supplier
                    </th>
                    <th className="table-header-cell text-left uppercase">
                      Warehouse
                    </th>
                    <th className="table-header-cell text-left uppercase">
                      Date
                    </th>
                    <th className="table-header-cell text-left uppercase">
                      Status
                    </th>
                    <th className="table-header-cell text-center uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedReceipts.map((receipt) => {
                    const isExpanded = expandedReceipts.has(receipt.name);

                    return (
                      <>
                        <tr key={receipt.name} className="table-row">
                          <td className="px-2 sm:px-4 py-3">
                            {receipt.items && receipt.items.length > 0 && (
                              <button
                                onClick={() =>
                                  toggleReceiptExpansion(receipt.name)
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
                            {receipt.name}
                          </td>
                          <td className="table-cell">{receipt.supplier}</td>
                          <td className="table-cell">
                            {receipt.set_warehouse}
                          </td>
                          <td className="table-cell">{receipt.posting_date}</td>
                          <td className="table-cell">
                            {getStatusBadge(receipt.status)}
                          </td>
                          <td className="px-4 py-3">
                            <TableActionButtons
                              showEdit={
                                receipt.status.toLowerCase() === "draft"
                              }
                              onEdit={() => handleEditReceipt(receipt)}
                              showSubmit={
                                receipt.status.toLowerCase() === "draft"
                              }
                              onSubmit={() => handleSubmitReceipt(receipt.name)}
                              showCancel={true}
                              onCancel={() =>
                                handleCancelOrDeleteReceipt(
                                  receipt.name,
                                  receipt.status
                                )
                              }
                              docstatus={
                                receipt.status.toLowerCase() === "draft" ? 0 : 1
                              }
                              status={receipt.status}
                              size="sm"
                            />
                          </td>
                        </tr>
                        {isExpanded &&
                          receipt.items &&
                          receipt.items.length > 0 && (
                            <tr>
                              <td colSpan={7} className="px-4 py-2 bg-muted/30">
                                <div className="p-4">
                                  <h4 className="font-semibold text-sm mb-2 text-foreground">
                                    Items:
                                  </h4>
                                  <table className="reports-table text-xs">
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
                                      {receipt.items.map((item, idx) => (
                                        <tr
                                          key={idx}
                                          className="border-b border-border"
                                        >
                                          <td className="p-2 font-mono text-muted-foreground">
                                            {item.item_code}
                                          </td>
                                          <td className="p-2 text-foreground">
                                            {item.item_name}
                                          </td>
                                          <td className="p-2 text-right text-foreground">
                                            {item.qty}
                                          </td>
                                          <td className="p-2 text-right text-muted-foreground">
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
                              </td>
                            </tr>
                          )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <EnhancedPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                startIndex={startIndex}
                endIndex={endIndex}
                totalRecords={filteredReceipts.length}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
