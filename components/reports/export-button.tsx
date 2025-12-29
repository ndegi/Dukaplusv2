"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useState } from "react"
import { useCurrency } from "@/hooks/use-currency"

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
  total_amount_paid: number
  [key: string]: any // Allow dynamic payment mode fields
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

interface ItemWiseCustomerStatement {
  customer: string
  date: string
  warehouse: string
  item_code: string
  item_name: string
  quantity: number
  selling_price: number
  amount: number
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

interface ExportButtonProps {
  activeTab: string
  salesData: SalesReportItem[]
  customerData: CustomerStatement[]
  itemWiseData: ItemWiseCustomerStatement[]
  stockData: StockBalanceItem[]
  ledgerData: StockLedgerItem[]
  dateRange: { from: Date; to: Date }
}

export function ExportButton({
  activeTab,
  salesData,
  customerData,
  itemWiseData,
  stockData,
  ledgerData,
  dateRange,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { formatCurrency, currency } = useCurrency()

  const handleExport = async () => {
    setIsExporting(true)
    try {
      let csv = ""
      let filename = ""

      if (activeTab === "sales") {
        csv = generateSalesExport(salesData, dateRange, currency)
        filename = `sales-report-${new Date().getTime()}.csv`
      } else if (activeTab === "customers") {
        csv = generateCustomerExport(customerData, dateRange, currency)
        filename = `customer-statement-${new Date().getTime()}.csv`
      } else if (activeTab === "item-wise") {
        csv = generateItemWiseStatementExport(itemWiseData, dateRange, currency)
        filename = `item-wise-customer-statement-${new Date().getTime()}.csv`
      } else if (activeTab === "stock") {
        csv = generateStockBalanceExport(stockData, dateRange, currency)
        filename = `stock-balance-${new Date().getTime()}.csv`
      } else if (activeTab === "ledger") {
        csv = generateStockLedgerExport(ledgerData, dateRange, currency)
        filename = `stock-ledger-${new Date().getTime()}.csv`
      }

      // Create download
      const element = document.createElement("a")
      element.setAttribute("href", `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`)
      element.setAttribute("download", filename)
      element.style.display = "none"
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    } catch (error) {
      console.error("Export error:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
    >
      <Download className="w-4 h-4" />
      {isExporting ? "Exporting..." : "Export"}
    </Button>
  )
}

function generateSalesExport(data: SalesReportItem[], dateRange: { from: Date; to: Date }, currency: any): string {
  // Get all unique payment mode fields from data
  const nonPaymentFields = [
    "sales_invoice",
    "warehouse",
    "posting_date",
    "posting_time",
    "status",
    "customer",
    "location",
    "grand_total",
    "outstanding_amount",
    "cost_of_goods_sold",
    "total_amount_paid",
  ]

  const paymentModeKeys = new Set<string>()
  if (data.length > 0) {
    Object.keys(data[0]).forEach((key) => {
      if (!nonPaymentFields.includes(key) && typeof data[0][key] === "number") {
        paymentModeKeys.add(key)
      }
    })
  }

  // Convert keys to readable format
  const paymentModeHeaders = Array.from(paymentModeKeys).map((key) =>
    key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  )

  const headerRow = [
    "Invoice",
    "Date",
    "Time",
    "Customer",
    "Warehouse",
    "Location",
    "Amount",
    ...paymentModeHeaders,
    "Outstanding",
    "Status",
  ]

  const dataRows = data.map((item) => [
    item.sales_invoice,
    item.posting_date,
    item.posting_time,
    item.customer,
    item.warehouse,
    item.location,
    item.grand_total.toFixed(2),
    ...Array.from(paymentModeKeys).map((key) => ((item[key] as number) || 0).toFixed(2)),
    item.outstanding_amount.toFixed(2),
    item.status,
  ])

  const rows = [
    ["DukaPlus Sales Report"],
    [`Generated: ${new Date().toLocaleString()}`],
    [`Period: ${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`],
    [],
    headerRow,
    ...dataRows,
  ]

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
}

function generateCustomerExport(data: CustomerStatement[], dateRange: { from: Date; to: Date }, currency: any): string {
  const rows = [
    ["DukaPlus Customer Statement Report"],
    [`Generated: ${new Date().toLocaleString()}`],
    [`Period: ${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`],
    [],
    [
      "Invoice",
      "Date",
      "Time",
      "Customer ID",
      "Customer Name",
      "Warehouse",
      "Location",
      "Invoice Amount",
      "Paid Amount",
      "Outstanding",
      "Status",
    ],
    ...data.map((item) => [
      item.sales_invoice,
      item.posting_date,
      item.posting_time,
      item.customer_id,
      item.customer_name,
      item.warehouse,
      item.location,
      item.invoice_amount.toFixed(2),
      item.paid_amount.toFixed(2),
      item.outstanding_amount.toFixed(2),
      item.status,
    ]),
  ]

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
}

function generateItemWiseStatementExport(
  data: ItemWiseCustomerStatement[],
  dateRange: { from: Date; to: Date },
  currency: any,
): string {
  const rows = [
    ["DukaPlus Item-wise Customer Statement"],
    [`Generated: ${new Date().toLocaleString()}`],
    [`Period: ${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`],
    [],
    [
      "Date",
      "Customer",
      "Warehouse",
      "Item",
      "Item Code",
      "Quantity",
      "Selling Price",
      "Amount",
    ],
    ...data.map((item) => [
      item.date,
      item.customer,
      item.warehouse,
      item.item_name,
      item.item_code,
      (item.quantity ?? 0).toFixed(2),
      (item.selling_price ?? 0).toFixed(2),
      (item.amount ?? 0).toFixed(2),
    ]),
  ]

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
}

function generateStockBalanceExport(
  data: StockBalanceItem[],
  dateRange: { from: Date; to: Date },
  currency: any,
): string {
  const rows = [
    ["DukaPlus Stock Balance Report"],
    [`Generated: ${new Date().toLocaleString()}`],
    [`Period: ${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`],
    [],
    [
      "Item Code",
      "Item Name",
      "Category",
      "Warehouse",
      "Opening Stock",
      "Qty In",
      "Qty Out",
      "Balance",
      "Amount Sold",
      "Stock Value",
    ],
    ...data.map((item) => [
      item.item_code,
      item.item_name,
      item.item_group,
      item.warehouse,
      item.opening_stock.toFixed(2),
      item.qty_in.toFixed(2),
      item.qty_out.toFixed(2),
      item.balance_stock.toFixed(2),
      item.amount_sold.toFixed(2),
      item.stock_value.toFixed(2),
    ]),
  ]

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
}

function generateStockLedgerExport(
  data: StockLedgerItem[],
  dateRange: { from: Date; to: Date },
  currency: any,
): string {
  const rows = [
    ["DukaPlus Stock Ledger Report"],
    [`Generated: ${new Date().toLocaleString()}`],
    [`Period: ${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`],
    [],
    [
      "Item Code",
      "Item Name",
      "Category",
      "Date",
      "Time",
      "Voucher Type",
      "Voucher No",
      "Party Type",
      "Party Name",
      "Opening",
      "Qty In",
      "Qty Out",
      "Balance",
      "Amount Sold",
      "Value",
      "Modified By",
    ],
    ...data.map((item) => [
      item.item_code,
      item.item_name,
      item.item_group,
      item.posting_date,
      item.posting_time,
      item.voucher_type,
      item.voucher_no,
      item.party_type,
      item.party_name,
      item.opening_stock.toFixed(2),
      item.qty_in.toFixed(2),
      item.qty_out.toFixed(2),
      item.balance_in_store.toFixed(2),
      item.amount_sold.toFixed(2),
      item.value_of_stock.toFixed(2),
      item.modified_by,
    ]),
  ]

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
}
