"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle, Upload, X } from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  category: string
  quantity: number
  reorderLevel: number
  price: number
  cost?: number
  barcode?: string
  colorCode?: string
  description?: string
  img?: string // Added image field
  lastUpdated: string
  status: "in_stock" | "low_stock" | "out_of_stock"
}

interface ProductFormProps {
  product: Product | null
  onClose: () => void
  onSave: () => void
}

export function ProductForm({ product, onClose, onSave }: ProductFormProps) {
  const [formData, setFormData] = useState({
    product_id: "",
    sku: "",
    product_name: "",
    product_category: "",
    description: "",
    price: 0,
    color_code: "#2196F3",
    shape: "0",
    product_cost: 0,
    track_inventory: 1,
    stock_quantity: 0,
    sold_by: "Each",
    warehouse_id: "Emidan Farm - DP",
    is_purchase_item: 1,
    barcode: "",
    purpose: "Stock Reconciliation",
    img: "", // Added image URL field
  })

  const [imagePreview, setImagePreview] = useState<string>("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const selectedWarehouse = sessionStorage.getItem("selected_warehouse") || "Emidan Farm - DP"

    if (product) {
      setFormData({
        product_id: product.id,
        sku: product.sku,
        product_name: product.name,
        product_category: product.category,
        description: product.description || "",
        price: product.price,
        color_code: product.colorCode || "#2196F3",
        shape: "0",
        product_cost: product.cost || 0,
        track_inventory: 1,
        stock_quantity: product.quantity,
        sold_by: "Each",
        warehouse_id: selectedWarehouse,
        is_purchase_item: 1,
        barcode: product.barcode || "",
        purpose: "Stock Reconciliation",
        img: product.img || "", // Load existing image
      })
      setImagePreview(product.img || "") // Set preview for existing product
    } else {
      setFormData((prev) => ({
        ...prev,
        warehouse_id: selectedWarehouse,
      }))
    }
  }, [product])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "stock_quantity" || name === "price" || name === "product_cost" || name === "track_inventory"
          ? Number(value)
          : value,
    }))

    if (name === "img") {
      setImagePreview(value)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create a local preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        // In a real implementation, you would upload the file to a server here
        // For now, we'll store the data URL
        setFormData((prev) => ({ ...prev, img: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClearImage = () => {
    setImagePreview("")
    setFormData((prev) => ({ ...prev, img: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const url = product ? `/api/inventory/products/${product.id}` : "/api/inventory/products"
      const method = product ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setMessage({ type: "success", text: `Product ${product ? "updated" : "added"} successfully` })
        setTimeout(() => {
          onSave()
        }, 1000)
      } else {
        const data = await response.json()
        setMessage({ type: "error", text: data.message || "Failed to save product" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while saving product" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card-base p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="dialog-title mb-6">{product ? "Edit Product" : "Add New Product"}</h2>

        {message && (
          <div className={message.type === "success" ? "alert-success mb-6" : "alert-error mb-6"}>
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            )}
            <p className={message.type === "success" ? "text-success text-sm" : "text-danger text-sm"}>
              {message.text}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Product Image</label>
            <div className="space-y-3">
              {/* Image Preview */}
              {imagePreview && (
                <div className="relative w-full h-48 rounded-lg border-2 border-border overflow-hidden bg-muted">
                  <img src={imagePreview || "/placeholder.svg"} alt="Product preview" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="absolute top-2 right-2 p-1.5 bg-danger text-white rounded-full hover:bg-danger/90 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Upload Options */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="btn-secondary cursor-pointer flex items-center justify-center gap-2 w-full">
                    <Upload className="w-4 h-4" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <Input
                    type="text"
                    name="img"
                    value={formData.img}
                    onChange={handleChange}
                    placeholder="Or paste image URL"
                    className="input-base"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Product ID</label>
              <Input
                type="text"
                name="product_id"
                value={formData.product_id}
                onChange={handleChange}
                placeholder="e.g., 443433tt66666646"
                className="input-base"
                required
                disabled={!!product}
              />
            </div>

            <div>
              <label className="form-label">SKU</label>
              <Input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g., 1221222FDeeF7D"
                className="input-base"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Product Name</label>
            <Input
              type="text"
              name="product_name"
              value={formData.product_name}
              onChange={handleChange}
              placeholder="e.g., 500 Grams Eden Tea"
              className="input-base"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Category</label>
              <Input
                type="text"
                name="product_category"
                value={formData.product_category}
                onChange={handleChange}
                placeholder="e.g., Seaweed"
                className="input-base"
                required
              />
            </div>

            <div>
              <label className="form-label">Color Code</label>
              <Input
                type="text"
                name="color_code"
                value={formData.color_code}
                onChange={handleChange}
                placeholder="#2196F3"
                className="input-base"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Description</label>
            <Input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Product description"
              className="input-base"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Cost (KES)</label>
              <Input
                type="number"
                name="product_cost"
                value={formData.product_cost}
                onChange={handleChange}
                placeholder="100"
                step="0.01"
                className="input-base"
                required
              />
            </div>

            <div>
              <label className="form-label">Selling Price (KES)</label>
              <Input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="150"
                step="0.01"
                className="input-base"
                required
              />
            </div>

            <div>
              <label className="form-label">Stock Quantity</label>
              <Input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                placeholder="45"
                className="input-base"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Barcode</label>
              <Input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                placeholder="87787887"
                className="input-base"
              />
            </div>

            <div>
              <label className="form-label">Sold By</label>
              <Input
                type="text"
                name="sold_by"
                value={formData.sold_by}
                onChange={handleChange}
                placeholder="Each"
                className="input-base"
                required
              />
            </div>
          </div>

          {product && (
            <div>
              <label className="form-label">Purpose</label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="select-base w-full rounded-lg px-4 py-2"
              >
                <option value="Stock Reconciliation">Stock Reconciliation</option>
                <option value="Purchase">Purchase</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="btn-create flex-1">
              {isLoading ? "Saving..." : "Save Product"}
            </Button>
            <Button type="button" onClick={onClose} className="btn-cancel flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
