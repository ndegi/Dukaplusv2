"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { ProductForm } from "./product-form";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  price: number;
  cost: number;
  barcode?: string;
  colorCode: string;
  description: string;
  img?: string; // Added image field
  lastUpdated: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
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

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const credentialsStr = sessionStorage.getItem("tenant_credentials");
      const credentials = credentialsStr ? JSON.parse(credentialsStr) : null;
      const warehouse =
        sessionStorage.getItem("selected_warehouse") || "Emidan Farm - DP";

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

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      {error && (
        <div className="alert-error">
          <FontAwesomeIcon
            icon={faExclamationCircle}
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

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
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
      )}

      {/* Products Table */}
      <div className="card-base overflow-hidden">
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
              <table className="w-full text-sm">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell text-left uppercase">
                      Product Name
                    </th>
                    <th className="table-header-cell text-left uppercase">
                      SKU
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
                      Status
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
                      <td className="table-cell-secondary">
                        {product.category}
                      </td>
                      <td className="table-cell text-center font-semibold">
                        {product.quantity.toFixed(1)}
                      </td>
                      <td className="table-cell-secondary text-center">
                        KES {product.cost.toFixed(2)}
                      </td>
                      <td className="table-cell-secondary text-center">
                        KES {product.price.toFixed(2)}
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
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowForm(true);
                          }}
                          className="action-btn-edit inline-flex items-center gap-1 text-sm"
                          title="Edit Product"
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <div className="text-sm text-secondary">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredProducts.length)} of{" "}
                  {filteredProducts.length} products
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className={currentPage === page ? "btn-warning" : ""}
                        >
                          {page}
                        </Button>
                      )
                    )}
                  </div>
                  <Button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
