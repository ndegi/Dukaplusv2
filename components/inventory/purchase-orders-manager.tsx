"use client";

import type React from "react";
import { EnhancedPagination } from "@/components/reports/enhanced-pagination";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { TableActionButtons } from "@/components/ui/table-action-buttons";
import { DateRangeFilter } from "@/components/reports/date-range-filter";
import { useCurrency } from "@/lib/contexts/currency-context";

interface PurchaseOrder {
  order_id: string;
  supplier: string;
  date: string;
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

interface Supplier {
  supplier_name: string;
  supplier_id?: string;
  mobile_number?: string;
}

export function PurchaseOrdersManager() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [showNewSupplierForm, setShowNewSupplierForm] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant: string;
  }>({
    open: false,
    title: "",
    description: "",
    action: () => {},
    variant: "default",
  });
  const [message, setMessage] = useState<{ type: string; text: string } | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { currency } = useCurrency();

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, dateRange]);

  const fetchPurchaseOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const warehouseId = sessionStorage.getItem("selected_warehouse") || "";

      if (!warehouseId) {
        setError("Please select a warehouse first");
        setIsLoadingOrders(false);
        return;
      }

      const response = await fetch(
        `/api/purchase-orders?warehouse_id=${encodeURIComponent(warehouseId)}`
      );
      const data = await response.json();

      if (
        response.status === 401 ||
        (typeof data.message === "string" &&
          data.message.includes("Unauthorized"))
      ) {
        sessionStorage.clear();
        window.location.href = "/login";
        return;
      }

      if (
        typeof data.message === "string" &&
        data.message.includes("Failed to fetch warehouses")
      ) {
        setError("Failed to fetch warehouses. Please log in again.");
        setTimeout(() => {
          sessionStorage.clear();
          window.location.href = "/login";
        }, 2000);
        setIsLoadingOrders(false);
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

  const handleCancelOrDeleteOrder = async (
    orderId: string,
    docstatus: number
  ) => {
    const isDraft = docstatus === 0;

    setConfirmDialog({
      open: true,
      title: isDraft ? "Delete Purchase Order?" : "Cancel Purchase Order?",
      description: isDraft
        ? `Delete draft order ${orderId}? This action cannot be undone.`
        : `Cancel order ${orderId}? This action cannot be undone.`,
      action: async () => {
        try {
          const response = await fetch("/api/purchase-orders/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: orderId }),
          });

          if (response.ok) {
            fetchPurchaseOrders();
          } else {
            const data = await response.json();
            alert(
              data.message?.message ||
                `Failed to ${isDraft ? "delete" : "cancel"} order`
            );
          }
        } catch (err) {
          alert(`Error ${isDraft ? "deleting" : "canceling"} order`);
          console.error("[DukaPlus] Error:", err);
        }
      },
      variant: isDraft ? "danger" : "default",
    });
  };

  const handleCreateReceipt = async (orderId: string) => {
    setConfirmDialog({
      open: true,
      title: "Create Purchase Receipt?",
      description: `Create receipt for order ${orderId}?`,
      action: async () => {
        try {
          const response = await fetch("/api/purchase-orders/receipt/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: orderId }),
          });

          if (response.ok) {
            const data = await response.json();
            alert("Receipt created successfully: " + data.message?.receipt_id);
            fetchPurchaseOrders();
          } else {
            const data = await response.json();
            alert(data.message?.message || "Failed to create receipt");
          }
        } catch (err) {
          alert("Error creating receipt");
          console.error("[DukaPlus] Error:", err);
        }
      },
      variant: "success",
    });
  };

  const handleEditOrder = (orderId: string) => {
    setEditingOrderId(orderId);
    setShowNewOrderForm(true);
  };

  const handleSubmitOrder = async (orderId: string) => {
    setConfirmDialog({
      open: true,
      title: "Submit Purchase Order?",
      description: `Submit order ${orderId}? This action cannot be undone.`,
      action: async () => {
        try {
          const response = await fetch("/api/purchase-orders/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: orderId }),
          });

          const data = await response.json();

          if (response.ok) {
            setMessage({
              type: "success",
              text: "Purchase order submitted successfully",
            });
            fetchPurchaseOrders();
          } else {
            setMessage({
              type: "error",
              text: data.message?.message || "Failed to submit purchase order",
            });
          }
        } catch (error) {
          setMessage({
            type: "error",
            text: "Error submitting purchase order",
          });
          console.error("[DukaPlus] Error submitting purchase order:", error);
        }
      },
      variant: "success",
    });
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.supplier.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.date);
        return orderDate >= dateRange.from && orderDate <= dateRange.to;
      });
    }

    setFilteredOrders(filtered);
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const clearFilters = () => {
    setSearchQuery("");
    setDateRange({
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date(),
    });
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
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
            ? "Cancel Order"
            : confirmDialog.title.includes("Submit")
            ? "Submit"
            : "Confirm"
        }
      />

      {message && (
        <div
          className={`bg-${
            message.type === "success" ? "green-50" : "red-50"
          } dark:bg-${
            message.type === "success" ? "green-900/20" : "red-900/20"
          } border border-${
            message.type === "success" ? "green-200" : "red-200"
          } dark:border-${
            message.type === "success" ? "green-800" : "red-800"
          } rounded-lg p-4 flex items-start gap-3`}
        >
          <AlertCircle
            className={`w-5 h-5 text-${
              message.type === "success" ? "green-600" : "red-600"
            } dark:text-${
              message.type === "success" ? "green-400" : "red-400"
            } flex-shrink-0 mt-0.5`}
          />
          <p
            className={`text-${
              message.type === "success" ? "green-800" : "red-800"
            } dark:text-${
              message.type === "success" ? "green-200" : "red-200"
            } text-sm`}
          >
            {message.text}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            onClick={() => setShowNewSupplierForm(!showNewSupplierForm)}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showNewSupplierForm ? "Cancel" : "Add Supplier"}
          </Button>
          <Button
            onClick={() => {
              setEditingOrderId(null);
              setShowNewOrderForm(!showNewOrderForm);
            }}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showNewOrderForm ? "Cancel" : "New Order"}
          </Button>
        </div>
      </div>

      {showNewSupplierForm && (
        <NewSupplierInlineForm
          onClose={() => setShowNewSupplierForm(false)}
          onSuccess={() => {
            setShowNewSupplierForm(false);
            fetchPurchaseOrders();
          }}
        />
      )}

      {showNewOrderForm && (
        <NewOrderInlineForm
          editingOrderId={editingOrderId}
          editingOrder={
            editingOrderId
              ? orders.find((o) => o.order_id === editingOrderId)
              : undefined
          }
          onClose={() => {
            setShowNewOrderForm(false);
            setEditingOrderId(null);
          }}
          onSuccess={() => {
            setShowNewOrderForm(false);
            setEditingOrderId(null);
            fetchPurchaseOrders();
          }}
        />
      )}

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders..."
            className="input-base w-full pl-10"
          />
        </div>
        <DateRangeFilter
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
        {(searchQuery ||
          dateRange.from.getTime() !==
            new Date(
              new Date().setDate(new Date().getDate() - 30)
            ).getTime()) && (
          <Button onClick={clearFilters} variant="outline" size="sm">
            Clear Filters
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="card-base table-card overflow-hidden">
        {isLoadingOrders ? (
          <p className="p-6 text-center text-foreground text-sm">
            Loading purchase orders...
          </p>
        ) : filteredOrders.length === 0 ? (
          <p className="p-6 text-center text-foreground text-sm">
            No purchase orders found
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="reports-table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell w-10"></th>
                    <th className="table-header-cell text-left uppercase">
                      Order ID
                    </th>
                    <th className="table-header-cell text-left uppercase">
                      Supplier
                    </th>
                    <th className="table-header-cell text-left uppercase">
                      Date
                    </th>
                    <th className="table-header-cell text-right uppercase">
                      Grand Total
                    </th>
                    <th className="table-header-cell text-center uppercase">
                      Status
                    </th>
                    <th className="table-header-cell text-center uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedOrders.map((order) => {
                    const isExpanded = expandedOrders.has(order.order_id);
                    return (
                      <>
                        <tr key={order.order_id} className="table-row">
                          <td className="table-cell">
                            {order.items && order.items.length > 0 && (
                              <button
                                onClick={() =>
                                  toggleOrderExpansion(order.order_id)
                                }
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </td>
                          <td className="table-cell font-mono text-warning">
                            {order.order_id}
                          </td>
                          <td className="table-cell">{order.supplier}</td>
                          <td className="table-cell">
                            {new Date(order.date).toLocaleDateString()}
                          </td>
                          <td className="table-cell text-right font-semibold">
                            {currency}{" "}
                            {order.grand_total.toLocaleString("en-KE", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="table-cell text-center">
                            <span
                              className={`badge ${
                                order.status === "Draft"
                                  ? "badge-secondary"
                                  : order.status === "To Bill"
                                  ? "badge-warning"
                                  : order.status === "Completed"
                                  ? "badge-success"
                                  : "badge-info"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="table-cell text-center">
                            <TableActionButtons
                              showEdit={order.docstatus === 0}
                              onEdit={() => handleEditOrder(order.order_id)}
                              showSubmit={order.docstatus === 0}
                              onSubmit={() => handleSubmitOrder(order.order_id)}
                              showCancel={true}
                              showCreateReceipt={order.status !== "Draft"}
                              onCancel={() =>
                                handleCancelOrDeleteOrder(
                                  order.order_id,
                                  order.docstatus
                                )
                              }
                              onCreateReceipt={() =>
                                handleCreateReceipt(order.order_id)
                              }
                              docstatus={order.docstatus}
                              status={order.status}
                              size="sm"
                            />
                          </td>
                        </tr>
                        {isExpanded &&
                          order.items &&
                          order.items.length > 0 && (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50"
                              >
                                <div className="p-4">
                                  <h4 className="font-semibold text-sm mb-2">
                                    Items:
                                  </h4>
                                  <table className="reports-table text-xs">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-foreground">
                                      <tr>
                                        <th className="text-left p-2 font-semibold text-foreground">
                                          Item Code
                                        </th>
                                        <th className="text-left p-2 font-semibold text-foreground">
                                          Item Name
                                        </th>
                                        <th className="text-right p-2 font-semibold text-foreground">
                                          Quantity
                                        </th>
                                        <th className="text-right p-2 font-semibold text-foreground">
                                          Rate
                                        </th>
                                        <th className="text-right p-2 font-semibold text-foreground">
                                          Amount
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {order.items.map((item, idx) => (
                                        <tr
                                          key={idx}
                                          className="border-b border-slate-200 dark:border-slate-700"
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
                totalRecords={filteredOrders.length}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NewOrderInlineForm({
  onClose,
  onSuccess,
  editingOrderId,
  editingOrder,
}: {
  onClose: () => void;
  onSuccess: () => void;
  editingOrderId?: string | null;
  editingOrder?: PurchaseOrder;
}) {
  const [items, setItems] = useState<
    Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      buying_price: number;
    }>
  >(() => {
    if (editingOrder?.items && editingOrder.items.length > 0) {
      return editingOrder.items.map((i) => ({
        product_id: i.item_code,
        product_name: i.item_name,
        quantity: i.qty,
        buying_price: i.rate,
      }));
    }
    return [{ product_id: "", product_name: "", quantity: 1, buying_price: 0 }];
  });
  const [supplier, setSupplier] = useState(editingOrder?.supplier || "");
  const [supplierSearch, setSupplierSearch] = useState(
    editingOrder?.supplier || ""
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [productSearches, setProductSearches] = useState<string[]>(() => {
    if (editingOrder?.items && editingOrder.items.length > 0) {
      return editingOrder.items.map((i) => i.item_name);
    }
    return [""];
  });
  const [showProductDropdowns, setShowProductDropdowns] = useState<boolean[]>(
    () => {
      if (editingOrder?.items && editingOrder.items.length > 0) {
        return editingOrder.items.map(() => false);
      }
      return [false];
    }
  );
  const [requiredBy, setRequiredBy] = useState(editingOrder?.date || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currency } = useCurrency();

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers");
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.suppliers || []);
      }
    } catch (err) {
      console.error("[DukaPlus] Error fetching suppliers:", err);
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
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("[DukaPlus] Error fetching products:", err);
    }
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.supplier_name.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const getFilteredProducts = (search: string) => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase())
    );
  };

  const addItem = () => {
    setItems([
      ...items,
      { product_id: "", product_name: "", quantity: 1, buying_price: 0 },
    ]);
    setProductSearches([...productSearches, ""]);
    setShowProductDropdowns([...showProductDropdowns, false]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    setProductSearches(productSearches.filter((_, i) => i !== index));
    setShowProductDropdowns(showProductDropdowns.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    if (field === "product_id" && value) {
      const existingIndex = items.findIndex(
        (item, i) => i !== index && item.product_id === value
      );

      if (existingIndex !== -1) {
        // Product already exists, merge quantities
        const newItems = [...items];
        newItems[existingIndex].quantity += items[index].quantity || 1;
        newItems.splice(index, 1); // Remove the duplicate
        setItems(newItems);
        // Also update related arrays
        setProductSearches(productSearches.filter((_, i) => i !== index));
        setShowProductDropdowns(
          showProductDropdowns.filter((_, i) => i !== index)
        );
        return;
      }
    }

    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const selectProduct = (index: number, product: any) => {
    const existingItemIndex = items.findIndex(
      (item, idx) => idx !== index && item.product_id === product.id
    );

    if (existingItemIndex !== -1) {
      setError(`"${product.name}" is already in the list. Quantities merged.`);
      const newItems = [...items];
      newItems[existingItemIndex].quantity += items[index].quantity || 1;
      const updatedItems = newItems.filter((_, idx) => idx !== index);
      setItems(updatedItems);
      setProductSearches(productSearches.filter((_, idx) => idx !== index));
      setShowProductDropdowns(
        showProductDropdowns.filter((_, idx) => idx !== index)
      );
      setTimeout(() => setError(null), 3000);
    } else {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        product_id: product.id,
        product_name: product.name,
        buying_price: product.cost || 0,
      };
      setItems(newItems);

      const newSearches = [...productSearches];
      newSearches[index] = product.name;
      setProductSearches(newSearches);

      const newDropdowns = [...showProductDropdowns];
      newDropdowns[index] = false;
      setShowProductDropdowns(newDropdowns);
    }
  };

  const handleProductSearchChange = (index: number, searchValue: string) => {
    const newSearches = [...productSearches];
    newSearches[index] = searchValue;
    setProductSearches(newSearches);

    if (
      items[index].product_name &&
      searchValue !== items[index].product_name
    ) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        product_id: "",
        product_name: "",
        buying_price: 0,
      };
      setItems(newItems);
    }

    const newDropdowns = [...showProductDropdowns];
    newDropdowns[index] = true;
    setShowProductDropdowns(newDropdowns);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    console.log("[DukaPlus] Submit clicked - Starting validation");
    console.log("[DukaPlus] Supplier:", supplier);
    console.log("[DukaPlus] Items:", items);

    if (!supplier) {
      setError("Please select a supplier");
      return;
    }

    if (items.length === 0) {
      setError("Please add at least one item");
      return;
    }

    const invalidItems = items.filter(
      (i) => !i.product_id || !i.product_name || i.quantity <= 0
    );
    if (invalidItems.length > 0) {
      console.log("[DukaPlus] Invalid items found:", invalidItems);
      const emptyProducts = items.filter(
        (i) => !i.product_id || !i.product_name
      );
      if (emptyProducts.length > 0) {
        setError("Please select a product from the dropdown for all items");
      } else {
        setError("Please ensure all items have valid quantities");
      }
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const warehouseId = sessionStorage.getItem("selected_warehouse") || "";

      if (!warehouseId) {
        setError("No warehouse selected");
        setIsSaving(false);
        return;
      }

      let formattedDate = "";
      if (requiredBy) {
        const dateObj = new Date(requiredBy);
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const year = dateObj.getFullYear();
        formattedDate = `${month}-${day}-${year}`;
      }

      const payload: any = {
        ordered_items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          product_name: item.product_name,
          buying_price: item.buying_price,
        })),
        warehouse_id: warehouseId,
        supplier_id: supplier,
        required_by: formattedDate,
      };

      if (editingOrderId) {
        payload.order_id = editingOrderId;
      }

      console.log(
        "[DukaPlus] Submitting order with payload:",
        JSON.stringify(payload, null, 2)
      );

      const response = await fetch("/api/purchase-orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("[DukaPlus] Response status:", response.status);
      console.log("[DukaPlus] Response data:", data);

      if (response.ok) {
        console.log("[DukaPlus] Order created successfully!");
        onSuccess();
      } else {
        const errorMsg =
          data.message?.message ||
          data.message ||
          "Failed to create purchase order";
        setError(errorMsg);
        console.error("[DukaPlus] Order creation failed:", errorMsg);
      }
    } catch (err) {
      const errorMsg = "Error creating purchase order";
      setError(errorMsg);
      console.error("[DukaPlus] Exception during order creation:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card-base border-2 border-orange-300">
      <div className="flex justify-between items-center px-4 py-3 border-b border-border bg-orange-50 dark:bg-orange-950/20">
        <h3 className="text-base font-bold text-foreground">
          {editingOrderId ? "Edit Purchase Order" : "New Purchase Order"}
        </h3>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
        >
          ✕
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="p-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2.5 text-xs text-red-800 dark:text-red-200 flex items-start gap-2 mb-3">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="relative">
            <label className="block text-xs font-medium mb-1.5">
              Supplier <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={supplierSearch}
                onChange={(e) => {
                  setSupplierSearch(e.target.value);
                  setShowSupplierDropdown(true);
                }}
                onFocus={() => setShowSupplierDropdown(true)}
                className="input-base w-full h-9 text-sm pr-9"
                placeholder="Search supplier..."
                required
              />
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
            {showSupplierDropdown && filteredSuppliers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredSuppliers.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSupplier(s.supplier_name);
                      setSupplierSearch(s.supplier_name);
                      setShowSupplierDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm"
                  >
                    <span className="font-medium">{s.supplier_name}</span>
                    {s.mobile_number && (
                      <span className="text-xs text-secondary block">
                        {s.mobile_number}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium">Required By</label>
            <input
              type="date"
              value={requiredBy}
              onChange={(e) => setRequiredBy(e.target.value)}
              className="input-base w-full h-9 text-sm"
            />
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-medium">
              Items <span className="text-red-500">*</span>
            </label>
            <Button
              type="button"
              onClick={addItem}
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-transparent"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Item
            </Button>
          </div>

          <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-t-lg text-xs font-medium text-secondary">
            <div className="col-span-5">Product</div>
            <div className="col-span-2 text-center">Quantity</div>
            <div className="col-span-2 text-center">Price</div>
            <div className="col-span-2 text-right">Subtotal</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="sm:col-span-5 relative">
                  <label className="sm:hidden text-xs font-medium text-secondary mb-1 block">
                    Product
                  </label>
                  <input
                    type="text"
                    value={productSearches[index] || ""}
                    onChange={(e) =>
                      handleProductSearchChange(index, e.target.value)
                    }
                    onFocus={() => {
                      const newDropdowns = [...showProductDropdowns];
                      newDropdowns[index] = true;
                      setShowProductDropdowns(newDropdowns);
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        const newDropdowns = [...showProductDropdowns];
                        newDropdowns[index] = false;
                        setShowProductDropdowns(newDropdowns);
                      }, 200);
                    }}
                    className="input-base w-full h-8 text-sm"
                    placeholder="Search product..."
                    required
                  />
                  {showProductDropdowns[index] &&
                    getFilteredProducts(productSearches[index] || "").length >
                      0 && (
                      <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {getFilteredProducts(productSearches[index] || "")
                          .slice(0, 8)
                          .map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => selectProduct(index, p)}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs"
                            >
                              <div className="font-medium truncate">
                                {p.name}
                              </div>
                              <div className="text-[10px] text-secondary truncate">
                                {p.id} • {currency} {p.cost?.toFixed(2)} •
                                Stock: {p.quantity}
                              </div>
                            </button>
                          ))}
                      </div>
                    )}
                </div>

                <div className="sm:col-span-2">
                  <label className="sm:hidden text-xs font-medium text-secondary mb-1 block">
                    Qty
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "quantity",
                        Number.parseInt(e.target.value) || 0
                      )
                    }
                    className="input-base w-full h-8 text-sm text-center"
                    placeholder="Qty"
                    min="1"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="sm:hidden text-xs font-medium text-secondary mb-1 block">
                    Price
                  </label>
                  <input
                    type="number"
                    value={item.buying_price}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "buying_price",
                        Number.parseFloat(e.target.value) || 0
                      )
                    }
                    className="input-base w-full h-8 text-sm text-center"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="sm:col-span-2 flex items-center">
                  <label className="sm:hidden text-xs font-medium text-secondary mr-2">
                    Subtotal:
                  </label>
                  <div className="text-sm font-semibold text-foreground sm:text-right sm:w-full">
                    {currency} {(item.quantity * item.buying_price).toFixed(2)}
                  </div>
                </div>

                <div className="sm:col-span-1 flex items-center justify-end">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {items.length > 0 && (
            <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg flex justify-between items-center text-sm">
              <span className="font-medium">
                Total ({items.length} item{items.length > 1 ? "s" : ""}):
              </span>
              <span className="font-bold text-lg text-warning">
                {currency}{" "}
                {items
                  .reduce(
                    (sum, item) => sum + item.quantity * item.buying_price,
                    0
                  )
                  .toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="btn-cancel flex-1 h-9 text-sm"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-create flex-1 h-9 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            {isSaving
              ? "Saving..."
              : editingOrderId
              ? "Update Order"
              : "Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
}

function NewSupplierInlineForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [supplier, setSupplier] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currency } = useCurrency();

  const handleSubmit = async () => {
    if (!supplier || !mobileNumber) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch("/api/suppliers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier,
          mobile_number: mobileNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(data.message?.message || "Failed to create supplier");
      }
    } catch (err) {
      setError("Error creating supplier");
      console.error("[DukaPlus] Error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card-base p-6 mb-6 border-2 border-green-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Add Supplier</h3>
        <Button onClick={onClose} variant="ghost" size="sm">
          ✕
        </Button>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            Supplier Name *
          </label>
          <input
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="input-base w-full"
            placeholder="Enter supplier name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Mobile Number *
          </label>
          <input
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            className="input-base w-full"
            placeholder="0700000000"
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onClose}
          className="btn-cancel flex-1"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="btn-create flex-1"
          disabled={isSaving || !supplier || !mobileNumber}
        >
          {isSaving ? "Adding..." : "Add Supplier"}
        </button>
      </div>
    </div>
  );
}
