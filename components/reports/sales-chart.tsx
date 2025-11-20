"use client"

import { useEffect, useState } from "react"
import { useCurrency } from "@/hooks/use-currency"

interface SalesChartProps {
  dateRange: { from: Date; to: Date }
  isLoading: boolean
}

export function SalesChart({ dateRange, isLoading }: SalesChartProps) {
  const { formatCurrency } = useCurrency()

  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    // Simulate chart data
    const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
    const chartData = Array.from({ length: Math.min(days, 7) }).map((_, i) => {
      const date = new Date(dateRange.from)
      date.setDate(date.getDate() + i)
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        sales: Math.floor(Math.random() * 50000) + 10000,
        transactions: Math.floor(Math.random() * 100) + 20,
      }
    })
    setData(chartData)
  }, [dateRange])

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Sales Trend</h3>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-400">Loading chart...</div>
      ) : (
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.date} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">{item.date}</span>
                <span className="font-semibold text-orange-400">{formatCurrency(item.sales)}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-full rounded-full"
                  style={{ width: `${(item.sales / 50000) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
