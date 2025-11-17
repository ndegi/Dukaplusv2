"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

interface Supplier {
  supplier_name: string
  supplier_id?: string
  mobile_number?: string
  email?: string
  address?: string
}

export function SuppliersManager() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    action: () => void
  }>({
    open: false,
    title: "",
    description: "",
    action: () => {},
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/suppliers")
      const data = await response.json()

      if (response.ok) {
        setSuppliers(data.suppliers || [])
        setError(null)
      } else {
        setError("Failed to fetch suppliers")
      }
    } catch (err) {
      setError("Error fetching suppliers")
      console.error("[v0] Error fetching suppliers:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (supplierName: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Supplier?",
      description: `Delete "${supplierName}"? This action cannot be undone.`,
      action: async () => {
        try {
          const response = await fetch("/api/suppliers/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ supplier_name: supplierName }),
          })

          if (response.ok) {
            fetchSuppliers()
          } else {
            const data = await response.json()
            alert(data.message || "Failed to delete supplier")
          }
        } catch (err) {
          alert("Error deleting supplier")
          console.error("[v0] Error:", err)
        }
      },
    })
  }

  const filteredSuppliers = suppliers.filter(s =>
    s.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.mobile_number?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.action}
        variant="danger"
        confirmText="Delete"
      />

      <div className="flex justify-between items-center gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-base flex-1 max-w-md"
          placeholder="Search suppliers..."
        />
        <Button onClick={() => setShowModal(true)} size="sm" className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {error && (
        <div className="alert-error">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="card-base overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-center text-foreground text-sm">Loading suppliers...</p>
        ) : filteredSuppliers.length === 0 ? (
          <p className="p-6 text-center text-foreground text-sm">
            {searchQuery ? "No suppliers found matching your search" : "No suppliers found"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell text-left uppercase">Supplier Name</th>
                  <th className="table-header-cell text-left uppercase">Mobile Number</th>
                  <th className="table-header-cell text-left uppercase">Email</th>
                  <th className="table-header-cell text-center uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSuppliers.map((supplier, idx) => (
                  <tr key={idx} className="table-row">
                    <td className="table-cell font-medium">{supplier.supplier_name}</td>
                    <td className="table-cell">{supplier.mobile_number || "-"}</td>
                    <td className="table-cell">{supplier.email || "-"}</td>
                    <td className="table-cell text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleDelete(supplier.supplier_name)}
                          className="action-btn-delete"
                          title="Delete supplier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <AddSupplierModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            fetchSuppliers()
          }}
        />
      )}
    </div>
  )
}

function AddSupplierModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [supplierName, setSupplierName] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [email, setEmail] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!supplierName || !mobileNumber) {
      setError("Supplier name and mobile number are required")
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch("/api/suppliers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier: supplierName,
          mobile_number: mobileNumber,
          email: email || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
      } else {
        setError(data.message || "Failed to create supplier")
      }
    } catch (err) {
      setError("Error creating supplier")
      console.error("[v0] Error:", err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg w-full max-w-md">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">Add Supplier</h2>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="alert-error">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="form-label">Supplier Name *</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="input-base w-full"
              placeholder="Enter supplier name"
            />
          </div>

          <div>
            <label className="form-label">Mobile Number *</label>
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="input-base w-full"
              placeholder="0700000000"
            />
          </div>

          <div>
            <label className="form-label">Email (Optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base w-full"
              placeholder="supplier@example.com"
            />
          </div>
        </div>

        <div className="p-6 border-t border-border flex gap-2">
          <button onClick={onClose} className="btn-cancel flex-1" disabled={isSaving}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn-create flex-1"
            disabled={isSaving || !supplierName || !mobileNumber}
          >
            {isSaving ? "Adding..." : "Add Supplier"}
          </button>
        </div>
      </div>
    </div>
  )
}
