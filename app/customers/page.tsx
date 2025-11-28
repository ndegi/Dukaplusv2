"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { TableActionButtons } from "@/components/ui/table-action-buttons"
import { useCurrency } from "@/hooks/use-currency"

interface Customer {
  customer_id: string
  customer_name: string
  customer_group: string | null
  mobile_number: string
  paid_invoices: {
    count: number
    total: number
  }
  unpaid_invoices: {
    count: number
    total: number
  }
  total_sales: number
}

type SortField = keyof Pick<Customer, "customer_name" | "total_sales" | "mobile_number">
type SortOrder = "asc" | "desc"

export default function CustomersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { formatCurrency } = useCurrency()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("customer_name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [showForm, setShowForm] = useState(false)
  const [groups, setGroups] = useState<string[]>([])
  const [formData, setFormData] = useState({
    customer_name: "",
    mobile_number: "",
    customer_group: "Individual",
    sales_person: "Sales Team",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const itemsPerPage = 10

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    fetchCustomers()
    fetchGroups()
  }, [])

  const fetchCustomers = async () => {
    try {
      setPageLoading(true)
      const res = await fetch("/api/customers/list")
      const data = await res.json()
      setCustomers(data.customers || [])
    } catch (error) {
      console.error("[DukaPlus] Error fetching customers:", error)
    } finally {
      setPageLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/customers/groups")
      const data = await res.json()
      console.log("[DukaPlus] Customer groups data:", data)
      const groupsArray = data.message?.customer_groups || data.groups || []
      const parsedGroups = groupsArray
        .map((g: any) => (typeof g === "string" ? g : g?.customer_group))
        .filter((g: any) => g && typeof g === "string")
      console.log("[DukaPlus] Parsed groups:", parsedGroups)
      setGroups(parsedGroups.length > 0 ? parsedGroups : ["Individual", "Corporate", "Government"])
    } catch (error) {
      console.error("[DukaPlus] Error fetching groups:", error)
      setGroups(["Individual", "Corporate", "Government"])
    }
  }

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const endpoint = editingCustomer ? "/api/customers/update" : "/api/customers/create"
      const method = "POST"

      const payload = editingCustomer ? { customer_id: editingCustomer.customer_id, ...formData } : formData

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setFormData({
          customer_name: "",
          mobile_number: "",
          customer_group: groups[0] || "Individual",
          sales_person: "Sales Team",
        })
        setShowForm(false)
        setEditingCustomer(null)
        fetchCustomers()
      }
    } catch (error) {
      console.error("[DukaPlus] Error saving customer:", error)
    }
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      customer_name: customer.customer_name,
      mobile_number: customer.mobile_number,
      customer_group: customer.customer_group || groups[0] || "Individual",
      sales_person: "Sales Team",
    })
    setShowForm(true)
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const filteredAndSorted = customers
    .filter(
      (c) =>
        (c.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (c.mobile_number?.includes(searchQuery) ?? false),
    )
    .sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      const comparison = typeof aVal === "string" ? aVal.localeCompare(bVal) : (aVal as number) - (bVal as number)
      return sortOrder === "asc" ? comparison : -comparison
    })

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredAndSorted.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  if (isLoading || !user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="page-title">Customers</h1>
            <p className="page-subtitle">Manage customer information and sales history</p>
          </div>
          <Button
            onClick={() => {
              setEditingCustomer(null)
              setFormData({
                customer_name: "",
                mobile_number: "",
                customer_group: groups[0] || "Individual",
                sales_person: "Sales Team",
              })
              setShowForm(true)
            }}
            className="btn-create w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="dialog-content sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="dialog-title">
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="form-label">Customer Name *</label>
                  <Input
                    placeholder="Enter customer name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="input-base"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Mobile Number</label>
                  <Input
                    placeholder="Enter phone number"
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="form-label">Customer Group</label>
                  <select
                    value={formData.customer_group}
                    onChange={(e) => setFormData({ ...formData, customer_group: e.target.value })}
                    className="w-full input-base"
                  >
                    {groups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Sales Person</label>
                  <Input
                    placeholder="Sales person name"
                    value={formData.sales_person}
                    onChange={(e) => setFormData({ ...formData, sales_person: e.target.value })}
                    className="input-base"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 flex-col sm:flex-row">
                <Button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingCustomer(null)
                  }}
                  className="btn-cancel w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" className="btn-success w-full sm:w-auto">
                  {editingCustomer ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-secondary" />
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-10"
            />
          </div>
        </div>

        <Card className="card-base overflow-hidden">
          {pageLoading ? (
            <div className="p-6 text-foreground text-center">Loading customers...</div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="p-6 text-foreground text-center">No customers found</div>
          ) : (
            <>
              <div className="overflow-x-auto text-xs sm:text-sm">
                <table className="w-full">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">
                        <button
                          onClick={() => toggleSort("customer_name")}
                          className="flex items-center gap-2 hover:text-foreground"
                        >
                          Customer Name
                          {sortField === "customer_name" && (
                            <ArrowUpDown
                              className="w-4 h-4"
                              style={{ transform: sortOrder === "desc" ? "scaleY(-1)" : "" }}
                            />
                          )}
                        </button>
                      </th>
                      <th className="table-header-cell">Phone</th>
                      <th className="table-header-cell">Group</th>
                      <th className="table-header-cell text-right">
                        <button
                          onClick={() => toggleSort("total_sales")}
                          className="flex items-center gap-2 hover:text-foreground ml-auto"
                        >
                          Total Sales
                          {sortField === "total_sales" && (
                            <ArrowUpDown
                              className="w-4 h-4"
                              style={{ transform: sortOrder === "desc" ? "scaleY(-1)" : "" }}
                            />
                          )}
                        </button>
                      </th>
                      <th className="table-header-cell text-right">Paid Total</th>
                      <th className="table-header-cell text-right">Unpaid Total</th>
                      <th className="table-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((customer) => (
                      <tr key={customer.customer_id} className="table-row">
                        <td className="table-cell font-medium">{customer.customer_name}</td>
                        <td className="table-cell-secondary">{customer.mobile_number}</td>
                        <td className="table-cell-secondary">{customer.customer_group || "-"}</td>
                        <td className="px-4 py-3 text-right text-warning font-semibold">
                          {formatCurrency(customer.total_sales)}
                        </td>
                        <td className="table-cell-secondary text-right">
                          {formatCurrency(customer.paid_invoices?.total || 0)}
                        </td>
                        <td className="table-cell-secondary text-right">
                          {formatCurrency(customer.unpaid_invoices?.total || 0)}
                        </td>
                        <td className="px-4 py-3">
                          <TableActionButtons showEdit={true} onEdit={() => handleEditCustomer(customer)} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <div className="text-sm text-secondary">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSorted.length)} of{" "}
                    {filteredAndSorted.length} customers
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="border-border"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className={currentPage === page ? "btn-warning" : "border-border"}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="border-border"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
