"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle, Plus, Trash2, ArrowRightLeft } from 'lucide-react'

interface StockTransfer {
  material_transfer_id: string
  from_warehouse: string | null
  to_warehouse: string | null
  posting_date: string
  docstatus: number
  items: {
    item_code: string
    item_name: string
    qty: number
  }[]
}

interface TransferItem {
  item_code: string
  qty: number
}

interface Warehouse {
  warehouse_id: string
  warehouse_name: string
}

interface Product {
  id: string
  name: string
}

export function StockTransferManager() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [sourceWarehouse, setSourceWarehouse] = useState("")
  const [targetWarehouse, setTargetWarehouse] = useState("")
  const [transferItems, setTransferItems] = useState<TransferItem[]>([{ item_code: "", qty: 1 }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "submitted" | "cancelled">("all")

  useEffect(() => {
    fetchTransfers()
    fetchWarehouses()
    fetchProducts()
  }, [])

  const fetchTransfers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/inventory/stock-transfer")
      const data = await response.json()

      if (response.ok && data.message?.data) {
        setTransfers(data.message.data)
      } else {
        setMessage({ type: "error", text: data.message || "Failed to fetch stock transfers" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error fetching stock transfers" })
      console.error("[DukaPlus] Error fetching stock transfers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWarehouses = async () => {
    try {
      const response = await fetch("/api/warehouses")
      const data = await response.json()

      if (response.ok && data.message?.warehouses) {
        setWarehouses(data.message.warehouses)
        if (!sourceWarehouse && data.message.warehouses.length > 0) {
          setSourceWarehouse(data.message.warehouses[0].warehouse_name)
        }
        if (!targetWarehouse && data.message.warehouses.length > 1) {
          setTargetWarehouse(data.message.warehouses[1].warehouse_name)
        }
      }
    } catch (error) {
      console.error("[DukaPlus] Error fetching warehouses:", error)
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

  const handleCreateTransfer = async () => {
    if (!sourceWarehouse || !targetWarehouse) {
      setMessage({ type: "error", text: "Please select source and target warehouses" })
      return
    }

    if (transferItems.some((item) => !item.item_code || item.qty <= 0)) {
      setMessage({ type: "error", text: "Please fill all item details correctly" })
      return
    }

    const confirmed = window.confirm(
      `Create stock transfer?\n\nFrom: ${sourceWarehouse}\nTo: ${targetWarehouse}\nItems: ${transferItems.length}`
    )
    
    if (!confirmed) return

    setIsSubmitting(true)
    setMessage(null)

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
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: "Stock transfer created successfully" })
        setShowCreateForm(false)
        setSourceWarehouse("")
        setTargetWarehouse("")
        setTransferItems([{ item_code: "", qty: 1 }])
        fetchTransfers()
      } else {
        setMessage({ type: "error", text: data.message || "Failed to create stock transfer" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error creating stock transfer" })
      console.error("[DukaPlus] Error creating stock transfer:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitTransfer = async (transferId: string) => {
    const confirmed = window.confirm(
      `Submit stock transfer ${transferId}?\n\nThis will move the items between warehouses.\nThis action cannot be undone.`
    )
    
    if (!confirmed) return

    try {
      const response = await fetch("/api/inventory/stock-transfer/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material_transfer_id: transferId }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: "Stock transfer submitted successfully" })
        fetchTransfers()
      } else {
        setMessage({ type: "error", text: data.message || "Failed to submit stock transfer" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error submitting stock transfer" })
      console.error("[DukaPlus] Error submitting stock transfer:", error)
    }
  }

  const handleCancelTransfer = async (transferId: string) => {
    const confirmed = window.confirm(
      `Cancel stock transfer ${transferId}?\n\nThis action cannot be undone.`
    )
    
    if (!confirmed) return

    try {
      const response = await fetch("/api/inventory/stock-transfer/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material_transfer_id: transferId }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: "Stock transfer cancelled successfully" })
        fetchTransfers()
      } else {
        setMessage({ type: "error", text: data.message || "Failed to cancel stock transfer" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error cancelling stock transfer" })
      console.error("[DukaPlus] Error cancelling stock transfer:", error)
    }
  }

  const addTransferItem = () => {
    setTransferItems([...transferItems, { item_code: "", qty: 1 }])
  }

  const removeTransferItem = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index))
  }

  const updateTransferItem = (index: number, field: keyof TransferItem, value: string | number) => {
    const updated = [...transferItems]
    updated[index] = { ...updated[index], [field]: field === "qty" ? Number(value) : value }
    setTransferItems(updated)
  }

  const getStatusBadge = (docstatus: number) => {
    switch (docstatus) {
      case 0:
        return <span className="badge-warning">Draft</span>
      case 1:
        return <span className="badge-success">Submitted</span>
      case 2:
        return <span className="badge-danger">Cancelled</span>
      default:
        return <span className="badge-secondary">Unknown</span>
    }
  }

  const filteredTransfers = transfers.filter((transfer) => {
    const matchesSearch =
      transfer.material_transfer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.from_warehouse?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.to_warehouse?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "draft" && transfer.docstatus === 0) ||
      (statusFilter === "submitted" && transfer.docstatus === 1) ||
      (statusFilter === "cancelled" && transfer.docstatus === 2)

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
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
            <ArrowRightLeft className="w-6 h-6" />
            Stock Transfers
          </h2>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-create">
            <Plus className="w-4 h-4 mr-2" />
            {showCreateForm ? "Cancel" : "New Transfer"}
          </Button>
        </div>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Search transfers..."
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
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {showCreateForm && (
          <div className="mb-6 p-4 border border-border rounded-lg bg-muted/50">
            <h3 className="text-lg font-semibold text-foreground mb-4">Create Stock Transfer</h3>
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
                      <option key={warehouse.warehouse_id} value={warehouse.warehouse_name}>
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
                      <option key={warehouse.warehouse_id} value={warehouse.warehouse_name}>
                        {warehouse.warehouse_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="form-label">Items</label>
                  <Button onClick={addTransferItem} size="sm" className="btn-success text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Add Item
                  </Button>
                </div>
                <div className="space-y-2">
                  {transferItems.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={item.item_code}
                        onChange={(e) => updateTransferItem(index, "item_code", e.target.value)}
                        className="input-base flex-1"
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
                        onChange={(e) => updateTransferItem(index, "qty", e.target.value)}
                        placeholder="Quantity"
                        min="1"
                        className="input-base w-32"
                      />
                      {transferItems.length > 1 && (
                        <Button
                          onClick={() => removeTransferItem(index)}
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
                <Button onClick={handleCreateTransfer} disabled={isSubmitting} className="btn-create flex-1">
                  {isSubmitting ? "Creating..." : "Create Transfer"}
                </Button>
                <Button onClick={() => setShowCreateForm(false)} disabled={isSubmitting} className="btn-cancel flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-foreground p-6 text-center">Loading stock transfers...</p>
        ) : filteredTransfers.length === 0 ? (
          <p className="text-foreground text-center py-8">
            {searchTerm || statusFilter !== "all" ? "No transfers match your filters" : "No stock transfers found"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3 text-left">Transfer ID</th>
                  <th className="px-4 py-3 text-left">From Warehouse</th>
                  <th className="px-4 py-3 text-left">To Warehouse</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransfers.map((transfer) => (
                  <tr key={transfer.material_transfer_id} className="table-row">
                    <td className="px-4 py-3 font-mono text-warning text-sm">{transfer.material_transfer_id}</td>
                    <td className="px-4 py-3 text-foreground">{transfer.from_warehouse || "N/A"}</td>
                    <td className="px-4 py-3 text-foreground">{transfer.to_warehouse || "N/A"}</td>
                    <td className="px-4 py-3 text-foreground">{transfer.posting_date}</td>
                    <td className="px-4 py-3">{getStatusBadge(transfer.docstatus)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {transfer.docstatus === 0 && (
                          <>
                            <Button
                              onClick={() => handleSubmitTransfer(transfer.material_transfer_id)}
                              size="sm"
                              className="btn-success text-xs px-3"
                            >
                              Submit
                            </Button>
                            <Button
                              onClick={() => handleCancelTransfer(transfer.material_transfer_id)}
                              size="sm"
                              className="btn-danger text-xs px-3"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {transfer.docstatus === 1 && (
                          <Button
                            onClick={() => handleCancelTransfer(transfer.material_transfer_id)}
                            size="sm"
                            className="btn-danger text-xs px-3"
                          >
                            Cancel
                          </Button>
                        )}
                        {transfer.docstatus === 2 && <span className="text-foreground text-sm">Cancelled</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
