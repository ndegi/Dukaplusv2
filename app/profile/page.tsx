"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserProfile } from "@/components/auth/user-profile"
import { ShiftHistory } from "@/components/shift/shift-history"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, User, ExternalLink } from "lucide-react"

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [currentWarehouse, setCurrentWarehouse] = useState("")
  const [backOfficeUrl, setBackOfficeUrl] = useState("")

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

    // Get base URL from tenant_credentials
    const credentialsStr = sessionStorage.getItem("tenant_credentials")
    if (credentialsStr) {
      try {
        const credentials = JSON.parse(credentialsStr)
        if (credentials.baseUrl) {
          setBackOfficeUrl(credentials.baseUrl)
        }
      } catch (e) {
        console.error("Failed to parse tenant credentials:", e)
      }
    }
  }, [])

  if (isLoading || !user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Manage your shifts and account settings</p>
          </div>
          {backOfficeUrl && (
            <a
              href={backOfficeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors shadow-sm hover:shadow-md whitespace-nowrap"
            >
              <span>Open Back Office</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
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
            <div className="space-y-6">
              {/* Profile Settings Card */}
              <div className="card-base p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Profile Settings</h2>
                  <p className="text-muted-foreground">Manage your account information and preferences</p>
                </div>
                <UserProfile user={user} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
