"use client";

import { useState, useEffect, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { TableActionButtons } from "@/components/ui/table-action-buttons";
import { DateRangeFilter } from "@/components/reports/date-range-filter";
import { EnhancedPagination } from "@/components/reports/enhanced-pagination";

interface StockTransfer {
  material_transfer_id: string;
  from_warehouse: string | null;
  to_warehouse: string | null;
  posting_date: string;
  docstatus: number;
  items: {
    item_code: string;
    item_name: string;
    qty: number;
  }[];
}

interface TransferItem {
  item_code: string;
  qty: number;
}

interface Warehouse {
  warehouse_id: string;
  warehouse_name: string;
}

interface Product {
  id: string;
  name: string;
}

export function StockTransferManager() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sourceWarehouse, setSourceWarehouse] = useState("");
  const [targetWarehouse, setTargetWarehouse] = useState("");
  const [transferItems, setTransferItems] = useState<TransferItem[]>([
    { item_code: "", qty: 1 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "submitted" | "cancelled"
  >("all");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [expandedTransferId, setExpandedTransferId] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTransfers();
    fetchWarehouses();
    fetchProducts();
  }, []);

  const fetchTransfers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/inventory/stock-transfer");
      const data = await response.json();

      if (response.ok && data.message?.data) {
        setTransfers(data.message.data);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to fetch stock transfers",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error fetching stock transfers" });
      console.error("[DukaPlus] Error fetching stock transfers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch("/api/warehouses");
      const data = await response.json();

      if (response.ok && data.message?.warehouses) {
        setWarehouses(data.message.warehouses);
        if (!sourceWarehouse && data.message.warehouses.length > 0) {
          setSourceWarehouse(data.message.warehouses[0].warehouse_name);
        }
        if (!targetWarehouse && data.message.warehouses.length > 1) {
          setTargetWarehouse(data.message.warehouses[1].warehouse_name);
        }
      }
    } catch (error) {
      console.error("[DukaPlus] Error fetching warehouses:", error);
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

  const handleCreateTransfer = async () => {
    if (!sourceWarehouse || !targetWarehouse) {
      setMessage({
        type: "error",
        text: "Please select source and target warehouses",
      });
      return;
    }

    if (transferItems.some((item) => !item.item_code || item.qty <= 0)) {
      setMessage({
        type: "error",
        text: "Please fill all item details correctly",
      });
      return;
    }

    setConfirmDialog({
      open: true,
      title: "Create Stock Transfer?",
      description: `This will create a stock transfer from ${sourceWarehouse} to ${targetWarehouse} with ${transferItems.length} item(s).`,
      action: async () => {
        setIsSubmitting(true);
        setMessage(null);

        try {
          const response = await fetch("/api/inventory/stock-transfer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              source_warehouse: sourceWarehouse,
              target_warehouse: targetWarehouse,
              material_transfer_id: "",
              items: transferItems,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            setMessage({
              type: "success",
              text: "Stock transfer created successfully",
            });
            setShowCreateForm(false);
            setSourceWarehouse("");
            setTargetWarehouse("");
            setTransferItems([{ item_code: "", qty: 1 }]);
            fetchTransfers();
          } else {
            setMessage({
              type: "error",
              text: data.message || "Failed to create stock transfer",
            });
          }
        } catch (error) {
          setMessage({ type: "error", text: "Error creating stock transfer" });
          console.error("[DukaPlus] Error creating stock transfer:", error);
        } finally {
          setIsSubmitting(false);
        }
      },
      variant: "success",
    });
  };

  const handleSubmitTransfer = async (transferId: string) => {
    setConfirmDialog({
      open: true,
      title: "Submit Stock Transfer?",
      description: `Submit transfer ${transferId}? This will move items between warehouses. This action cannot be undone.`,
      action: async () => {
        try {
          const response = await fetch("/api/inventory/stock-transfer/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ material_transfer_id: transferId }),
          });

          const data = await response.json();

          if (response.ok) {
            setMessage({
              type: "success",
              text: "Stock transfer submitted successfully",
            });
            fetchTransfers();
          } else {
            setMessage({
              type: "error",
              text: data.message || "Failed to submit stock transfer",
            });
          }
        } catch (error) {
          setMessage({
            type: "error",
            text: "Error submitting stock transfer",
          });
          console.error("[DukaPlus] Error submitting stock transfer:", error);
        }
      },
      variant: "success",
    });
  };

  const handleCancelOrDeleteTransfer = async (
    transferId: string,
    docstatus: number
  ) => {
    const isDraft = docstatus === 0;

    setConfirmDialog({
      open: true,
      title: isDraft ? "Delete Stock Transfer?" : "Cancel Stock Transfer?",
      description: isDraft
        ? `This action will permanently delete transfer ${transferId}.`
        : `Cancel transfer ${transferId}? This action cannot be undone.`,
      action: async () => {
        try {
          const response = await fetch("/api/inventory/stock-transfer/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ material_transfer_id: transferId }),
          });

          const data = await response.json();

          if (response.ok) {
            setMessage({
              type: "success",
              text: isDraft
                ? "Stock transfer deleted successfully"
                : "Stock transfer cancelled successfully",
            });
            fetchTransfers();
          } else {
            setMessage({
              type: "error",
              text: data.message || "Failed to cancel/delete stock transfer",
            });
          }
        } catch (error) {
          setMessage({
            type: "error",
            text: "Error cancelling/deleting stock transfer",
          });
          console.error(
            "[DukaPlus] Error cancelling/deleting stock transfer:",
            error
          );
        }
      },
      variant: "danger",
    });
  };

  const addTransferItem = () => {
    const newItem = { item_code: "", qty: 1 };
    const updatedItems = [...transferItems, newItem];
    setTransferItems(updatedItems);
  };

  const removeTransferItem = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index));
  };

  const updateTransferItem = (
    index: number,
    field: keyof TransferItem,
    value: string | number
  ) => {
    if (field === "item_code") {
      const existingIndex = transferItems.findIndex(
        (item, i) => i !== index && item.item_code === value && value !== ""
      );

      if (existingIndex !== -1) {
        // Item already exists, merge quantities
        const updated = [...transferItems];
        updated[existingIndex].qty += transferItems[index].qty || 1;
        updated.splice(index, 1); // Remove the duplicate
        setTransferItems(updated);
        return;
      }
    }

    const updated = [...transferItems];
    updated[index] = {
      ...updated[index],
      [field]: field === "qty" ? Number(value) : value,
    };
    setTransferItems(updated);
  };

  const getStatusBadge = (docstatus: number) => {
    switch (docstatus) {
      case 0:
        return <span className="badge-warning">Draft</span>;
      case 1:
        return <span className="badge-success">Submitted</span>;
      case 2:
        return <span className="badge-danger">Cancelled</span>;
      default:
        return <span className="badge-secondary">Unknown</span>;
    }
  };

  const filteredTransfers = transfers
    .filter((transfer) => {
      const matchesSearch = transfer.material_transfer_id
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "draft" && transfer.docstatus === 0) ||
        (statusFilter === "submitted" && transfer.docstatus === 1) ||
        (statusFilter === "cancelled" && transfer.docstatus === 2);

      const transferDate = new Date(transfer.posting_date);
      const matchesDate =
        transferDate >= dateRange.from && transferDate <= dateRange.to;

      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort(
      (a, b) =>
        new Date(b.posting_date).getTime() - new Date(a.posting_date).getTime()
    );

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateRange({
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date(),
    });
    setCurrentPage(1);
  };

  const renderItemsTable = (items: StockTransfer["items"]) => {
    if (!items || items.length === 0) {
      return (
        <div className="p-4">
          <p className="text-muted-foreground text-sm">No items</p>
        </div>
      );
    }

    return (
      <div className="p-4">
        <h4 className="font-semibold text-sm mb-2 text-foreground">Items:</h4>
        <table className="reports-table text-xs">
          <thead className="bg-muted">
            <tr>
              <th className="table-header-cell text-left">Item Code</th>
              <th className="table-header-cell text-left">Item Name</th>
              <th className="table-header-cell text-right">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-border">
                <td className="p-2 font-mono text-muted-foreground">
                  {item.item_code}
                </td>
                <td className="p-2 text-foreground">
                  {item.item_name || "N/A"}
                </td>
                <td className="p-2 text-right text-foreground">{item.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

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

  const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransfers = filteredTransfers.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 p-6">
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.action}
        variant={confirmDialog.variant}
        confirmText={
          confirmDialog.variant === "danger" ? "Cancel Transfer" : "Confirm"
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
            <ArrowRightLeft className="w-6 h-6" />
            Stock Transfers
          </h2>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-create"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showCreateForm ? "Cancel" : "New Transfer"}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Input
            type="text"
            placeholder="Search transfers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-base flex-1"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input-base px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="cancelled">Cancelled</option>
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
          <div className="mb-6 p-4 border border-border rounded-lg bg-muted/50">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Create Stock Transfer
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Source Warehouse</label>
                  <select
                    value={sourceWarehouse}
                    onChange={(e) => setSourceWarehouse(e.target.value)}
                    className="w-full input-base"
                  >
                    <option value="">Select source warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option
                        key={warehouse.warehouse_id}
                        value={warehouse.warehouse_name}
                      >
                        {warehouse.warehouse_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Target Warehouse</label>
                  <select
                    value={targetWarehouse}
                    onChange={(e) => setTargetWarehouse(e.target.value)}
                    className="w-full input-base"
                  >
                    <option value="">Select target warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option
                        key={warehouse.warehouse_id}
                        value={warehouse.warehouse_name}
                      >
                        {warehouse.warehouse_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="form-label">Items</label>
                  <Button
                    onClick={addTransferItem}
                    size="sm"
                    className="btn-success text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Item
                  </Button>
                </div>
                {/* Column Headers */}
                <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-muted border-b border-border font-semibold text-sm text-foreground">
                  <div className="col-span-8">Product</div>
                  <div className="col-span-3">Quantity</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-border">
                  {transferItems.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors"
                    >
                      <select
                        value={item.item_code}
                        onChange={(e) =>
                          updateTransferItem(index, "item_code", e.target.value)
                        }
                        className="input-base col-span-8"
                      >
                        <option value="">Select product...</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) =>
                          updateTransferItem(index, "qty", e.target.value)
                        }
                        placeholder="0"
                        min="1"
                        className="input-base col-span-3"
                      />
                      <div className="col-span-1 flex justify-center">
                        {transferItems.length > 1 && (
                          <Button
                            onClick={() => removeTransferItem(index)}
                            size="sm"
                            variant="ghost"
                            className="action-btn-delete hover:text-danger"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateTransfer}
                  disabled={isSubmitting}
                  className="btn-create flex-1"
                >
                  {isSubmitting ? "Creating..." : "Create Transfer"}
                </Button>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  disabled={isSubmitting}
                  className="btn-cancel flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {!showCreateForm && (
          <div>
            {isLoading ? (
              <p className="text-foreground p-6 text-center">
                Loading stock transfers...
              </p>
            ) : filteredTransfers.length === 0 ? (
              <p className="text-foreground text-center py-8">
                {searchTerm ||
                statusFilter !== "all" ||
                (dateRange.from && dateRange.to)
                  ? "No transfers match your filters"
                  : "No stock transfers found"}
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="reports-table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell w-10"></th>
                        <th className="table-header-cell text-left">
                          TRANSFER ID
                        </th>
                        <th className="table-header-cell text-left">
                          FROM WAREHOUSE
                        </th>
                        <th className="table-header-cell text-left">
                          TO WAREHOUSE
                        </th>
                        <th className="table-header-cell text-left">DATE</th>
                        <th className="table-header-cell text-left">STATUS</th>
                        <th className="table-header-cell text-center">
                          ACTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedTransfers.map((transfer) => {
                        const isExpanded =
                          expandedTransferId === transfer.material_transfer_id;
                        return (
                          <Fragment key={transfer.material_transfer_id}>
                            <tr className="table-row">
                              <td className="px-2 sm:px-4 py-3">
                                {transfer.items &&
                                  transfer.items.length > 0 && (
                                    <button
                                      onClick={() =>
                                        setExpandedTransferId(
                                          isExpanded
                                            ? null
                                            : transfer.material_transfer_id
                                        )
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
                                {transfer.material_transfer_id}
                              </td>
                              <td className="table-cell">
                                {transfer.from_warehouse || "N/A"}
                              </td>
                              <td className="table-cell">
                                {transfer.to_warehouse || "N/A"}
                              </td>
                              <td className="table-cell">
                                {transfer.posting_date}
                              </td>
                              <td className="table-cell">
                                {getStatusBadge(transfer.docstatus)}
                              </td>
                              <td className="px-4 py-3">
                                {transfer.docstatus === 0 && (
                                  <TableActionButtons
                                    showSubmit={true}
                                    showCancel={true}
                                    onSubmit={() =>
                                      handleSubmitTransfer(
                                        transfer.material_transfer_id
                                      )
                                    }
                                    onCancel={() =>
                                      handleCancelOrDeleteTransfer(
                                        transfer.material_transfer_id,
                                        transfer.docstatus
                                      )
                                    }
                                    docstatus={transfer.docstatus}
                                    size="sm"
                                  />
                                )}
                                {transfer.docstatus === 1 && (
                                  <TableActionButtons
                                    showCancel={true}
                                    onCancel={() =>
                                      handleCancelOrDeleteTransfer(
                                        transfer.material_transfer_id,
                                        transfer.docstatus
                                      )
                                    }
                                    docstatus={transfer.docstatus}
                                    size="sm"
                                  />
                                )}
                                {transfer.docstatus === 2 && (
                                  <span className="text-foreground text-sm">
                                    Cancelled
                                  </span>
                                )}
                              </td>
                            </tr>
                            {isExpanded &&
                              transfer.items &&
                              transfer.items.length > 0 && (
                                <tr>
                                  <td
                                    colSpan={7}
                                    className="px-4 py-2 bg-muted/30"
                                  >
                                    {renderItemsTable(transfer.items)}
                                  </td>
                                </tr>
                              )}
                          </Fragment>
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
                    totalRecords={filteredTransfers.length}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
