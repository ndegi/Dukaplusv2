"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { InventoryOverview } from "@/components/inventory/inventory-overview"
import { StockTransferManager } from "@/components/inventory/stock-transfer-manager"
import { PurchaseOrdersManager } from "@/components/inventory/purchase-orders-manager"
import { PurchaseReceiptsManager } from "@/components/inventory/purchase-receipts-manager"
import { PurchaseInvoicesManager } from "@/components/inventory/purchase-invoices-manager"
import { SuppliersManager } from "@/components/inventory/suppliers-manager"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"

export default function InventoryPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"products" | "purchase-order" | "purchase-receipt" | "purchase-invoices" | "stock-transfer" | "suppliers">(
    "products",
  )

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Track and manage product stock levels</p>
        </div>

        <div className="flex gap-2 border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${activeTab === "products"
                ? "text-warning border-b-2 border-warning"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab("purchase-order")}
            className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${activeTab === "purchase-order"
                ? "text-warning border-b-2 border-warning"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Purchase Orders
          </button>
          <button
            onClick={() => setActiveTab("purchase-receipt")}
            className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${activeTab === "purchase-receipt"
                ? "text-warning border-b-2 border-warning"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Purchase Receipts
          </button>
          <button
            onClick={() => setActiveTab("purchase-invoices")}
            className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${activeTab === "purchase-invoices"
                ? "text-warning border-b-2 border-warning"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Purchase Invoices
          </button>
          <button
            onClick={() => setActiveTab("stock-transfer")}
            className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${activeTab === "stock-transfer"
                ? "text-warning border-b-2 border-warning"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Stock Transfer
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${activeTab === "suppliers"
                ? "text-warning border-b-2 border-warning"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Suppliers
          </button>
        </div>

        {activeTab === "products" && <InventoryOverview />}
        {activeTab === "purchase-order" && <PurchaseOrdersManager />}
        {activeTab === "purchase-receipt" && <PurchaseReceiptsManager />}
        {activeTab === "purchase-invoices" && <PurchaseInvoicesManager />}
        {activeTab === "stock-transfer" && <StockTransferManager />}
        {activeTab === "suppliers" && <SuppliersManager />}
      </div>
    </DashboardLayout>
  )
}
