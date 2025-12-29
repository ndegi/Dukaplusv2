"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Package } from "lucide-react";
import { useCurrency } from "@/lib/contexts/currency-context";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  qty_in_store?: number;
  track_inventory?: number;
  price: number;
  status?: "in_stock" | "low_stock" | "out_of_stock";
  all_selling_prices?: Array<{
    unit_of_measure: string;
    unit_selling_price: number;
  }>;
  img?: string;
}

interface ProductBrowserProps {
  onAddToCart: (product: Product) => void;
  searchTerm?: string;
}

export function ProductBrowser({
  onAddToCart,
  searchTerm = "",
}: ProductBrowserProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const { currency } = useCurrency();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const warehouse: any = sessionStorage.getItem("selected_warehouse");

      const response = await fetch(
        `/api/inventory/products?warehouse_id=${encodeURIComponent(warehouse)}`,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setError(null);
      } else {
        setError("Failed to fetch inventory");
      }
    } catch (err) {
      setError("An error occurred while fetching inventory");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = (product: Product) => {
    const trackInventory = product.track_inventory ?? 1;
    const qtyInStore = product.qty_in_store ?? product.quantity ?? 0;

    if (trackInventory === 0 || qtyInStore > 0) {
      onAddToCart(product);
    }
  };

  if (isLoading) {
    return (
      <div className="card-base p-8 text-center text-secondary">
        Loading products...
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-error flex items-start gap-3">
        <AlertCircle className="text-danger mt-0.5 flex-shrink-0" />
        <p className="text-danger text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3 p-2 sm:p-3 md:p-4 bg-background">
      <p className="text-xs sm:text-sm text-foreground font-medium">
        {filteredProducts.length} of {products.length} items
      </p>

      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full whitespace-nowrap transition-colors font-medium text-xs sm:text-sm ${
            selectedCategory === "all"
              ? "bg-blue-600 text-white"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          All items
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full whitespace-nowrap transition-colors font-medium text-xs sm:text-sm ${
              selectedCategory === category
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-2 md:gap-3">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-8 text-secondary text-sm sm:text-base">
            No products found
          </div>
        ) : (
          filteredProducts.map((product) => {
            const trackInventory = product.track_inventory ?? 1;
            const qtyInStore = product.qty_in_store ?? product.quantity ?? 0;
            const stockStatus = product.status || "in_stock";

            const statusConfig = {
              in_stock: {
                badge:
                  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                dot: "bg-green-500",
              },
              low_stock: {
                badge:
                  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
                dot: "bg-yellow-500",
              },
              out_of_stock: {
                badge:
                  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                dot: "bg-red-500",
              },
              service: {
                badge:
                  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
                dot: "bg-blue-500",
              },
            };

            const isService = trackInventory === 0;
            const statusKey = isService ? "service" : stockStatus;
            const currentStatus =
              statusConfig[statusKey as keyof typeof statusConfig];

            let stockText = "";
            if (isService) {
              stockText = "Available";
            } else if (stockStatus === "out_of_stock") {
              stockText = "Out of stock";
            } else if (stockStatus === "low_stock") {
              stockText = `${qtyInStore} left`;
            } else {
              stockText = `${qtyInStore} available`;
            }

            const statusLabel = isService
              ? "Service"
              : stockStatus === "out_of_stock"
              ? "Out of stock"
              : stockStatus === "low_stock"
              ? "Low stock"
              : "In stock";

            const isOutOfStock = trackInventory === 1 && qtyInStore === 0;

            return (
              <div
                key={product.id}
                className={`card-hover overflow-hidden flex flex-col justify-between ${
                  isOutOfStock
                    ? "opacity-60 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                onClick={() => !isOutOfStock && handleAddProduct(product)}
              >
                <div className="w-full h-16 sm:h-20 md:h-24 bg-muted flex items-center justify-center overflow-hidden relative">
                  {product.img ? (
                    <img
                      src={product.img || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                  )}
                  <div className="absolute top-1 right-1">
                    <span
                      className={`text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full ${currentStatus.badge}`}
                    >
                      {stockText}
                    </span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-xs sm:text-sm line-clamp-2">
                      {product.name}
                    </h3>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base md:text-lg font-bold text-foreground truncate">
                        {currency}{" "}
                        {product.price.toLocaleString("en-KE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      {product.all_selling_prices &&
                        product.all_selling_prices.length > 1 && (
                          <div className="mt-1 space-y-0.5">
                            {product.all_selling_prices.map((price) => (
                              <p
                                key={price.unit_of_measure}
                                className="text-xs text-muted-foreground font-medium truncate"
                              >
                                {price.unit_of_measure}: {currency}{" "}
                                {price.unit_selling_price.toLocaleString(
                                  "en-KE",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </p>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                    <span
                      className={`w-2 h-2 rounded-full ${currentStatus.dot}`}
                    />
                    <span>{statusLabel}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
