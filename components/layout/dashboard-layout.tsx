"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from "@/hooks/use-auth"
import { Menu, X, LogOut, Moon, Sun } from 'lucide-react'
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
  quantity,
  selectedCustomer,
  onSearchChange,
  onQuantityChange,
  onCustomerChange,
  currentSalesPerson,
  onSalesPersonChange,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSalesPersonModal, setShowSalesPersonModal] = useState(false)
  const [showWarehouseModal, setShowWarehouseModal] = useState(false)
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([])
  const [currentWarehouse, setCurrentWarehouse] = useState("")
  const [customerSearch, setCustomerSearch] = useState("")
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [mustSelectWarehouse, setMustSelectWarehouse] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

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
    }
  }, [])

  useEffect(() => {
    if (isPOS) {
      fetchCustomers()
    }
  }, [isPOS])

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers/list")
      if (response.ok) {
        const data = await response.json()
        const customerList = data.customers || []
        setCustomers(
          customerList.map((c: any) => ({
            id: c.customer_id || c.customer_name,
            name: c.customer_name,
          })),
        )
      }
    } catch (error) {
      console.error("[v0] Failed to fetch customers:", error)
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
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-4 flex-shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h2 className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-500">{getPageTitle()}</h2>

            {/* Header Controls - Dynamic based on page */}
            <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">
              {isPOS && currentWarehouse && <ShiftStatusIndicator warehouseId={currentWarehouse} />}

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div>
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm || ""}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-blue-500 focus:outline-none text-sm"
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
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-blue-500 focus:outline-none text-sm"
                />
                {showCustomerDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                    <button
                      onClick={() => {
                        setCustomerSearch("Walk In")
                        onCustomerChange?.("Walk In")
                        setShowCustomerDropdown(false)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-sm border-b border-slate-200 dark:border-slate-600"
                    >
                      Walk In
                    </button>
                    {customers
                      .filter((c) => c.name && c.name.toLowerCase().includes(customerSearch.toLowerCase()))
                      .map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => {
                            setCustomerSearch(customer.name)
                            onCustomerChange?.(customer.name)
                            setShowCustomerDropdown(false)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-sm"
                        >
                          {customer.name}
                        </button>
                      ))}
                    {customers.filter((c) => c.name && c.name.toLowerCase().includes(customerSearch.toLowerCase()))
                      .length === 0 &&
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

      {/* Sales Person Switcher Modal - only for POS */}
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
