"use client"

import { useState, useEffect } from "react"
import { ProductBrowser } from "./product-browser"
import { CartSummary } from "./cart-summary"
import { PaymentModal } from "./payment-modal"
import { offlineStore } from "@/lib/db/offline-store"

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
        return
      }

      // Try to find customer in the customers list first
      const customer = customers.find((c) => c.id === selectedCustomer)
      if (customer) {
        setCustomerName(customer.name)
        // Fetch full customer details including mobile
        try {
          const response = await fetch(`/api/customers/list`)
          if (response.ok) {
            const data = await response.json()
            const fullCustomer = data.customers?.find(
              (c: any) => (c.customer_id || c.customer_name) === selectedCustomer,
            )
            if (fullCustomer) {
              setMobileNumber(fullCustomer.mobile_number || "")
            }
          }
        } catch (error) {
          console.error("[DukaPlus] Failed to fetch customer details:", error)
        }
      } else {
        // If not found in list, treat as customer name directly
        setCustomerName(selectedCustomer)
      }
    }

    updateCustomerInfo()
  }, [selectedCustomer, customers])

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
        all_selling_prices: prices, // Add both for compatibility
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
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-0 lg:gap-0 bg-gray-50 dark:bg-gray-900">
      <div className="w-full lg:w-1/2 overflow-y-auto order-2 lg:order-1 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700">
        <ProductBrowser onAddToCart={addToCart} searchTerm={searchTerm} />
      </div>

      <div className="w-full lg:w-1/2 bg-white dark:bg-gray-800 overflow-y-auto flex flex-col order-1 lg:order-2">
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
        />
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          totalAmount={totalAmount}
          itemCount={cart.length}
          cartItems={cart}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            clearCart()
            setShowPayment(false)
          }}
          customerName={customerName}
          mobileNumber={mobileNumber}
        />
      )}
    </div>
  )
}
