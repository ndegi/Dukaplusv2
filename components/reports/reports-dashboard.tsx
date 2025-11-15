"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DateRangeFilter } from "./date-range-filter"
import { ExportButton } from "./export-button"
import { AlertCircle, ChevronLeft, ChevronRight, Search, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface User {
  id: string
  name: string
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

interface StockBalanceItem {
  item_code: string
  item_name: string
  warehouse: string
  item_group: string
  opening_stock: number
  qty_in: number
  qty_out: number
  amount_sold: number
  balance_stock: number
  stock_value: number
}

interface StockLedgerItem {
  item_code: string
  item_name: string
  item_group: string
  opening_stock: number
  qty_in: number
  qty_out: number
  amount_sold: number
  balance_in_store: number
  value_of_stock: number
  voucher_type: string
  voucher_no: string
  party_type: string
  party_name: string
  posting_date: string
  posting_time: string
  modified_by: string
}

export function ReportsDashboard({ user }: { user: User }) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })

  const [salesReports, setSalesReports] = useState<SalesReportItem[]>([])
  const [customerStatements, setCustomerStatements] = useState<CustomerStatement[]>([])
  const [stockBalance, setStockBalance] = useState<StockBalanceItem[]>([])
  const [stockLedger, setStockLedger] = useState<StockLedgerItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("sales")

  useEffect(() => {
    fetchAllReports()
  }, [])

  const fetchAllReports = async () => {
    try {
      setIsLoading(true)

      console.log("[DukaPlus] Fetching all reports data (no date filter on API)")

      const [salesRes, customerRes, stockRes, ledgerRes] = await Promise.all([
        fetch(`/api/reports/sales`),
        fetch(`/api/reports/customer-statement`),
        fetch(`/api/reports/stock-balance`),
        fetch(`/api/reports/stock-ledger`),
      ])

      if (salesRes.ok) {
        const data = await salesRes.json()
        console.log("[v0] Sales data received:", data.sales?.length || 0, "records")
        setSalesReports(data.sales || [])
      }

      if (customerRes.ok) {
        const data = await customerRes.json()
        console.log("[v0] Customer data received:", data.customers?.length || 0, "records")
        setCustomerStatements(data.customers || [])
      }

      if (stockRes.ok) {
        const data = await stockRes.json()
        console.log("[DukaPlus] Stock balance response:", data)
        setStockBalance(data.message?.data || data.stock || [])
      }

      if (ledgerRes.ok) {
        const data = await ledgerRes.json()
        console.log("[DukaPlus] Stock ledger response:", data)
        setStockLedger(data.message?.data || data.stock || [])
      }

      setError(null)
    } catch (err) {
      setError("Failed to fetch report data")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (error && salesReports.length === 0) {
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
          <ExportButton reportData={null} dateRange={dateRange} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800 dark:bg-slate-800 border border-slate-700">
          <TabsTrigger
            value="sales"
            className="text-slate-200 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs sm:text-sm"
          >
            Sales Report
          </TabsTrigger>
          <TabsTrigger
            value="customers"
            className="text-slate-200 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs sm:text-sm"
          >
            Customers
          </TabsTrigger>
          <TabsTrigger
            value="stock"
            className="text-slate-200 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs sm:text-sm"
          >
            Stock Balance
          </TabsTrigger>
          <TabsTrigger
            value="ledger"
            className="text-slate-200 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs sm:text-sm"
          >
            Stock Ledger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <SalesReportTable data={salesReports} isLoading={isLoading} dateRange={dateRange} onDateRangeChange={setDateRange} />
        </TabsContent>

        <TabsContent value="customers">
          <CustomerStatementTable data={customerStatements} isLoading={isLoading} dateRange={dateRange} onDateRangeChange={setDateRange} />
        </TabsContent>

        <TabsContent value="stock">
          <StockBalanceTable data={stockBalance} isLoading={isLoading} dateRange={dateRange} onDateRangeChange={setDateRange} />
        </TabsContent>

        <TabsContent value="ledger">
          <StockLedgerTable data={stockLedger} isLoading={isLoading} dateRange={dateRange} onDateRangeChange={setDateRange} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EnhancedPagination({
  currentPage,
  totalPages,
  onPageChange,
  startIndex,
  endIndex,
  totalRecords
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  startIndex: number
  endIndex: number
  totalRecords: number
}) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }

    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-slate-700">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {startIndex + 1} to {Math.min(endIndex, totalRecords)} of {totalRecords} records
      </div>

      <div className="flex items-center gap-1">
        {/* First page */}
        <Button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        {/* Previous page */}
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Page numbers */}
        {getPageNumbers().map((page, idx) => (
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
          ) : (
            <Button
              key={page}
              onClick={() => onPageChange(page as number)}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              className={`h-8 w-8 p-0 ${currentPage === page
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : ""
                }`}
            >
              {page}
            </Button>
          )
        ))}

        {/* Next page */}
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Last page */}
        <Button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

