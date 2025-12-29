"use client"
import { useCurrency as useCurrencyContext } from "@/lib/contexts/currency-context"

interface Currency {
  code: string
  symbol: string
  name: string
}

export function useCurrency() {
  const { currency: currencyCode, isLoading } = useCurrencyContext()

  const currency: Currency = {
    code: currencyCode,
    symbol: currencyCode,
    name: currencyCode,
  }

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount == null || isNaN(amount)) {
      return `${currency.symbol} 0.00`
    }

    try {
      const formatted = amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      return `${currency.symbol} ${formatted}`
    } catch (error) {
      console.error("[useCurrency] Error formatting currency:", error)
      return `${currency.symbol} ${amount.toFixed(2)}`
    }
  }

  return {
    currency,
    formatCurrency,
    isLoading,
  }
}
