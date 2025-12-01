"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBuilding, faExclamationCircle } from "@fortawesome/free-solid-svg-icons"

interface Warehouse {
  id: string
  warehouse_name: string
}

interface WarehouseSwitcherProps {
  onSuccess: (warehouse: string) => void
  onCancel: () => void
}

export function WarehouseSwitcher({ onSuccess, onCancel }: WarehouseSwitcherProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const fetchWarehouses = async () => {
    try {
      setIsLoading(true)
      const credentialsStr = sessionStorage.getItem("tenant_credentials")
      const credentials = credentialsStr ? JSON.parse(credentialsStr) : null

      const response = await fetch("/api/warehouses", {
        headers: credentials
          ? {
            "X-API-Key": credentials.api_key,
            "X-API-Secret": credentials.api_secret,
            "X-Base-URL": credentials.base_url,
          }
          : {},
      })

      if (response.status === 401) {
        console.log("[DukaPlus] Warehouse fetch returned 401, redirecting to login")
        sessionStorage.removeItem("tenant_credentials")
        sessionStorage.removeItem("selected_warehouse")
        localStorage.clear()
        router.push("/login?sessionExpired=true")
        return
      }

      const data = await response.json()

      if (response.ok && data.message?.warehouses) {
        setWarehouses(data.message.warehouses)
        const current = sessionStorage.getItem("selected_warehouse")
        if (current) {
          setSelectedWarehouse(current)
        }
      } else {
        setError("Failed to fetch warehouses")
      }
    } catch (err) {
      setError("Error loading warehouses")
      console.error("[DukaPlus] Warehouse fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwitchWarehouse = () => {
    if (!selectedWarehouse) {
      setError("Please select a warehouse")
      return
    }

    sessionStorage.setItem("selected_warehouse", selectedWarehouse)
    window.dispatchEvent(new CustomEvent("warehouseChanged", { detail: selectedWarehouse }))

    onSuccess(selectedWarehouse)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-[95%] md:max-w-md">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faBuilding} className="w-5 h-5" />
          Switch Warehouse
        </h2>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 flex items-start gap-2">
            <FontAwesomeIcon
              icon={faExclamationCircle}
              className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
            />
            <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          {isLoading ? (
            <p className="text-gray-600 dark:text-gray-400 text-sm">Loading warehouses...</p>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Warehouse
              </label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm">
                  <SelectValue placeholder="Choose warehouse" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id} className="max-w-full">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="truncate flex-1">{warehouse.warehouse_name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">({warehouse.id})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSwitchWarehouse}
              disabled={isLoading || !selectedWarehouse}
              className="flex-1 btn-success h-9 text-sm"
            >
              {isLoading ? "Loading..." : "Switch"}
            </Button>
            <Button onClick={onCancel} className="flex-1 btn-cancel h-9 text-sm">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
