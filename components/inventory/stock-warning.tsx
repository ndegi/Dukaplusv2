import { AlertCircle, TrendingDown } from "lucide-react";

interface Product {
  id: string;
  name: string;
  quantity: number;
  reorderLevel: number;
  status: string;
}

export function StockWarning({ product }: { product: Product }) {
  const isOutOfStock = product.status === "out_of_stock";
  const isLowStock = product.status === "low_stock";

  return (
    <div
      className={`p-4 rounded-lg border flex items-start gap-3 ${
        isOutOfStock
          ? "bg-red-500/10 border-red-500/20"
          : "bg-yellow-500/10 border-yellow-500/20"
      }`}
    >
      {isOutOfStock ? (
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      ) : (
        <TrendingDown className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p
          className={
            isOutOfStock
              ? "text-red-200 font-medium"
              : "text-yellow-200 font-medium"
          }
        >
          {product.name}
        </p>
        <p
          className={
            isOutOfStock
              ? "text-red-100/70 text-sm"
              : "text-yellow-100/70 text-sm"
          }
        >
          {isOutOfStock
            ? `Out of stock - Reorder Level: ${product.reorderLevel} units`
            : `Low stock: ${product.quantity}/${product.reorderLevel} units`}
        </p>
      </div>
    </div>
  );
}
