"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AlertCircle, Plus, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { TableActionButtons } from "@/components/ui/table-action-buttons"
import { useCurrency } from "@/hooks/use-currency"

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

interface Supplier {
  supplier: string
  mobile_number: string
}

export default function PurchaseOrdersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { formatCurrency } = useCurrency()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [showNewOrderModal, setShowNewOrderModal] = useState(false)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
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

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      fetchPurchaseOrders()
    }
  }, [user])

  const fetchPurchaseOrders = async () => {
    try {
      setIsLoadingOrders(true)
      const warehouseId = sessionStorage.getItem("selected_warehouse") || ""

      if (!warehouseId) {
        setError("Please select a warehouse first")
        setIsLoadingOrders(false)
        return
      }

      const response = await fetch(`/api/purchase-orders?warehouse_id=${encodeURIComponent(warehouseId)}`)
      const data = await response.json()

      if (response.ok && data.message?.purchase_orders) {
        setOrders(data.message.purchase_orders)
        setError(null)
      } else {
        setError(data.message?.message || "Failed to fetch purchase orders")
      }
    } catch (err) {
      setError("Error fetching purchase orders")
      console.error("[DukaPlus] Error fetching purchase orders:", err)
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const handleCancelOrder = async (orderId: string) => {
    setConfirmDialog({
      open: true,
      title: "Cancel Purchase Order?",
      description: `Cancel order ${orderId}? This action cannot be undone.`,
      action: async () => {
        try {
          const response = await fetch("/api/purchase-orders/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: orderId }),
          })

          if (response.ok) {
            fetchPurchaseOrders()
          } else {
            const data = await response.json()
            setError(data.message?.message || "Failed to cancel order")
          }
        } catch (err) {
          setError("Error cancelling order")
          console.error("[DukaPlus] Error cancelling order:", err)
        }
      },
    })
  }

  const handleCreateReceipt = async (orderId: string) => {
    // Implement the logic for creating a purchase receipt here
    console.log(`Creating receipt for order ${orderId}`)
  }

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
          confirmText="Cancel Order"
        />

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">Purchase Orders</h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Manage purchase orders and suppliers
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowSupplierModal(true)} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
            <Button onClick={() => setShowNewOrderModal(true)} size="sm" className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <div className="card-base p-4 sm:p-6">
          {isLoadingOrders ? (
            <p className="text-foreground p-6 text-center">Loading purchase orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-foreground text-center py-8">No purchase orders found</p>
          ) : (
            <div className="overflow-x-auto text-xs sm:text-sm">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell w-10"></th>
                    <th className="table-header-cell text-left">Order ID</th>
                    <th className="table-header-cell text-left">Supplier</th>
                    <th className="table-header-cell text-right">Grand Total</th>
                    <th className="table-header-cell text-center">Status</th>
                    <th className="table-header-cell text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => {
                    const isExpanded = expandedOrders.has(order.order_id)
                    return (
                      <>
                        <tr key={order.order_id} className="table-row">
                          <td className="px-2 sm:px-4 py-3">
                            {order.items && order.items.length > 0 && (
                              <button
                                onClick={() => toggleOrderExpansion(order.order_id)}
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
                          <td className="table-cell font-mono text-warning">{order.order_id}</td>
                          <td className="table-cell">{order.supplier}</td>
                          <td className="px-4 py-3 text-right text-warning font-semibold">
                            {formatCurrency(order.grand_total)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {order.status === "To Bill" ? (
                              <span className="badge-warning">{order.status}</span>
                            ) : (
                              <span className="badge-success">{order.status}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <TableActionButtons
                              showCancel={order.status !== "Draft"}
                              showCreateReceipt={order.status === "To Receive"}
                              onCancel={() => handleCancelOrder(order.order_id)}
                              onCreateReceipt={() => handleCreateReceipt(order.order_id)}
                              size="sm"
                            />
                          </td>
                        </tr>
                        {isExpanded && order.items && order.items.length > 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-2 bg-muted/30">
                              <div className="p-4">
                                <h4 className="font-semibold text-sm mb-2 text-foreground">Items:</h4>
                                <table className="w-full text-xs">
                                  <thead className="bg-muted">
                                    <tr>
                                      <th className="p-2 text-left text-xs font-semibold text-muted-foreground">
                                        Item Code
                                      </th>
                                      <th className="p-2 text-left text-xs font-semibold text-muted-foreground">
                                        Item Name
                                      </th>
                                      <th className="p-2 text-right text-xs font-semibold text-muted-foreground">
                                        Quantity
                                      </th>
                                      <th className="p-2 text-right text-xs font-semibold text-muted-foreground">
                                        Rate
                                      </th>
                                      <th className="p-2 text-right text-xs font-semibold text-muted-foreground">
                                        Amount
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.items.map((item, idx) => (
                                      <tr key={idx} className="border-b border-border">
                                        <td className="p-2 font-mono text-muted-foreground">{item.item_code}</td>
                                        <td className="p-2 text-foreground">{item.item_name}</td>
                                        <td className="p-2 text-right text-foreground">{item.qty}</td>
                                        <td className="p-2 text-right text-muted-foreground">
                                          {formatCurrency(item.rate)}
                                        </td>
                                        <td className="p-2 text-right font-semibold text-foreground">
                                          {formatCurrency(item.amount)}
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

      {showNewOrderModal && (
        <NewOrderModal
          onClose={() => setShowNewOrderModal(false)}
          onSuccess={() => {
            setShowNewOrderModal(false)
            fetchPurchaseOrders()
          }}
        />
      )}

      {showSupplierModal && (
        <NewSupplierModal
          onClose={() => setShowSupplierModal(false)}
          onSuccess={() => {
            setShowSupplierModal(false)
          }}
        />
      )}
    </DashboardLayout>
  )
}

function NewOrderModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [items, setItems] = useState<
    Array<{ product_id: string; product_name: string; quantity: number; buying_price: number }>
  >([{ product_id: "", product_name: "", quantity: 1, buying_price: 0 }])
  const [supplier, setSupplier] = useState("")
  const [requiredBy, setRequiredBy] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addItem = () => {
    setItems([...items, { product_id: "", product_name: "", quantity: 1, buying_price: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSubmit = async () => {
    try {
      setIsSaving(true)
      setError(null)
      const warehouseId = sessionStorage.getItem("selected_warehouse") || ""

      const response = await fetch("/api/purchase-orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ordered_items: items,
          warehouse_id: warehouseId,
          supplier_id: supplier,
          required_by: requiredBy,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
      } else {
        setError(data.message?.message || "Failed to create purchase order")
      }
    } catch (err) {
      setError("Error creating purchase order")
      console.error("[DukaPlus] Error:", err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="dialog-content w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="dialog-title">New Purchase Order</h2>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Supplier</label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="input-base w-full"
              placeholder="Enter supplier name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Required By</label>
            <input
              type="date"
              value={requiredBy}
              onChange={(e) => setRequiredBy(e.target.value)}
              className="input-base w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-foreground">Items</label>
              <Button onClick={addItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <input
                    type="text"
                    value={item.product_id}
                    onChange={(e) => updateItem(index, "product_id", e.target.value)}
                    className="input-base flex-1"
                    placeholder="Product ID"
                  />
                  <input
                    type="text"
                    value={item.product_name}
                    onChange={(e) => updateItem(index, "product_name", e.target.value)}
                    className="input-base flex-1"
                    placeholder="Product Name"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value) || 0)}
                    className="input-base w-20"
                    placeholder="Qty"
                    min="1"
                  />
                  <input
                    type="number"
                    value={item.buying_price}
                    onChange={(e) => updateItem(index, "buying_price", Number.parseFloat(e.target.value) || 0)}
                    className="input-base w-24"
                    placeholder="Price"
                    min="0"
                    step="0.01"
                  />
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border flex gap-2 sticky bottom-0 bg-card">
          <Button onClick={onClose} className="btn-cancel flex-1" disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="btn-success flex-1"
            disabled={isSaving || !supplier || items.length === 0}
          >
            {isSaving ? "Creating..." : "Create Order"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function NewSupplierModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [supplier, setSupplier] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch("/api/suppliers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier,
          mobile_number: mobileNumber,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
      } else {
        setError(data.message?.message || "Failed to create supplier")
      }
    } catch (err) {
      setError("Error creating supplier")
      console.error("[DukaPlus] Error:", err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="dialog-content w-full max-w-md">
        <div className="p-6 border-b border-border">
          <h2 className="dialog-title">Add Supplier</h2>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Supplier Name</label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="input-base w-full"
              placeholder="Enter supplier name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Mobile Number</label>
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="input-base w-full"
              placeholder="0700000000"
            />
          </div>
        </div>

        <div className="p-6 border-t border-border flex gap-2">
          <Button onClick={onClose} className="btn-cancel flex-1" disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="btn-success flex-1"
            disabled={isSaving || !supplier || !mobileNumber}
          >
            {isSaving ? "Adding..." : "Add Supplier"}
          </Button>
        </div>
      </div>
    </div>
  )
}
