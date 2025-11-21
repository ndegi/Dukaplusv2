"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBarcode, faX } from "@fortawesome/free-solid-svg-icons"

interface BarcodeInputProps {
  onScan: (barcode: string) => void
  isLoading?: boolean
}

export function BarcodeInput({ onScan, isLoading }: BarcodeInputProps) {
  const [barcodeValue, setBarcodeValue] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (barcodeValue.trim()) {
      onScan(barcodeValue.trim())
      setBarcodeValue("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <FontAwesomeIcon icon={faBarcode} className="w-4 h-4" />
          </div>
          <Input
            type="text"
            placeholder="Scan barcode or enter product code..."
            value={barcodeValue}
            onChange={(e) => setBarcodeValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading}
            className={`pl-10 h-10 rounded-lg ${
              isFocused ? "ring-2 ring-primary" : ""
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          {barcodeValue && (
            <button
              type="button"
              onClick={() => setBarcodeValue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              <FontAwesomeIcon icon={faX} className="w-3 h-3" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          disabled={!barcodeValue.trim() || isLoading}
          className="btn-primary h-10 px-4 rounded-lg whitespace-nowrap"
        >
          {isLoading ? "Searching..." : "Add"}
        </Button>
      </div>
    </form>
  )
}
