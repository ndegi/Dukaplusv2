"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { useCurrency } from "@/lib/contexts/currency-context"
import { EnhancedPagination } from "@/components/reports/enhanced-pagination"

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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const { currency } = useCurrency()

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

  // Calculate pagination
  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = data.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <Card className="card-base table-card p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Productivity per Product
      </h3>

      {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>}

      {internalLoading || isLoading ? (
        <div className="text-slate-500 dark:text-slate-400 text-sm">Loading products...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="reports-table">
            <thead>
              <tr>
                <th className="table-header-cell">Product Code</th>
                <th className="table-header-cell">Product Name</th>
                <th className="table-header-cell text-right">Qty Sold</th>
                <th className="table-header-cell text-right">Total Sales</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((product) => (
                <tr key={product.item_code} className="table-row">
                  <td className="table-cell font-medium">{product.item_code}</td>
                  <td className="table-cell-secondary">{product.item_name}</td>
                  <td className="table-cell text-info font-semibold text-right">
                    {product.total_qty}
                  </td>
                  <td className="table-cell text-success font-semibold text-right">
                    {`${currency} ${product.total_sales}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 10 && (
            <EnhancedPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              startIndex={startIndex}
              endIndex={Math.min(endIndex, data.length)}
              totalRecords={data.length}
            />
          )}
        </div>
      )}
    </Card>
  )
}