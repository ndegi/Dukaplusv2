"use client";

import { useState, useEffect } from "react";
import { ProductBrowser } from "./product-browser";
import { CartSummary } from "./cart-summary";
import { PaymentForm } from "./payment-form";
import { offlineStore } from "@/lib/db/offline-store";
import { BarcodeInput } from "./barcode-input";

interface User {
  id: string;
  name: string;
  warehouse: string;
}

interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
  unit_of_measure?: string;
  sellingPrices?: Array<{
    unit_of_measure: string;
    unit_selling_price: number;
  }>;
  available_quantity: number;
}

interface Customer {
  id: string;
  name: string;
  account_credit?: number;
  loyalty_points?: number;
  mobile_number?: string;
}

export function POSInterface({
  user,
  searchTerm,
  quantity,
  selectedCustomer,
  selectedCustomerId,
}: {
  user: User;
  searchTerm: string;
  quantity: number;
  selectedCustomer: string;
  selectedCustomerId?: string;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedId, setSelectedId] = useState(selectedCustomerId);
  const [customerName, setCustomerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [pendingInvoiceId, setPendingInvoiceId] = useState<string | null>(null);
  const [invoiceOutstandingAmount, setInvoiceOutstandingAmount] = useState<
    number | null
  >(null);
  const [pendingInvoiceActive, setPendingInvoiceActive] = useState<
    boolean | null
  >(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [customerCredit, setCustomerCredit] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [barcodeSearching, setBarcodeSearching] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [productMap, setProductMap] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    const initCart = async () => {
      const savedCart = await offlineStore.getCart();
      if (savedCart.length > 0) {
        setCart(savedCart);
      }
    };
    initCart();
  }, []);

  useEffect(() => {
    const fetchCustomersWithWalkIn = async () => {
      try {
        // First, get the walk-in customer name from the API
        const walkInResponse = await fetch("/api/sales/walk-in-customer");
        let walkInName = "";
        let walkInCustomerId = "";

        if (walkInResponse.ok) {
          const walkInData = await walkInResponse.json();
          walkInName = walkInData.walk_in_customer || "";
        }

        // Then fetch all customers to find the walk-in customer's actual ID
        const response = await fetch("/api/customers/list");
        if (!response.ok) {
          throw new Error(`Failed to fetch customers: ${response.status}`);
        }

        const customersData = await response.json();
        const customerList =
          customersData.customers || customersData.message?.customers || [];

        // Find the walk-in customer in the list using the name from the walk-in API
        const walkInCustomer = customerList.find(
          (c: any) =>
            (c.customer_id || c.customer_name) === walkInName ||
            (c.customer_name || c.name) === walkInName
        );

        // Use the actual customer_id from the API if found, otherwise use the name
        if (walkInCustomer) {
          walkInCustomerId =
            walkInCustomer.customer_id || walkInCustomer.id || walkInName;
        } else if (walkInName) {
          walkInCustomerId = walkInName;
        }

        // Map all customers, ensuring walk-in is included with its actual ID
        const allCustomers = customerList.map((c: any) => ({
          id: c.customer_id || c.id || c.customer_name,
          name: c.customer_name || c.name,
          mobile_number:
            c.mobile_number ||
            c.mobile_no ||
            c.phone ||
            c.mobile ||
            c.contact_mobile ||
            "",
        })) as Customer[];

        // If walk-in customer exists in the list, it's already included. Otherwise add it.
        if (
          walkInCustomerId &&
          !allCustomers.find((c) => c.id === walkInCustomerId)
        ) {
          allCustomers.unshift({
            id: walkInCustomerId,
            name: walkInName,
            mobile_number: "",
          });
        }

        setCustomers(allCustomers);
      } catch (error) {
        console.error(
          "[DukaPlus] Failed to fetch customers with walk-in:",
          error
        );
      }
    };

    fetchCustomersWithWalkIn();
  }, []);

  useEffect(() => {
    if (!selectedCustomer) return;

    try {
      const parsed = JSON.parse(selectedCustomer) as {
        id?: string;
        name?: string;
        mobile_number?: string;
      };

      if (parsed && parsed.id) {
        setSelectedId(parsed.id);
      }
      if (parsed && parsed.name) {
        setCustomerName(parsed.name);
      }
      if (parsed && parsed.mobile_number) {
        setMobileNumber(parsed.mobile_number);
      }
    } catch {
      // Fallback: if it's not JSON, treat it as a name only
      const name = selectedCustomer.trim();
      if (name) {
        setCustomerName(name);
      }
    }
  }, [selectedCustomer]);

  useEffect(() => {
    offlineStore.saveCart(cart).catch((error) => {});
  }, [cart]);

  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    setTotalAmount(total);
  }, [cart]);

  useEffect(() => {
    if (selectedCustomerId) {
      setSelectedId(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    const updateCustomerInfo = async () => {
      if (!selectedId) {
        // Wait until we know whether a pending invoice is active
        if (pendingInvoiceActive === null) {
          return;
        }
        // If a pending invoice is active but came without an ID, keep the parsed customer info instead of resetting to walk-in
        if (pendingInvoiceActive) {
          return;
        }
        // When no customer is selected, fetch walk-in customer from API
        try {
          const walkInResponse = await fetch("/api/sales/walk-in-customer");
          if (walkInResponse.ok) {
            const walkInData = await walkInResponse.json();
            const walkInName = walkInData.walk_in_customer || "";

            // Find the walk-in customer in the customers list to get its actual ID
            const customersResponse = await fetch("/api/customers/list");
            if (customersResponse.ok) {
              const customersData = await customersResponse.json();
              const customerList =
                customersData.customers ||
                customersData.message?.customers ||
                [];
              const walkInCustomer = customerList.find(
                (c: any) =>
                  (c.customer_id || c.customer_name) === walkInName ||
                  (c.customer_name || c.name) === walkInName
              );

              // Use the actual customer_id from the API
              const walkInCustomerId = walkInCustomer
                ? walkInCustomer.customer_id || walkInCustomer.id || walkInName
                : walkInName;

              setSelectedId(walkInCustomerId);
              setCustomerName(walkInName);
            } else {
              // Fallback: use the name as ID if customers list fetch fails
              setSelectedId(walkInName);
              setCustomerName(walkInName);
            }
            setMobileNumber("");
            setCustomerCredit(0);
            setLoyaltyPoints(0);
            return;
          }
        } catch (error) {
          console.error("[DukaPlus] Failed to fetch walk-in customer:", error);
        }
        return;
      }

      const customer = customers.find((c) => c.id === selectedId);
      if (customer) {
        setCustomerName(customer.name);
        try {
          const response = await fetch(`/api/customers/list`);
          if (response.ok) {
            const data = await response.json();
            const fullCustomer = data.customers?.find(
              (c: any) => (c.customer_id || c.customer_name) === selectedId
            );

            if (fullCustomer) {
              const mobile =
                fullCustomer.mobile_number ||
                fullCustomer.mobile_no ||
                fullCustomer.phone ||
                fullCustomer.mobile ||
                fullCustomer.contact_mobile ||
                "";
              setMobileNumber(mobile);
              setCustomerCredit(fullCustomer.account_credit || 0);
              setLoyaltyPoints(fullCustomer.loyalty_points || 0);
            }
          }
        } catch (error) {}
      }
    };

    updateCustomerInfo();
  }, [selectedId, customers, pendingInvoiceActive]);

  useEffect(() => {
    const handleLoadDraftItems = (event: any) => {
      const { items, customer, mobile, draftId } = event.detail;

      setCart([]);

      if (customer) setCustomerName(customer);
      if (mobile) setMobileNumber(mobile);
      if (draftId) setDraftId(draftId);

      items.forEach((item: any) => {
        const cartItem: CartItem = {
          id: item.item_code,
          name: item.item_name,
          sku: item.item_code,
          price: item.rate,
          quantity: item.qty,
          subtotal: item.amount,
          unit_of_measure: "Each",
          available_quantity: item.qty,
        };
        setCart((prev) => [...prev, cartItem]);
      });
    };

    window.addEventListener("loadDraftItems", handleLoadDraftItems);
    return () =>
      window.removeEventListener("loadDraftItems", handleLoadDraftItems);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      setPendingInvoiceActive(false);
      return;
    }

    const pendingInvoice = sessionStorage.getItem("pending_invoice_payment");
    if (pendingInvoice) {
      try {
        const invoice = JSON.parse(pendingInvoice);
        setSelectedId(
          invoice.customer_id ||
            invoice.customerId ||
            invoice.customer ||
            invoice.customer_name
        );
        setCustomerName(
          invoice.customer_name || invoice.customer || invoice.customerId || ""
        );
        setMobileNumber(invoice.mobile_number);
        setPendingInvoiceId(invoice.sales_id);
        setInvoiceOutstandingAmount(invoice.outstanding_amount || 0);
        setShowPayment(true);
        setPendingInvoiceActive(true);
      } catch (err) {
        setPendingInvoiceActive(false);
      } finally {
        sessionStorage.removeItem("pending_invoice_payment");
      }
    } else {
      setPendingInvoiceActive(false);
    }
  }, []);

  const addToCart = (product: any) => {
    const trackInventory = product.track_inventory ?? 1;
    const qtyInStore = product.qty_in_store ?? product.quantity ?? 0;
    const availableQty = product.quantity || 0;

    // Allow adding if it's a service (track_inventory === 0) or has available quantity
    if (trackInventory === 1 && qtyInStore <= 0) {
      return;
    }

    // Store product details for later validation
    setProductMap((prev) => ({
      ...prev,
      [product.id]: product,
    }));

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        // Only check quantity limits for products that track inventory
        if (trackInventory === 1 && newQuantity > availableQty) {
          console.warn(
            `[DukaPlus] Cannot add more of ${product.name}. Only ${availableQty} available, requested ${newQuantity}`
          );
          return prevCart;
        }

        return prevCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: newQuantity,
                subtotal: newQuantity * item.price,
              }
            : item
        );
      }

      const prices = product.all_selling_prices || [];
      const defaultPrice =
        prices.length > 0 ? prices[0].unit_selling_price : product.price;
      const defaultUom = prices.length > 0 ? prices[0].unit_of_measure : "Each";

      const newItem = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: defaultPrice,
        quantity: 1,
        subtotal: defaultPrice,
        unit_of_measure: defaultUom,
        sellingPrices: prices,
        all_selling_prices: prices,
        available_quantity: trackInventory === 0 ? Infinity : availableQty, // Services have unlimited quantity
      };

      return [...prevCart, newItem];
    });
  };

  const updateCartItem = (
    id: string,
    quantity: number,
    price?: number,
    unit?: string
  ) => {
    const product = productMap[id];
    const trackInventory = product?.track_inventory ?? 1;
    const maxQty = product?.quantity || 0;

    if (quantity < 0.01) {
      console.warn(`[DukaPlus] Quantity must be at least 0.01`);
      return;
    }

    // Only check quantity limits for products that track inventory
    if (trackInventory === 1 && quantity > maxQty) {
      console.warn(
        `[DukaPlus] Quantity ${quantity} exceeds available stock of ${maxQty}`
      );
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity,
              unit_of_measure: unit || item.unit_of_measure,
              price: price !== undefined ? price : item.price,
              subtotal: quantity * (price !== undefined ? price : item.price),
            }
          : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    offlineStore.clearCart().catch((error) => {});
    setShowPayment(false);
    setPendingInvoiceId(null);
    setInvoiceOutstandingAmount(null);
    setDraftId(null);
    setPendingInvoiceActive(false);
  };

  const handleBarcodeScan = async (barcode: string) => {
    setBarcodeSearching(true);
    try {
      const credentialsStr = sessionStorage.getItem("tenant_credentials");
      const credentials = credentialsStr ? JSON.parse(credentialsStr) : null;
      const warehouse = sessionStorage.getItem("selected_warehouse");

      if (!warehouse) {
        setBarcodeSearching(false);
        return;
      }

      let foundProduct = products.find(
        (p) =>
          p.barcode?.toLowerCase() === barcode.toLowerCase() ||
          p.sku?.toLowerCase() === barcode.toLowerCase()
      );

      if (!foundProduct) {
        const response = await fetch(
          `/api/inventory/products?warehouse_id=${encodeURIComponent(
            warehouse
          )}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(credentials
                ? {
                    Authorization: `token ${credentials.username}:${credentials.apiKey}`,
                  }
                : {}),
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const allProducts = data.products || [];
          setProducts(allProducts);

          foundProduct = allProducts.find(
            (p: any) =>
              p.barcode?.toLowerCase() === barcode.toLowerCase() ||
              p.sku?.toLowerCase() === barcode.toLowerCase()
          );
        }
      }

      if (foundProduct) {
        addToCart(foundProduct);
      }
    } catch (error) {
    } finally {
      setBarcodeSearching(false);
    }
  };

  if (showPayment) {
    return (
      <div className="h-full bg-slate-50 dark:bg-slate-800 overflow-y-auto">
        <PaymentForm
          totalAmount={
            invoiceOutstandingAmount !== null
              ? invoiceOutstandingAmount
              : totalAmount
          }
          itemCount={cart.length}
          cartItems={cart}
          invoiceId={pendingInvoiceId || undefined}
          isInvoicePayment={!!pendingInvoiceId}
          onClose={() => {
            setShowPayment(false);
            setPendingInvoiceId(null);
            setInvoiceOutstandingAmount(null);
            setDraftId(null);
          }}
          onSuccess={() => {
            // Clear cart and reset state after successful payment
            clearCart();
            setShowPayment(false);
            setPendingInvoiceId(null);
            setInvoiceOutstandingAmount(null);
            setDraftId(null);

            // Reset local POS customer state so the next sale starts from walk-in.
            setSelectedId(undefined);
            setCustomerName("");
            setMobileNumber("");

            // Notify the layout header / POS page to reset to the walk-in customer
            // using the API-provided name & id.
            window.dispatchEvent(new Event("resetToWalkInCustomer"));
          }}
          customerName={customerName}
          customerId={selectedId}
          mobileNumber={mobileNumber}
          customerCredit={customerCredit}
          loyaltyPoints={loyaltyPoints}
          mode="inline"
          draftId={draftId || undefined}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-0 bg-slate-50 dark:bg-slate-800">
      {/* Product Browser Section - Full width on mobile, left half on desktop */}
      <div className="w-full lg:w-1/2 overflow-y-auto order-2 lg:order-1 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-slate-700 flex flex-col">
        <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
          <BarcodeInput
            onScan={handleBarcodeScan}
            isLoading={barcodeSearching}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <ProductBrowser onAddToCart={addToCart} searchTerm={searchTerm} />
        </div>
      </div>

      {/* Cart Summary Section - Full width on mobile, right half on desktop */}
      <div className="w-full lg:w-1/2 bg-white dark:bg-slate-800 overflow-y-auto flex flex-col order-1 lg:order-2">
        <CartSummary
          cart={cart}
          totalAmount={totalAmount}
          onUpdateQuantity={updateCartItem}
          onRemoveItem={removeFromCart}
          onCheckout={() => setShowPayment(true)}
          onClearCart={clearCart}
          warehouse={user.warehouse}
          user={user.name}
          customerName={customerName}
          customerId={selectedId}
          mobileNumber={mobileNumber}
          customerCredit={customerCredit}
          loyaltyPoints={loyaltyPoints}
        />
      </div>
    </div>
  );
}
