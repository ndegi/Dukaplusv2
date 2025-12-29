"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, AlertCircle } from "lucide-react";
import { useCurrency } from "@/lib/contexts/currency-context";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  unit_of_measure?: string;
  sellingPrices?: Array<{
    unit_of_measure: string;
    unit_selling_price: number;
  }>;
  all_selling_prices?: Array<{
    unit_of_measure: string;
    unit_selling_price: number;
  }>;
}

interface CartSummaryProps {
  cart: CartItem[];
  totalAmount: number;
  onUpdateQuantity: (
    id: string,
    quantity: number,
    price?: number,
    unit?: string
  ) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onClearCart: () => void;
  warehouse?: string;
  user?: string;
  customerName?: string;
  customerId?: string;
  mobileNumber?: string;
  customerCredit?: number;
  loyaltyPoints?: number;
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
  customerName = "",
  customerId,
  mobileNumber = "",
  customerCredit = 0,
  loyaltyPoints = 0,
}: CartSummaryProps) {
  const [queuedCount, setQueuedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftReceipts, setDraftReceipts] = useState<any[]>([]);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [actualWarehouse, setActualWarehouse] = useState("");
  const { currency } = useCurrency();
  const [quantityInputs, setQuantityInputs] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    const storedWarehouse = sessionStorage.getItem("selected_warehouse");
    if (storedWarehouse) {
      setActualWarehouse(storedWarehouse);
    }
  }, []);

  useEffect(() => {
    const handleWarehouseChange = () => {
      if (cart.length > 0) {
        onClearCart();
        setQueuedCount(0);
      }
    };

    window.addEventListener("warehouseChanged", handleWarehouseChange);
    return () =>
      window.removeEventListener("warehouseChanged", handleWarehouseChange);
  }, [cart.length, onClearCart]);

  useEffect(() => {
    fetchDraftReceipts();
  }, [actualWarehouse]);

  const fetchDraftReceipts = async () => {
    if (!actualWarehouse) {
      console.log("[DukaPlus] No warehouse selected, skipping draft fetch");
      return;
    }

    try {
      console.log("[DukaPlus] Fetching drafts for warehouse:", actualWarehouse);
      const response = await fetch(
        `/api/sales/draft?warehouse_id=${encodeURIComponent(actualWarehouse)}`
      );
      const data = await response.json();

      console.log("[DukaPlus] Draft receipts response:", data);

      if (response.ok) {
        if (
          data.message?.sales_data &&
          Array.isArray(data.message.sales_data)
        ) {
          setDraftReceipts(data.message.sales_data);
          setQueuedCount(data.message.sales_data.length);
          console.log(
            "[DukaPlus] Successfully loaded",
            data.message.sales_data.length,
            "draft receipts"
          );
        } else {
          console.log("[DukaPlus] No draft receipts found");
          setDraftReceipts([]);
          setQueuedCount(0);
        }
      } else {
        console.error(
          "[DukaPlus] API error fetching drafts:",
          data.message?.message || data.message || "Unknown error"
        );
        setDraftReceipts([]);
        setQueuedCount(0);
      }
    } catch (err) {
      console.error("[DukaPlus] Error fetching draft receipts:", err);
      setDraftReceipts([]);
      setQueuedCount(0);
    }
  };

  const handleQueueCart = async () => {
    if (cart.length === 0) return;

    try {
      setIsProcessing(true);
      setError(null);

      const invoiceItems = cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        product_name: item.name,
        product_price: item.price,
        unit_of_measure: item.unit_of_measure || "Each",
      }));

      const response = await fetch("/api/sales/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_items: invoiceItems,
          warehouse_id: actualWarehouse,
          customer_name: customerName || "",
          customer_id: customerId || "",
          total_sales_price: totalAmount,
          mobile_number: mobileNumber,
          logged_in_user: user,
          location: "",
          sales_id: "",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchDraftReceipts();
        onClearCart();
      } else {
        setError(data.message?.message || "Failed to queue invoice");
      }
    } catch (err) {
      setError("Error queueing invoice");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadDraft = (draft: any) => {
    if (draft.status === "paid" || draft.status === 1) {
      onClearCart();

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
            customer: draft.customer || "", // Removed hardcoded "Walk In"
            mobile: draft.store_mobile_number || "",
            draftId: draft.sales_id, // Pass draft ID for deletion
          },
        });
        window.dispatchEvent(loadEvent);
      }

      setShowQueueModal(false);
    } else {
      onClearCart();

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
            customer: draft.customer || "", // Removed hardcoded "Walk In"
            mobile: draft.store_mobile_number || "",
            draftId: draft.sales_id, // Pass draft ID for deletion
          },
        });
        window.dispatchEvent(loadEvent);
      }

      setShowQueueModal(false);
      setTimeout(() => onCheckout(), 100);
    }
  };

  const handleUnitChange = (itemId: string, newUnit: string) => {
    const item = cart.find((i) => i.id === itemId);
    const prices = item?.sellingPrices || item?.all_selling_prices;
    if (prices) {
      const selectedPrice = prices.find((p) => p.unit_of_measure === newUnit);
      if (selectedPrice) {
        onUpdateQuantity(
          itemId,
          item.quantity,
          selectedPrice.unit_selling_price,
          newUnit
        );
      }
    }
  };

  const handlePriceChange = (itemId: string, newPrice: number) => {
    const item = cart.find((i) => i.id === itemId);
    if (item) {
      onUpdateQuantity(itemId, item.quantity, newPrice, item.unit_of_measure);
    }
  };

  useEffect(() => {
    const handleDraftCompleted = () => {
      fetchDraftReceipts();
    };

    window.addEventListener("draftCompleted", handleDraftCompleted);
    return () =>
      window.removeEventListener("draftCompleted", handleDraftCompleted);
  }, [actualWarehouse]);

  useEffect(() => {
    const handleDraftCompletedWithId = (event: CustomEvent) => {
      const { sales_id } = event.detail;
      console.log(
        "[DukaPlus] Cart Summary received draftCompleted event for:",
        sales_id
      );

      // Remove the completed draft from local state immediately
      setDraftReceipts((prevDrafts) => {
        const filtered = prevDrafts.filter(
          (draft) => draft.sales_id !== sales_id
        );
        console.log(
          "[DukaPlus] Removed draft from queue. Before:",
          prevDrafts.length,
          "After:",
          filtered.length
        );
        setQueuedCount(filtered.length);
        return filtered;
      });

      // Also refresh from server to ensure consistency
      setTimeout(() => fetchDraftReceipts(), 1000);
    };

    window.addEventListener(
      "draftCompleted",
      handleDraftCompletedWithId as EventListener
    );
    return () =>
      window.removeEventListener(
        "draftCompleted",
        handleDraftCompletedWithId as EventListener
      );
  }, []);

  useEffect(() => {
    const newInputs: { [key: string]: string } = {};
    cart.forEach((item) => {
      // Always update to reflect current cart quantity
      newInputs[item.id] = item.quantity.toString();
    });
    setQuantityInputs(newInputs);
  }, [cart]);

  return (
    <div className="flex flex-col h-full bg-card">
      {error && (
        <div className="mx-3 sm:mx-4 mt-2 sm:mt-3 alert-error flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
          <p className="text-danger text-xs sm:text-sm">{error}</p>
        </div>
      )}

      {cart.length > 0 && (
        <div
          className="hidden md:grid px-3 sm:px-4 py-1.5 sm:py-2 table-header gap-2 text-xs font-semibold border-b border-border"
          style={{ gridTemplateColumns: "2fr 1fr 1.5fr 1fr 1fr" }}
        >
          <div className="table-cell">Name</div>
          <div className="table-cell text-center">QTY</div>
          <div className="table-cell text-center">UOM</div>
          <div className="table-cell text-right">Rate</div>
          <div className="table-cell text-right">Amount</div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 sm:px-4 space-y-2 py-2 sm:py-3">
        {cart.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-xs sm:text-sm">Cart is empty</p>
          </div>
        ) : (
          cart.map((item) => {
            const prices = item.all_selling_prices || item.sellingPrices || [];
            const hasMultiplePrices = prices.length > 1;
            const currentUom =
              item.unit_of_measure ||
              (prices.length > 0 ? prices[0]?.unit_of_measure : "Each");

            return (
              <div
                key={item.id}
                className="grid gap-1.5 sm:gap-2 items-center min-h-14 sm:h-16 bg-muted/50 p-1.5 sm:p-2 rounded-lg hover:bg-muted transition-colors"
                style={{ gridTemplateColumns: "2fr 1fr 1.5fr 1fr 1fr" }}
              >
                <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-danger hover:text-red-700 dark:hover:text-red-300 flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                  <span
                    className="text-xs font-medium text-foreground truncate"
                    title={item.name}
                  >
                    {item.name}
                  </span>
                </div>
                <div>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={quantityInputs[item.id] ?? item.quantity.toString()}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow numbers, decimals, and empty string
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        setQuantityInputs((prev) => ({
                          ...prev,
                          [item.id]: value,
                        }));
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      const numValue = Number.parseFloat(value);

                      if (value === "" || isNaN(numValue) || numValue < 0.01) {
                        // Reset to previous valid value
                        setQuantityInputs((prev) => ({
                          ...prev,
                          [item.id]: item.quantity.toString(),
                        }));
                      } else {
                        // Update cart with new quantity
                        onUpdateQuantity(item.id, numValue);
                        setQuantityInputs((prev) => ({
                          ...prev,
                          [item.id]: numValue.toString(),
                        }));
                      }
                    }}
                    className="h-7 sm:h-8 input-base text-center text-xs"
                  />
                </div>
                <div>
                  {hasMultiplePrices ? (
                    <Select
                      value={currentUom}
                      onValueChange={(val) => handleUnitChange(item.id, val)}
                    >
                      <SelectTrigger className="h-7 sm:h-8 input-base text-xs">
                        <SelectValue placeholder={currentUom} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {prices.map((sp) => (
                          <SelectItem
                            key={sp.unit_of_measure}
                            value={sp.unit_of_measure}
                            className="text-foreground text-xs"
                          >
                            {sp.unit_of_measure} (
                            {`${currency} ${sp.unit_selling_price}`})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-foreground text-xs pl-1 sm:pl-2 block leading-7">
                      {currentUom}
                    </span>
                  )}
                </div>
                <div>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) =>
                      handlePriceChange(item.id, Number(e.target.value) || 0)
                    }
                    className="h-7 sm:h-8 input-base text-center text-xs"
                  />
                </div>
                <div className="text-right text-foreground font-semibold text-xs">
                  {`${currency} ${item.quantity * item.price}`}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-border px-2 sm:px-4 py-1.5 sm:py-2 space-y-1.5 bg-card">
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm font-semibold text-foreground">
            Total: ({cart.length} items)
          </span>
          <span className="text-base sm:text-lg font-bold text-success">{`${currency} ${totalAmount}`}</span>
        </div>

        <Button
          onClick={onCheckout}
          disabled={cart.length === 0 || isProcessing}
          className="w-full btn-success h-8 sm:h-9 text-xs sm:text-sm font-bold uppercase rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          CHECKOUT ({`${currency} ${totalAmount}`})
        </Button>

        {queuedCount > 0 ? (
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              onClick={handleQueueCart}
              disabled={cart.length === 0 || isProcessing}
              className="bg-orange-600 hover:bg-orange-700 text-white h-8 sm:h-9 text-xs sm:text-sm font-bold uppercase rounded-lg disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : "QUEUE"}
            </Button>
            <Button
              onClick={() => setShowQueueModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white h-8 sm:h-9 text-xs sm:text-sm font-bold uppercase rounded-lg"
            >
              QUEUED ({`${queuedCount} receipts`})
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleQueueCart}
            disabled={cart.length === 0 || isProcessing}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white h-8 sm:h-9 text-xs sm:text-sm font-bold uppercase rounded-lg disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "QUEUE"}
          </Button>
        )}
      </div>

      {showQueueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">
                Queued Receipts
              </h2>
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
                      <p className="font-mono text-sm text-warning">
                        {draft.sales_id}
                      </p>
                      <p className="text-foreground font-medium">
                        {draft.customer}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {draft.date} {draft.time}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {draft.items?.length || 0} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">
                        {currency}{" "}
                        {draft.total_amount?.toLocaleString("en-KE", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {draft.status === "paid" || draft.status === 1
                          ? "✓ Paid"
                          : "Pending"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border">
              <Button
                onClick={() => setShowQueueModal(false)}
                className="w-full btn-cancel"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
