"use client"

import type React from "react"
import { TableActionButtons } from "@/components/ui/table-action-buttons"

import { useAuth } from "@/hooks/use-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Plus, Trash2 } from 'lucide-react'

interface POSUser {
  email_address: string
  mobile_number?: string
  full_name?: string
  warehouse?: string
}

interface Warehouse {
  id: string
  warehouse_name: string
}

export default function UsersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<POSUser[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    mobile_number: "",
    email_address: "",
    business_name: "",
    country: "Kenya",
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      fetchUsers()
      fetchWarehouses()
    }
  }, [user])

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true)
      const response = await fetch("/api/pos-users/list")
      const data = await response.json()

      if (response.ok && data.message?.pos_users) {
        setUsers(data.message.pos_users)
      } else {
        setError(data.message?.message || "Failed to fetch users")
      }
    } catch (err) {
      setError("Error fetching users")
      console.error(err)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const fetchWarehouses = async () => {
    try {
      const response = await fetch("/api/warehouses")
      const data = await response.json()

      if (response.ok && data.message?.warehouses) {
        setWarehouses(data.message.warehouses)
      }
    } catch (err) {
      console.error("Error fetching warehouses:", err)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/pos-users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setFormData({
          full_name: "",
          mobile_number: "",
          email_address: "",
          business_name: "",
          country: "Kenya",
        })
        setShowForm(false)
        fetchUsers()
      } else {
        setError(data.message?.message || "Failed to create user")
      }
    } catch (err) {
      setError("Error creating user")
      console.error(err)
    }
  }

  const handleAssignWarehouse = async (userEmail: string) => {
    if (!selectedWarehouse) {
      setError("Please select a warehouse")
      return
    }

    try {
      const response = await fetch("/api/pos-users/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email_address: userEmail,
          warehouse: selectedWarehouse,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSelectedWarehouse("")
        fetchUsers()
      } else {
        setError(data.message?.message || "Failed to assign warehouse")
      }
    } catch (err) {
      setError("Error assigning warehouse")
      console.error(err)
    }
  }

  const handleDisableUser = async (userEmail: string) => {
    if (!confirm("Are you sure you want to disable this user?")) return

    try {
      const response = await fetch("/api/pos-users/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_address: userEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        fetchUsers()
      } else {
        setError(data.message?.message || "Failed to disable user")
      }
    } catch (err) {
      setError("Error disabling user")
      console.error(err)
    }
  }

  if (isLoading || !user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">POS User Management</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Manage POS users and assign them to warehouses
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 dark:border-red-500/30 rounded-lg p-3 sm:p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm sm:text-base text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">POS Users</h2>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>

          {showForm && (
            <form
              onSubmit={handleAddUser}
              className="mb-6 p-3 sm:p-4 bg-slate-50 dark:bg-slate-700 rounded-lg space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  placeholder="Full Name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 text-slate-900 dark:text-white"
                />
                <Input
                  placeholder="Email Address"
                  type="email"
                  value={formData.email_address}
                  onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
                  required
                  className="bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 text-slate-900 dark:text-white"
                />
                <Input
                  placeholder="Mobile Number"
                  value={formData.mobile_number}
                  onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                  required
                  className="bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 text-slate-900 dark:text-white"
                />
                <Input
                  placeholder="Business Name"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                  Create User
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="w-full sm:w-auto bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-700 text-slate-900 dark:text-white"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {isLoadingUsers ? (
            <p className="text-slate-600 dark:text-slate-400">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">No POS users found</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {users.map((u) => (
                <div
                  key={u.email_address}
                  className="bg-slate-50 dark:bg-slate-700 p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-100 dark:hover:bg-slate-650 transition-colors"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <p className="font-semibold text-slate-900 dark:text-white">{u.full_name || u.email_address}</p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{u.email_address}</p>
                    {u.mobile_number && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{u.mobile_number}</p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                      <SelectTrigger className="w-full sm:w-40 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 text-slate-900 dark:text-white">
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={w.id} className="text-slate-900 dark:text-white">
                            {w.warehouse_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => handleAssignWarehouse(u.email_address)}
                      className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                    >
                      Assign
                    </Button>
                    <TableActionButtons
                      showDelete={true}
                      onDelete={() => handleDisableUser(u.email_address)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
