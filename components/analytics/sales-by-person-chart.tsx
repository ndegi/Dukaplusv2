"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"
import { useCurrency } from "@/lib/contexts/currency-context"
interface SalesByPersonChartProps {
  dateRange: { from: Date; to: Date }
  warehouse: string
  isLoading?: boolean
}

export function SalesByPersonChart({ dateRange, warehouse, isLoading = false }: SalesByPersonChartProps) {
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const { currency } = useCurrency()
  useEffect(() => {
    const fetchPersonData = async () => {
      try {
        const response = await fetch("/api/analytics/sales-by-person", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            warehouse,
            sales_person: "",
            from_date: dateRange.from.toISOString().split("T")[0],
            to_date: dateRange.to.toISOString().split("T")[0],
          }),
        })

        if (!response.ok) throw new Error("Failed to fetch")

        const result = await response.json()
        setData(result.data || [])
        setError(null)
      } catch (err) {
        setError("Failed to load sales by person")
        console.error(err)
      }
    }

    fetchPersonData()
  }, [dateRange, warehouse])

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4">Sales by Sales Person</h3>

      {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>}

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">Loading chart...</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-slate-700" />
            <XAxis dataKey="sales_person" stroke="#64748b" className="dark:stroke-slate-400" />
            <YAxis stroke="#64748b" className="dark:stroke-slate-400" />
            <Tooltip
              contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}
              labelStyle={{ color: "var(--foreground)" }}
            />
            <Bar dataKey="total_sales" fill="#10b981" name={`Total Sales (${currency})`} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
