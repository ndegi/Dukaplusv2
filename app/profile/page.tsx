"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserProfile } from "@/components/auth/user-profile"
import { ShiftHistory } from "@/components/shift/shift-history"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, User } from 'lucide-react'

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
      <div className="space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your shifts and account settings</p>
        </div>

        <Tabs defaultValue="shifts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-lg h-auto">
            <TabsTrigger 
              value="shifts" 
              className="flex items-center gap-2 px-4 py-3 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              <Clock className="w-4 h-4" />
              <span className="font-medium">Shifts</span>
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="flex items-center gap-2 px-4 py-3 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              <User className="w-4 h-4" />
              <span className="font-medium">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shifts" className="mt-6">
            <div className="card-base p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Shift Management</h2>
                <p className="text-muted-foreground">View and manage your shift history and financial summaries</p>
              </div>
              {currentWarehouse ? (
                <ShiftHistory warehouseId={currentWarehouse} />
              ) : (
                <div className="text-center py-12 bg-muted/20 rounded-lg">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-medium mb-1">No Warehouse Selected</p>
                  <p className="text-muted-foreground text-sm">Please select a warehouse to view shift history</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <div className="card-base p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Profile Settings</h2>
                <p className="text-muted-foreground">Manage your account information and preferences</p>
              </div>
              <UserProfile user={user} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
