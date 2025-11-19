"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { formatCurrency, formatNumber } from "@/lib/utils/format"

interface ProductProductivityTableProps {
  dateRange: { from: Date; to: Date }
  warehouse: string
  isLoading?: boolean
}

interface ProductData {
  item_code: string
  item_name: string
  total_qty: number
  total_sales: number
}

export function ProductProductivityTable({ dateRange, warehouse, isLoading = false }: ProductProductivityTableProps) {
  const [data, setData] = useState<ProductData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [internalLoading, setInternalLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const response = await fetch("/api/analytics/product-productivity", {
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
        setError("Failed to load product productivity")
        console.error(err)
      } finally {
        setInternalLoading(false)
      }
    }

    fetchProductData()
  }, [dateRange, warehouse])

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Productivity per Product
      </h3>

      {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>}

      {internalLoading || isLoading ? (
        <div className="text-slate-500 dark:text-slate-400 text-sm">Loading products...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left p-3 text-slate-700 dark:text-slate-300 font-semibold">Product Code</th>
                <th className="text-left p-3 text-slate-700 dark:text-slate-300 font-semibold">Product Name</th>
                <th className="text-right p-3 text-slate-700 dark:text-slate-300 font-semibold">Qty Sold</th>
                <th className="text-right p-3 text-slate-700 dark:text-slate-300 font-semibold">Total Sales</th>
              </tr>
            </thead>
            <tbody>
              {data.map((product) => (
                <tr
                  key={product.item_code}
                  className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <td className="p-3 text-slate-900 dark:text-slate-200 font-medium">{product.item_code}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{product.item_name}</td>
                  <td className="p-3 text-right text-blue-600 dark:text-blue-400 font-semibold">
                    {formatNumber(product.total_qty)}
                  </td>
                  <td className="p-3 text-right text-green-600 dark:text-green-400 font-semibold">
                    {formatCurrency(product.total_sales)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
