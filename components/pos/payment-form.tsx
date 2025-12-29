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
import { useCurrency } from "@/lib/contexts/currency-context";
import { Toast } from "../ui/toast";

interface PaymentMode {
  mode_of_payment: string;
  type?: string;
}

interface PaymentModeOption {
  label: string;
  value: string;
}

interface PaymentSplit {
  id: number;
  mode: string;
  amount: number;
  isPaid: boolean;
  phone?: string;
  reference?: string;
}

interface PaymentFormProps {
  totalAmount: number;
  itemCount: number;
  cartItems: any[];
  onClose: () => void;
  onSuccess: () => void;
  customerName?: string;
  customerId?: string;
  mobileNumber?: string;
  invoiceId?: string;
  isInvoicePayment?: boolean;
  customerCredit?: number;
  loyaltyPoints?: number;
  mode?: "inline" | "modal";
  draftId?: string;
}

export function PaymentForm({
  totalAmount,
  itemCount,
  cartItems,
  onClose,
  onSuccess,
  customerName: initialCustomerName = "",
  customerId,
  mobileNumber: initialMobileNumber = "",
  invoiceId,
  isInvoicePayment = false,
  customerCredit = 0,
  loyaltyPoints = 0,
  mode = "inline",
  draftId,
}: PaymentFormProps) {
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [paymentModeOptions, setPaymentModeOptions] = useState<
    PaymentModeOption[]
  >([]);
  const [splitPayments, setSplitPayments] = useState<PaymentSplit[]>([
    { id: 1, mode: "Cash", amount: totalAmount, isPaid: false },
  ]);
  const WALK_IN_CREDIT_ERROR =
    "Credit sale is not allowed for walk-in customers. Please select a registered customer.";
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stkProcessing, setStkProcessing] = useState<{
    [key: number]: boolean;
  }>({});
  const [stkStatus, setStkStatus] = useState<{
    [key: number]: "processing" | "success" | "failure" | null;
  }>({});
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
  const { currency } = useCurrency();
  const pointsValue = 1;
  const [autoPrint, setAutoPrint] = useState(false);
  const [autoSend, setAutoSend] = useState(false);
  const resolvedCustomerId = customerId || "";
  const pointsToEarn = Math.floor(totalAmount * 0.1);
  useEffect(() => {
    if (initialCustomerName) {
      setCustomerName(initialCustomerName);
    }
    setMobileNumber(initialMobileNumber || "");
  }, [initialCustomerName, initialMobileNumber]);

  useEffect(() => {
    checkShiftStatus();
    const handleShiftChange = () => {
      checkShiftStatus();
    };
    window.addEventListener("shiftOpened", handleShiftChange);
    window.addEventListener("shiftClosed", handleShiftChange);

    return () => {
      window.removeEventListener("shiftOpened", handleShiftChange);
      window.removeEventListener("shiftClosed", handleShiftChange);
    };
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

  useEffect(() => {
    initialCustomerName;
    customerNameState;

    if (initialCustomerName && initialCustomerName !== customerNameState) {
      setCustomerName(initialCustomerName);
    }
  }, [initialCustomerName]);

  useEffect(() => {
    initialMobileNumber;

    mobileNumberState;

    setMobileNumber(initialMobileNumber || "");
  }, [initialMobileNumber]);

  const isWalkInCustomer = () => {
    // Check if customer ID is missing, or if the name/ID indicates walk-in customer
    // The walk-in customer ID from API is typically "Walk In" (the name itself)
    const name = (customerNameState || "").trim().toLowerCase();
    return (
      !customerId ||
      customerId.toLowerCase() === "walk-in" ||
      customerId.toLowerCase() === "walk in" ||
      name === "walk in" ||
      name === "walkin" ||
      name === "walk-in"
    );
  };

  const creditAmount = useCredit;
  const pointsAmount = redeemPoints * pointsValue;
  const totalPaid =
    splitPayments.reduce((sum, payment) => sum + payment.amount, 0) +
    creditAmount +
    pointsAmount;
  const remaining = totalAmount - totalPaid;
  const isPaymentComplete = Math.abs(remaining) < 0.01;

  const hasUnconfirmedSTKPayments = splitPayments.some((payment) => {
    const isMpesaOrTill =
      payment.mode.toLowerCase().includes("mpesa") ||
      payment.mode.toLowerCase().includes("till");
    const hasTriedSTK =
      stkStatus[payment.id] !== undefined && stkStatus[payment.id] !== null;
    const isSTKSuccess = stkStatus[payment.id] === "success";
    const isProcessingSTK = stkStatus[payment.id] === "processing";

    return isMpesaOrTill && hasTriedSTK && isProcessingSTK;
  });

  const canComplete = !hasUnconfirmedSTKPayments;

  useEffect(() => {
    setSplitPayments((prev) => autoPopulateLastSplit(prev));
  }, [creditAmount, pointsAmount, totalAmount]);

  useEffect(() => {
    if (
      message?.text === WALK_IN_CREDIT_ERROR &&
      (!isWalkInCustomer() ||
        !splitPayments.some(
          (payment) => payment.mode?.toLowerCase() === "credit"
        ))
    ) {
      setMessage(null);
    }
  }, [customerNameState, splitPayments, message]);

  const autoPopulateLastSplit = (splits: PaymentSplit[]): PaymentSplit[] => {
    if (splits.length === 0) return splits;
    const lastIndex = splits.length - 1;
    const paidBeforeLast = splits
      .slice(0, lastIndex)
      .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    const remainingAmount =
      totalAmount - paidBeforeLast - creditAmount - pointsAmount;
    const normalizedAmount = Number(Math.max(0, remainingAmount).toFixed(2));
    const currentLastAmount = Number(
      Math.max(0, splits[lastIndex]?.amount || 0).toFixed(2)
    );

    if (Math.abs(currentLastAmount - normalizedAmount) < 0.01) {
      return splits;
    }

    const updatedSplits = [...splits];
    updatedSplits[lastIndex] = {
      ...updatedSplits[lastIndex],
      amount: normalizedAmount,
      isPaid: false,
    };
    return updatedSplits;
  };

  const addPaymentSplit = () => {
    setSplitPayments((prev) => {
      const newId = Math.max(...prev.map((p) => p.id), 0) + 1;
      const currentTotal = prev.reduce(
        (sum, payment) => sum + (Number(payment.amount) || 0),
        0
      );
      const remainingAmount =
        totalAmount - currentTotal - creditAmount - pointsAmount;
      const newSplit: PaymentSplit = {
        id: newId,
        mode: paymentModes[0]?.mode_of_payment || "Cash",
        amount: Number(Math.max(0, remainingAmount).toFixed(2)),
        isPaid: false,
      };
      return autoPopulateLastSplit([...prev, newSplit]);
    });
  };

  const removePaymentSplit = (id: number) => {
    setSplitPayments((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      const filtered = prev.filter((p) => p.id !== id);
      if (filtered.length === prev.length) {
        return prev;
      }
      if (filtered.length === 0) {
        return filtered;
      }
      return autoPopulateLastSplit(filtered);
    });
  };

  const updatePaymentSplit = (
    id: number,
    field: keyof PaymentSplit,
    value: any
  ) => {
    setSplitPayments((prev) => {
      if (field === "mode" && value.toLowerCase() === "credit") {
        if (isWalkInCustomer()) {
          setMessage({
            type: "error",
            text: WALK_IN_CREDIT_ERROR,
          });
          return prev;
        }
      }

      const updatedSplits = prev.map((p) =>
        p.id === id
          ? {
              ...p,
              [field]: field === "amount" ? Number(value) : value,
              isPaid: false,
            }
          : p
      );

      if (
        field === "amount" &&
        prev.length > 1 &&
        prev.findIndex((p) => p.id === id) !== prev.length - 1
      ) {
        return autoPopulateLastSplit(updatedSplits);
      }

      return updatedSplits;
    });
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

    setStkProcessing((prev) => ({ ...prev, [paymentId]: true }));
    setStkStatus((prev) => ({ ...prev, [paymentId]: "processing" }));
    setMessage({
      type: "success",
      text: "Processing M-Pesa payment. Please check your phone...",
    });

    try {
      const response = await fetch("/api/payments/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile_number: phoneNumber,
          payment_details: [
            {
              mode_of_payment: payment.mode,
              amount: payment.amount,
            },
          ],
        }),
      });

      const data = await response.json();

      if (response.ok && data.message?.status === 200) {
        setStkStatus((prev) => ({ ...prev, [paymentId]: "success" }));
        setMessage({
          type: "success",
          text: "Payment successful! M-Pesa payment confirmed.",
        });

        setSplitPayments(
          splitPayments.map((p) =>
            p.id === paymentId
              ? {
                  ...p,
                  isPaid: true,
                  reference:
                    data.checkoutRequestId || data.message?.transaction_id,
                }
              : p
          )
        );
      } else {
        setStkStatus((prev) => ({ ...prev, [paymentId]: "failure" }));
        const errorMessage =
          data.message?.message ||
          data.message ||
          "STK Push failed. Please try again.";
        setMessage({ type: "error", text: errorMessage });
      }
    } catch (error) {
      setStkStatus((prev) => ({ ...prev, [paymentId]: "failure" }));
      setMessage({
        type: "error",
        text: "Failed to initiate STK Push. Please check your connection.",
      });
    } finally {
      setTimeout(() => {
        setStkProcessing((prev) => ({ ...prev, [paymentId]: false }));
      }, 1000);
    }
  };

  const printReceipt = async (salesId: string) => {
    try {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Print Receipt</title></head>
            <body onload="window.print(); window.close();">
              <script>
                fetch('http://192.168.1.100/print', {
                  method: 'POST',
                  body: JSON.stringify({ sales_id: '${salesId}' })
                }).catch(console.error);
              </script>
            </body>
          </html>
        `);
      }
    } catch (error) {
      Toast;
    }
  };

  const sendReceipt = async (salesId: string, mobile: string) => {
    if (!mobile) {
      return;
    }

    try {
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
        setMessage({ type: "success", text: "Receipt sent to customer" });
      } else {
        setMessage({
          type: "error",
          text: data.message?.message || "Failed to send receipt",
        });
      }
    } catch (error) {}
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
        unit_of_measure: item.unit_of_measure,
      }));

      const response = await fetch("/api/sales/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_items: invoiceItems,
          warehouse_id: warehouse,
          customer_name: customerNameState,
          customer_id: resolvedCustomerId,
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
      setMessage({ type: "error", text: "Failed to save to queue" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    const hasActiveShift = sessionStorage.getItem("active_shift_id");
    if (!hasActiveShift && !isInvoicePayment) {
      setMessage({
        type: "error",
        text: "Cannot process sale. No active shift found. Please open a shift first.",
      });
      return;
    }

    if (hasUnconfirmedSTKPayments) {
      setMessage({
        type: "error",
        text: "Please confirm pending M-Pesa/Till payments before finishing",
      });
      return;
    }
    if (!isPaymentComplete) {
      const proceed = window.confirm(
        `Payment incomplete. Remaining: ${currency} ${remaining.toFixed(
          2
        )}.\n\nDo you want to complete the sale as a partial payment?`
      );
      if (!proceed) return;
    }

    if (isInvoicePayment && invoiceId) {
      setIsProcessing(true);
      setMessage(null);

      try {
        const nonCreditPayments = splitPayments.filter(
          (payment) => payment.mode.toLowerCase() !== "credit"
        );

        const invoicePayload: {
          sales_id: string;
          payment_details?: {
            mode_of_payment: string;
            amount: number;
            total_sales_price: number;
            reference: string;
          }[];
        } = {
          sales_id: invoiceId,
        };

        if (nonCreditPayments.length > 0) {
          invoicePayload.payment_details = nonCreditPayments.map((payment) => ({
            mode_of_payment: payment.mode,
            amount: payment.amount,
            total_sales_price: totalAmount,
            reference: payment.reference || "",
          }));
        }

        console.log("Submitting invoice payment payload:", invoicePayload);

        const response = await fetch("/api/sales/invoice/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invoicePayload),
        });

        const data = await response.json();
        if (response.ok) {
          console.log("Invoice payment response:", data);
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

    if (isWalkInCustomer()) {
      const hasCreditMode = splitPayments.some(
        (payment) => payment.mode.toLowerCase() === "credit"
      );

      if (hasCreditMode) {
        setMessage({
          type: "error",
          text: "Walk-in customers cannot be assigned credit payments.",
        });
        return;
      }
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const warehouse = sessionStorage.getItem("selected_warehouse") || "";
      const user =
        sessionStorage.getItem("user_email") || "dev.dukaplus@gmail.com";

      const [year, month, day] = salesDate.split("-");
      const formattedDate = `${day}-${month}-${year}`;

      const nonCreditPayments = splitPayments.filter(
        (payment) => payment.mode.toLowerCase() !== "credit"
      );

      const payload: any = {
        invoice_items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          product_name: item.name,
          product_price: item.price,
          unit_of_measure: item.unit_of_measure,
        })),
        warehouse_id: warehouse,
        customer_name: customerNameState,
        customer_id: resolvedCustomerId,
        total_sales_price: totalAmount,
        mobile_number: mobileNumberState,
        logged_in_user: user,
        location: location,
        sales_date: formattedDate,
        credit_used: creditAmount,
        loyalty_points_redeemed: redeemPoints,
      };

      if (nonCreditPayments.length > 0) {
        payload.payment_details = nonCreditPayments.map((payment) => ({
          mode_of_payment: payment.mode,
          amount: payment.amount,
          total_sales_price: totalAmount,
          reference: payment.reference || "",
        }));
      }

      console.log("Submitting POS payment payload:", payload);

      if (draftId) {
        payload.sales_id = draftId;
      }

      const response = await fetch("/api/sales/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("POS payment response:", data);
        const salesId =
          data.sales_id || data.message?.sales_id || data.data?.sales_id;

        setMessage({ type: "success", text: "Payment processed successfully" });

        if (draftId) {
          window.dispatchEvent(
            new CustomEvent("draftCompleted", { detail: { sales_id: draftId } })
          );
        }

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
      <div className="px-4 py-1 border-b border-border bg-slate-50 dark:bg-slate-800/30">
        <div className="flex items-center justify-between gap- flex-wrap">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 min-w-[260px]">
            <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/40 px-3 py-2 rounded-lg shadow-sm h-full">
              <div>
                <p className="text-lg sm:text-xl font-bold text-orange-600 dark:text-orange-400">
                  Total: {currency}{" "}
                  {totalAmount.toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/40 px-3 py-2 rounded-lg shadow-sm h-full">
              <div>
                <p className="text-lg sm:text-xl font-bold text-orange-600 dark:text-orange-400">
                  {itemCount} Items
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 px-3 py-2 rounded-lg shadow-sm h-full">
              <Gift className="w-4 h-4 text-purple-600 dark:text-purple-300" />
              <div>
                <p className="text-[10px] leading-none text-purple-700 dark:text-purple-200 font-medium">
                  Loyalty +{pointsToEarn} pts
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
                  const isProcessingSTK = stkProcessing[payment.id];
                  const stkState = stkStatus[payment.id];

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
                                    disabled={isProcessingSTK}
                                  />
                                  <Button
                                    type="button"
                                    onClick={() => handleSTKPush(payment.id)}
                                    disabled={isProcessingSTK}
                                    className={`h-9 px-2.5 text-xs whitespace-nowrap ${
                                      stkState === "processing"
                                        ? "bg-yellow-600 hover:bg-yellow-700"
                                        : stkState === "failure"
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-orange-600 hover:bg-orange-700"
                                    } text-white`}
                                  >
                                    {stkState === "processing" ? (
                                      <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                        Processing
                                      </>
                                    ) : (
                                      <>
                                        <Smartphone className="w-3.5 h-3.5 mr-1" />
                                        STK
                                      </>
                                    )}
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
                            {currency} {customerCredit.toFixed(2)}
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
                            {loyaltyPoints} pts ({currency}{" "}
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
                  {currency}{" "}
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
              variant="outline"
              className="h-11 text-sm font-semibold border-2 border-red-300 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 hover:text-red-700 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={saveDraft}
              disabled={isProcessing || cartItems.length === 0}
              variant="outline"
              className="h-11 text-sm font-semibold border-2 border-amber-300 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 hover:text-amber-700 bg-transparent"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Draft
            </Button>
            <Button
              onClick={handlePayment}
              disabled={
                isProcessing ||
                hasUnconfirmedSTKPayments ||
                (!hasActiveShift && !isInvoicePayment)
              }
              className="h-11 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              {isProcessing
                ? "Processing..."
                : !hasActiveShift && !isInvoicePayment
                ? "No Shift"
                : isPaymentComplete
                ? "Complete"
                : `Complete (Remaining ${currency} ${Math.abs(
                    remaining
                  ).toFixed(2)})`}
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
