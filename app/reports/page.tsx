"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ReportsDashboard } from "@/components/reports/reports-dashboard"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ReportsPage() {
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
      <ReportsDashboard user={user} />
    </DashboardLayout>
  )
}
