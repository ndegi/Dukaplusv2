"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle } from "lucide-react";

interface PaymentMode {
  mode_of_payment: string;
}

interface ShiftDetails {
  mode_of_payment: string;
  opening_amount: number;
}

export function OpenShiftModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [shiftDetails, setShiftDetails] = useState<ShiftDetails[]>([
    { mode_of_payment: "Cash", opening_amount: 0 },
  ]);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingModes, setIsLoadingModes] = useState(true);

  useEffect(() => {
    fetchPaymentModes();
  }, []);

  const fetchPaymentModes = async () => {
    try {
      const response = await fetch("/api/payments/modes");
      if (response.ok) {
        const data = await response.json();
        setPaymentModes(data.modes || []);
        // Initialize shift details with all payment modes
        if (data.modes && data.modes.length > 0) {
          setShiftDetails(
            data.modes.map((mode: PaymentMode) => ({
              mode_of_payment: mode.mode_of_payment,
              opening_amount: 0,
            }))
          );
        }
      }
    } catch (error) {
      console.error("[DukaPlus] Failed to fetch payment modes:", error);
    } finally {
      setIsLoadingModes(false);
    }
  };

  const handleOpenShift = async () => {
    try {
      setIsLoading(true);
      setMessage(null);

      const warehouse = sessionStorage.getItem("selected_warehouse");
      const credentials = JSON.parse(
        sessionStorage.getItem("tenant_credentials") || "{}"
      );

      const response = await fetch("/api/shift/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouse_id: warehouse,
          opened_by: credentials.user_name,
          shift_details: shiftDetails,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Shift opened successfully" });
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to open shift",
        });
      }
    } catch (error) {
      console.error("[DukaPlus] Error opening shift:", error);
      setMessage({
        type: "error",
        text: "An error occurred while opening shift",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateShiftDetail = (modeOfPayment: string, amount: number) => {
    setShiftDetails(
      shiftDetails.map((detail) =>
        detail.mode_of_payment === modeOfPayment
          ? { ...detail, opening_amount: amount }
          : detail
      )
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-6">Open Shift</h2>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              message.type === "success"
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-red-500/10 border border-red-500/20"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={
                message.type === "success"
                  ? "text-green-200 text-sm"
                  : "text-red-200 text-sm"
              }
            >
              {message.text}
            </p>
          </div>
        )}

        {isLoadingModes ? (
          <div className="text-center py-8">
            <p className="text-slate-400">Loading payment modes...</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <p className="text-sm text-slate-400">
              Enter opening amounts for each payment mode:
            </p>
            {shiftDetails.map((detail) => (
              <div key={detail.mode_of_payment} className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  {detail.mode_of_payment}
                </label>
                <Input
                  type="number"
                  value={detail.opening_amount}
                  onChange={(e) =>
                    updateShiftDetail(
                      detail.mode_of_payment,
                      Number(e.target.value)
                    )
                  }
                  placeholder="0.00"
                  step="0.01"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleOpenShift}
            disabled={isLoading || isLoadingModes}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            {isLoading ? "Opening..." : "Open Shift"}
          </Button>
          <Button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
