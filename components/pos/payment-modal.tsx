"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle, Plus, Trash2, Calendar, Smartphone } from "lucide-react"

interface PaymentMode {
  mode_of_payment: string
  type?: string
}

interface PaymentModalProps {
  totalAmount: number
  itemCount: number
  cartItems: any[]
  onClose: () => void
  onSuccess: () => void
  customerName?: string
  mobileNumber?: string
  invoiceId?: string
  isInvoicePayment?: boolean
}

interface PaymentSplit {
  id: number
  mode: string
  amount: number
  reference?: string
  phone?: string
  isPaid?: boolean
}

export function PaymentModal({
  totalAmount,
  itemCount,
  cartItems,
  onClose,
  onSuccess,
  customerName: initialCustomerName = "Walk In",
  mobileNumber: initialMobileNumber = "",
  invoiceId,
  isInvoicePayment = false,
}: PaymentModalProps) {
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([])
  const [splitPayments, setSplitPayments] = useState<PaymentSplit[]>([
    { id: 1, mode: "Cash", amount: totalAmount, isPaid: false },
  ])
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [salesDate, setSalesDate] = useState(new Date().toISOString().split("T")[0])
  const [customerName, setCustomerName] = useState(initialCustomerName)
  const [mobileNumber, setMobileNumber] = useState(initialMobileNumber)

  useEffect(() => {
    setCustomerName(initialCustomerName)
    setMobileNumber(initialMobileNumber)
  }, [initialCustomerName, initialMobileNumber])

  useEffect(() => {
    fetchPaymentModes()
  }, [])

  const fetchPaymentModes = async () => {
    try {
      const response = await fetch("/api/payments/modes")
      if (response.ok) {
        const data = await response.json()
        const modes = data.message?.modes_of_payments || data.modes || data.message?.modes_of_payment || []
        const modesList = Array.isArray(modes) ? modes : []
        setPaymentModes(modesList)
        if (modesList.length > 0) {
          setSplitPayments([
            { id: 1, mode: modesList[0].mode_of_payment || "Cash", amount: totalAmount, isPaid: false },
          ])
        }
      }
    } catch (error) {
      console.error("[v0] Failed to fetch payment modes:", error)
      setPaymentModes([
        { mode_of_payment: "Cash" },
        { mode_of_payment: "Mpesa" },
        { mode_of_payment: "Card" },
        { mode_of_payment: "Paid to Till" },
      ])
    }
  }

  const totalPaid = splitPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const remaining = totalAmount - totalPaid
  const isPaymentComplete = Math.abs(remaining) < 0.01

  const allElectronicPaymentsPaid = splitPayments.every((payment) => {
    const isElectronic = payment.mode.toLowerCase().includes("mpesa") || payment.mode.toLowerCase().includes("till")
    return !isElectronic || payment.isPaid
  })

  const canComplete = isPaymentComplete && allElectronicPaymentsPaid

  const addPaymentSplit = () => {
    const newId = Math.max(...splitPayments.map((p) => p.id), 0) + 1
    setSplitPayments([
      ...splitPayments,
      {
        id: newId,
        mode: paymentModes[0]?.mode_of_payment || "Cash",
        amount: Math.max(0, remaining),
        isPaid: false,
      },
    ])
  }

  const removePaymentSplit = (id: number) => {
    if (splitPayments.length > 1) {
      setSplitPayments(splitPayments.filter((p) => p.id !== id))
    }
  }

  const updatePaymentSplit = (id: number, field: keyof PaymentSplit, value: any) => {
    setSplitPayments(
      splitPayments.map((p) =>
        p.id === id ? { ...p, [field]: field === "amount" ? Number(value) : value, isPaid: false } : p,
      ),
    )
  }

  const handleSTKPush = async (paymentId: number) => {
    const payment = splitPayments.find((p) => p.id === paymentId)
    if (!payment) return

    const phoneNumber = payment.phone || mobileNumber
    if (!phoneNumber) {
      setMessage({ type: "error", text: "Please provide a mobile number for STK Push" })
      return
    }

    setMessage(null)
    setIsProcessing(true)

    try {
      const response = await fetch("/api/payments/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneNumber,
          amount: payment.amount,
          tillNumber: payment.mode.toLowerCase().includes("till") ? "Till" : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: "STK Push sent! Check your phone to complete payment." })
        // Mark payment as paid after successful STK push
        setSplitPayments(
          splitPayments.map((p) =>
            p.id === paymentId ? { ...p, isPaid: true, reference: data.checkoutRequestId } : p,
          ),
        )
      } else {
        setMessage({ type: "error", text: data.message || "STK Push failed" })
      }
    } catch (error) {
      console.error("[v0] STK Push error:", error)
      setMessage({ type: "error", text: "Failed to initiate STK Push" })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePayment = async () => {
    if (!canComplete) {
      if (!isPaymentComplete) {
        setMessage({ type: "error", text: `Payment incomplete. Remaining: KES ${remaining.toFixed(2)}` })
      } else {
        setMessage({ type: "error", text: "Please complete all M-PESA/Till payments before finishing" })
      }
      return
    }

    if (isInvoicePayment && invoiceId) {
      setIsProcessing(true)
      setMessage(null)

      try {
        const response = await fetch("/api/sales/invoice/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sales_id: invoiceId,
            payment_details: splitPayments.map((payment) => ({
              mode_of_payment: payment.mode,
              amount: payment.amount,
            })),
          }),
        })

        const data = await response.json()
        if (response.ok) {
          setMessage({ type: "success", text: "Payment processed successfully" })
          setTimeout(() => {
            onSuccess()
          }, 1500)
        } else {
          setMessage({ type: "error", text: data.message?.message || "Payment failed" })
        }
      } catch (error) {
        console.error("[v0] Payment error:", error)
        setMessage({ type: "error", text: "An error occurred while processing payment" })
      } finally {
        setIsProcessing(false)
      }
      return
    }

    if (!cartItems || cartItems.length === 0) {
      setMessage({ type: "error", text: "No items in cart. Cannot process payment." })
      return
    }

    setIsProcessing(true)
    setMessage(null)

    try {
      const warehouse = sessionStorage.getItem("selected_warehouse") || ""
      const user = sessionStorage.getItem("user_email") || "dev.dukaplus@gmail.com"

      const [year, month, day] = salesDate.split("-")
      const formattedDate = `${day}-${month}-${year}`

      const payload = {
        invoice_items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          product_name: item.name,
          product_price: item.price,
        })),
        payment_details: splitPayments.map((payment) => ({
          mode_of_payment: payment.mode,
          amount: payment.amount,
          reference: payment.reference,
        })),
        warehouse_id: warehouse,
        customer_name: customerName,
        customer_id: customerName,
        total_sales_price: totalAmount,
        mobile_number: mobileNumber,
        logged_in_user: user,
        location: "",
        sales_date: formattedDate,
      }

      const response = await fetch("/api/sales/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (response.ok) {
        setMessage({ type: "success", text: "Payment processed successfully" })
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        setMessage({ type: "error", text: data.message || "Payment failed" })
      }
    } catch (error) {
      console.error("[v0] Payment error:", error)
      setMessage({ type: "error", text: "An error occurred while processing payment" })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card-base w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-xl font-bold text-foreground">Complete Payment</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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
              <p className={message.type === "success" ? "text-success text-sm" : "text-danger text-sm"}>
                {message.text}
              </p>
            </div>
          )}

          <div className="bg-muted rounded-lg px-5 py-3 border border-border">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Items:</span>
                <span className="text-lg font-bold text-foreground">{itemCount}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-foreground">Total:</span>
                <span className="text-2xl font-bold text-warning">
                  KES {totalAmount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {!isPaymentComplete && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Remaining:</span>
                  <span className="text-lg font-bold text-danger">
                    KES {remaining.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">Customer Name</label>
              <Input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="input-base text-sm h-9"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">Mobile Number</label>
              <Input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="input-base text-sm h-9"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">Sales Date</label>
              <div className="flex items-center gap-2 input-base rounded-lg px-2.5 py-2">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="date"
                  value={salesDate}
                  onChange={(e) => setSalesDate(e.target.value)}
                  className="flex-1 bg-transparent text-foreground text-sm outline-none min-w-0"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-foreground">Payment Methods</label>
              <Button type="button" onClick={addPaymentSplit} size="sm" className="btn-success text-xs h-8 px-3">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Payment
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-4 py-2 text-xs font-semibold">Mode</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold">Amount (KES)</th>
                    <th className="text-center px-4 py-2 text-xs font-semibold">Action</th>
                    <th className="text-center px-4 py-2 text-xs font-semibold w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {splitPayments.map((payment, index) => {
                    const isMpesaOrTill =
                      payment.mode.toLowerCase().includes("mpesa") || payment.mode.toLowerCase().includes("till")

                    return (
                      <tr key={payment.id} className="table-row">
                        <td className="px-4 py-3">
                          <select
                            value={payment.mode}
                            onChange={(e) => updatePaymentSplit(payment.id, "mode", e.target.value)}
                            className="w-full input-base rounded-lg px-2.5 py-1.5 text-sm"
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
                                <option value="Paid to Till">Paid to Till</option>
                              </>
                            )}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={payment.amount}
                            onChange={(e) => updatePaymentSplit(payment.id, "amount", e.target.value)}
                            step="0.01"
                            className="input-base h-8 text-sm text-right"
                          />
                        </td>
                        <td className="px-4 py-3">
                          {isMpesaOrTill ? (
                            <div className="flex flex-col gap-1.5">
                              {!payment.isPaid ? (
                                <>
                                  <Input
                                    type="tel"
                                    value={payment.phone || mobileNumber}
                                    onChange={(e) => updatePaymentSplit(payment.id, "phone", e.target.value)}
                                    placeholder="Phone: 07XXXXXXXX"
                                    className="input-base h-7 text-xs"
                                  />
                                  <Button
                                    type="button"
                                    onClick={() => handleSTKPush(payment.id)}
                                    disabled={isProcessing}
                                    className="btn-warning text-xs h-7 px-2 whitespace-nowrap"
                                  >
                                    <Smartphone className="w-3 h-3 mr-1" />
                                    STK Push
                                  </Button>
                                </>
                              ) : (
                                <div className="badge-success text-xs px-2 py-1 text-center">✓ Paid</div>
                              )}
                            </div>
                          ) : (
                            <Input
                              type="text"
                              value={payment.reference || ""}
                              onChange={(e) => updatePaymentSplit(payment.id, "reference", e.target.value)}
                              placeholder="Reference (optional)"
                              className="input-base h-8 text-xs"
                            />
                          )}
                        </td>
                        <td className="px-2 py-3 text-center">
                          {splitPayments.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removePaymentSplit(payment.id)}
                              size="sm"
                              variant="ghost"
                              className="action-btn-delete h-7 w-7 p-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex gap-3 flex-shrink-0">
          <Button
            onClick={handlePayment}
            disabled={isProcessing || !canComplete}
            className="flex-1 btn-success h-11 text-sm font-semibold uppercase rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing
              ? "Processing..."
              : canComplete
                ? `Complete (KES ${totalAmount.toFixed(2)})`
                : !isPaymentComplete
                  ? `Remaining: KES ${remaining.toFixed(2)}`
                  : "Complete Payments First"}
          </Button>
          <Button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 btn-cancel h-11 text-sm font-semibold uppercase rounded-lg"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
