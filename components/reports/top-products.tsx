"use client"

import { useState } from "react"
import { useCurrency } from "@/hooks/use-currency"

interface Product {
  name: string
  quantity: number
  revenue: number
}

interface TopProductsProps {
  isLoading: boolean
}

export function TopProducts({ isLoading }: TopProductsProps) {
  const { formatCurrency } = useCurrency()

  const [products, setProducts] = useState<Product[]>([
    { name: "Cappuccino", quantity: 234, revenue: 58500 },
    { name: "Espresso", quantity: 189, revenue: 37800 },
    { name: "Latte", quantity: 156, revenue: 39000 },
    { name: "Americano", quantity: 142, revenue: 28400 },
    { name: "Pastry Mix", quantity: 98, revenue: 19600 },
  ])

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Top Selling Products</h3>

      {isLoading ? (
        <div className="text-slate-400 text-sm">Loading products...</div>
      ) : (
        <div className="space-y-3">
          {products.map((product, index) => (
            <div
              key={product.name}
              className="flex items-center justify-between pb-3 border-b border-slate-700 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-orange-400">{index + 1}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.quantity} units sold</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-green-400">{formatCurrency(product.revenue)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
