"use client"

import { useEffect, useState, useRef } from "react"

interface BarcodeScannerOptions {
  onBarcodeScan: (barcode: string) => void
  enabled?: boolean
}

export function useBarcodeScan({ onBarcodeScan, enabled = true }: BarcodeScannerOptions) {
  const [barcodeInput, setBarcodeInput] = useState("")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastKeyTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const now = Date.now()
      const timeSinceLastKey = now - lastKeyTimeRef.current
      lastKeyTimeRef.current = now

      // Barcode scanners typically send data very rapidly (within 100ms)
      // Standard keyboard input is much slower
      if (timeSinceLastKey > 100 && barcodeInput.length > 0) {
        // Reset if too much time has passed
        setBarcodeInput("")
      }

      // Only capture characters that would be in a barcode
      if (/^[a-zA-Z0-9-]$/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
        setBarcodeInput((prev) => prev + event.key)
      } else if (event.key === "Enter" && barcodeInput.length > 0) {
        event.preventDefault()
        onBarcodeScan(barcodeInput)
        setBarcodeInput("")
      } else if (event.key === "Escape") {
        setBarcodeInput("")
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    // Clear barcode input after 500ms of inactivity (non-standard input)
    if (barcodeInput.length > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        setBarcodeInput("")
      }, 500)
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [barcodeInput, onBarcodeScan, enabled])

  return { barcodeInput, setBarcodeInput }
}