function SalesReportTable({
  data,
  isLoading,
  dateRange,
  onDateRangeChange
}: {
  data: SalesReportItem[]
  isLoading: boolean
  dateRange: { from: Date; to: Date }
  onDateRangeChange: (range: { from: Date; to: Date }) => void
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const itemsPerPage = 10

  if (isLoading) {
    return <div className="text-foreground p-6 text-center">Loading sales report...</div>
  }

  const filteredData = data.filter((item) => {
    // Date filter
    const itemDate = new Date(item.posting_date)
    const fromDate = new Date(dateRange.from)
    const toDate = new Date(dateRange.to)
    fromDate.setHours(0, 0, 0, 0)
    toDate.setHours(23, 59, 59, 999)

    const dateMatch = itemDate >= fromDate && itemDate <= toDate

    // Search filter
    const searchMatch = searchTerm === "" ||
      (item.sales_invoice?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (item.customer?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (item.warehouse?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())

    return dateMatch && searchMatch
  })

  const totalSales = filteredData.reduce((sum, item) => sum + item.grand_total, 0)
  const profitTotal = filteredData.reduce((sum, item) => sum + (item.grand_total - item.cost_of_goods_sold), 0)

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/20 dark:border-orange-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Revenue</p>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
            KES {totalSales.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-green-500/10 dark:bg-green-500/10 border border-green-500/20 dark:border-green-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Profit</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            KES {profitTotal.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Outstanding</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            KES {filteredData.reduce((sum, item) => sum + item.outstanding_amount, 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="px-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by invoice, customer, or warehouse..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
          />
        </div>
        <DateRangeFilter dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
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
                  KES {row.grand_total.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="p-3 text-right text-gray-600 dark:text-gray-400">
                  KES {row.cash.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="p-3 text-right text-gray-600 dark:text-gray-400">
                  KES {row.mpesa.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${row.status === "Paid"
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
        <EnhancedPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          startIndex={startIndex}
          endIndex={endIndex}
          totalRecords={filteredData.length}
        />
      )}
    </Card>
  )
}

function CustomerStatementTable({
  data,
  isLoading,
  dateRange,
  onDateRangeChange
}: {
  data: CustomerStatement[]
  isLoading: boolean
  dateRange: { from: Date; to: Date }
  onDateRangeChange: (range: { from: Date; to: Date }) => void
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const itemsPerPage = 10

  if (isLoading) {
    return <div className="text-foreground p-6 text-center">Loading customer statements...</div>
  }

  const filteredData = data.filter((item) => {
    // Date filter
    const itemDate = new Date(item.posting_date)
    const fromDate = new Date(dateRange.from)
    const toDate = new Date(dateRange.to)
    fromDate.setHours(0, 0, 0, 0)
    toDate.setHours(23, 59, 59, 999)

    const dateMatch = itemDate >= fromDate && itemDate <= toDate

    // Search filter
    const searchMatch = searchTerm === "" ||
      (item.sales_invoice?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (item.customer_name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (item.warehouse?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())

    return dateMatch && searchMatch
  })

  const totalInvoiced = filteredData.reduce((sum, item) => sum + item.invoice_amount, 0)
  const totalPaid = filteredData.reduce((sum, item) => sum + item.paid_amount, 0)
  const totalOutstanding = filteredData.reduce((sum, item) => sum + item.outstanding_amount, 0)

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Invoiced</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            KES {totalInvoiced.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-green-500/10 dark:bg-green-500/10 border border-green-500/20 dark:border-green-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Paid</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            KES {totalPaid.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-red-500/10 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Outstanding</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">
            KES {totalOutstanding.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="px-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by invoice, customer, or warehouse..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
          />
        </div>
        <DateRangeFilter dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
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
                  KES {row.invoice_amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="p-3 text-right text-green-600 dark:text-green-400 font-semibold">
                  KES {row.paid_amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="p-3 text-right text-orange-600 dark:text-orange-400 font-semibold">
                  KES {row.outstanding_amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${row.outstanding_amount === 0
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
        <EnhancedPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          startIndex={startIndex}
          endIndex={endIndex}
          totalRecords={filteredData.length}
        />
      )}
    </Card>
  )
}

function StockBalanceTable({
  data,
  isLoading,
  dateRange,
  onDateRangeChange
}: {
  data: StockBalanceItem[]
  isLoading: boolean
  dateRange: { from: Date; to: Date }
  onDateRangeChange: (range: { from: Date; to: Date }) => void
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const itemsPerPage = 10

  if (isLoading) {
    return <div className="text-foreground p-6 text-center">Loading stock balance...</div>
  }

  const filteredData = data.filter((item) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (item.item_code?.toLowerCase() ?? '').includes(searchLower) ||
      (item.item_name?.toLowerCase() ?? '').includes(searchLower) ||
      (item.warehouse?.toLowerCase() ?? '').includes(searchLower) ||
      (item.item_group?.toLowerCase() ?? '').includes(searchLower)
    )
  })

  const totalStockValue = filteredData.reduce((sum, item) => sum + (item.stock_value || 0), 0)
  const totalAmountSold = filteredData.reduce((sum, item) => sum + (item.amount_sold || 0), 0)
  const totalItems = filteredData.length

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Items</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalItems}</p>
        </div>
        <div className="bg-green-500/10 dark:bg-green-500/10 border border-green-500/20 dark:border-green-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Stock Value</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            KES {totalStockValue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/20 dark:border-orange-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Amount Sold</p>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
            KES {totalAmountSold.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="px-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by item code, name, group, or warehouse..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
          />
        </div>
        <DateRangeFilter dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Item Code</th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Item Name</th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Group</th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Warehouse</th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">Opening</th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">Qty In</th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">Qty Out</th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">Balance</th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">Stock Value</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={`${row.item_code}-${row.warehouse}-${idx}`}
                className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
              >
                <td className="p-3 text-gray-900 dark:text-gray-200 font-medium">{row.item_code}</td>
                <td className="p-3 text-gray-600 dark:text-gray-400">{row.item_name}</td>
                <td className="p-3 text-gray-600 dark:text-gray-400">{row.item_group}</td>
                <td className="p-3 text-gray-600 dark:text-gray-400">{row.warehouse}</td>
                <td className="p-3 text-right text-gray-600 dark:text-gray-400">
                  {(row.opening_stock || 0).toLocaleString('en-KE')}
                </td>
                <td className="p-3 text-right text-green-600 dark:text-green-400">
                  {(row.qty_in || 0).toLocaleString('en-KE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </td>
                <td className="p-3 text-right text-red-600 dark:text-red-400">
                  {(row.qty_out || 0).toLocaleString('en-KE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </td>
                <td className="p-3 text-right text-blue-600 dark:text-blue-400 font-semibold">
                  {(row.balance_stock || 0).toLocaleString('en-KE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </td>
                <td className="p-3 text-right text-orange-600 dark:text-orange-400 font-semibold">
                  KES {(row.stock_value || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <EnhancedPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          startIndex={startIndex}
          endIndex={endIndex}
          totalRecords={filteredData.length}
        />
      )}
    </Card>
  )
}

function StockLedgerTable({
  data,
  isLoading,
  dateRange,
  onDateRangeChange
}: {
  data: StockLedgerItem[]
  isLoading: boolean
  dateRange: { from: Date; to: Date }
  onDateRangeChange: (range: { from: Date; to: Date }) => void
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const itemsPerPage = 10

  if (isLoading) {
    return <div className="text-foreground p-6 text-center">Loading stock ledger...</div>
  }

  const filteredData = data.filter((item) => {
    // Date filter (only if posting_date exists)
    let dateMatch = true
    if (item.posting_date) {
      const itemDate = new Date(item.posting_date)
      const fromDate = new Date(dateRange.from)
      const toDate = new Date(dateRange.to)
      fromDate.setHours(0, 0, 0, 0)
      toDate.setHours(23, 59, 59, 999)

      dateMatch = itemDate >= fromDate && itemDate <= toDate
    }

    // Search filter
    const searchLower = searchTerm.toLowerCase()
    const searchMatch = searchTerm === "" ||
      (item.item_code?.toLowerCase() ?? '').includes(searchLower) ||
      (item.item_name?.toLowerCase() ?? '').includes(searchLower) ||
      (item.item_group?.toLowerCase() ?? '').includes(searchLower) ||
      (item.voucher_no?.toLowerCase() ?? '').includes(searchLower)

    return dateMatch && searchMatch
  })

  const totalValue = filteredData.reduce((sum, item) => sum + (item.value_of_stock || 0), 0)
  const totalBalance = filteredData.reduce((sum, item) => sum + (item.balance_in_store || 0), 0)

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Items</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{filteredData.length}</p>
        </div>
        <div className="bg-green-500/10 dark:bg-green-500/10 border border-green-500/20 dark:border-green-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Balance</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            {totalBalance.toLocaleString('en-KE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </p>
        </div>
        <div className="bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/20 dark:border-orange-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Stock Value</p>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
            KES {totalValue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="px-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by item, voucher, or group..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
          />
        </div>
        <DateRangeFilter dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-gray-100 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Item Code</th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Item Name</th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Voucher Type</th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Voucher No</th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">Qty In</th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">Qty Out</th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">Balance</th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">Value</th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={`${row.voucher_no}-${idx}`}
                className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
              >
                <td className="p-3 text-gray-900 dark:text-gray-200 font-medium">{row.item_code}</td>
                <td className="p-3 text-gray-600 dark:text-gray-400">{row.item_name}</td>
                <td className="p-3 text-gray-600 dark:text-gray-400">{row.voucher_type}</td>
                <td className="p-3 text-gray-900 dark:text-gray-200 font-mono">{row.voucher_no}</td>
                <td className="p-3 text-right text-green-600 dark:text-green-400">
                  {(row.qty_in || 0).toLocaleString('en-KE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </td>
                <td className="p-3 text-right text-red-600 dark:text-red-400">
                  {(row.qty_out || 0).toLocaleString('en-KE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </td>
                <td className="p-3 text-right text-blue-600 dark:text-blue-400 font-semibold">
                  {(row.balance_in_store || 0).toLocaleString('en-KE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </td>
                <td className="p-3 text-right text-orange-600 dark:text-orange-400 font-semibold">
                  KES {(row.value_of_stock || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-400 text-xs">{row.posting_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <EnhancedPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          startIndex={startIndex}
          endIndex={endIndex}
          totalRecords={filteredData.length}
        />
      )}
    </Card>
  )
}
