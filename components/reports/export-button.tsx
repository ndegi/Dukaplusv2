"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useState } from "react"

interface ExportButtonProps {
  reportData: any
  dateRange: { from: Date; to: Date }
}

export function ExportButton({ reportData, dateRange }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Prepare CSV data
      const csv = [
        ["DukaPlus Sales Report"],
        [`Generated: ${new Date().toLocaleString()}`],
        [`Period: ${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`],
        [],
        ["Metric", "Value"],
        ["Total Sales", `KES ${reportData?.totalSales?.toFixed(2) || 0}`],
        ["Total Transactions", reportData?.totalTransactions || 0],
        ["Average Transaction", `KES ${reportData?.averageTransaction?.toFixed(2) || 0}`],
        ["Today's Sales", `KES ${reportData?.todaySales?.toFixed(2) || 0}`],
      ]
        .map((row) => row.join(","))
        .join("\n")

      // Create download
      const element = document.createElement("a")
      element.setAttribute("href", `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`)
      element.setAttribute("download", `duka-plus-report-${new Date().getTime()}.csv`)
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
