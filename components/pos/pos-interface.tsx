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
  sellingPrices?: Array<{
    unit_of_measure: string
    unit_selling_price: number
  }>
  available_quantity: number
}

interface Customer {
  id: string
  name: string
  account_credit?: number
  loyalty_points?: number
  mobile_number?: string
}

export function POSInterface({
  user,
  searchTerm,
  quantity,
  selectedCustomer,
  selectedCustomerId,
}: {
  user: User
  searchTerm: string
  quantity: number
  selectedCustomer: string
  selectedCustomerId?: string
}) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [totalAmount, setTotalAmount] = useState(0)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedId, setSelectedId] = useState(selectedCustomerId)
  const [customerName, setCustomerName] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [pendingInvoiceId, setPendingInvoiceId] = useState<string | null>(null)
  const [invoiceOutstandingAmount, setInvoiceOutstandingAmount] = useState<number | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [customerCredit, setCustomerCredit] = useState(0)
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [barcodeSearching, setBarcodeSearching] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [productMap, setProductMap] = useState<{ [key: string]: any }>({})

  const getWalkInCustomerUrl = () => {
    if (typeof window === "undefined") {
      return "/api/sales/walk-in-customer"
    }
    const warehouse = sessionStorage.getItem("selected_warehouse") || ""
    return warehouse
      ? `/api/sales/walk-in-customer?warehouse_id=${encodeURIComponent(warehouse)}`
      : "/api/sales/walk-in-customer"
  }

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
    const fetchCustomersWithWalkIn = async () => {
      try {
        const walkInResponse = await fetch(getWalkInCustomerUrl())
        let walkInName = ""

        if (walkInResponse.ok) {
          const walkInData = await walkInResponse.json()
          walkInName = walkInData.walk_in_customer
        }
        const response = await fetch("/api/sales/customers")
        if (!response.ok) {
          throw new Error(`Failed to fetch customers: ${response.status}`)
        }

        const data = await response.json()
        const customerList = data.message?.customers || data.customers || []

        const allCustomers = [
          { id: "walk-in", name: walkInName, mobile_number: "" },
          ...customerList.map((c: any) => ({
            id: c.customer_id || c.id || c.customer_name,
            name: c.customer_name || c.name,
            mobile_number:
              c.mobile_number ||
              c.mobile_no ||
              c.phone ||
              c.mobile ||
              c.contact_mobile ||
              "",
          })),
        ] as Customer[]

        setCustomers(allCustomers)
      } catch (error) {
        // If fetching customers fails, don't fall back to any hard-coded walk-in name.
        // Leave selection empty and let downstream logic handle errors gracefully.
        console.error("[DukaPlus] Failed to fetch customers with walk-in:", error)
      }
    }

    fetchCustomersWithWalkIn()
  }, [])

  // Sync selected customer coming from the layout header (JSON string with id/name/mobile)
  useEffect(() => {
    if (!selectedCustomer) return

    try {
      const parsed = JSON.parse(selectedCustomer) as {
        id?: string
        name?: string
        mobile_number?: string
      }

      if (parsed && parsed.id) {
        setSelectedId(parsed.id)
      }
      if (parsed && parsed.name) {
        setCustomerName(parsed.name)
      }
      if (parsed && parsed.mobile_number) {
        setMobileNumber(parsed.mobile_number)
      }
    } catch {
      // Fallback: if it's not JSON, treat it as a name only
      const name = selectedCustomer.trim()
      if (name) {
        setCustomerName(name)
      }
    }
  }, [selectedCustomer])

  useEffect(() => {
    offlineStore.saveCart(cart).catch((error) => { })
  }, [cart])

  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0)
    setTotalAmount(total)
  }, [cart])

  useEffect(() => {
    if (selectedCustomerId) {
      setSelectedId(selectedCustomerId)
    }
  }, [selectedCustomerId])

  useEffect(() => {
    const updateCustomerInfo = async () => {
      if (!selectedId) {
        try {
          const response = await fetch(getWalkInCustomerUrl())
          if (response.ok) {
            const data = await response.json()
            const walkInName = data.walk_in_customer
            setCustomerName(walkInName)
            setMobileNumber("")
            setCustomerCredit(0)
            setLoyaltyPoints(0)
            // Mark current selection as the walk-in customer sentinel so downstream
            // logic (e.g. PaymentForm) can use the correct customer_id.
            setSelectedId("walk-in")
            return
          }
        } catch (error) {
          console.error("Failed to fetch walk-in customer:", error)
        }
        return
      }

      const customer = customers.find((c) => c.id === selectedId)
      if (customer) {
        setCustomerName(customer.name)
        try {
          const response = await fetch(`/api/customers/list`)
          if (response.ok) {
            const data = await response.json()
            const fullCustomer = data.customers?.find((c: any) => (c.customer_id || c.customer_name) === selectedId)

            if (fullCustomer) {
              const mobile =
                fullCustomer.mobile_number ||
                fullCustomer.mobile_no ||
                fullCustomer.phone ||
                fullCustomer.mobile ||
                fullCustomer.contact_mobile ||
                ""

              setMobileNumber(mobile)
              setCustomerCredit(fullCustomer.account_credit || 0)
              setLoyaltyPoints(fullCustomer.loyalty_points || 0)
            }
          }
        } catch (error) {
          console.error("Failed to fetch customer details:", error)
        }
      }
    }

    updateCustomerInfo()
  }, [selectedId, customers])

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
          available_quantity: item.qty,
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
        setCustomerName(invoice.customer_name )
        setMobileNumber(invoice.mobile_number )
        setPendingInvoiceId(invoice.sales_id)
        setInvoiceOutstandingAmount(invoice.outstanding_amount || 0)
        setShowPayment(true)
        sessionStorage.removeItem("pending_invoice_payment")
      } catch (err) { }
    }
  }, [])

  const addToCart = (product: any) => {
    const availableQty = product.quantity || 0
    if (availableQty <= 0) {
      console.warn("[DukaPlus] Cannot add out of stock item:", product.name)
      return
    }

    // Store product details for later validation
    setProductMap((prev) => ({
      ...prev,
      [product.id]: product,
    }))

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)

      if (existingItem) {
        const newQuantity = existingItem.quantity + 1
        if (newQuantity > availableQty) {
          console.warn(
            `[DukaPlus] Cannot add more of ${product.name}. Only ${availableQty} available, requested ${newQuantity}`,
          )
          return prevCart
        }

        return prevCart.map((item) =>
          item.id === product.id
            ? {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * item.price,
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
        available_quantity: availableQty,
      }

      return [...prevCart, newItem]
    })
  }

  const updateCartItem = (id: string, quantity: number, price?: number, unit?: string) => {
    const product = productMap[id]
    const maxQty = product?.quantity || 0

    if (quantity < 0.01) {
      console.warn(`[DukaPlus] Quantity must be at least 0.01`)
      return
    }

    if (quantity > maxQty) {
      console.warn(`[DukaPlus] Quantity ${quantity} exceeds available stock of ${maxQty}`)
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
    offlineStore.clearCart().catch((error) => { })
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

      let foundProduct = products.find(
        (p) => p.barcode?.toLowerCase() === barcode.toLowerCase() || p.sku?.toLowerCase() === barcode.toLowerCase(),
      )

      if (!foundProduct) {
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
        addToCart(foundProduct)
      }
    } catch (error) {
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
            // Clear cart and reset state after successful payment
            clearCart()
            setShowPayment(false)
            setPendingInvoiceId(null)
            setInvoiceOutstandingAmount(null)
            setDraftId(null)

            // Reset local POS customer state so the next sale starts from walk-in.
            setSelectedId(undefined)
            setCustomerName("")
            setMobileNumber("")

            // Notify the layout header / POS page to reset to the walk-in customer
            // using the API-provided name & id.
            window.dispatchEvent(new Event("resetToWalkInCustomer"))
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
          customerId={selectedId}
          mobileNumber={mobileNumber}
          customerCredit={customerCredit}
          loyaltyPoints={loyaltyPoints}
        />
      </div>
    </div>
  )
}
