"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserProfile } from "@/components/auth/user-profile"
import { ShiftHistory } from "@/components/shift/shift-history"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [currentWarehouse, setCurrentWarehouse] = useState("")

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const warehouse = sessionStorage.getItem("selected_warehouse")
    if (warehouse) {
      setCurrentWarehouse(warehouse)
    }
  }, [])

  if (isLoading || !user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and view shift history</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-muted p-1 rounded-lg inline-flex gap-1">
            <TabsTrigger 
              value="profile" 
              className="px-4 py-2 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground transition-colors"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="shifts" 
              className="px-4 py-2 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground transition-colors"
            >
              Shifts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <UserProfile user={user} />
          </TabsContent>

          <TabsContent value="shifts" className="mt-6">
            <div className="card-base p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Shift History</h2>
              {currentWarehouse ? (
                <ShiftHistory warehouseId={currentWarehouse} />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Please select a warehouse to view shift history
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
