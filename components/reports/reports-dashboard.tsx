"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesChart } from "./sales-chart"
import { TopProducts } from "./top-products"
import { PaymentMethodBreakdown } from "./payment-breakdown"
import { DateRangeFilter } from "./date-range-filter"
import { ExportButton } from "./export-button"
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface User {
  id: string
  name: string
}

interface ReportData {
  totalSales: number
  totalTransactions: number
  averageTransaction: number
  todaySales: number
  thisWeekSales: number
  thisMonthSales: number
}

interface SalesReportItem {
  sales_invoice: string
  warehouse: string
  posting_date: string
  posting_time: string
  status: string
  customer: string
  location: string
  grand_total: number
  outstanding_amount: number
  cost_of_goods_sold: number
  mpesa: number
  cash: number
  paid_to_pochi: number
  paid_to_till: number
  total_amount_paid: number
}

interface CustomerStatement {
  sales_invoice: string
  warehouse: string
  status: string
  posting_date: string
  posting_time: string
  customer_id: string
  customer_name: string
  location: string
  invoice_amount: number
  paid_amount: number
  outstanding_amount: number
}

interface StockBalance {
  product_id: string
  product_name: string
  warehouse: string
  quantity_on_hand: number
  reorder_level: number
  value: number
}

export function ReportsDashboard({ user }: { user: User }) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })

  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [salesReports, setSalesReports] = useState<SalesReportItem[]>([])
  const [customerStatements, setCustomerStatements] = useState<CustomerStatement[]>([])
  const [stockBalance, setStockBalance] = useState<StockBalance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchAllReports()
  }, [dateRange])

  const fetchAllReports = async () => {
    try {
      setIsLoading(true)

      const [analyticsRes, salesRes, customerRes, stockRes] = await Promise.all([
        fetch(`/api/reports/analytics?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`),
        fetch(`/api/reports/sales`),
        fetch(`/api/reports/customer-statement`),
        fetch(`/api/reports/stock-balance`),
      ])

      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setReportData(data)
      }

      if (salesRes.ok) {
        const data = await salesRes.json()
        setSalesReports(data.sales || [])
      }

      if (customerRes.ok) {
        const data = await customerRes.json()
        setCustomerStatements(data.customers || [])
      }

      if (stockRes.ok) {
        const data = await stockRes.json()
        setStockBalance(data.stock || [])
      }

      setError(null)
    } catch (err) {
      setError("Failed to fetch report data")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (error && !reportData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">View sales performance and insights</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">View sales performance and insights</p>
        </div>
        <div className="flex gap-2">
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
          <ExportButton reportData={reportData} dateRange={dateRange} />
        </div>
      </div>

      {/* Key Metrics */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Sales"
            value={`KES ${reportData.totalSales.toFixed(2)}`}
            trend={Math.round((reportData.thisMonthSales / reportData.totalSales) * 100)}
            color="orange"
          />
          <MetricCard
            label="Transactions"
            value={reportData.totalTransactions.toString()}
            trend={(reportData.totalTransactions / Math.max(reportData.totalTransactions, 1)) * 100}
            color="blue"
          />
          <MetricCard
            label="Avg Transaction"
            value={`KES ${reportData.averageTransaction.toFixed(2)}`}
            trend={Math.round(reportData.averageTransaction / 100)}
            color="green"
          />
          <MetricCard
            label="Today's Sales"
            value={`KES ${reportData.todaySales.toFixed(2)}`}
            trend={Math.round((reportData.todaySales / Math.max(reportData.thisWeekSales, 1)) * 100)}
            color="purple"
          />
        </div>
      )}

      {/* Tabbed Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800 dark:bg-slate-800 border border-slate-700">
          <TabsTrigger 
            value="overview" 
            className="text-slate-200 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="sales" 
            className="text-slate-200 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            Sales Report
          </TabsTrigger>
          <TabsTrigger 
            value="customers" 
            className="text-slate-200 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            Customers
          </TabsTrigger>
          <TabsTrigger 
            value="stock" 
            className="text-slate-200 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            Stock Balance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesChart dateRange={dateRange} isLoading={isLoading} />
            <PaymentMethodBreakdown dateRange={dateRange} isLoading={isLoading} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopProducts isLoading={isLoading} />
            <SalesInsights reportData={reportData} isLoading={isLoading} />
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <SalesReportTable data={salesReports} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="customers">
          <CustomerStatementTable data={customerStatements} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="stock">
          <StockBalanceTable data={stockBalance} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MetricCard({
  label,
  value,
  trend,
  color,
}: {
  label: string
  value: string
  trend: number
  color: "orange" | "blue" | "green" | "purple"
}) {
  const colorClasses = {
    orange: "bg-orange-500/10 dark:bg-orange-500/10 border-orange-500/20 dark:border-orange-500/20",
    blue: "bg-blue-500/10 dark:bg-blue-500/10 border-blue-500/20 dark:border-blue-500/20",
    green: "bg-green-500/10 dark:bg-green-500/10 border-green-500/20 dark:border-green-500/20",
    purple: "bg-purple-500/10 dark:bg-purple-500/10 border-purple-500/20 dark:border-purple-500/20",
  }

  const trendColor = trend >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{value}</p>
      <p className={`text-xs font-medium ${trendColor}`}>
        {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
      </p>
    </div>
  )
}

function SalesInsights({
  reportData,
  isLoading,
}: {
  reportData: ReportData | null
  isLoading: boolean
}) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Insights</h3>

      {isLoading ? (
        <div className="text-gray-600 dark:text-gray-400 text-sm">Loading insights...</div>
      ) : reportData ? (
        <div className="space-y-3">
          <InsightItem
            title="This Week Performance"
            value={`KES ${reportData.thisWeekSales.toFixed(2)}`}
            subtitle="7-day total sales"
          />
          <InsightItem
            title="This Month Performance"
            value={`KES ${reportData.thisMonthSales.toFixed(2)}`}
            subtitle="30-day total sales"
          />
          <InsightItem
            title="Average Transaction Value"
            value={`KES ${reportData.averageTransaction.toFixed(2)}`}
            subtitle={`Across ${reportData.totalTransactions} transactions`}
          />
          <InsightItem title="Conversion Rate" value="98.5%" subtitle="Successful transactions" />
        </div>
      ) : null}
    </div>
  )
}

function InsightItem({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string
  subtitle: string
}) {
  return (
    <div className="pb-3 border-b border-gray-200 dark:border-slate-700 last:border-0">
      <div className="flex justify-between items-start mb-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{value}</p>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  )
}

function SalesReportTable({ data, isLoading }: { data: SalesReportItem[]; isLoading: boolean }) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  if (isLoading) {
    return <div className="text-gray-600 dark:text-gray-400">Loading sales report...</div>
  }

  const totalSales = data.reduce((sum, item) => sum + item.grand_total, 0)
  const profitTotal = data.reduce((sum, item) => sum + (item.grand_total - item.cost_of_goods_sold), 0)

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = data.slice(startIndex, endIndex)

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/20 dark:border-orange-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Revenue</p>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">KES {totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-green-500/10 dark:bg-green-500/10 border border-green-500/20 dark:border-green-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Profit</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">KES {profitTotal.toFixed(2)}</p>
        </div>
        <div className="bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Outstanding</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            KES {data.reduce((sum, item) => sum + item.outstanding_amount, 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Invoice</th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Date</th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Customer</th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Warehouse</th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">Amount</th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">Cash</th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">M-Pesa</th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr
                key={row.sales_invoice}
                className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
              >
                <td className="p-3 text-gray-900 dark:text-gray-200 font-medium">{row.sales_invoice}</td>
                <td className="p-3 text-gray-600 dark:text-gray-400">{row.posting_date}</td>
                <td className="p-3 text-gray-600 dark:text-gray-400">{row.customer}</td>
                <td className="p-3 text-gray-600 dark:text-gray-400">{row.warehouse}</td>
                <td className="p-3 text-right text-orange-600 dark:text-orange-400 font-semibold">
                  KES {row.grand_total.toFixed(2)}
                </td>
                <td className="p-3 text-right text-gray-600 dark:text-gray-400">
                  KES {row.cash.toFixed(2)}
                </td>
                <td className="p-3 text-right text-gray-600 dark:text-gray-400">
                  KES {row.mpesa.toFixed(2)}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      row.status === "Paid"
                        ? "bg-green-500/20 text-green-600 dark:text-green-400"
                        : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-400">
            Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} records
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

function CustomerStatementTable({ data, isLoading }: { data: CustomerStatement[]; isLoading: boolean }) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  if (isLoading) {
    return <div className="text-gray-600 dark:text-gray-400">Loading customer statements...</div>
  }

  const totalInvoiced = data.reduce((sum, item) => sum + item.invoice_amount, 0)
  const totalPaid = data.reduce((sum, item) => sum + item.paid_amount, 0)
  const totalOutstanding = data.reduce((sum, item) => sum + item.outstanding_amount, 0)

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = data.slice(startIndex, endIndex)

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Invoiced</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">KES {totalInvoiced.toFixed(2)}</p>
        </div>
        <div className="bg-green-500/10 dark:bg-green-500/10 border border-green-500/20 dark:border-green-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Paid</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">KES {totalPaid.toFixed(2)}</p>
        </div>
        <div className="bg-red-500/10 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Outstanding</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">KES {totalOutstanding.toFixed(2)}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Invoice</th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Customer</th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Date</th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">Invoiced</th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">Paid</th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">Outstanding</th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr
                key={row.sales_invoice}
                className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
              >
                <td className="p-3 text-gray-900 dark:text-gray-200 font-medium">{row.sales_invoice}</td>
                <td className="p-3 text-gray-600 dark:text-gray-400">{row.customer_name}</td>
                <td className="p-3 text-gray-600 dark:text-gray-400">{row.posting_date}</td>
                <td className="p-3 text-right text-blue-600 dark:text-blue-400 font-semibold">
                  KES {row.invoice_amount.toFixed(2)}
                </td>
                <td className="p-3 text-right text-green-600 dark:text-green-400 font-semibold">
                  KES {row.paid_amount.toFixed(2)}
                </td>
                <td className="p-3 text-right text-orange-600 dark:text-orange-400 font-semibold">
                  KES {row.outstanding_amount.toFixed(2)}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      row.outstanding_amount === 0
                        ? "bg-green-500/20 text-green-600 dark:text-green-400"
                        : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                    }`}
                  >
                    {row.outstanding_amount === 0 ? "Paid" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-400">
            Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} records
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

function StockBalanceTable({ data, isLoading }: { data: StockBalance[]; isLoading: boolean }) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  if (isLoading) {
    return <div className="text-gray-600 dark:text-gray-400">Loading stock balance...</div>
  }

  const lowStockItems = data.filter((item) => item.quantity_on_hand <= item.reorder_level)
  const totalValue = data.reduce((sum, item) => sum + item.value, 0)

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = data.slice(startIndex, endIndex)

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Items</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{data.length}</p>
        </div>
        <div className="bg-red-500/10 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Low Stock Items</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">{lowStockItems.length}</p>
        </div>
        <div className="bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Value</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">KES {totalValue.toFixed(2)}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Product</th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Warehouse</th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">On Hand</th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">Reorder Level</th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">Value</th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => {
              const isLowStock = row.quantity_on_hand <= row.reorder_level
              return (
                <tr
                  key={`${row.product_id}-${row.warehouse}`}
                  className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                >
                  <td className="p-3 text-gray-900 dark:text-gray-200 font-medium">{row.product_name}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{row.warehouse}</td>
                  <td className="p-3 text-right text-gray-900 dark:text-gray-200">{row.quantity_on_hand}</td>
                  <td className="p-3 text-right text-gray-600 dark:text-gray-400">{row.reorder_level}</td>
                  <td className="p-3 text-right text-blue-600 dark:text-blue-400 font-semibold">
                    KES {row.value.toFixed(2)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 w-fit ${
                        isLowStock
                          ? "bg-red-500/20 text-red-600 dark:text-red-400"
                          : "bg-green-500/20 text-green-600 dark:text-green-400"
                      }`}
                    >
                      {isLowStock ? "⚠" : "✓"} {isLowStock ? "Low Stock" : "Ok"}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-400">
            Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} records
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
