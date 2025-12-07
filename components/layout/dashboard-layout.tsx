"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Menu, X, LogOut, Moon, Sun } from "lucide-react"
import {
  faHome,
  faShoppingCart,
  faBox,
  faUsers,
  faFileInvoice,
  faFileAlt,
  faChartBar,
  faUser,
  faExchange,
  faBuilding,
  faCog,
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Link from "next/link"
import Image from "next/image"
import { IdleScreensaver } from "@/components/screensaver/idle-screensaver"
import { useTheme } from "next-themes"
import { SalesPeopleSwitcher } from "@/components/sales/sales-people-switcher"
import { WarehouseSwitcher } from "@/components/warehouse/warehouse-switcher"
import { ShiftStatusIndicator } from "@/components/shift/shift-status-indicator"

interface DashboardLayoutProps {
  children: React.ReactNode
  searchTerm?: string
  quantity?: number
  selectedCustomer?: string
  onSearchChange?: (value: string) => void
  onQuantityChange?: (value: number) => void
  onCustomerChange?: (value: string) => void
  currentSalesPerson?: string | null
  onSalesPersonChange?: (salesPerson: string) => void
}

export function DashboardLayout({
  children,
  searchTerm,
  onSearchChange,
  onQuantityChange,
  onCustomerChange,
  currentSalesPerson,
  onSalesPersonChange,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSalesPersonModal, setShowSalesPersonModal] = useState(false)
  const [showWarehouseModal, setShowWarehouseModal] = useState(false)
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; mobile_number?: string }>>([])
  const [currentWarehouse, setCurrentWarehouse] = useState("")
  const [customerSearch, setCustomerSearch] = useState("")
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [mustSelectWarehouse, setMustSelectWarehouse] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [warehouseId, setWarehouseId] = useState("")

  const isPOS = pathname === "/pos"

  useEffect(() => {
    setMounted(true)
    const stored = sessionStorage.getItem("selected_warehouse")
    if (!stored) {
      setMustSelectWarehouse(true)
      setShowWarehouseModal(true)
    } else {
      const storedName = sessionStorage.getItem("selected_warehouse_name")
      setCurrentWarehouse(storedName || stored)
      setWarehouseId(stored)
    }
  }, [])

  useEffect(() => {
    const handleWarehouseChange = (event: Event) => {
      const customEvent = event as CustomEvent
      const newWarehouseId = customEvent.detail
      setWarehouseId(newWarehouseId)
    }

    window.addEventListener("warehouseChanged", handleWarehouseChange)
    return () => window.removeEventListener("warehouseChanged", handleWarehouseChange)
  }, [])

  useEffect(() => {
    if (isPOS) {
      fetchWalkInCustomerFirst()
    }
  }, [isPOS])

  useEffect(() => {
    if (!isPOS) return

    const handleResetToWalkIn = async () => {
      try {
        const walkInResponse = await fetch("/api/sales/walk-in-customer")
        if (walkInResponse.ok) {
          const walkInData = await walkInResponse.json()
          const walkInName = walkInData.walk_in_customer || ""
          const walkIn = customers.find(
            (c) => c.name === walkInName || c.id === walkInName || c.name.toLowerCase().includes("walk")
          )

          if (walkIn) {
            // Update the header input text
            setCustomerSearch(walkIn.name || "")
            onCustomerChange?.(
              JSON.stringify({
                id: walkIn.id, // Use the actual customer_id from API
                name: walkIn.name || "",
                mobile_number: walkIn.mobile_number || "",
              }),
            )
          }
        }
      } catch (error) {
        console.error("[DukaPlus] Failed to reset to walk-in customer:", error)
      }
    }

    window.addEventListener("resetToWalkInCustomer", handleResetToWalkIn)
    return () => window.removeEventListener("resetToWalkInCustomer", handleResetToWalkIn)
  }, [isPOS, customers, onCustomerChange])

  const fetchWalkInCustomerFirst = async () => {
    try {
      const walkInResponse = await fetch("/api/sales/walk-in-customer")
      let walkInName = ""

      if (walkInResponse.ok) {
        const walkInData = await walkInResponse.json()
        walkInName = walkInData.walk_in_customer || ""
      } else {
        console.warn("[DukaPlus] Failed to fetch walk-in customer:", walkInResponse.status)
      }
      const customersResponse = await fetch("/api/customers/list")

      if (!customersResponse.ok) {
        throw new Error(`Failed to fetch customers: ${customersResponse.status}`)
      }

      const customersData = await customersResponse.json()

      const customerList = customersData.customers || customersData.message?.customers || []
      const walkInCustomer = customerList.find(
        (c: any) => (c.customer_id || c.customer_name) === walkInName || (c.customer_name || c.name) === walkInName
      )
      const walkInCustomerId = walkInCustomer
        ? walkInCustomer.customer_id || walkInCustomer.id || walkInName
        : walkInName

      const allCustomers = [
        { id: walkInCustomerId, name: walkInName, mobile_number: "" },
        ...customerList
          .filter((c: any) => {
            const cId = c.customer_id || c.id || c.customer_name
            const cName = c.customer_name || c.name
            return cId !== walkInCustomerId && cName !== walkInName
          })
          .map((c: any) => ({
            id: c.customer_id || c.id,
            name: c.customer_name || c.name,
            mobile_number: c.mobile_number || "",
          })),
      ]
      setCustomers(allCustomers)
    } catch (error) {
      console.error("[DukaPlus] Error in fetchWalkInCustomerFirst:", error)
      setCustomers([{ id: "walk-in", name: "", mobile_number: "" }])
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      sessionStorage.removeItem("tenant_credentials")
      sessionStorage.removeItem("selected_warehouse")
      router.push("/login")
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }

  const handleWarehouseSwitch = (warehouse: string) => {
    sessionStorage.setItem("selected_warehouse", warehouse)
    const warehouseName = warehouse
    sessionStorage.setItem("selected_warehouse_name", warehouseName)
    setCurrentWarehouse(warehouseName)
    setWarehouseId(warehouse)
    setShowWarehouseModal(false)
    setMustSelectWarehouse(false)
    window.location.reload()
  }

  const navItems = [
    { label: "Dashboard", icon: faHome, href: "/dashboard" },
    { label: "Point of Sale", icon: faShoppingCart, href: "/pos" },
    { label: "Inventory", icon: faBox, href: "/inventory" },
    { label: "Customers", icon: faUsers, href: "/customers" },
    { label: "Sales", icon: faFileInvoice, href: "/sales" },
    { label: "Expenses", icon: faFileAlt, href: "/expenses" },
    { label: "Reports", icon: faChartBar, href: "/reports" },
    { label: "Settings", icon: faCog, href: "/profile" },
    { label: "Users", icon: faUser, href: "/users" },
  ]

  const getPageTitle = () => {
    const currentItem = navItems.find((item) => item.href === pathname)
    return currentItem?.label || "DukaPlus POS"
  }

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      <IdleScreensaver idleTimeout={300000} />

      {mustSelectWarehouse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Select Warehouse Required</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              You must select a warehouse before accessing the application.
            </p>
            <WarehouseSwitcher onSuccess={handleWarehouseSwitch} onCancel={() => { }} />
          </div>
        </div>
      )}

      <aside
        className={`bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <Image src="/images/icon.png" alt="DukaPlus" width={32} height={32} className="flex-shrink-0" />
                <span className="font-bold text-slate-900 dark:text-white text-lg">DukaPlus</span>
              </div>
            )}
            {!sidebarOpen && <Image src="/images/icon.png" alt="DukaPlus" width={32} height={32} className="mx-auto" />}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation - with dark mode responsive colors */}
          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group ${pathname === item.href
                  ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                  }`}
                title={!sidebarOpen ? item.label : ""}
              >
                <FontAwesomeIcon icon={item.icon} className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* Sidebar Footer with dark mode */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-3 space-y-3 bg-white dark:bg-slate-800">
            {sidebarOpen && (
              <div className="px-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Logged in</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              {sidebarOpen && "Logout"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Dynamic based on current page */}
        <div
          className={`bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 flex-shrink-0 ${isPOS ? "py-2" : "py-4"}`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
            <h2
              className={`font-bold text-green-600 dark:text-green-500 ${isPOS ? "text-base md:text-lg" : "text-lg md:text-2xl"}`}
            >
              {getPageTitle()}
            </h2>

            {/* Header Controls - Dynamic based on page */}
            <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">
              {isPOS && warehouseId && <ShiftStatusIndicator warehouseId={warehouseId} />}

              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-slate-600" />
                  )}
                </button>
              )}

              {/* User Dropdown - Includes Sales Person Switcher for POS */}
              <div className="relative group">
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium">
                  <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                  <span className="hidden md:inline">{user?.name || "User"}</span>
                  {isPOS && <span className="md:hidden">Menu</span>}
                </button>

                {/* Dropdown Menu - Shows Sales Person switch for POS */}
                <div className="absolute right-0 mt-0 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-600">
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                      {currentSalesPerson || "No Sales Person"}
                    </p>
                  </div>
                  {isPOS && (
                    <button
                      onClick={() => setShowSalesPersonModal(true)}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faExchange} className="w-4 h-4" />
                      Switch Sales Person
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 border-t border-slate-200 dark:border-slate-600"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowWarehouseModal(true)}
                className="flex items-center gap-2 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <FontAwesomeIcon icon={faBuilding} className="w-4 h-4" />
                <span className="hidden md:inline">{currentWarehouse}</span>
              </button>
            </div>
          </div>

          {/* POS-specific controls - Search and Customer */}
          {isPOS && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              <div>
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm || ""}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-blue-500 focus:outline-none text-sm"
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search customer..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value)
                    setShowCustomerDropdown(true)
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-blue-500 focus:outline-none text-sm"
                />
                {showCustomerDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                    {customers
                      .filter(
                        (c) =>
                          (c.name && c.name.toLowerCase().includes(customerSearch.toLowerCase())) ||
                          (c.mobile_number && c.mobile_number.includes(customerSearch)),
                      )
                      .map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => {
                            setCustomerSearch(customer.name)
                            onCustomerChange?.(
                              JSON.stringify({
                                id: customer.id,
                                name: customer.name,
                                mobile_number: customer.mobile_number || "",
                              }),
                            )
                            setShowCustomerDropdown(false)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-sm"
                        >
                          <div className="flex justify-between items-center">
                            <span>{customer.name}</span>
                            {customer.mobile_number && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                                {customer.mobile_number}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    {customers.filter(
                      (c) =>
                        (c.name && c.name.toLowerCase().includes(customerSearch.toLowerCase())) ||
                        (c.mobile_number && c.mobile_number.includes(customerSearch)),
                    ).length === 0 &&
                      customerSearch !== "" && (
                        <div className="px-3 py-2 text-slate-500 dark:text-slate-400 text-sm">No customers found</div>
                      )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Page Content */}
        <div
          className={`flex-1 overflow-auto ${isPOS ? "p-0 bg-slate-50 dark:bg-slate-900" : "p-4 md:p-8 bg-slate-50 dark:bg-slate-900"
            }`}
        >
          {children}
        </div>
      </main>

      {showWarehouseModal && (
        <WarehouseSwitcher
          onSuccess={handleWarehouseSwitch}
          onCancel={() => {
            if (!mustSelectWarehouse) {
              setShowWarehouseModal(false)
            }
          }}
        />
      )}

      {isPOS && showSalesPersonModal && (
        <SalesPeopleSwitcher
          onSuccess={(salesPerson) => {
            onSalesPersonChange?.(salesPerson)
            setShowSalesPersonModal(false)
          }}
          onCancel={() => setShowSalesPersonModal(false)}
        />
      )}
    </div>
  )
}
