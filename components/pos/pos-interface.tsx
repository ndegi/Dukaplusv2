"use client"

import { useState, useEffect } from "react"
import { ProductBrowser } from "./product-browser"
import { CartSummary } from "./cart-summary"
import { PaymentForm } from "./payment-form"
import { offlineStore } from "@/lib/db/offline-store"
import { BarcodeInput } from "./barcode-input"

interface User {
  id: string
  name: string
  warehouse: string
}

interface CartItem {
  id: string
  name: string
  sku: string
  price: number
  quantity: number
  subtotal: number
  unit_of_measure?: string
  sellingPrices?: Array<{ unit_of_measure: string; unit_selling_price: number }>
}

interface Customer {
  id: string
  name: string
  account_credit?: number
  loyalty_points?: number
}

export function POSInterface({
  user,
  searchTerm,
  quantity,
  selectedCustomer,
}: {
  user: User
  searchTerm: string
  quantity: number
  selectedCustomer: string
}) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [totalAmount, setTotalAmount] = useState(0)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState(selectedCustomer)
  const [customerName, setCustomerName] = useState("Walk In")
  const [mobileNumber, setMobileNumber] = useState("")
  const [pendingInvoiceId, setPendingInvoiceId] = useState<string | null>(null)
  const [invoiceOutstandingAmount, setInvoiceOutstandingAmount] = useState<number | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [customerCredit, setCustomerCredit] = useState(0)
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [barcodeSearching, setBarcodeSearching] = useState(false)
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    const initCart = async () => {
      const savedCart = await offlineStore.getCart()
      if (savedCart.length > 0) {
        setCart(savedCart)
      }
    }
    initCart()
  }, [])

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/customers/list")
        if (!response.ok) throw new Error("Failed to fetch customers")

        const data = await response.json()
        setCustomers(data.customers || [])
      } catch (error) {
        console.error("[DukaPlus] Failed to fetch customers:", error)
      }
    }

    fetchCustomers()
  }, [])

  useEffect(() => {
    offlineStore.saveCart(cart).catch((error) => {
      console.error("[DukaPlus] Failed to save cart:", error)
    })
  }, [cart])

  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0)
    setTotalAmount(total)
  }, [cart])

  useEffect(() => {
    const updateCustomerInfo = async () => {
      if (selectedCustomer === "Walk In" || selectedCustomer === "walk-in") {
        setCustomerName("Walk In")
        setMobileNumber("")
        setCustomerCredit(0)
        setLoyaltyPoints(0)
        console.log("[DukaPlus] Reset to Walk In customer")
        return
      }

      const customer = customers.find((c) => c.id === selectedCustomer)
      if (customer) {
        setCustomerName(customer.name)
        try {
          const response = await fetch(`/api/customers/list`)
          if (response.ok) {
            const data = await response.json()
            const fullCustomer = data.customers?.find(
              (c: any) =>
                (c.customer_id || c.customer_name) === selectedCustomer ||
                c.customer_name === selectedCustomer ||
                c.id === selectedCustomer ||
                c.name === selectedCustomer,
            )

            if (fullCustomer) {
              const mobile =
                fullCustomer.mobile_number ||
                fullCustomer.mobile_no ||
                fullCustomer.phone ||
                fullCustomer.mobile ||
                fullCustomer.contact_mobile ||
                ""

              console.log("[DukaPlus] Full customer data received:", {
                id: fullCustomer.id,
                customerId: fullCustomer.customer_id,
                name: fullCustomer.customer_name || fullCustomer.name,
                allFields: fullCustomer,
                resolvedMobile: mobile,
              })

              setMobileNumber(mobile)
              setCustomerCredit(fullCustomer.account_credit || 0)
              setLoyaltyPoints(fullCustomer.loyalty_points || 0)

              console.log("[DukaPlus] POS Interface updated customer info:", {
                name: fullCustomer.customer_name || fullCustomer.name,
                mobile,
                credit: fullCustomer.account_credit,
                points: fullCustomer.loyalty_points,
              })
            } else {
              console.log("[DukaPlus] Customer not found in API response. Searched for:", selectedCustomer)
              console.log(
                "[DukaPlus] Available customers:",
                data.customers?.map((c: any) => ({
                  id: c.id,
                  customerId: c.customer_id,
                  name: c.customer_name || c.name,
                })),
              )
              setCustomerName(selectedCustomer)
            }
          } else {
            console.error("[DukaPlus] Failed to fetch customer list")
          }
        } catch (error) {
          console.error("[DukaPlus] Failed to fetch customer details:", error)
        }
      } else {
        console.log("[DukaPlus] Customer not found in local state, using selected name:", selectedCustomer)
        setCustomerName(selectedCustomer)
      }
    }

    updateCustomerInfo()
  }, [selectedCustomer, customers])

  useEffect(() => {
    const handleLoadDraftItems = (event: any) => {
      const { items, customer, mobile, draftId } = event.detail

      setCart([])

      if (customer) setCustomerName(customer)
      if (mobile) setMobileNumber(mobile)
      if (draftId) setDraftId(draftId)

      items.forEach((item: any) => {
        const cartItem: CartItem = {
          id: item.item_code,
          name: item.item_name,
          sku: item.item_code,
          price: item.rate,
          quantity: item.qty,
          subtotal: item.amount,
          unit_of_measure: "Each",
        }
        setCart((prev) => [...prev, cartItem])
      })
    }

    window.addEventListener("loadDraftItems", handleLoadDraftItems)
    return () => window.removeEventListener("loadDraftItems", handleLoadDraftItems)
  }, [])

  useEffect(() => {
    const pendingInvoice = sessionStorage.getItem("pending_invoice_payment")
    if (pendingInvoice) {
      try {
        const invoice = JSON.parse(pendingInvoice)
        console.log("[DukaPlus] Loading pending invoice payment:", invoice)
        setCustomerName(invoice.customer_name || "Walk In")
        setMobileNumber(invoice.mobile_number || "")
        setPendingInvoiceId(invoice.sales_id)
        setInvoiceOutstandingAmount(invoice.outstanding_amount || 0)
        setShowPayment(true)
        sessionStorage.removeItem("pending_invoice_payment")
      } catch (err) {
        console.error("[DukaPlus] Failed to load pending invoice:", err)
      }
    }
  }, [])

  const addToCart = (product: any) => {
    console.log("[DukaPlus] Adding product to cart:", product.name, "all_selling_prices:", product.all_selling_prices)

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price,
              }
            : item,
        )
      }

      const prices = product.all_selling_prices || []
      const defaultPrice = prices.length > 0 ? prices[0].unit_selling_price : product.price
      const defaultUom = prices.length > 0 ? prices[0].unit_of_measure : "Each"

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
      }

      console.log("[DukaPlus] New cart item:", newItem)
      return [...prevCart, newItem]
    })
  }

  const updateCartItem = (id: string, quantity: number, price?: number, unit?: string) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
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
          : item,
      ),
    )
  }

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  }

  const clearCart = () => {
    setCart([])
    offlineStore.clearCart().catch((error) => {
      console.error("[DukaPlus] Failed to clear cart:", error)
    })
    setShowPayment(false)
    setPendingInvoiceId(null)
    setInvoiceOutstandingAmount(null)
    setDraftId(null)
  }

  const handleBarcodeScan = async (barcode: string) => {
    setBarcodeSearching(true)
    try {
      const credentialsStr = sessionStorage.getItem("tenant_credentials")
      const credentials = credentialsStr ? JSON.parse(credentialsStr) : null
      const warehouse = sessionStorage.getItem("selected_warehouse")

      if (!warehouse) {
        setBarcodeSearching(false)
        return
      }

      // Search for product by barcode in the products list
      let foundProduct = products.find(
        (p) => p.barcode?.toLowerCase() === barcode.toLowerCase() || p.sku?.toLowerCase() === barcode.toLowerCase(),
      )

      if (!foundProduct) {
        // If not found locally, fetch all products and search
        const response = await fetch(`/api/inventory/products?warehouse_id=${encodeURIComponent(warehouse)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(credentials
              ? {
                  Authorization: `token ${credentials.username}:${credentials.apiKey}`,
                }
              : {}),
          },
        })

        if (response.ok) {
          const data = await response.json()
          const allProducts = data.products || []
          setProducts(allProducts)

          foundProduct = allProducts.find(
            (p: any) =>
              p.barcode?.toLowerCase() === barcode.toLowerCase() || p.sku?.toLowerCase() === barcode.toLowerCase(),
          )
        }
      }

      if (foundProduct) {
        console.log("[DukaPlus] Product found by barcode:", foundProduct.name)
        addToCart(foundProduct)
      } else {
        console.log("[DukaPlus] No product found for barcode:", barcode)
      }
    } catch (error) {
      console.error("[DukaPlus] Error searching by barcode:", error)
    } finally {
      setBarcodeSearching(false)
    }
  }

  if (showPayment) {
    return (
      <div className="h-full bg-slate-50 dark:bg-slate-800 overflow-y-auto">
        <PaymentForm
          totalAmount={invoiceOutstandingAmount !== null ? invoiceOutstandingAmount : totalAmount}
          itemCount={cart.length}
          cartItems={cart}
          invoiceId={pendingInvoiceId || undefined}
          isInvoicePayment={!!pendingInvoiceId}
          onClose={() => {
            setShowPayment(false)
            setPendingInvoiceId(null)
            setInvoiceOutstandingAmount(null)
            setDraftId(null)
          }}
          onSuccess={() => {
            clearCart()
            setShowPayment(false)
            setPendingInvoiceId(null)
            setInvoiceOutstandingAmount(null)
            setDraftId(null)
          }}
          customerName={customerName}
          mobileNumber={mobileNumber}
          customerCredit={customerCredit}
          loyaltyPoints={loyaltyPoints}
          mode="inline"
          draftId={draftId || undefined}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-0 bg-slate-50 dark:bg-slate-800">
      {/* Product Browser Section - Full width on mobile, left half on desktop */}
      <div className="w-full lg:w-1/2 overflow-y-auto order-2 lg:order-1 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-slate-700 flex flex-col">
        <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
          <BarcodeInput onScan={handleBarcodeScan} isLoading={barcodeSearching} />
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
          mobileNumber={mobileNumber}
          customerCredit={customerCredit}
          loyaltyPoints={loyaltyPoints}
        />
      </div>
    </div>
  )
}
