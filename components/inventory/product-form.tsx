"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  price: number;
  cost?: number;
  barcode?: string;
  colorCode?: string;
  description?: string;
  lastUpdated: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
}

interface ProductFormProps {
  product: Product | null;
  onClose: () => void;
  onSave: () => void;
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
  });

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const selectedWarehouse =
      sessionStorage.getItem("selected_warehouse") || "Emidan Farm - DP";

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
      });
      // if product has an existing image url, show it in preview
      const prodImg = (product as any)?.img || (product as any)?.image || null;
      if (prodImg) setPreviewUrl(prodImg);
    } else {
      setFormData((prev) => ({
        ...prev,
        warehouse_id: selectedWarehouse,
      }));
    }
  }, [product]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    // Handle file inputs separately to produce a preview
    if (e.target instanceof HTMLInputElement && e.target.type === "file") {
      const file = e.target.files?.[0] ?? null;
      if (file) {
        setImageFile(file);
        // revoke previous preview if it was a blob URL
        if (previewUrl && previewUrl.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(previewUrl);
          } catch (_) {}
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setImageFile(null);
        // clear preview for no file
        if (previewUrl && previewUrl.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(previewUrl);
          } catch (_) {}
        }
        setPreviewUrl(null);
      }
      return;
    }

    const { name, value } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "stock_quantity" ||
        name === "price" ||
        name === "product_cost" ||
        name === "track_inventory"
          ? Number(value)
          : value,
    }));
  };

  // cleanup any created object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch (_) {}
      }
    };
  }, [previewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const url = product
        ? `/api/inventory/products/${product.id}`
        : "/api/inventory/products";
      const method = product ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Product ${product ? "updated" : "added"} successfully`,
        });
        setTimeout(() => {
          onSave();
        }, 1000);
      } else {
        const data = await response.json();
        setMessage({
          type: "error",
          text: data.message || "Failed to save product",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while saving product",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card-base p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="dialog-title mb-6">
          {product ? "Edit Product" : "Add New Product"}
        </h2>

        {message && (
          <div
            className={
              message.type === "success"
                ? "alert-success mb-6"
                : "alert-error mb-6"
            }
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            )}
            <p
              className={
                message.type === "success"
                  ? "text-success text-sm"
                  : "text-danger text-sm"
              }
            >
              {message.text}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Product ID</label>
              <Input
                type="text"
                name="product_id"
                value={formData.product_id}
                onChange={handleChange}
                placeholder="ENTER PRODUCT ID"
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
                placeholder="ENTER SKU"
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
              placeholder="ENTER PRODUCT NAME"
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
                placeholder="ENTER CATEGORY"
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

            <div>
              <label className="form-label">Product Image</label>
              <Input
                type="file"
                name="product_image"
                onChange={handleChange}
                className="input-base"
              />
            </div>

            <div>
              <label className="form-label">Product Image Preview</label>
              {/* Add image preview logic here */}
              <div className="w-full h-24 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 overflow-hidden">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Product preview"
                    className="object-contain w-full h-full"
                  />
                ) : (
                  "Image Preview"
                )}
              </div>
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
                <option value="Stock Reconciliation">
                  Stock Reconciliation
                </option>
                <option value="Purchase">Purchase</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="btn-create flex-1"
            >
              {isLoading ? "Saving..." : "Save Product"}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              className="btn-cancel flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
