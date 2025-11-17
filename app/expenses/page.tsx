"use client"

import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ExpensesOverview } from "@/components/expenses/expenses-overview"
import { useRouter } from "next/navigation"

export default function ExpensesPage() {
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
          <h1 className="page-title">Expenses Management</h1>
          <p className="page-subtitle">Track and manage business expenses</p>
        </div>

        <ExpensesOverview />
      </div>
    </DashboardLayout>
  )
}
