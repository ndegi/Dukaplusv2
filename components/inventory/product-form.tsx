"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle, Upload, X, Check, ChevronsUpDown } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

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
  track_inventory: number
  is_purchase_item: number
  product_status: number
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
    img: "",
  })

  const [imagePreview, setImagePreview] = useState<string>("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState("")
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)

  const [trackInventory, setTrackInventory] = useState(true)
  const [isPurchaseItem, setIsPurchaseItem] = useState(true)
  const [productStatus, setProductStatus] = useState(1)
  const [originalStockQuantity, setOriginalStockQuantity] = useState("")
  const [showPurposeSelector, setShowPurposeSelector] = useState(false)

  useEffect(() => {
    const selectedWarehouse = sessionStorage.getItem("selected_warehouse") || "Emidan Farm - DP"

    fetchCategories(selectedWarehouse)

    if (product) {
      setOriginalStockQuantity(product.quantity.toString())
      setTrackInventory(product.track_inventory === 1)
      setIsPurchaseItem(product.is_purchase_item === 1)
      setProductStatus(product.product_status || 1)

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
        track_inventory: product.track_inventory === 1 ? 1 : 0,
        stock_quantity: product.quantity,
        sold_by: product.sold_by || "Each",
        warehouse_id: selectedWarehouse,
        is_purchase_item: product.is_purchase_item === 1 ? 1 : 0,
        barcode: product.barcode || "",
        purpose: product.purpose || "Stock Reconciliation",
        img: product.img || "",
      })
      setImagePreview(product.img || "")
    } else {
      setFormData((prev) => ({
        ...prev,
        warehouse_id: selectedWarehouse,
      }))
    }
  }, [product])

  useEffect(() => {
    if (product && trackInventory) {
      const hasQuantityChanged = formData.stock_quantity.toString() !== originalStockQuantity
      setShowPurposeSelector(hasQuantityChanged)
      if (!hasQuantityChanged) {
        setFormData((prev) => ({ ...prev, purpose: "Stock Reconciliation" }))
      }
    }
  }, [formData.stock_quantity, originalStockQuantity, trackInventory, product])

  const fetchCategories = async (warehouseId: string) => {
    try {
      const response = await fetch(`/api/inventory/categories?warehouse_id=${encodeURIComponent(warehouseId)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.message?.product_categories && Array.isArray(data.message.product_categories)) {
          const categoryNames = data.message.product_categories.map((cat: any) => cat.category_name)
          setCategories(categoryNames)
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

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
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
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

    if (isPurchaseItem && !formData.product_cost) {
      setMessage({ type: "error", text: "Cost is required for purchase items" })
      return
    }

    if (showPurposeSelector && !formData.purpose) {
      setMessage({ type: "error", text: "Please select a purpose for the quantity change" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const payload = {
        ...formData,
        track_inventory: trackInventory ? 1 : 0,
        is_purchase_item: isPurchaseItem ? 1 : 0,
        product_status: productStatus,
        stock_quantity: trackInventory ? formData.stock_quantity : 0,
        product_cost: isPurchaseItem ? formData.product_cost : 0,
      }

      const url = product ? "/api/inventory/products/update" : "/api/inventory/products"
      const method = "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const createCategory = async (categoryName: string) => {
    setIsCreatingCategory(true)
    try {
      const response = await fetch("/api/inventory/categories/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_category: categoryName }),
      })

      if (response.ok) {
        setCategories((prev) => [...prev, categoryName])
        setFormData((prev) => ({ ...prev, product_category: categoryName }))
        setCategoryOpen(false)
        setCategorySearch("")
        return true
      } else {
        const data = await response.json()
        setMessage({ type: "error", text: data.error || "Failed to create category" })
        return false
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to create category" })
      return false
    } finally {
      setIsCreatingCategory(false)
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
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <label className="form-label">Product Image</label>
              {imagePreview && (
                <div className="relative w-24 h-24 rounded-lg border-2 border-border overflow-hidden bg-muted mt-2">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="absolute top-1 right-1 p-1 bg-danger text-white rounded-full hover:bg-danger/90 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="space-y-2 mt-2">
                <label className="btn-secondary cursor-pointer flex items-center justify-center gap-2 w-24 text-xs py-1.5">
                  <Upload className="w-3 h-3" />
                  Upload
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="product-status" className="text-sm">
                  Product Active
                </Label>
                <Switch
                  id="product-status"
                  checked={productStatus === 1}
                  onCheckedChange={(checked) => setProductStatus(checked ? 1 : 0)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="purchase-item" className="text-sm">
                  Is Purchase Item
                </Label>
                <Switch id="purchase-item" checked={isPurchaseItem} onCheckedChange={setIsPurchaseItem} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="track-inventory" className="text-sm">
                  Track Inventory
                </Label>
                <Switch id="track-inventory" checked={trackInventory} onCheckedChange={setTrackInventory} />
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
                placeholder="Enter product ID"
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
                placeholder="Enter SKU"
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
              placeholder="Enter product name"
              className="input-base"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Category</label>
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className="w-full justify-between h-9 input-base bg-transparent"
                  >
                    {formData.product_category || "Select category..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search category..."
                      value={categorySearch}
                      onValueChange={setCategorySearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2">
                          <p className="text-sm text-muted-foreground mb-2">No category found.</p>
                          {categorySearch && (
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => createCategory(categorySearch)}
                              disabled={isCreatingCategory}
                            >
                              {isCreatingCategory ? "Creating..." : `Create "${categorySearch}"`}
                            </Button>
                          )}
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {categories.map((category) => (
                          <CommandItem
                            key={category}
                            value={category}
                            onSelect={() => {
                              setFormData((prev) => ({ ...prev, product_category: category }))
                              setCategoryOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.product_category === category ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {category}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="form-label">Color Code</label>
              <Input
                type="text"
                name="color_code"
                value={formData.color_code}
                onChange={handleChange}
                placeholder="Enter hex color code"
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
              placeholder="Enter product description"
              className="input-base"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">
                Cost (KES) {isPurchaseItem && <span className="text-destructive">*</span>}
              </label>
              <Input
                type="number"
                name="product_cost"
                value={formData.product_cost}
                onChange={handleChange}
                placeholder="Enter cost"
                step="0.01"
                className="input-base"
                required={isPurchaseItem}
                disabled={!isPurchaseItem}
              />
            </div>

            <div>
              <label className="form-label">Selling Price (KES)</label>
              <Input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Enter selling price"
                step="0.01"
                className="input-base"
                required
              />
            </div>

            {trackInventory && (
              <div>
                <label className="form-label">Stock Quantity</label>
                <Input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  placeholder="Enter stock quantity"
                  className="input-base"
                  required
                />
              </div>
            )}
          </div>

          {showPurposeSelector && (
            <div>
              <label className="form-label">
                Purpose for quantity change <span className="text-destructive">*</span>
              </label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="select-base w-full rounded-lg px-4 py-2"
                required
              >
                <option value="">Select purpose</option>
                <option value="Purchase">Purchase</option>
                <option value="Stock Reconciliation">Stock Reconciliation</option>
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
