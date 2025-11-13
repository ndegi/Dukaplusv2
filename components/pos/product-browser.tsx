"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationCircle,
  faBox,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
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
      const credentialsStr = sessionStorage.getItem("tenant_credentials");
      const credentials = credentialsStr ? JSON.parse(credentialsStr) : null;
      const warehouse = sessionStorage.getItem("selected_warehouse");

      if (!warehouse) {
        setError("No warehouse selected. Please select a warehouse first.");
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `/api/inventory/products?warehouse_id=${encodeURIComponent(warehouse)}`,
        {
          headers: credentials
            ? {
                "X-API-Key": credentials.api_key,
                "X-API-Secret": credentials.api_secret,
                "X-Base-URL": credentials.base_url,
              }
            : {},
        }
      );

      if (response.ok) {
        const data = await response.json();
        const availableProducts = data.products || [];
        setProducts(availableProducts);

        const uniqueCategories = [
          ...new Set(availableProducts.map((p: Product) => p.category)),
        ];
        setCategories(uniqueCategories as string[]);

        setError(null);
      } else {
        setError("Failed to fetch products");
      }
    } catch (err) {
      setError("An error occurred while fetching products");
      console.error("[v0] Error fetching products:", err);
    } finally {
      setIsLoading(false);
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
        <FontAwesomeIcon
          icon={faExclamationCircle}
          className="text-danger mt-0.5"
        />
        <p className="text-danger text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 bg-background">
      <p className="text-sm text-foreground font-medium">
        {filteredProducts.length} of {products.length} items
      </p>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors font-medium text-sm ${
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
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors font-medium text-sm ${
              selectedCategory === category
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-8 text-secondary">
            No products found
          </div>
        ) : (
          filteredProducts.map((product) => {
            const stockStatus = product.status || "in_stock";
            const statusConfig = {
              in_stock: {
                color:
                  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                label: "In Stock",
              },
              low_stock: {
                color:
                  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
                label: "Low Stock",
              },
              out_of_stock: {
                color:
                  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                label: "Out of Stock",
              },
            };
            const currentStatus = statusConfig[stockStatus];
            const isOutOfStock = stockStatus === "out_of_stock";

            return (
              <div
                key={product.id}
                className={`card-hover overflow-hidden flex flex-col justify-between ${
                  isOutOfStock
                    ? "opacity-60 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                onClick={() => !isOutOfStock && onAddToCart(product)}
              >
                <div className="w-full h-20 bg-muted flex items-center justify-center overflow-hidden relative">
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
                    <FontAwesomeIcon
                      icon={faBox}
                      className="text-2xl text-muted-foreground"
                    />
                  )}
                  <div className="absolute top-1 right-1">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${currentStatus.color}`}
                    >
                      {currentStatus.label}
                    </span>
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-xs line-clamp-2">
                      {product.name}
                    </h3>
                    <p
                      className={`text-xs mt-0.5 font-medium ${
                        isOutOfStock ? "text-red-600" : "text-foreground"
                      }`}
                    >
                      <FontAwesomeIcon icon={faBox} /> {product.quantity}{" "}
                      available
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-base sm:text-lg font-bold text-foreground truncate">
                        KES{" "}
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
                                {price.unit_of_measure}: KES{" "}
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOutOfStock) onAddToCart(product);
                      }}
                      disabled={isOutOfStock}
                      className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ml-2 ${
                        isOutOfStock
                          ? "bg-gray-300 cursor-not-allowed"
                          : "btn-success"
                      }`}
                    >
                      <FontAwesomeIcon icon={faPlus} className="text-sm" />
                    </button>
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
