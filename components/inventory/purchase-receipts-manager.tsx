"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Plus, ChevronDown, ChevronUp, FileText, Trash2, Search } from 'lucide-react'
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { TableActionButtons } from "@/components/ui/table-action-buttons"
import { DateRangeFilter } from "@/components/reports/date-range-filter"

interface PurchaseReceipt {
  name: string
  supplier: string
  status: string
  posting_date: string
  set_warehouse: string
  items: {
    item_code: string
    item_name: string
    qty: number
    rate: number
    amount: number
  }[]
}

interface PurchaseOrder {
  order_id: string
  supplier: string
  items: Array<{
    item_code: string
    item_name: string
    qty: number
    rate: number
    amount: number
  }>
  grand_total: number
  status: string
  docstatus: number
}

interface Product {
  id: string
  name: string
}

interface ReceiptItem {
  item_code: string
  qty: number
}

export function PurchaseReceiptsManager() {
  const [receipts, setReceipts] = useState<PurchaseReceipt[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [expandedReceipts, setExpandedReceipts] = useState<Set<string>>(new Set())
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [editingReceiptId, setEditingReceiptId] = useState("")
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([{ item_code: "", qty: 1 }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "submitted">("all")
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
  const [productSearchTerms, setProductSearchTerms] = useState<string[]>([""])
  const [showProductDropdowns, setShowProductDropdowns] = useState<boolean[]>([false])

  useEffect(() => {
    fetchReceipts()
    fetchOrders()
    fetchProducts()
  }, [])

  const fetchReceipts = async () => {
    try {
      setIsLoading(true)
      const warehouseId = sessionStorage.getItem("selected_warehouse") || ""
      const response = await fetch(`/api/purchase-receipts?warehouse_id=${encodeURIComponent(warehouseId)}`)
      const data = await response.json()

      if (response.ok && data.message?.data) {
        setReceipts(data.message.data)
      } else {
        setMessage({ type: "error", text: data.message || "Failed to fetch purchase receipts" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error fetching purchase receipts" })
      console.error("[DukaPlus] Error fetching purchase receipts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const warehouseId = sessionStorage.getItem("selected_warehouse") || ""

      if (!warehouseId) {
        console.error("[DukaPlus] No warehouse selected")
        return
      }

      const response = await fetch(`/api/purchase-orders?warehouse_id=${encodeURIComponent(warehouseId)}`)
      const data = await response.json()

      if (response.ok && data.message?.purchase_orders) {
        const ordersToReceive = data.message.purchase_orders.filter(
          (order: PurchaseOrder) => 
            order.status !== "Draft" && 
            order.status !== "Completed" && 
            order.status !== "Received" && 
            order.status !== "Cancelled"
        )
        setOrders(ordersToReceive)
        console.log("[DukaPlus] Loaded purchase orders for receipts:", ordersToReceive.length)
      }
    } catch (error) {
      console.error("[DukaPlus] Error fetching purchase orders:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const warehouseId = sessionStorage.getItem("selected_warehouse") || ""
      const response = await fetch(`/api/inventory/products?warehouse_id=${encodeURIComponent(warehouseId)}`)
      const data = await response.json()

      if (response.ok && data.products) {
        setProducts(data.products)
      }
    } catch (error) {
      console.error("[DukaPlus] Error fetching products:", error)
    }
  }

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId)
    const order = orders.find(o => o.order_id === orderId)
    if (order && order.items) {
      setReceiptItems(order.items.map(item => ({
        item_code: item.item_code,
        qty: item.qty
      })))
      // Set product display names for read-only view
      setProductSearchTerms(order.items.map(item => item.item_name))
      setShowProductDropdowns(order.items.map(() => false))
    } else {
      setReceiptItems([{ item_code: "", qty: 1 }])
      setProductSearchTerms([""])
      setShowProductDropdowns([false])
    }
  }

  const handleCreateOrUpdateReceipt = async () => {
    if (!selectedOrderId) {
      setMessage({ type: "error", text: "Please select a purchase order" })
      return
    }

    if (receiptItems.some((item) => !item.item_code || item.qty <= 0)) {
      setMessage({ type: "error", text: "Please fill all item details correctly" })
      return
    }

    const actionText = editingReceiptId ? "update" : "create"

    setConfirmDialog({
      open: true,
      title: `${editingReceiptId ? "Update" : "Create"} Purchase Receipt?`,
      description: `This will ${actionText} a purchase receipt for order ${selectedOrderId} with ${receiptItems.length} item(s).`,
      action: async () => {
        setIsSubmitting(true)
        setMessage(null)

        try {
          const response = await fetch("/api/purchase-receipts/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: selectedOrderId,
              purchase_receipt_id: editingReceiptId,
              items: receiptItems,
            }),
          })

          const data = await response.json()

          if (response.ok) {
            setMessage({ 
              type: "success", 
              text: data.message?.message || `Purchase receipt ${editingReceiptId ? "updated" : "created"} successfully` 
            })
            setShowCreateForm(false)
            setSelectedOrderId("")
            setEditingReceiptId("")
            setReceiptItems([{ item_code: "", qty: 1 }])
            setProductSearchTerms([""])
            setShowProductDropdowns([false])
            fetchReceipts()
            fetchOrders() // Refresh orders to update available orders
          } else {
            setMessage({ type: "error", text: data.message?.message || `Failed to ${actionText} purchase receipt` })
          }
        } catch (error) {
          setMessage({ type: "error", text: `Error ${actionText}ing purchase receipt` })
          console.error(`[DukaPlus] Error ${actionText}ing purchase receipt:`, error)
        } finally {
          setIsSubmitting(false)
        }
      },
      variant: "success",
    })
  }

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
          })

          const data = await response.json()

          if (response.ok) {
            setMessage({ type: "success", text: "Purchase receipt submitted successfully" })
            fetchReceipts()
          } else {
            setMessage({ type: "error", text: data.message?.message || "Failed to submit purchase receipt" })
          }
        } catch (error) {
          setMessage({ type: "error", text: "Error submitting purchase receipt" })
          console.error("[DukaPlus] Error submitting purchase receipt:", error)
        }
      },
      variant: "success",
    })
  }

  const handleCancelOrDeleteReceipt = async (receiptId: string, docstatus: number) => {
    const isDraft = docstatus === 0
    
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
            body: JSON.stringify({ receipt_id: receiptId }),
          })

          if (response.ok) {
            setMessage({ type: "success", text: `Purchase receipt ${isDraft ? 'deleted' : 'cancelled'} successfully` })
            fetchReceipts()
          } else {
            const data = await response.json()
            setMessage({ type: "error", text: data.message?.message || `Failed to ${isDraft ? 'delete' : 'cancel'} receipt` })
          }
        } catch (err) {
          setMessage({ type: "error", text: `Error ${isDraft ? 'deleting' : 'canceling'} receipt` })
          console.error("[DukaPlus] Error:", err)
        }
      },
      variant: "danger",
    })
  }

  const handleEditReceipt = (receipt: PurchaseReceipt) => {
    setEditingReceiptId(receipt.name)
    setReceiptItems(receipt.items.map(item => ({
      item_code: item.item_code,
      qty: item.qty
    })))
    setShowCreateForm(true)
    // Try to find matching order (might not exist if already fully received)
    const matchingOrder = orders.find(order => order.supplier === receipt.supplier)
    if (matchingOrder) {
      setSelectedOrderId(matchingOrder.order_id)
    }
    setProductSearchTerms(receipt.items.map(item => item.item_name))
    setShowProductDropdowns(receipt.items.map(() => false))
  }

  const addReceiptItem = () => {
    if (selectedOrderId) {
      setMessage({ type: "error", text: "Cannot add items. Items are from the selected purchase order." })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    setReceiptItems([...receiptItems, { item_code: "", qty: 1 }])
    setProductSearchTerms([...productSearchTerms, ""])
    setShowProductDropdowns([...showProductDropdowns, false])
  }

  const removeReceiptItem = (index: number) => {
    if (selectedOrderId) {
      setMessage({ type: "error", text: "Cannot remove items. Items are from the selected purchase order." })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    setReceiptItems(receiptItems.filter((_, i) => i !== index))
    setProductSearchTerms(productSearchTerms.filter((_, i) => i !== index))
    setShowProductDropdowns(showProductDropdowns.filter((_, i) => i !== index))
  }

  const selectProduct = (index: number, productId: string) => {
    if (selectedOrderId) {
      return
    }
    
    const existingItemIndex = receiptItems.findIndex((item, idx) => idx !== index && item.item_code === productId)
    
    if (existingItemIndex !== -1) {
      const newItems = [...receiptItems]
      newItems[existingItemIndex].qty += 1
      setReceiptItems(newItems.filter((_, idx) => idx !== index))
      setProductSearchTerms(productSearchTerms.filter((_, idx) => idx !== index))
      setShowProductDropdowns(showProductDropdowns.filter((_, idx) => idx !== index))
      const product = products.find(p => p.id === productId)
      setMessage({ type: "error", text: `"${product?.name || productId}" already in list. Quantity increased.` })
      setTimeout(() => setMessage(null), 3000)
    } else {
      updateReceiptItem(index, "item_code", productId)
      const product = products.find(p => p.id === productId)
      const newTerms = [...productSearchTerms]
      newTerms[index] = product ? product.name : productId
      setProductSearchTerms(newTerms)
      const newShow = [...showProductDropdowns]
      newShow[index] = false
      setShowProductDropdowns(newShow)
    }
  }

  const updateReceiptItem = (index: number, field: keyof ReceiptItem, value: string | number) => {
    const updated = [...receiptItems]
    updated[index] = { ...updated[index], [field]: field === "qty" ? Number(value) : value }
    setReceiptItems(updated)
  }

  const toggleReceiptExpansion = (receiptId: string) => {
    setExpandedReceipts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(receiptId)) {
        newSet.delete(receiptId)
      } else {
        newSet.add(receiptId)
      }
      return newSet
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft":
        return <span className="badge-warning">Draft</span>
      case "submitted":
        return <span className="badge-success">Submitted</span>
      default:
        return <span className="badge-secondary">{status}</span>
    }
  }

  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch =
      receipt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.supplier.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "draft" && receipt.status.toLowerCase() === "draft") ||
      (statusFilter === "submitted" && receipt.status.toLowerCase() === "submitted")

    const receiptDate = new Date(receipt.posting_date)
    const matchesDateRange = receiptDate >= dateRange.from && receiptDate <= dateRange.to

    return matchesSearch && matchesStatus && matchesDateRange
  })

  const getFilteredProducts = (searchTerm: string) => {
    if (!searchTerm) return products
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
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
        confirmText={confirmDialog.title.includes("Delete") ? "Delete" : confirmDialog.title.includes("Cancel") ? "Cancel Receipt" : "Confirm"}
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
            Purchase Receipts
          </h2>
          <Button 
            onClick={() => {
              setShowCreateForm(!showCreateForm)
              setEditingReceiptId("")
              setSelectedOrderId("")
              setReceiptItems([{ item_code: "", qty: 1 }])
              setProductSearchTerms([""])
              setShowProductDropdowns([false])
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
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
        </div>

        {showCreateForm && (
          <div className="mb-6 p-4 border border-border rounded-lg bg-muted/50">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {editingReceiptId ? "Edit Purchase Receipt" : "Create Purchase Receipt"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Purchase Order</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => handleOrderSelect(e.target.value)}
                  className="w-full input-base"
                  disabled={!!editingReceiptId}
                >
                  <option value="">Select purchase order</option>
                  {orders.map((order) => (
                    <option key={order.order_id} value={order.order_id}>
                      {order.order_id} - {order.supplier} (KES {order.grand_total.toFixed(2)})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Only submitted orders available for receiving are shown
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="form-label">Items</label>
                  {!selectedOrderId && (
                    <Button onClick={addReceiptItem} size="sm" className="btn-success text-xs">
                      <Plus className="w-3 h-3 mr-1" />
                      Add Item
                    </Button>
                  )}
                </div>
                {selectedOrderId && (
                  <p className="text-xs text-muted-foreground mb-2 italic">
                    Items from purchase order. You can only adjust quantities.
                  </p>
                )}
                <div className="space-y-2">
                  {receiptItems.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1 relative">
                        {selectedOrderId ? (
                          <input
                            type="text"
                            value={productSearchTerms[index] || ""}
                            readOnly
                            className="input-base w-full bg-muted/50 cursor-not-allowed"
                            title="Item from purchase order - cannot be changed"
                          />
                        ) : (
                          <>
                            <div className="relative">
                              <input
                                type="text"
                                value={productSearchTerms[index] || ""}
                                onChange={(e) => {
                                  const newTerms = [...productSearchTerms]
                                  newTerms[index] = e.target.value
                                  setProductSearchTerms(newTerms)
                                  const newShow = [...showProductDropdowns]
                                  newShow[index] = true
                                  setShowProductDropdowns(newShow)
                                }}
                                onFocus={() => {
                                  const newShow = [...showProductDropdowns]
                                  newShow[index] = true
                                  setShowProductDropdowns(newShow)
                                }}
                                placeholder="Search product..."
                                className="input-base w-full pr-8"
                              />
                              <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            </div>
                            {showProductDropdowns[index] && (
                              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {getFilteredProducts(productSearchTerms[index]).length === 0 ? (
                                  <div className="p-2 text-sm text-muted-foreground">No products found</div>
                                ) : (
                                  getFilteredProducts(productSearchTerms[index]).map((product) => (
                                    <button
                                      key={product.id}
                                      onClick={() => selectProduct(index, product.id)}
                                      className="w-full p-2 text-left hover:bg-muted transition-colors text-sm"
                                    >
                                      <div className="font-medium text-foreground">{product.name}</div>
                                      <div className="text-xs text-muted-foreground">{product.id}</div>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateReceiptItem(index, "qty", e.target.value)}
                        placeholder="Quantity"
                        min="1"
                        className="input-base w-32"
                      />
                      {receiptItems.length > 1 && !selectedOrderId && (
                        <Button
                          onClick={() => removeReceiptItem(index)}
                          size="sm"
                          variant="ghost"
                          className="action-btn-delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateOrUpdateReceipt} disabled={isSubmitting} className="btn-create flex-1">
                  {isSubmitting ? (editingReceiptId ? "Updating..." : "Creating...") : (editingReceiptId ? "Update Receipt" : "Create Receipt")}
                </Button>
                <Button 
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingReceiptId("")
                    setSelectedOrderId("")
                    setReceiptItems([{ item_code: "", qty: 1 }])
                    setProductSearchTerms([""])
                    setShowProductDropdowns([false])
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
          <p className="text-foreground p-6 text-center">Loading purchase receipts...</p>
        ) : filteredReceipts.length === 0 ? (
          <p className="text-foreground text-center py-8">
            {searchTerm || statusFilter !== "all" || (dateRange.from && dateRange.to) ? "No receipts match your filters" : "No purchase receipts found"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell w-10"></th>
                  <th className="table-header-cell text-left">Receipt ID</th>
                  <th className="table-header-cell text-left">Supplier</th>
                  <th className="table-header-cell text-left">Warehouse</th>
                  <th className="table-header-cell text-left">Date</th>
                  <th className="table-header-cell text-left">Status</th>
                  <th className="table-header-cell text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredReceipts.map((receipt) => {
                  const isExpanded = expandedReceipts.has(receipt.name)
                  const docstatus = receipt.status.toLowerCase() === "draft" ? 0 : 1
                  
                  return (
                    <>
                      <tr key={receipt.name} className="table-row">
                        <td className="px-2 sm:px-4 py-3">
                          {receipt.items && receipt.items.length > 0 && (
                            <button
                              onClick={() => toggleReceiptExpansion(receipt.name)}
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
                        <td className="table-cell font-mono text-warning text-sm">{receipt.name}</td>
                        <td className="table-cell">{receipt.supplier}</td>
                        <td className="table-cell">{receipt.set_warehouse}</td>
                        <td className="table-cell">{receipt.posting_date}</td>
                        <td className="table-cell">{getStatusBadge(receipt.status)}</td>
                        <td className="px-4 py-3">
                          {receipt.status.toLowerCase() === "draft" && (
                            <TableActionButtons
                              showEdit={true}
                              showSubmit={true}
                              showCancel={true}
                              onEdit={() => handleEditReceipt(receipt)}
                              onSubmit={() => handleSubmitReceipt(receipt.name)}
                              onCancel={() => handleCancelOrDeleteReceipt(receipt.name, docstatus)}
                              docstatus={docstatus}
                              status={receipt.status}
                            />
                          )}
                          {receipt.status.toLowerCase() === "submitted" && (
                            <TableActionButtons
                              showCancel={true}
                              onCancel={() => handleCancelOrDeleteReceipt(receipt.name, docstatus)}
                              docstatus={docstatus}
                              status={receipt.status}
                            />
                          )}
                        </td>
                      </tr>
                      {isExpanded && receipt.items && receipt.items.length > 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-2 bg-muted/30">
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
                                  {receipt.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-border">
                                      <td className="p-2 font-mono text-muted-foreground">{item.item_code}</td>
                                      <td className="p-2 text-foreground">{item.item_name}</td>
                                      <td className="p-2 text-right text-foreground">{item.qty}</td>
                                      <td className="p-2 text-right text-muted-foreground">
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
    </div>
  )
}
