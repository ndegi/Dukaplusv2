"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

interface CurrencyContextType {
  currency: string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "",
  isLoading: true,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCurrency() {
      try {
        const warehouseId = typeof window !== "undefined" ? sessionStorage.getItem("selected_warehouse") || "" : "";
        const response = await fetch(`/api/currency?warehouse_id=${encodeURIComponent(warehouseId)}`);
        const data = await response.json();
        if (data.message?.currency) {
          setCurrency(data.message.currency);
        }
      } catch (error) {
        console.error("Failed to fetch currency:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCurrency();
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
