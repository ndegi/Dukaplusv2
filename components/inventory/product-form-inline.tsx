"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/contexts/currency-context";
import { Label } from "@/components/ui/label";
import { Toast } from "@radix-ui/react-toast";

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
  img?: string;
  lastUpdated: string;
  product_status: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  purpose: string;
  track_inventory: number;
  is_purchase_item: any;
}

interface ProductFormProps {
  product: any;
  onClose: () => void;
  onSave: () => void;
}

export function ProductFormInline({
  product,
  onClose,
  onSave,
}: ProductFormProps) {
  const { currency } = useCurrency();
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
    // sold_by: "Each", // Field removed
    warehouse_id: "",
    is_purchase_item: 1,
    barcode: "",
    purpose: "Purchase",
    img: "",
    product_status: 0,
  });

  const [imagePreview, setImagePreview] = useState<string>("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [productStatus, setProductStatus] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [trackInventory, setTrackInventory] = useState(true);
  const [isPurchaseItem, setIsPurchaseItem] = useState(true);
  const [originalStockQuantity, setOriginalStockQuantity] = useState("");
  const [showPurposeSelector, setShowPurposeSelector] = useState(false);
  const [sellingPrices, setSellingPrices] = useState<
    Array<{ uom: string; conversion_factor: number; price: number }>
  >([]);

  useEffect(() => {
    const selectedWarehouse =
      sessionStorage.getItem("selected_warehouse") || "";

    fetchCategories(selectedWarehouse);

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
        // sold_by: "Each", // Field removed
        warehouse_id: selectedWarehouse,
        is_purchase_item: 1,
        barcode: product.barcode || "",
        purpose: "Stock Reconciliation",
        img: product.img || "",
        product_status: product.product_status,
      });
      setImagePreview(product.img || "");
      // initialize selling prices from product if available
      const rawPrices =
        product.all_selling_prices || product.selling_prices || [];
      const normalized = (rawPrices || []).map((sp: any) => ({
        uom: sp.unit_of_measure || sp.uom || sp.unit || "Each",
        conversion_factor:
          Number(sp.conversion_factor ?? sp.conversion ?? sp.factor ?? 1) || 1,
        price:
          Number(
            sp.unit_selling_price ??
            sp.price ??
            sp.unit_price ??
            sp.unit_selling_price
          ) || 0,
      }));
      setSellingPrices(
        normalized.length > 0
          ? normalized
          : [{ uom: "Each", conversion_factor: 1, price: product.price || 0 }]
      );
    } else {
      setFormData((prev) => ({
        ...prev,
        warehouse_id: selectedWarehouse,
      }));
    }
  }, [product]);

  useEffect(() => {
    if (product && trackInventory) {
      const hasQuantityChanged =
        formData.stock_quantity.toString() !== originalStockQuantity;
      setShowPurposeSelector(hasQuantityChanged);
      if (!hasQuantityChanged) {
        setFormData((prev) => ({ ...prev, purpose: "Stock Reconciliation" }));
      }
    }
  }, [formData.stock_quantity, originalStockQuantity, trackInventory, product]);

  const fetchCategories = async (warehouseId: string) => {
    try {
      const response = await fetch(
        `/api/inventory/categories?warehouse_id=${encodeURIComponent(
          warehouseId
        )}`
      );
      if (response.ok) {
        const data = await response.json();
        if (
          data.message?.product_categories &&
          Array.isArray(data.message.product_categories)
        ) {
          const categoryNames = data.message.product_categories.map(
            (cat: any) => cat.category_name
          );
          setCategories(categoryNames);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Automatically remove spaces from SKU
    let processedValue = value;
    if (name === "sku") {
      processedValue = value.replace(/\s/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "stock_quantity" ||
          name === "price" ||
          name === "product_cost" ||
          name === "track_inventory"
          ? Number(processedValue)
          : processedValue,
    }));

    if (name === "img") {
      setImagePreview(processedValue);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData((prev) => ({ ...prev, img: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setImagePreview("");
    setFormData((prev) => ({ ...prev, img: "" }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.sku || formData.sku.trim() === "") {
      setMessage({
        type: "error",
        text: "SKU is required",
      });
      return;
    }

    // Validate SKU has no spaces
    if (formData.sku.includes(" ")) {
      setMessage({
        type: "error",
        text: "SKU cannot contain spaces",
      });
      return;
    }

    if (!formData.product_name || formData.product_name.trim() === "") {
      setMessage({
        type: "error",
        text: "Product name is required",
      });
      return;
    }

    if (!formData.product_category || formData.product_category.trim() === "") {
      setMessage({
        type: "error",
        text: "Category is required",
      });
      return;
    }

    // if (!formData.price || formData.price <= 0) {
    //   setMessage({
    //     type: "error",
    //     text: "Selling price is required and must be greater than 0",
    //   });
    //   return;
    // }

    if (
      isPurchaseItem &&
      (!formData.product_cost || formData.product_cost <= 0)
    ) {
      setMessage({
        type: "error",
        text: "Cost is required for purchase items and must be greater than 0",
      });
      return;
    }

    if (
      trackInventory &&
      (formData.stock_quantity === undefined ||
        formData.stock_quantity === null ||
        formData.stock_quantity < 0)
    ) {
      setMessage({
        type: "error",
        text: "Stock quantity is required when tracking inventory",
      });
      return;
    }

    if (showPurposeSelector && !formData.purpose) {
      setMessage({
        type: "error",
        text: "Please select a purpose for the quantity change",
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const url = product
        ? "/api/inventory/products/update"
        : "/api/inventory/products";
      const method = "POST";

      const preparedPayload = {
        ...formData,
        track_inventory: trackInventory ? 1 : 0,
        is_purchase_item: isPurchaseItem ? 1 : 0,
        stock_quantity: trackInventory
          ? Number(formData.stock_quantity) || 0
          : 0,
        product_cost: isPurchaseItem ? Number(formData.product_cost) || 0 : 0,
        sold_by: "Each", // Field removed from UI, defaulting to "Each"
        purpose: product
          ? showPurposeSelector
            ? formData.purpose || "Stock Reconciliation"
            : "Stock Reconciliation"
          : formData.purpose || "Purchase",
        product_status: productStatus,
        // include selling prices in normalized shape expected by API
        selling_prices: sellingPrices
          .filter((s) => s.uom && !isNaN(Number(s.price)))
          .map((s) => ({
            uom: s.uom,
            conversion_factor: Number(s.conversion_factor) || 1,
            price: Number(s.price) || 0,
          })),
      };
      console.log("[DukaPlus] Payload to API:", preparedPayload);
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preparedPayload),
      });

      const responseText = await response.text();
      let data: any = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText };
      }

      if (response.ok) {
        const successMsg = typeof data?.message === 'object'
          ? (data.message.message || JSON.stringify(data.message))
          : (data?.message || `Product ${product ? "updated" : "added"} successfully`);

        setMessage({
          type: "success",
          text: successMsg,
        });
        setTimeout(() => {
          onSave();
        }, 800);
      } else {
        const errorMsg = typeof data?.message === 'object'
          ? (data.message.message || JSON.stringify(data.message))
          : (data?.message || "Failed to save product");

        setMessage({
          type: "error",
          text: errorMsg,
        });
      }
    } catch (error) {
      console.error("[DukaPlus] Product save error:", error);
      setMessage({
        type: "error",
        text: "An error occurred while saving product. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createCategory = async (categoryName: string) => {
    setIsCreatingCategory(true);
    try {
      const response = await fetch("/api/inventory/categories/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_category: categoryName,
          warehouse_id: formData.warehouse_id,
        }),
      });

      const responseText = await response.text();
      let data: any = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText };
      }

      if (response.ok) {
        setCategories((prev) => [...prev, categoryName]);
        setFormData((prev) => ({ ...prev, product_category: categoryName }));
        setCategoryOpen(false);
        setCategorySearch("");

        const successMsg = typeof data?.message === 'object'
          ? (data.message.message || JSON.stringify(data.message))
          : (data?.message || `Category "${categoryName}" created successfully`);

        setMessage({
          type: "success",
          text: successMsg,
        });
        return true;
      } else {
        const errorMsg = typeof data?.message === 'object'
          ? (data.message.message || JSON.stringify(data.message))
          : (data?.error || data?.message || "Failed to create category");

        setMessage({
          type: "error",
          text: errorMsg,
        });
        return false;
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to create category" });
      return false;
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Selling prices helpers
  const updateSellingPrice = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setSellingPrices((prev) => {
      const copy = [...prev];
      const item = { ...copy[index] };
      if (field === "uom") item.uom = String(value);
      if (field === "conversion_factor")
        item.conversion_factor = Number(value) || 1;
      if (field === "price") item.price = Number(value) || 0;
      copy[index] = item;
      return copy;
    });
  };

  const addSellingPrice = () => {
    setSellingPrices((prev) => [
      ...prev,
      { uom: "Each", conversion_factor: 1, price: 0 },
    ]);
  };

  const removeSellingPrice = (index: number) => {
    setSellingPrices((prev) => prev.filter((_, i) => i !== index));
  };


  return (
    <div className="space-y-4">
      {message && (
        <div
          className={
            message.type === "success" ? "alert-success" : "alert-error"
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

      <div className="space-y-4">
        <div>
          <label className="form-label">Product Image</label>
          <div className="space-y-3">
            {imagePreview && (
              <div className="relative w-24 h-24 rounded-lg border-2 border-border overflow-hidden bg-muted">
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
                  placeholder="Enter image URL"
                  className="input-base"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0">
          {/* <div>
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
          </div> */}

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="product-status" className="form-label">
                Product Active
              </Label>
              <Switch
                id="product-status"
                checked={productStatus === 0}
                onCheckedChange={(checked) => setProductStatus(checked ? 0 : 1)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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

          <div>
            <label className="form-label">Barcode</label>
            <Input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              placeholder="Enter barcode"
              className="input-base"
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
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          No category found.
                        </p>
                        {categorySearch && (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => createCategory(categorySearch)}
                            disabled={isCreatingCategory}
                          >
                            {isCreatingCategory
                              ? "Creating..."
                              : `Create "${categorySearch}"`}
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
                            setFormData((prev) => ({
                              ...prev,
                              product_category: category,
                            }));
                            setCategoryOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.product_category === category
                                ? "opacity-100"
                                : "opacity-0"
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="purchase-item" className="form-label">
                Is Purchase Item
              </Label>
              <Switch
                id="purchase-item"
                checked={isPurchaseItem}
                onCheckedChange={(checked) => {
                  setIsPurchaseItem(checked);
                  setFormData((prev) => ({
                    ...prev,
                    is_purchase_item: checked ? 1 : 0,
                    product_cost: checked ? prev.product_cost : 0,
                  }));
                }}
              />
            </div>
            {isPurchaseItem && (
              <label className="form-label">Cost ({currency})</label>
            )}
            {isPurchaseItem && (
              <Input
                type="number"
                name="product_cost"
                value={formData.product_cost}
                onChange={handleChange}
                placeholder={`Cost (${currency})`}
                step="0.01"
                className="input-base"
                required
              />
            )}
          </div>

          {/* <div>
            <label className="form-label">Selling Price ({currency})</label>
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
          </div> */}
        </div>

        {/* Multiple selling prices (UOM / conversion / price) */}
        <div className="space-y-2">
          <label className="form-label">Selling Prices ({currency})</label>
          <div className="space-y-2">
            {sellingPrices.map((sp, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <label className="form-label text-xs">UOM</label>
                  <select
                    value={sp.uom}
                    onChange={(e) =>
                      updateSellingPrice(idx, "uom", e.target.value)
                    }
                    className="input-base w-full"
                  >
                    <option value="Each">Each</option>
                    <option value="Box">Box</option>
                    <option value="Tray">Tray</option>
                    <option value="Weight">Weight</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="form-label text-xs">Conversion</label>
                  <Input
                    type="number"
                    value={sp.conversion_factor}
                    onChange={(e) =>
                      updateSellingPrice(
                        idx,
                        "conversion_factor",
                        e.target.value
                      )
                    }
                    className="input-base w-full"
                  />
                </div>
                <div className="col-span-4">
                  <label className="form-label text-xs">
                    Price ({currency})
                  </label>
                  <Input
                    type="number"
                    value={sp.price}
                    onChange={(e) =>
                      updateSellingPrice(idx, "price", e.target.value)
                    }
                    placeholder={`Price (${currency})`}
                    className="input-base"
                    step="0.01"
                  />
                </div>
                <div className="col-span-1">
                  <button
                    type="button"
                    onClick={() => removeSellingPrice(idx)}
                    className="text-danger p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSellingPrice}
              >
                + Add price
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="track-inventory" className="form-label">
                Track Inventory
              </Label>
              <Switch
                id="track-inventory"
                checked={trackInventory}
                onCheckedChange={(checked) => {
                  setTrackInventory(checked);
                  setFormData((prev) => ({
                    ...prev,
                    track_inventory: checked ? 1 : 0,
                    stock_quantity: checked ? prev.stock_quantity : 0,
                  }));
                  if (!checked) {
                    setShowPurposeSelector(false);
                    setFormData((prev) => ({
                      ...prev,
                      purpose: "Stock Reconciliation",
                    }));
                  }
                }}
              />
            </div>
            {trackInventory && (
              <label className="form-label">Stock Quantity</label>
            )}
            {trackInventory && (
              <Input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                placeholder="Stock quantity"
                className="input-base"
                min="0"
                required
              />
            )}
          </div>

          {/* Field removed: Sold By */}
          {/* 
          <div>
            <label className="form-label">Sold By</label>
            <select
              name="sold_by"
              value={formData.sold_by}
              onChange={handleChange}
              className="input-base"
              required
            >
              <option value="Each">Each</option>
              <option value="Weight">Weight</option>
            </select>
          </div> 
          */}
        </div>

        {showPurposeSelector && (
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
          <Button type="button" onClick={onClose} className="btn-cancel flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="btn-create flex-1"
          >
            {isLoading ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </div>
    </div>
  );
}
