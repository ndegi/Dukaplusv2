"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTrashAlt, faExclamationCircle } from "@fortawesome/free-solid-svg-icons"
import { formatCurrency, formatNumber } from "@/lib/utils/format"
import { PaymentModal } from "@/components/pos/payment-modal"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  subtotal: number
  unit_of_measure?: string
  sellingPrices?: Array<{ unit_of_measure: string; unit_selling_price: number }>
  all_selling_prices?: Array<{ unit_of_measure: string; unit_selling_price: number }>
}

interface CartSummaryProps {
  cart: CartItem[]
  totalAmount: number
  onUpdateQuantity: (id: string, quantity: number, price?: number, unit?: string) => void
  onRemoveItem: (id: string) => void
  onCheckout: () => void
  onClearCart: () => void
  warehouse?: string
  user?: string
  customerName?: string
  mobileNumber?: string
}

export function CartSummary({
  cart,
  totalAmount,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onClearCart,
  warehouse = "",
  user = "",
  customerName = "Walk In",
  mobileNumber = "",
}: CartSummaryProps) {
  const [queuedCount, setQueuedCount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftReceipts, setDraftReceipts] = useState<any[]>([])
  const [showQueueModal, setShowQueueModal] = useState(false)
  const [actualWarehouse, setActualWarehouse] = useState("")
  const [paymentModalData, setPaymentModalData] = useState<{
    salesId: string
    total: number
    items: any[]
  } | null>(null)

  useEffect(() => {
    const storedWarehouse = sessionStorage.getItem("selected_warehouse")
    if (storedWarehouse) {
      setActualWarehouse(storedWarehouse)
    }
  }, [])

  useEffect(() => {
    const handleWarehouseChange = () => {
      if (cart.length > 0) {
        onClearCart()
        setQueuedCount(0)
      }
    }

    window.addEventListener("warehouseChanged", handleWarehouseChange)
    return () => window.removeEventListener("warehouseChanged", handleWarehouseChange)
  }, [cart.length, onClearCart])

  useEffect(() => {
    fetchDraftReceipts()
  }, [actualWarehouse])

  const fetchDraftReceipts = async () => {
    if (!actualWarehouse) {
      console.log("[v0] No warehouse selected, skipping draft fetch")
      return
    }

    try {
      console.log("[v0] Fetching drafts for warehouse:", actualWarehouse)
      const response = await fetch(`/api/sales/draft?warehouse_id=${encodeURIComponent(actualWarehouse)}`)
      const data = await response.json()

      console.log("[v0] Draft receipts response:", data)

      if (response.ok) {
        if (data.message?.sales_data && Array.isArray(data.message.sales_data)) {
          setDraftReceipts(data.message.sales_data)
          setQueuedCount(data.message.sales_data.length)
          console.log("[v0] Successfully loaded", data.message.sales_data.length, "draft receipts")
        } else {
          console.log("[v0] No draft receipts found")
          setDraftReceipts([])
          setQueuedCount(0)
        }
      } else {
        console.error("[v0] API error fetching drafts:", data.message?.message || data.message || "Unknown error")
        setDraftReceipts([])
        setQueuedCount(0)
      }
    } catch (err) {
      console.error("[v0] Error fetching draft receipts:", err)
      setDraftReceipts([])
      setQueuedCount(0)
    }
  }

  const handleQueueCart = async () => {
    if (cart.length === 0) return

    try {
      setIsProcessing(true)
      setError(null)

      const invoiceItems = cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        product_name: item.name,
        product_price: item.price,
        unit_of_measure: item.unit_of_measure || "Each",
      }))

      const response = await fetch("/api/sales/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_items: invoiceItems,
          warehouse_id: actualWarehouse,
          customer_name: customerName,
          customer_id: customerName,
          total_sales_price: totalAmount,
          mobile_number: mobileNumber,
          logged_in_user: user,
          location: "",
          sales_id: "",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchDraftReceipts()
        onClearCart()
      } else {
        setError(data.message?.message || "Failed to queue invoice")
      }
    } catch (err) {
      setError("Error queueing invoice")
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLoadDraft = (draft: any) => {
    if (draft.status === "paid" || draft.status === 1) {
      // If already paid, load into cart
      onClearCart()

      if (draft.items && Array.isArray(draft.items)) {
        const loadEvent = new CustomEvent("loadDraftItems", {
          detail: {
            items: draft.items.map((item: any) => ({
              item_code: item.item_code,
              item_name: item.item_name,
              qty: item.qty,
              rate: item.rate,
              amount: item.amount,
            })),
            customer: draft.customer || "Walk In",
            mobile: draft.store_mobile_number || "",
          },
        })
        window.dispatchEvent(loadEvent)
      }

      setShowQueueModal(false)
    } else {
      // If unpaid, show payment modal for completing the receipt
      setPaymentModalData({
        salesId: draft.sales_id,
        total: draft.total_amount || 0,
        items: draft.items || [],
      })
    }
  }

  const handleUnitChange = (itemId: string, newUnit: string) => {
    const item = cart.find((i) => i.id === itemId)
    const prices = item?.sellingPrices || item?.all_selling_prices
    if (prices) {
      const selectedPrice = prices.find((p) => p.unit_of_measure === newUnit)
      if (selectedPrice) {
        onUpdateQuantity(itemId, item.quantity, selectedPrice.unit_selling_price, newUnit)
      }
    }
  }

  const handlePriceChange = (itemId: string, newPrice: number) => {
    const item = cart.find((i) => i.id === itemId)
    if (item) {
      onUpdateQuantity(itemId, item.quantity, newPrice, item.unit_of_measure)
    }
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Error message */}
      {error && (
        <div className="mx-4 mt-3 alert-error flex items-start gap-2">
          <FontAwesomeIcon icon={faExclamationCircle} className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
          <p className="text-danger text-xs">{error}</p>
        </div>
      )}

      {cart.length > 0 && (
        <div
          className="px-4 py-3 table-header grid gap-2 text-xs font-semibold border-b border-border"
          style={{ gridTemplateColumns: "2fr 1fr 1.5fr 1fr 1fr" }}
        >
          <div className="table-cell">Name</div>
          <div className="table-cell text-center">QTY</div>
          <div className="table-cell text-center">UOM</div>
          <div className="table-cell text-right">Rate</div>
          <div className="table-cell text-right">Amount</div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 space-y-2 py-3">
        {cart.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Cart is empty</p>
          </div>
        ) : (
          cart.map((item) => {
            const prices = item.all_selling_prices || item.sellingPrices || []
            const hasMultiplePrices = prices.length > 1
            const currentUom = item.unit_of_measure || (prices.length > 0 ? prices[0]?.unit_of_measure : "Each")

            return (
              <div
                key={item.id}
                className="grid gap-2 items-center h-16 bg-muted/50 p-2 rounded-lg hover:bg-muted transition-colors"
                style={{ gridTemplateColumns: "2fr 1fr 1.5fr 1fr 1fr" }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-danger hover:text-red-700 dark:hover:text-red-300 flex-shrink-0"
                  >
                    <FontAwesomeIcon icon={faTrashAlt} className="text-xs" />
                  </button>
                  <span className="text-xs font-medium text-foreground truncate" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <div>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(item.id, Number(e.target.value) || 1)}
                    className="h-7 input-base text-center text-xs"
                  />
                </div>
                <div>
                  {hasMultiplePrices ? (
                    <Select value={currentUom} onValueChange={(val) => handleUnitChange(item.id, val)}>
                      <SelectTrigger className="h-7 input-base text-xs">
                        <SelectValue placeholder={currentUom} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {prices.map((sp) => (
                          <SelectItem
                            key={sp.unit_of_measure}
                            value={sp.unit_of_measure}
                            className="text-foreground text-xs"
                          >
                            {sp.unit_of_measure} ({formatNumber(sp.unit_selling_price)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-foreground text-xs pl-2 block leading-7">{currentUom}</span>
                  )}
                </div>
                <div>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => handlePriceChange(item.id, Number(e.target.value) || 0)}
                    className="h-7 input-base text-center text-xs"
                  />
                </div>
                <div className="text-right text-foreground font-semibold text-xs">
                  {formatNumber(item.quantity * item.price)}
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="border-t border-border px-4 py-3 space-y-2 bg-card">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-foreground">Total: ({cart.length} items)</span>
          <span className="text-lg font-bold text-success">{formatCurrency(totalAmount)}</span>
        </div>

        <Button
          onClick={onCheckout}
          disabled={cart.length === 0 || isProcessing}
          className="w-full btn-success h-12 text-base uppercase rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          CHECKOUT ({formatCurrency(totalAmount)})
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleQueueCart}
            disabled={cart.length === 0 || isProcessing}
            className="btn-warning h-12 text-base uppercase rounded-lg disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "QUEUE"}
          </Button>
          <Button
            onClick={() => setShowQueueModal(true)}
            disabled={queuedCount === 0}
            className="btn-disabled h-12 text-base uppercase rounded-lg"
          >
            QUEUED ({queuedCount})
          </Button>
        </div>
      </div>

      {showQueueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Queued Receipts</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {draftReceipts.map((draft) => (
                <div
                  key={draft.sales_id}
                  className="card-base p-4 hover:bg-muted cursor-pointer"
                  onClick={() => handleLoadDraft(draft)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-sm text-warning">{draft.sales_id}</p>
                      <p className="text-foreground font-medium">{draft.customer}</p>
                      <p className="text-xs text-muted-foreground">
                        {draft.date} {draft.time}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">{draft.items?.length || 0} items</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">
                        KES {draft.total_amount?.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {draft.status === "paid" || draft.status === 1 ? "✓ Paid" : "Pending"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border">
              <Button onClick={() => setShowQueueModal(false)} className="w-full btn-cancel">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {paymentModalData && (
        <div className="fixed inset-0 z-50">
          <PaymentModal
            totalAmount={paymentModalData.total}
            itemCount={paymentModalData.items.length}
            cartItems={paymentModalData.items.map((item: any) => ({
              id: item.item_code,
              name: item.item_name,
              price: item.rate,
              quantity: item.qty,
              subtotal: item.amount,
            }))}
            invoiceId={paymentModalData.salesId}
            isInvoicePayment={true}
            onClose={() => {
              setPaymentModalData(null)
              setShowQueueModal(false)
            }}
            onSuccess={() => {
              setPaymentModalData(null)
              setShowQueueModal(false)
              fetchDraftReceipts()
            }}
          />
        </div>
      )}
    </div>
  )
}
