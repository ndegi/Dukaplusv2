"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Smartphone,
  Gift,
  Coins,
  X,
  Save,
  Printer,
  Send,
} from "lucide-react";

interface PaymentMode {
  mode_of_payment: string;
  type?: string;
}

interface PaymentModeOption {
  label: string;
  value: string;
}

interface PaymentFormProps {
  totalAmount: number;
  itemCount: number;
  cartItems: any[];
  onClose: () => void;
  onSuccess: () => void;
  customerName?: string;
  mobileNumber?: string;
  invoiceId?: string;
  isInvoicePayment?: boolean;
  customerCredit?: number;
  loyaltyPoints?: number;
  mode?: "inline" | "modal";
}

interface PaymentSplit {
  id: number;
  mode: string;
  amount: number;
  reference?: string;
  phone?: string;
  isPaid?: boolean;
}

export function PaymentForm({
  totalAmount,
  itemCount,
  cartItems,
  onClose,
  onSuccess,
  customerName: initialCustomerName = "Walk In",
  mobileNumber: initialMobileNumber = "",
  invoiceId,
  isInvoicePayment = false,
  customerCredit = 0,
  loyaltyPoints = 0,
  mode = "inline",
}: PaymentFormProps) {
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [paymentModeOptions, setPaymentModeOptions] = useState<
    PaymentModeOption[]
  >([]);
  const [splitPayments, setSplitPayments] = useState<PaymentSplit[]>([
    { id: 1, mode: "Cash", amount: totalAmount, isPaid: false },
  ]);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [salesDate, setSalesDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [customerNameState, setCustomerName] = useState(initialCustomerName);
  const [mobileNumberState, setMobileNumber] = useState(
    initialMobileNumber || ""
  );
  const [location, setLocation] = useState("");
  const [shiftCheckComplete, setShiftCheckComplete] = useState(false);
  const [hasActiveShift, setHasActiveShift] = useState(false);
  const [useCredit, setUseCredit] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const pointsValue = 1; // KES per point
  const [autoPrint, setAutoPrint] = useState(true); // Set print to checked by default
  const [autoSend, setAutoSend] = useState(false);

  const pointsToEarn = Math.floor(totalAmount * 0.1);

  useEffect(() => {
    console.log("[DukaPlus] PaymentForm received customer data:", {
      name: initialCustomerName,
      mobile: initialMobileNumber,
      hasValue: !!initialMobileNumber,
    });

    setCustomerName(initialCustomerName);
    setMobileNumber(initialMobileNumber || "");
  }, [initialCustomerName, initialMobileNumber]);

  useEffect(() => {
    checkShiftStatus();
  }, []);

  const checkShiftStatus = async () => {
    const warehouse = sessionStorage.getItem("selected_warehouse");
    if (!warehouse) {
      setShiftCheckComplete(true);
      return;
    }

    try {
      const response = await fetch(
        `/api/shift/status?warehouse_id=${encodeURIComponent(warehouse)}`
      );
      if (response.ok) {
        const data = await response.json();
        const isOpen = data.message?.message === 1 || data.message === 1;
        setHasActiveShift(isOpen);

        if (!isOpen) {
          setMessage({
            type: "error",
            text: "No active shift found. Please open a shift before making sales.",
          });
        }
      }
    } catch (error) {
      console.error("[DukaPlus] Failed to check shift status:", error);
    } finally {
      setShiftCheckComplete(true);
    }
  };

  useEffect(() => {
    fetchPaymentModes();
  }, []);

  const fetchPaymentModes = async () => {
    try {
      const response = await fetch("/api/payments/modes");
      if (response.ok) {
        const data = await response.json();
        const modes = data.modes || [];
        const modesList = Array.isArray(modes) ? modes : [];

        const modesWithCredit = [...modesList];
        if (
          !modesWithCredit.find(
            (m) => m.mode_of_payment.toLowerCase() === "credit"
          )
        ) {
          modesWithCredit.push({ mode_of_payment: "credit" });
        }

        setPaymentModes(modesWithCredit);

        const options: PaymentModeOption[] = modesWithCredit.map((mode) => ({
          label:
            mode.mode_of_payment === "credit" ? "Credit" : mode.mode_of_payment,
          value: mode.mode_of_payment,
        }));
        setPaymentModeOptions(options);

        if (modesWithCredit.length > 0) {
          setSplitPayments([
            {
              id: 1,
              mode: modesWithCredit[0].mode_of_payment || "Cash",
              amount: totalAmount,
              isPaid: false,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("[DukaPlus] Failed to fetch payment modes:", error);
      const fallbackModes = [
        { mode_of_payment: "Cash" },
        { mode_of_payment: "Mpesa" },
        { mode_of_payment: "Card" },
        { mode_of_payment: "credit" },
        { mode_of_payment: "Paid to Till" },
      ];
      setPaymentModes(fallbackModes);

      const options: PaymentModeOption[] = fallbackModes.map((mode) => ({
        label:
          mode.mode_of_payment === "credit" ? "Credit" : mode.mode_of_payment,
        value: mode.mode_of_payment,
      }));
      setPaymentModeOptions(options);
    }
  };

  const creditAmount = useCredit;
  const pointsAmount = redeemPoints * pointsValue;
  const totalPaid =
    splitPayments.reduce((sum, payment) => sum + payment.amount, 0) +
    creditAmount +
    pointsAmount;
  const remaining = totalAmount - totalPaid;
  const isPaymentComplete = Math.abs(remaining) < 0.01;

  const allElectronicPaymentsPaid = splitPayments.every((payment) => {
    const isElectronic =
      payment.mode.toLowerCase().includes("mpesa") ||
      payment.mode.toLowerCase().includes("till");
    return !isElectronic || payment.isPaid;
  });

  const canComplete = isPaymentComplete && allElectronicPaymentsPaid;

  const addPaymentSplit = () => {
    const newId = Math.max(...splitPayments.map((p) => p.id), 0) + 1;
    setSplitPayments([
      ...splitPayments,
      {
        id: newId,
        mode: paymentModes[0]?.mode_of_payment || "Cash",
        amount: Math.max(0, remaining),
        isPaid: false,
      },
    ]);
  };

  const removePaymentSplit = (id: number) => {
    if (splitPayments.length > 1) {
      setSplitPayments(splitPayments.filter((p) => p.id !== id));
    }
  };

  const updatePaymentSplit = (
    id: number,
    field: keyof PaymentSplit,
    value: any
  ) => {
    setSplitPayments(
      splitPayments.map((p) =>
        p.id === id
          ? {
              ...p,
              [field]: field === "amount" ? Number(value) : value,
              isPaid: false,
            }
          : p
      )
    );
  };

  const handleSTKPush = async (paymentId: number) => {
    const payment = splitPayments.find((p) => p.id === paymentId);
    if (!payment) return;

    const phoneNumber = payment.phone || mobileNumberState;
    if (!phoneNumber) {
      setMessage({
        type: "error",
        text: "Please provide a mobile number for STK Push",
      });
      return;
    }

    setMessage(null);
    setIsProcessing(true);

    try {
      const response = await fetch("/api/payments/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneNumber,
          amount: payment.amount,
          tillNumber: payment.mode.toLowerCase().includes("till")
            ? "Till"
            : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "STK Push sent! Check your phone to complete payment.",
        });
        setSplitPayments(
          splitPayments.map((p) =>
            p.id === paymentId
              ? { ...p, isPaid: true, reference: data.checkoutRequestId }
              : p
          )
        );
      } else {
        setMessage({ type: "error", text: data.message || "STK Push failed" });
      }
    } catch (error) {
      console.error("[DukaPlus] STK Push error:", error);
      setMessage({ type: "error", text: "Failed to initiate STK Push" });
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = async (salesId: string) => {
    try {
      console.log(
        "[DukaPlus] Printing receipt to 192.168.1.100 for sale:",
        salesId
      );
      // Network print command - adjust based on your printer setup
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Print Receipt</title></head>
            <body onload="window.print(); window.close();">
              <script>
                // Send print job to network printer
                fetch('http://192.168.1.100/print', {
                  method: 'POST',
                  body: JSON.stringify({ sales_id: '${salesId}' })
                }).catch(console.error);
              </script>
            </body>
          </html>
        `);
      }
      console.log("[DukaPlus] Print job sent successfully");
    } catch (error) {
      console.error("[DukaPlus] Failed to print receipt:", error);
    }
  };

  const sendReceipt = async (salesId: string, mobile: string) => {
    if (!mobile) {
      console.log("[DukaPlus] No mobile number provided, skipping send");
      return;
    }

    try {
      console.log("[DukaPlus] Sending receipt to customer:", mobile);
      const response = await fetch("/api/sales/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sales_id: salesId,
          mobile_number: mobile,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("[DukaPlus] Receipt sent successfully");
        setMessage({ type: "success", text: "Receipt sent to customer" });
      } else {
        console.error("[DukaPlus] Failed to send receipt:", data.message);
      }
    } catch (error) {
      console.error("[DukaPlus] Error sending receipt:", error);
    }
  };

  const saveDraft = async () => {
    if (cartItems.length === 0) return;

    try {
      setIsProcessing(true);
      setMessage(null);

      const warehouse = sessionStorage.getItem("selected_warehouse") || "";
      const user =
        sessionStorage.getItem("user_email") || "dev.dukaplus@gmail.com";

      const invoiceItems = cartItems.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        product_name: item.name,
        product_price: item.price,
      }));

      const response = await fetch("/api/sales/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_items: invoiceItems,
          warehouse_id: warehouse,
          customer_name: customerNameState,
          customer_id: customerNameState,
          total_sales_price: totalAmount,
          mobile_number: mobileNumberState,
          logged_in_user: user,
          location: location,
          sales_id: "",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Cart saved to queue successfully",
        });
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setMessage({
          type: "error",
          text: data.message?.message || "Failed to save to queue",
        });
      }
    } catch (error) {
      console.error("[DukaPlus] Error saving draft:", error);
      setMessage({ type: "error", text: "Failed to save to queue" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!hasActiveShift && !isInvoicePayment) {
      setMessage({
        type: "error",
        text: "Cannot process sale. No active shift found. Please open a shift first.",
      });
      return;
    }

    if (!canComplete) {
      if (!isPaymentComplete) {
        setMessage({
          type: "error",
          text: `Payment incomplete. Remaining: KES ${remaining.toFixed(2)}`,
        });
      } else {
        setMessage({
          type: "error",
          text: "Please complete all M-PESA/Till payments before finishing",
        });
      }
      return;
    }

    if (isInvoicePayment && invoiceId) {
      setIsProcessing(true);
      setMessage(null);

      try {
        const response = await fetch("/api/sales/invoice/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sales_id: invoiceId,
            payment_details: splitPayments.map((payment) => ({
              mode_of_payment: payment.mode,
              amount: payment.amount,
            })),
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setMessage({
            type: "success",
            text: "Payment processed successfully",
          });
          setTimeout(() => {
            onSuccess();
          }, 1500);
        } else {
          setMessage({
            type: "error",
            text: data.message?.message || "Payment failed",
          });
        }
      } catch (error) {
        console.error("[DukaPlus] Payment error:", error);
        setMessage({
          type: "error",
          text: "An error occurred while processing payment",
        });
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setMessage({
        type: "error",
        text: "No items in cart. Cannot process payment.",
      });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const warehouse = sessionStorage.getItem("selected_warehouse") || "";
      const user =
        sessionStorage.getItem("user_email") || "dev.dukaplus@gmail.com";

      const [year, month, day] = salesDate.split("-");
      const formattedDate = `${day}-${month}-${year}`;

      const payload = {
        invoice_items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          product_name: item.name,
          product_price: item.price,
        })),
        payment_details: splitPayments.map((payment) => ({
          mode_of_payment: payment.mode, // Now sends "Credit" when Credit is selected
          amount: payment.amount,
          reference: payment.reference,
        })),
        warehouse_id: warehouse,
        customer_name: customerNameState,
        customer_id: customerNameState,
        total_sales_price: totalAmount,
        mobile_number: mobileNumberState,
        logged_in_user: user,
        location: location,
        sales_date: formattedDate,
        credit_used: creditAmount,
        loyalty_points_redeemed: redeemPoints,
      };

      const response = await fetch("/api/sales/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        const salesId = data.message?.sales_id || data.sales_id;

        setMessage({ type: "success", text: "Payment processed successfully" });

        if (autoPrint && salesId) {
          await printReceipt(salesId);
        }

        if (autoSend && salesId && mobileNumberState) {
          await sendReceipt(salesId, mobileNumberState);
        }

        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setMessage({ type: "error", text: data.message || "Payment failed" });
      }
    } catch (error) {
      console.error("[DukaPlus] Payment error:", error);
      setMessage({
        type: "error",
        text: "An error occurred while processing payment",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const content = (
    <div className="h-full flex flex-col bg-background">
      <div className="px-6 py-3 border-b border-border bg-slate-50 dark:bg-slate-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                KES{" "}
                {totalAmount.toLocaleString("en-KE", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Items</p>
              <p className="text-lg font-semibold text-foreground">
                {itemCount}
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full">
              <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                  +{pointsToEarn} pts
                </p>
              </div>
            </div>
          </div>
          {mode === "inline" && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {message && (
        <div className="px-6 pt-3">
          <div
            className={
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2.5 flex items-center gap-2"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2.5 flex items-center gap-2"
            }
          >
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <p
              className={
                message.type === "success"
                  ? "text-green-800 dark:text-green-200 text-xs font-medium"
                  : "text-red-800 dark:text-red-200 text-xs font-medium"
              }
            >
              {message.text}
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden px-6 py-3">
        <div className="h-full max-w-7xl mx-auto flex flex-col gap-4">
          <div className="grid grid-cols-5 gap-4 flex-1 min-h-0">
            <div className="col-span-2 space-y-3 overflow-y-auto pr-2">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wide flex-shrink-0">
                Customer
              </h3>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase block mb-1">
                    Name
                  </label>
                  <Input
                    type="text"
                    value={customerNameState}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase block mb-1">
                    Mobile
                  </label>
                  <Input
                    type="tel"
                    value={mobileNumberState}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase block mb-1">
                    Location
                  </label>
                  <Input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Optional"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase block mb-1">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={salesDate}
                    onChange={(e) => setSalesDate(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="col-span-3 flex flex-col gap-3 min-h-0 overflow-hidden">
              <div className="flex items-center justify-between flex-shrink-0">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                  Payment Methods
                </h3>
                <Button
                  type="button"
                  onClick={addPaymentSplit}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                {splitPayments.map((payment) => {
                  const isMpesaOrTill =
                    payment.mode.toLowerCase().includes("mpesa") ||
                    payment.mode.toLowerCase().includes("till");

                  return (
                    <div
                      key={payment.id}
                      className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-border p-2.5 mb-2 flex-shrink-0"
                    >
                      <div className="grid grid-cols-12 gap-2.5 items-end">
                        <div className="col-span-3">
                          <label className="text-[10px] font-medium text-muted-foreground uppercase block mb-1">
                            Mode
                          </label>
                          <select
                            value={payment.mode}
                            onChange={(e) =>
                              updatePaymentSplit(
                                payment.id,
                                "mode",
                                e.target.value
                              )
                            }
                            className="w-full h-9 px-2.5 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-orange-500"
                          >
                            {paymentModeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-3">
                          <label className="text-[10px] font-medium text-muted-foreground uppercase block mb-1">
                            Amount
                          </label>
                          <Input
                            type="number"
                            value={payment.amount}
                            onChange={(e) =>
                              updatePaymentSplit(
                                payment.id,
                                "amount",
                                e.target.value
                              )
                            }
                            step="0.01"
                            className="h-9 text-sm font-semibold"
                          />
                        </div>

                        <div className="col-span-5">
                          <label className="text-[10px] font-medium text-muted-foreground uppercase block mb-1">
                            {isMpesaOrTill ? "Phone & Action" : "Reference"}
                          </label>
                          {isMpesaOrTill ? (
                            <div className="flex gap-2">
                              {!payment.isPaid ? (
                                <>
                                  <Input
                                    type="tel"
                                    value={payment.phone || mobileNumberState}
                                    onChange={(e) =>
                                      updatePaymentSplit(
                                        payment.id,
                                        "phone",
                                        e.target.value
                                      )
                                    }
                                    placeholder="07XXXXXXXX"
                                    className="h-9 flex-1 text-sm"
                                  />
                                  <Button
                                    type="button"
                                    onClick={() => handleSTKPush(payment.id)}
                                    disabled={isProcessing}
                                    className="bg-orange-600 hover:bg-orange-700 text-white h-9 px-2.5 text-xs whitespace-nowrap"
                                  >
                                    <Smartphone className="w-3.5 h-3.5 mr-1" />
                                    STK
                                  </Button>
                                </>
                              ) : (
                                <div className="h-9 flex items-center justify-center bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 rounded-md px-3 text-green-700 dark:text-green-400 font-semibold text-xs w-full">
                                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                  Confirmed
                                </div>
                              )}
                            </div>
                          ) : (
                            <Input
                              type="text"
                              value={payment.reference || ""}
                              onChange={(e) =>
                                updatePaymentSplit(
                                  payment.id,
                                  "reference",
                                  e.target.value
                                )
                              }
                              placeholder="Optional"
                              className="h-9 text-sm"
                            />
                          )}
                        </div>

                        <div className="col-span-1 flex justify-center">
                          {splitPayments.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removePaymentSplit(payment.id)}
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(customerCredit > 0 || loyaltyPoints > 0) && (
                <div className="grid grid-cols-2 gap-2.5 flex-shrink-0">
                  {customerCredit > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-lg p-2.5 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                          <Coins className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-semibold text-foreground">
                            Credit
                          </h4>
                          <p className="text-[10px] text-muted-foreground">
                            KES {customerCredit.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max={Math.min(customerCredit, totalAmount)}
                        value={useCredit}
                        onChange={(e) =>
                          setUseCredit(
                            Math.min(
                              customerCredit,
                              totalAmount,
                              Math.max(0, Number(e.target.value) || 0)
                            )
                          )
                        }
                        placeholder="0.00"
                        className="h-8 bg-white dark:bg-slate-900 text-sm font-semibold"
                      />
                    </div>
                  )}

                  {loyaltyPoints > 0 && (
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-lg p-2.5 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-amber-600 dark:bg-amber-500 flex items-center justify-center">
                          <Gift className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-semibold text-foreground">
                            Points
                          </h4>
                          <p className="text-[10px] text-muted-foreground">
                            {loyaltyPoints} pts (KES{" "}
                            {(loyaltyPoints * pointsValue).toFixed(2)})
                          </p>
                        </div>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max={loyaltyPoints}
                        value={redeemPoints}
                        onChange={(e) =>
                          setRedeemPoints(
                            Math.max(
                              0,
                              Math.min(
                                loyaltyPoints,
                                Number(e.target.value) || 0
                              )
                            )
                          )
                        }
                        placeholder="0"
                        className="h-8 bg-white dark:bg-slate-900 text-sm font-semibold"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {!isPaymentComplete && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-semibold text-foreground">
                    Balance Remaining
                  </span>
                </div>
                <span className="text-xl font-bold text-red-600 dark:text-red-400">
                  KES{" "}
                  {remaining.toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t-2 border-border bg-slate-50 dark:bg-slate-800/30 px-6 py-3">
        <div className="max-w-7xl mx-auto space-y-2">
          <div className="flex items-center gap-4 justify-end">
            <div className="flex items-center gap-2">
              <Checkbox
                id="auto-print"
                checked={autoPrint}
                onCheckedChange={(checked) => setAutoPrint(checked as boolean)}
              />
              <label
                htmlFor="auto-print"
                className="text-xs font-medium text-foreground cursor-pointer flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                Auto Print
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="auto-send"
                checked={autoSend}
                onCheckedChange={(checked) => setAutoSend(checked as boolean)}
              />
              <label
                htmlFor="auto-send"
                className="text-xs font-medium text-foreground cursor-pointer flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                Auto Send
              </label>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <Button
              onClick={onClose}
              disabled={isProcessing}
              variant="secondary"
              className="h-11 text-sm font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={saveDraft}
              disabled={isProcessing || cartItems.length === 0}
              variant="secondary"
              className="h-11 text-sm font-semibold"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Draft
            </Button>
            <Button
              onClick={handlePayment}
              disabled={
                isProcessing ||
                !canComplete ||
                (!hasActiveShift && !isInvoicePayment)
              }
              className="h-11 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              {isProcessing
                ? "Processing..."
                : !hasActiveShift && !isInvoicePayment
                ? "No Shift"
                : canComplete
                ? "Complete"
                : `KES ${remaining.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (mode === "modal") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-7xl h-[90vh] overflow-hidden rounded-xl shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
