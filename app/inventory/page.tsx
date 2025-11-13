"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { InventoryOverview } from "@/components/inventory/inventory-overview"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function InventoryPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

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

        <InventoryOverview />
      </div>
    </DashboardLayout>
  )
}
