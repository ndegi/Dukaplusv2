"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { ProductFormInline } from "./product-form-inline";
import { TableActionButtons } from "@/components/ui/table-action-buttons";
import { useCurrency } from "@/lib/contexts/currency-context";
import { EnhancedPagination } from "../reports/enhanced-pagination";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  price: number;
  cost: number;
  barcode: string | null;
  colorCode: string;
  description: string;
  img?: string;
  lastUpdated: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
  product_status: any;
  track_inventory: number;
  is_purchase_item: number;
  purpose: string;
  all_selling_prices?: any[];
}

export function InventoryOverview() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { currency } = useCurrency();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [searchTerm, products]);

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

  const clearFilters = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      {error && (
        <div className="alert-error">
          <FontAwesomeIcon
            icon={faExclamationCircle as any}
            className="w-4 h-4 text-danger flex-shrink-0 mt-0.5"
          />
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <Input
            placeholder="Search by name, SKU, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 input-base text-sm"
          />
        </div>
        {searchTerm && (
          <Button onClick={clearFilters} variant="outline" size="sm">
            Clear Filters
          </Button>
        )}
        <Button
          onClick={() => {
            setSelectedProduct(null);
            setShowForm(true);
          }}
          className="btn-create h-9 text-sm"
        >
          <Plus className="w-3 h-3" />
          Add Product
        </Button>
      </div>

      {/* Product Form Inline View */}
      {showForm && (
        <div className="card-base p-6 mb-6 border-2 border-orange-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">
              {selectedProduct ? "Edit Product" : "Add New Product"}
            </h3>
            <Button
              onClick={() => {
                setShowForm(false);
                setSelectedProduct(null);
              }}
              variant="ghost"
              size="sm"
            >
              ✕
            </Button>
          </div>

          <ProductFormInline
            product={selectedProduct}
            onClose={() => {
              setShowForm(false);
              setSelectedProduct(null);
            }}
            onSave={() => {
              fetchProducts();
              setShowForm(false);
              setSelectedProduct(null);
            }}
          />
        </div>
      )}

      {/* Products Table */}
      <div className="card-base table-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-secondary text-sm">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-6 text-center text-secondary text-sm">
            No products found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="reports-table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell text-left uppercase">
                      Product Name
                    </th>
                    <th className="table-header-cell text-left uppercase">
                      SKU
                    </th>
                    <th className="table-header-cell text-left uppercase">
                      Barcode
                    </th>
                    <th className="table-header-cell text-left uppercase">
                      Category
                    </th>
                    <th className="table-header-cell text-center uppercase">
                      Stock
                    </th>
                    <th className="table-header-cell text-center uppercase">
                      Cost
                    </th>
                    <th className="table-header-cell text-center uppercase">
                      Price
                    </th>
                    <th className="table-header-cell text-center uppercase">
                      Selling Prices
                    </th>
                    <th className="table-header-cell text-center uppercase">
                      Status
                    </th>
                    <th className="table-header-cell text-center uppercase">
                      Stock Status
                    </th>
                    <th className="table-header-cell text-center uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedProducts.map((product) => (
                    <tr key={product.id} className="table-row">
                      <td className="table-cell font-medium">{product.name}</td>
                      <td className="table-cell-secondary font-mono">
                        {product.sku}
                      </td>
                      <td className="table-cell-secondary font-mono">
                        {product.barcode || "-"}
                      </td>
                      <td className="table-cell-secondary">
                        {product.category}
                      </td>
                      <td className="table-cell text-center font-semibold">
                        {product.quantity.toFixed(1)}
                      </td>
                      <td className="table-cell-secondary text-center">
                        {currency} {product.cost.toFixed(2)}
                      </td>
                      <td className="table-cell-secondary text-center">
                        {currency} {product.price.toFixed(2)}
                      </td>
                      <td className="table-cell-secondary text-center">
                        {product.all_selling_prices &&
                        product.all_selling_prices.length > 0 ? (
                          <div className="text-xs">
                            {product.all_selling_prices
                              .map((sp: any) => {
                                // handle different possible shapes from API
                                const uom =
                                  sp.unit_of_measure ||
                                  sp.uom ||
                                  sp.unit ||
                                  sp.name ||
                                  "Unit";
                                const price =
                                  sp.unit_selling_price ??
                                  sp.price ??
                                  sp.unit_price ??
                                  sp.unit_selling_price;
                                const conv =
                                  sp.conversion_factor ??
                                  sp.conversion ??
                                  sp.factor ??
                                  "";
                                if (price === undefined || price === null)
                                  return `${uom}`;
                                return `${uom}: ${currency} ${Number(
                                  price
                                ).toFixed(2)}${conv ? ` (x${conv})` : ""}`;
                              })
                              .join(" \u2022 ")}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">-</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span
                          className={
                            product.product_status === 0
                              ? "badge-success"
                              : "badge-danger"
                          }
                        >
                          {product.product_status === 0
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span
                          className={
                            product.status === "in_stock"
                              ? "badge-success"
                              : product.status === "low_stock"
                              ? "badge-warning"
                              : "badge-danger"
                          }
                        >
                          {product.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <TableActionButtons
                          showEdit={true}
                          onEdit={() => {
                            setSelectedProduct(product);
                            setShowForm(true);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <EnhancedPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                startIndex={startIndex}
                endIndex={endIndex}
                totalRecords={filteredProducts.length}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
