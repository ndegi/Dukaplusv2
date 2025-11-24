"use client"

import type React from "react"
import Link from "next/link"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { loginUser } from "@/lib/api/auth"
import { AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Warehouse {
  id: string
  warehouse_name: string
}

export function LoginForm() {
  const router = useRouter()
  const [mobile, setMobile] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState("")
  const [showWarehouseSelector, setShowWarehouseSelector] = useState(false)
  const [tempCredentials, setTempCredentials] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await loginUser(mobile, password)
      if (result.success) {
        if (result.credentials) {
          sessionStorage.setItem("tenant_credentials", JSON.stringify(result.credentials))

          if (result.credentials.warehouses && result.credentials.warehouses.length > 0) {
            const normalizedWarehouses = result.credentials.warehouses.map((w: any) => ({
              id: w.id || w.warehoouse_id || "",
              warehouse_name: w.warehouse_name || "",
            }))
            setWarehouses(normalizedWarehouses)
            setTempCredentials(result.credentials)
            setShowWarehouseSelector(true)
            setIsLoading(false)
            return
          } else {
            setError("No warehouses available. Please contact support.")
            setIsLoading(false)
            return
          }
        }
      } else {
        setError(result.message || "Login failed")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleWarehouseSelect = () => {
    if (!selectedWarehouse) {
      setError("Please select a warehouse")
      return
    }
    sessionStorage.setItem("selected_warehouse", selectedWarehouse)

    const selectedWarehouseData = warehouses.find((w) => w.id === selectedWarehouse)
    if (selectedWarehouseData) {
      sessionStorage.setItem("selected_warehouse_name", selectedWarehouseData.warehouse_name)
    }

    setShowWarehouseSelector(false)
    router.push("/dashboard")
  }

  if (showWarehouseSelector) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="dialog-title text-lg mb-2">Select Warehouse</h3>
          <p className="dialog-description text-sm mb-4">
            You must select a warehouse to proceed. This will determine which products and data you can access.
          </p>

          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
            <SelectTrigger className="select-base w-full h-11 text-base">
              <SelectValue placeholder="Select a warehouse..." />
            </SelectTrigger>
            <SelectContent className="dialog-content">
              {warehouses.map((warehouse, index) => (
                <SelectItem key={warehouse.id || `warehouse-${index}`} value={warehouse.id || `warehouse-${index}`}>
                  {warehouse.warehouse_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="alert-error">
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleWarehouseSelect}
          disabled={!selectedWarehouse || isLoading}
          className="btn-create w-full h-11 justify-center disabled:opacity-50"
        >
          {isLoading ? "Processing..." : "Proceed to Dashboard"}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="alert-error">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className="form-label">Username</label>
        <Input
          type="text"
          placeholder="Enter your username, email, or phone"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          disabled={isLoading}
          className="input-base"
          required
        />
      </div>

      <div>
        <label className="form-label">Password</label>
        <Input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          className="input-base"
          required
        />
      </div>

      <Button type="submit" disabled={isLoading} className="btn-create w-full h-11 justify-center">
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>

      <div className="space-y-2">
        <div className="text-center">
          <Link href="/forgot-password" className="text-sm text-warning hover:text-orange-300 transition-colors">
            Forgot password?
          </Link>
        </div>
        <div className="text-center pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-semibold">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </form>
  )
}
