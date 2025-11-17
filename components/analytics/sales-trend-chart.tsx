"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"

interface SalesTrendChartProps {
  dateRange: { from: Date; to: Date }
  warehouse: string
  isLoading?: boolean
}

export function SalesTrendChart({ dateRange, warehouse, isLoading = false }: SalesTrendChartProps) {
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        const response = await fetch("/api/analytics/sales-trend", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            warehouse,
            sales_person: "",
            item_code: "",
            from_date: dateRange.from.toISOString().split("T")[0],
            to_date: dateRange.to.toISOString().split("T")[0],
          }),
        })

        if (!response.ok) throw new Error("Failed to fetch")

        const result = await response.json()
        setData(result.data || [])
        setError(null)
      } catch (err) {
        setError("Failed to load sales trend")
        console.error(err)
      }
    }

    fetchTrendData()
  }, [dateRange, warehouse])

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sales Trend by Product</h3>

      {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>}

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-slate-400">Loading chart...</div>
      ) : data.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500 dark:text-slate-400">
          <p className="text-sm">No data available for the selected date range</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-300 dark:text-gray-600" />
            <XAxis dataKey="date" stroke="currentColor" className="text-gray-600 dark:text-gray-400" />
            <YAxis stroke="currentColor" className="text-gray-600 dark:text-gray-400" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--tooltip-bg)",
                border: "1px solid var(--tooltip-border)",
                borderRadius: "0.5rem",
              }}
              labelStyle={{ color: "var(--tooltip-text)" }}
              itemStyle={{ color: "var(--tooltip-text)" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total_qty_sold"
              stroke="#f97316"
              dot={{ fill: "#f97316" }}
              name="Quantity Sold"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
