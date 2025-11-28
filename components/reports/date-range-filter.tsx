"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DateRangeFilterProps {
  dateRange: { from: Date; to: Date }
  onDateRangeChange: (range: { from: Date; to: Date }) => void
}

export function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customFrom, setCustomFrom] = useState(
    dateRange?.from instanceof Date
      ? dateRange.from.toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  )
  const [customTo, setCustomTo] = useState(
    dateRange?.to instanceof Date ? dateRange.to.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
  )

  const handlePreset = (days: number) => {
    const to = new Date()
    to.setHours(23, 59, 59, 999) // End of today

    const from = new Date()
    from.setDate(from.getDate() - days)
    from.setHours(0, 0, 0, 0) // Start of the from date

    onDateRangeChange({ from, to })
    setIsOpen(false)
  }

  const handleCustomRange = () => {
    const from = new Date(customFrom)
    from.setHours(0, 0, 0, 0) // Start of day

    const to = new Date(customTo)
    to.setHours(23, 59, 59, 999) // End of day

    onDateRangeChange({ from, to })
    setIsOpen(false)
  }

  const formatDate = (date: Date) => {
    if (!(date instanceof Date)) return "Invalid date"
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center gap-2"
      >
        <Calendar className="w-4 h-4" />
        {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 p-3 space-y-2 min-w-64">
          <button
            onClick={() => handlePreset(7)}
            className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-sm text-slate-300"
          >
            Last 7 days
          </button>
          <button
            onClick={() => handlePreset(30)}
            className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-sm text-slate-300"
          >
            Last 30 days
          </button>
          <button
            onClick={() => handlePreset(90)}
            className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-sm text-slate-300"
          >
            Last 90 days
          </button>

          <div className="border-t border-slate-700 pt-3 mt-2">
            <p className="text-xs text-slate-400 mb-2 px-3 font-semibold uppercase">Custom Range</p>
            <div className="space-y-2 px-3">
              <div>
                <Label className="text-xs text-slate-400">From</Label>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white text-sm h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">To</Label>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white text-sm h-8"
                />
              </div>
              <Button
                onClick={handleCustomRange}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white h-8 text-sm"
              >
                Apply Range
              </Button>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-2">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-sm text-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
