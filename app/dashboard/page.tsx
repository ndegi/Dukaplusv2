"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { DateRangeFilter } from "@/components/reports/date-range-filter"
import { SalesTrendChart } from "@/components/analytics/sales-trend-chart"
import { SalesPerformanceChart } from "@/components/analytics/sales-performance-chart"
import { SalesByPersonChart } from "@/components/analytics/sales-by-person-chart"
import { SalesCountChart } from "@/components/analytics/sales-count-chart"
import { ProductProductivityTable } from "@/components/analytics/product-productivity-table"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [warehouse, setWarehouse] = useState("")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    } else if (user) {
      const stored = sessionStorage.getItem("selected_warehouse")
      setWarehouse(stored || "")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">Dashboard</h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Sales analytics and performance metrics
            </p>
          </div>
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          <SalesTrendChart dateRange={dateRange} warehouse={warehouse} />
          <SalesPerformanceChart dateRange={dateRange} warehouse={warehouse} />
          <SalesByPersonChart dateRange={dateRange} warehouse={warehouse} />
          <SalesCountChart dateRange={dateRange} warehouse={warehouse} />
        </div>

        <ProductProductivityTable dateRange={dateRange} warehouse={warehouse} />
      </div>
    </DashboardLayout>
  )
}
