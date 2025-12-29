"use client"

import { useState } from "react"
import { useCurrency } from "@/hooks/use-currency"

interface PaymentData {
  method: string
  amount: number
  percentage: number
  color: string
}

interface PaymentBreakdownProps {
  dateRange: { from: Date; to: Date }
  isLoading: boolean
}

export function PaymentMethodBreakdown({ dateRange, isLoading }: PaymentBreakdownProps) {
  const { formatCurrency } = useCurrency()

  const [data, setData] = useState<PaymentData[]>([
    { method: "Cash", amount: 45000, percentage: 45, color: "bg-orange-500" },
    { method: "Card", amount: 35000, percentage: 35, color: "bg-blue-500" },
    { method: "M-Pesa", amount: 20000, percentage: 20, color: "bg-green-500" },
  ])

  const total = data.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Payment Methods</h3>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-400">Loading chart...</div>
      ) : (
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.method}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm font-medium text-slate-300">{item.method}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{formatCurrency(item.amount)}</p>
                  <p className="text-xs text-slate-500">{item.percentage}%</p>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.percentage}%` }} />
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-slate-700 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-300">Total Revenue</span>
              <p className="text-lg font-bold text-orange-400">{formatCurrency(total)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
