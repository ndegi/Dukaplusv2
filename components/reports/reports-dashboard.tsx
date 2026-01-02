"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangeFilter } from "./date-range-filter";
import { ExportButton } from "./export-button";
import { AlertCircle, Search, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/hooks/use-currency";
import { EnhancedPagination } from "./enhanced-pagination";

interface User {
  id: string;
  name: string;
}

interface SalesReportItem {
  sales_invoice: string;
  warehouse: string;
  posting_date: string;
  posting_time: string;
  status: string;
  customer: string;
  location: string;
  grand_total: number;
  outstanding_amount: number;
  cost_of_goods_sold: number;
  total_amount_paid: number;
  [key: string]: any; // Allow dynamic payment mode fields
}

interface CustomerStatement {
  sales_invoice: string;
  warehouse: string;
  status: string;
  posting_date: string;
  posting_time: string;
  customer_id: string;
  customer_name: string;
  location: string;
  invoice_amount: number;
  paid_amount: number;
  outstanding_amount: number;
}

interface ItemWiseCustomerStatement {
  customer: string;
  date: string;
  warehouse: string;
  item_code: string;
  item_name: string;
  uom: string;
  quantity: number;
  selling_price: number;
  amount: number;
}

interface StockBalanceItem {
  item_code: string;
  item_name: string;
  warehouse: string;
  item_group: string;
  opening_stock: number;
  qty_in: number;
  qty_out: number;
  amount_sold: number;
  balance_stock: number;
  stock_value: number;
}

interface StockLedgerItem {
  item_code: string;
  item_name: string;
  item_group: string;
  opening_stock: number;
  qty_in: number;
  qty_out: number;
  amount_sold: number;
  balance_in_store: number;
  value_of_stock: number;
  voucher_type: string;
  voucher_no: string;
  party_type: string;
  party_name: string;
  posting_date: string;
  posting_time: string;
  modified_by: string;
}

export function ReportsDashboard({ user }: { user: User }) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  const [salesReports, setSalesReports] = useState<SalesReportItem[]>([]);
  const [customerStatements, setCustomerStatements] = useState<
    CustomerStatement[]
  >([]);
  const [itemWiseStatements, setItemWiseStatements] = useState<
    ItemWiseCustomerStatement[]
  >([]);
  const [stockBalance, setStockBalance] = useState<StockBalanceItem[]>([]);
  const [stockLedger, setStockLedger] = useState<StockLedgerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("sales");
  const [paymentModes, setPaymentModes] = useState<
    Array<{ mode_of_payment: string }>
  >([]);

  useEffect(() => {
    fetchAllReports();
    fetchPaymentModes();
  }, []);

  const fetchPaymentModes = async () => {
    try {
      const response = await fetch("/api/payments/modes");
      if (response.ok) {
        const data = await response.json();
        const modes = data.modes || data.message?.mode_of_payments || [];
        setPaymentModes(Array.isArray(modes) ? modes : []);
      }
    } catch (error) {
      console.error("[DukaPlus] Failed to fetch payment modes:", error);
    }
  };

  const fetchAllReports = async () => {
    try {
      setIsLoading(true);

      const warehouseId = sessionStorage.getItem("selected_warehouse") || "";

      if (!warehouseId) {
        setError("Please select a warehouse first");
        setIsLoading(false);
        return;
      }

      console.log(
        "[DukaPlus] Fetching all reports data with warehouse:",
        warehouseId
      );

      const [salesRes, customerRes, itemWiseRes, stockRes, ledgerRes] =
        await Promise.all([
          fetch(
            `/api/reports/sales?warehouse_id=${encodeURIComponent(warehouseId)}`
          ),
          fetch(
            `/api/reports/customer-statement?warehouse_id=${encodeURIComponent(
              warehouseId
            )}`
          ),
          fetch(
            `/api/reports/item-wise-customer-statement?warehouse_id=${encodeURIComponent(
              warehouseId
            )}`
          ),
          fetch(
            `/api/reports/stock-balance?warehouse_id=${encodeURIComponent(
              warehouseId
            )}`
          ),
          fetch(
            `/api/reports/stock-ledger?warehouse_id=${encodeURIComponent(
              warehouseId
            )}`
          ),
        ]);

      if (salesRes.ok) {
        const data = await salesRes.json();
        setSalesReports(data.sales || []);
      }

      if (customerRes.ok) {
        const data = await customerRes.json();
        setCustomerStatements(data.customers || []);
      }

      if (itemWiseRes.ok) {
        const data = await itemWiseRes.json();
        setItemWiseStatements(data.statement || []);
      }

      if (stockRes.ok) {
        const data = await stockRes.json();
        setStockBalance(data.message?.data || data.stock || []);
      }

      if (ledgerRes.ok) {
        const data = await ledgerRes.json();
        setStockLedger(data.message?.data || data.stock || []);
      }

      setError(null);
    } catch (err) {
      setError("Failed to fetch report data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (error && salesReports.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View sales performance and insights
          </p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View sales performance and insights
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            activeTab={activeTab}
            salesData={salesReports}
            customerData={customerStatements}
            itemWiseData={itemWiseStatements}
            stockData={stockBalance}
            ledgerData={stockLedger}
            dateRange={dateRange}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
          <TabsTrigger
            value="sales"
            className="text-slate-700 dark:text-slate-200 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs sm:text-sm"
          >
            Sales Report
          </TabsTrigger>
          <TabsTrigger
            value="customers"
            className="text-slate-700 dark:text-slate-200 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs sm:text-sm"
          >
            Customers
          </TabsTrigger>
          <TabsTrigger
            value="item-wise"
            className="text-slate-700 dark:text-slate-200 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs sm:text-sm"
          >
            Item Wise
          </TabsTrigger>
          <TabsTrigger
            value="stock"
            className="text-slate-700 dark:text-slate-200 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs sm:text-sm"
          >
            Stock Balance
          </TabsTrigger>
          <TabsTrigger
            value="ledger"
            className="text-slate-700 dark:text-slate-200 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs sm:text-sm"
          >
            Stock Ledger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <SalesReportTable
            data={salesReports}
            isLoading={isLoading}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            paymentModes={paymentModes}
          />
        </TabsContent>

        <TabsContent value="customers">
          <CustomerStatementTable
            data={customerStatements}
            isLoading={isLoading}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </TabsContent>

        <TabsContent value="item-wise">
          <ItemWiseCustomerStatementTable
            data={itemWiseStatements}
            isLoading={isLoading}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </TabsContent>

        <TabsContent value="stock">
          <StockBalanceTable
            data={stockBalance}
            isLoading={isLoading}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </TabsContent>

        <TabsContent value="ledger">
          <StockLedgerTable
            data={stockLedger}
            isLoading={isLoading}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SalesReportTable({
  data,
  isLoading,
  dateRange,
  onDateRangeChange,
  paymentModes,
}: {
  data: SalesReportItem[];
  isLoading: boolean;
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  paymentModes: Array<{ mode_of_payment: string }>;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;
  const { formatCurrency } = useCurrency();

  const getPaymentModeKey = (modeName: string): string => {
    return modeName.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  };

  // Get all unique payment mode fields that exist in the data
  const getAvailablePaymentModes = (): Array<{ mode: string; key: string }> => {
    const availableModes: Array<{ mode: string; key: string }> = [];
    const seenKeys = new Set<string>();

    // First, try to use payment modes from API
    if (paymentModes.length > 0) {
      paymentModes.forEach((pm) => {
        const key = getPaymentModeKey(pm.mode_of_payment);
        // Check if this key exists in any data item
        const existsInData = data.some(
          (item) => item[key] !== undefined && item[key] !== null
        );
        if (existsInData && !seenKeys.has(key)) {
          availableModes.push({ mode: pm.mode_of_payment, key });
          seenKeys.add(key);
        }
      });
    }

    // Also check for any other payment-related fields in the data that might not be in payment modes
    if (data.length > 0) {
      const sampleItem = data[0];
      Object.keys(sampleItem).forEach((key) => {
        // Skip known non-payment fields
        const nonPaymentFields = [
          "sales_invoice",
          "warehouse",
          "posting_date",
          "posting_time",
          "status",
          "customer",
          "location",
          "grand_total",
          "outstanding_amount",
          "cost_of_goods_sold",
          "total_amount_paid",
        ];
        if (
          !nonPaymentFields.includes(key) &&
          typeof sampleItem[key] === "number" &&
          !seenKeys.has(key)
        ) {
          // Convert key back to readable format
          const readableMode = key
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
          availableModes.push({ mode: readableMode, key });
          seenKeys.add(key);
        }
      });
    }

    return availableModes;
  };

  const availablePaymentModes = getAvailablePaymentModes();

  const clearFilters = () => {
    setSearchTerm("");
    onDateRangeChange({
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date(),
    });
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="text-foreground p-6 text-center">
        Loading sales report...
      </div>
    );
  }

  const filteredData = data.filter((item) => {
    const itemDate = new Date(item.posting_date);
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const dateMatch = itemDate >= fromDate && itemDate <= toDate;

    const searchMatch =
      searchTerm === "" ||
      (item.sales_invoice?.toLowerCase() ?? "").includes(
        searchTerm.toLowerCase()
      ) ||
      (item.customer?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      (item.warehouse?.toLowerCase() ?? "").includes(searchTerm.toLowerCase());

    return dateMatch && searchMatch;
  });

  const totalSales = filteredData.reduce(
    (sum, item) => sum + item.grand_total,
    0
  );
  const totalCOGS = filteredData.reduce(
    (sum, item) => sum + (item.cost_of_goods_sold || 0),
    0
  );
  const profitTotal = filteredData.reduce(
    (sum, item) => sum + (item.grand_total - item.cost_of_goods_sold),
    0
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/20 dark:border-orange-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Total Revenue
          </p>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(totalSales)}
          </p>
        </div>
        <div className="bg-indigo-500/10 dark:bg-indigo-500/10 border border-indigo-500/20 dark:border-indigo-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Cost of Goods Sold
          </p>
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {formatCurrency(totalCOGS)}
          </p>
        </div>
        <div className="bg-green-500/10 dark:bg-green-500/10 border border-green-500/20 dark:border-green-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Total Gross Profit
          </p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(profitTotal)}
          </p>
        </div>
        <div className="bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Outstanding
          </p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(
              filteredData.reduce(
                (sum, item) => sum + item.outstanding_amount,
                0
              )
            )}
          </p>
        </div>
      </div>

      <div className="px-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by invoice, customer, or warehouse..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
          />
        </div>
        <DateRangeFilter
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
        />
        {searchTerm && (
          <Button onClick={clearFilters} variant="outline" size="sm">
            Clear Filters
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Invoice
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Date
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Customer
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Warehouse
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                COG
              </th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Amount
              </th>
              {availablePaymentModes.map((pm) => (
                <th
                  key={pm.key}
                  className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold"
                >
                  {pm.mode}
                </th>
              ))}

              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr
                key={row.sales_invoice}
                className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
              >
                <td className="p-3 text-gray-900 dark:text-gray-200 font-medium">
                  {row.sales_invoice}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-400">
                  {row.posting_date}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-400">
                  {row.customer}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-400">
                  {row.warehouse}
                </td>
                <td className="p-3 text-right text-gray-600 dark:text-gray-400">
                  {formatCurrency(row.cost_of_goods_sold || 0)}
                </td>
                <td className="p-3 text-right text-orange-600 dark:text-orange-400 font-semibold">
                  {formatCurrency(row.grand_total)}
                </td>
                {availablePaymentModes.map((pm) => (
                  <td
                    key={pm.key}
                    className="p-3 text-right text-gray-600 dark:text-gray-400"
                  >
                    {formatCurrency(row[pm.key] || 0)}
                  </td>
                ))}
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${row.status === "Paid"
                      ? "bg-green-500/20 text-green-600 dark:text-green-400"
                      : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                      }`}
                  >
                    {row.status}
                  </span>
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
          totalRecords={filteredData.length}
        />
      )}
    </Card>
  );
}

function CustomerStatementTable({
  data,
  isLoading,
  dateRange,
  onDateRangeChange,
}: {
  data: CustomerStatement[];
  isLoading: boolean;
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;
  const { formatCurrency } = useCurrency();

  const handleGenerateCustomerPDF = async (
    customerId: string,
    customerName: string
  ) => {
    try {
      const res = await fetch(
        `/api/reports/unpaid-customer-statement?customer_id=${encodeURIComponent(
          customerId
        )}`
      );
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to fetch customer statement");
        return;
      }

      const statementData = data.message?.data || [];
      const logo = data.message?.logo || "";

      // Generate PDF
      generateCustomerStatementPDF(
        customerId,
        customerName,
        statementData,
        logo,
        formatCurrency
      );
    } catch (error) {
      console.error("[DukaPlus] Error generating PDF:", error);
      alert("Failed to generate PDF");
    }
  };

  const generateCustomerStatementPDF = (
    customerId: string,
    customerName: string,
    statementData: any[],
    logo: string,
    formatCurrency: (amount: number) => string
  ) => {
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Customer Statement - ${customerName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { max-width: 150px; margin-bottom: 10px; }
            .customer-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total-row { font-weight: bold; }
            .text-right { text-align: right; }
            .items-table { margin-top: 10px; }
            .items-table th { background-color: #e8e8e8; }
          </style>
        </head>
        <body>
          <div class="header">
            ${logo ? `<img src="${logo}" alt="Logo" class="logo" />` : ""}
            <h1>Customer Statement</h1>
          </div>
          <div class="customer-info">
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Customer ID:</strong> ${customerId}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Grand Total</th>
                <th>Outstanding</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${statementData
        .map(
          (item) => `
                <tr>
                  <td>${item.invoice_id || ""}</td>
                  <td>${item.date || ""}</td>
                  <td>${item.due_date || ""}</td>
                  <td class="text-right">${formatCurrency(
            item.grand_total || 0
          )}</td>
                  <td class="text-right">${formatCurrency(
            item.outstanding_amount || 0
          )}</td>
                  <td>${item.status || ""}</td>
                </tr>
                ${item.items && item.items.length > 0
              ? `
                  <tr>
                    <td colspan="6">
                      <table class="items-table">
                        <thead>
                          <tr>
                            <th>Item Code</th>
                            <th>Item Name</th>
                            <th class="text-right">Qty</th>
                            <th class="text-right">Rate</th>
                            <th class="text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${item.items
                .map(
                  (itemRow: any) => `
                            <tr>
                              <td>${itemRow.item_code || ""}</td>
                              <td>${itemRow.item_name || ""}</td>
                              <td class="text-right">${itemRow.qty || 0}</td>
                              <td class="text-right">${formatCurrency(
                    itemRow.rate || 0
                  )}</td>
                              <td class="text-right">${formatCurrency(
                    itemRow.amount || 0
                  )}</td>
                            </tr>
                          `
                )
                .join("")}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                `
              : ""
            }
              `
        )
        .join("")}
            </tbody>
          </table>
          <div style="margin-top: 20px;">
            <p><strong>Total Outstanding:</strong> ${formatCurrency(
          statementData.reduce(
            (sum, item) => sum + (item.outstanding_amount || 0),
            0
          )
        )}</p>
          </div>
        </body>
      </html>
    `;

    // Open in new tab and print
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    onDateRangeChange({
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date(),
    });
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="text-foreground p-6 text-center">
        Loading customer statements...
      </div>
    );
  }

  const filteredData = data.filter((item) => {
    const itemDate = new Date(item.posting_date);
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const dateMatch = itemDate >= fromDate && itemDate <= toDate;

    const searchMatch =
      searchTerm === "" ||
      (item.sales_invoice?.toLowerCase() ?? "").includes(
        searchTerm.toLowerCase()
      ) ||
      (item.customer_name?.toLowerCase() ?? "").includes(
        searchTerm.toLowerCase()
      ) ||
      (item.warehouse?.toLowerCase() ?? "").includes(searchTerm.toLowerCase());

    return dateMatch && searchMatch;
  });

  const totalInvoiced = filteredData.reduce(
    (sum, item) => sum + item.invoice_amount,
    0
  );
  const totalPaid = filteredData.reduce(
    (sum, item) => sum + item.paid_amount,
    0
  );
  const totalOutstanding = filteredData.reduce(
    (sum, item) => sum + item.outstanding_amount,
    0
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Total Invoiced
          </p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(totalInvoiced)}
          </p>
        </div>
        <div className="bg-green-500/10 dark:bg-green-500/10 border border-green-500/20 dark:border-green-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Paid</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="bg-red-500/10 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Outstanding
          </p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totalOutstanding)}
          </p>
        </div>
      </div>

      <div className="px-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by invoice, customer, or warehouse..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
          />
        </div>
        <DateRangeFilter
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
        />
        {searchTerm && (
          <Button onClick={clearFilters} variant="outline" size="sm">
            Clear Filters
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Invoice
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Customer
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Date
              </th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Invoiced
              </th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Paid
              </th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Outstanding
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Status
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr
                key={row.sales_invoice}
                className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
              >
                <td className="p-3 text-gray-900 dark:text-gray-200 font-medium">
                  {row.sales_invoice}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-400">
                  {row.customer_name}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-400">
                  {row.posting_date}
                </td>
                <td className="p-3 text-right text-blue-600 dark:text-blue-400 font-semibold">
                  {formatCurrency(row.invoice_amount)}
                </td>
                <td className="p-3 text-right text-green-600 dark:text-green-400 font-semibold">
                  {formatCurrency(row.paid_amount)}
                </td>
                <td className="p-3 text-right text-orange-600 dark:text-orange-400 font-semibold">
                  {formatCurrency(row.outstanding_amount)}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${row.outstanding_amount === 0
                      ? "bg-green-500/20 text-green-600 dark:text-green-400"
                      : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                      }`}
                  >
                    {row.outstanding_amount === 0 ? "Paid" : "Pending"}
                  </span>
                </td>
                <td className="p-3">
                  <Button
                    onClick={() =>
                      handleGenerateCustomerPDF(
                        row.customer_id,
                        row.customer_name
                      )
                    }
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                    title="Generate Customer Statement PDF"
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
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
          totalRecords={filteredData.length}
        />
      )}
    </Card>
  );
}

function ItemWiseCustomerStatementTable({
  data,
  isLoading,
  dateRange,
  onDateRangeChange,
}: {
  data: ItemWiseCustomerStatement[];
  isLoading: boolean;
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;
  const { formatCurrency } = useCurrency();

  const clearFilters = () => {
    setSearchTerm("");
    onDateRangeChange({
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date(),
    });
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="text-foreground p-6 text-center">
        Loading item-wise statements...
      </div>
    );
  }

  const filteredData = data.filter((item) => {
    const itemDate = new Date(item.date);
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const dateMatch = itemDate >= fromDate && itemDate <= toDate;

    const searchMatch =
      searchTerm === "" ||
      (item.customer?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      (item.item_name?.toLowerCase() ?? "").includes(
        searchTerm.toLowerCase()
      ) ||
      (item.item_code?.toLowerCase() ?? "").includes(
        searchTerm.toLowerCase()
      ) ||
      (item.warehouse?.toLowerCase() ?? "").includes(searchTerm.toLowerCase());

    return dateMatch && searchMatch;
  });

  const totalAmount = filteredData.reduce(
    (sum, row) => sum + (row.amount || 0),
    0
  );
  const totalQuantity = filteredData.reduce(
    (sum, row) => sum + (row.quantity || 0),
    0
  );
  const uniqueItems = new Set(filteredData.map((row) => row.item_code)).size;

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/20 dark:border-orange-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Total Amount
          </p>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Total Quantity
          </p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {totalQuantity.toLocaleString("en-KE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="bg-green-500/10 dark:bg-green-500/10 border border-green-500/20 dark:border-green-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Unique Items
          </p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            {uniqueItems}
          </p>
        </div>
      </div>

      <div className="px-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by customer, item, code, or warehouse..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
          />
        </div>
        <DateRangeFilter
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
        />
        {searchTerm && (
          <Button onClick={clearFilters} variant="outline" size="sm">
            Clear Filters
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Date
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Customer
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Warehouse
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Item
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Item Code
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                UOM
              </th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Quantity
              </th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Selling Price
              </th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={`${row.customer}-${row.item_code}-${idx}`}
                className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
              >
                <td className="p-3 text-gray-600 dark:text-gray-400">
                  {row.date}
                </td>
                <td className="p-3 text-gray-900 dark:text-gray-200 font-medium">
                  {row.customer}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-400">
                  {row.warehouse}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-400">
                  {row.item_name}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-400 font-mono text-xs">
                  {row.item_code}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-400">
                  {row.uom}
                </td>
                <td className="p-3 text-right text-blue-600 dark:text-blue-400 font-semibold">
                  {Number(row.quantity ?? 0).toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="p-3 text-right text-green-600 dark:text-green-400 font-semibold">
                  {formatCurrency(row.selling_price)}
                </td>
                <td className="p-3 text-right text-orange-600 dark:text-orange-400 font-semibold">
                  {formatCurrency(row.amount)}
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
          totalRecords={filteredData.length}
        />
      )}
    </Card>
  );
}

function StockBalanceTable({
  data,
  isLoading,
  dateRange,
  onDateRangeChange,
}: {
  data: StockBalanceItem[];
  isLoading: boolean;
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;
  const { formatCurrency } = useCurrency();

  if (isLoading) {
    return (
      <div className="text-foreground p-6 text-center">
        Loading stock balance...
      </div>
    );
  }

  const filteredData = data.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.item_code?.toLowerCase() ?? "").includes(searchLower) ||
      (item.item_name?.toLowerCase() ?? "").includes(searchLower) ||
      (item.warehouse?.toLowerCase() ?? "").includes(searchLower) ||
      (item.item_group?.toLowerCase() ?? "").includes(searchLower)
    );
  });

  const totalStockValue = filteredData.reduce(
    (sum, item) => sum + (item.stock_value || 0),
    0
  );
  const totalAmountSold = filteredData.reduce(
    (sum, item) => sum + (item.amount_sold || 0),
    0
  );
  const totalItems = filteredData.length;

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Total Items
          </p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {totalItems}
          </p>
        </div>
        <div className="bg-green-500/10 dark:bg-green-500/10 border border-green-500/20 dark:border-green-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Stock Value
          </p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totalStockValue)}
          </p>
        </div>
        <div className="bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/20 dark:border-orange-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Amount Sold
          </p>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(totalAmountSold)}
          </p>
        </div>
      </div>

      <div className="px-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by item code, name, group, or warehouse..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
          />
        </div>
        <DateRangeFilter
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Item Code
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Item Name
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Group
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Warehouse
              </th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Opening
              </th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Qty In
              </th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Qty Out
              </th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Balance
              </th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Stock Value
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={`${row.item_code}-${row.warehouse}-${idx}`}
                className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
              >
                <td className="p-3 text-gray-900 dark:text-gray-200 font-medium">
                  {row.item_code}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-400">
                  {row.item_name}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-400">
                  {row.item_group}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-400">
                  {row.warehouse}
                </td>
                <td className="p-3 text-right text-gray-600 dark:text-gray-400">
                  {(row.opening_stock || 0).toLocaleString("en-KE")}
                </td>
                <td className="p-3 text-right text-green-600 dark:text-green-400">
                  {(row.qty_in || 0).toLocaleString("en-KE", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </td>
                <td className="p-3 text-right text-red-600 dark:text-red-400">
                  {(row.qty_out || 0).toLocaleString("en-KE", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </td>
                <td className="p-3 text-right text-blue-600 dark:text-blue-400 font-semibold">
                  {(row.balance_stock || 0).toLocaleString("en-KE", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </td>
                <td className="p-3 text-right text-orange-600 dark:text-orange-400 font-semibold">
                  {formatCurrency(row.stock_value || 0)}
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
          totalRecords={filteredData.length}
        />
      )}
    </Card>
  );
}

function StockLedgerTable({
  data,
  isLoading,
}: {
  data: StockLedgerItem[];
  isLoading: boolean;
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedItemCode, setSelectedItemCode] = useState<string>("");
  const [apiData, setApiData] = useState<StockLedgerItem[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const itemsPerPage = 10;
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    fetchStockLedger();
  }, [selectedDate, selectedItemCode]);

  const fetchStockLedger = async () => {
    try {
      setIsLoadingApi(true);

      const warehouseId = sessionStorage.getItem("selected_warehouse") || "";

      if (!warehouseId) {
        console.error("[DukaPlus] No warehouse selected");
        setApiData([]);
        setIsLoadingApi(false);
        return;
      }

      const dateStr = `${selectedDate.getDate().toString().padStart(2, "0")}-${(
        selectedDate.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${selectedDate.getFullYear()}`;

      const url = new URL("/api/reports/stock-ledger", window.location.origin);
      url.searchParams.set("warehouse_id", warehouseId);
      url.searchParams.set("date", dateStr);

      if (selectedItemCode) {
        url.searchParams.set("item_code", selectedItemCode);
      }

      console.log("[DukaPlus] Fetching stock ledger with params:", {
        warehouseId,
        date: dateStr,
        itemCode: selectedItemCode,
      });

      const response = await fetch(url.toString());

      if (response.ok) {
        const result = await response.json();
        setApiData(result.message?.data || result.data || []);
      } else {
        console.error(
          "[DukaPlus] Failed to fetch stock ledger:",
          response.status
        );
        setApiData([]);
      }
    } catch (error) {
      console.error("[DukaPlus] Stock ledger fetch error:", error);
      setApiData([]);
    } finally {
      setIsLoadingApi(false);
    }
  };

  const dataSource = apiData.length > 0 ? apiData : data;

  if (isLoading || isLoadingApi) {
    return (
      <div className="text-foreground p-6 text-center">
        Loading stock ledger...
      </div>
    );
  }

  const uniqueItemCodes = Array.from(
    new Set(data.map((item) => item.item_code).filter(Boolean))
  ).sort();

  const filteredData = dataSource.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const searchMatch =
      searchTerm === "" ||
      (item.item_code?.toLowerCase() ?? "").includes(searchLower) ||
      (item.item_name?.toLowerCase() ?? "").includes(searchLower) ||
      (item.item_group?.toLowerCase() ?? "").includes(searchLower) ||
      (item.voucher_no?.toLowerCase() ?? "").includes(searchLower);

    return searchMatch;
  });

  const totalValue = filteredData.reduce(
    (sum, item) => sum + (item.value_of_stock || 0),
    0
  );
  const totalBalance = filteredData.reduce(
    (sum, item) => sum + (item.balance_in_store || 0),
    0
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Total Items
          </p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {filteredData.length}
          </p>
        </div>
        <div className="bg-green-500/10 dark:bg-green-500/10 border border-green-500/20 dark:border-green-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Total Balance
          </p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            {totalBalance.toLocaleString("en-KE", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </p>
        </div>
        <div className="bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/20 dark:border-orange-500/20 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Total Stock Value
          </p>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(totalValue)}
          </p>
        </div>
      </div>

      <div className="px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by item, voucher, or group..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
          />
        </div>

        <div className="flex flex-col">
          <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            Select Date
          </Label>
          <Input
            type="date"
            value={selectedDate.toISOString().split("T")[0]}
            onChange={(e) => {
              setSelectedDate(new Date(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
          />
        </div>

        <div className="flex flex-col">
          <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            Item Code (Optional)
          </Label>
          <select
            value={selectedItemCode}
            onChange={(e) => {
              setSelectedItemCode(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-gray-900 dark:text-gray-200"
          >
            <option value="">All Items</option>
            {uniqueItemCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <Button
            onClick={fetchStockLedger}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            Fetch Report
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-slate-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Item Code
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Item Name
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Voucher Type
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Voucher No
              </th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Qty In
              </th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Qty Out
              </th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Balance
              </th>
              <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Value
              </th>
              <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={`${row.voucher_no}-${idx}`}
                className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
              >
                <td className="p-3 text-gray-900 dark:text-gray-200 font-medium">
                  {row.item_code}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-400">
                  {row.item_name}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-400">
                  {row.voucher_type}
                </td>
                <td className="p-3 text-gray-900 dark:text-gray-200 font-mono">
                  {row.voucher_no}
                </td>
                <td className="p-3 text-right text-green-600 dark:text-green-400">
                  {(row.qty_in || 0).toLocaleString("en-KE", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </td>
                <td className="p-3 text-right text-red-600 dark:text-red-400">
                  {(row.qty_out || 0).toLocaleString("en-KE", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </td>
                <td className="p-3 text-right text-blue-600 dark:text-blue-400 font-semibold">
                  {(row.balance_in_store || 0).toLocaleString("en-KE", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </td>
                <td className="p-3 text-right text-orange-600 dark:text-orange-400 font-semibold">
                  {formatCurrency(row.value_of_stock || 0)}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-400 text-xs">
                  {row.posting_date}
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
          totalRecords={filteredData.length}
        />
      )}
    </Card>
  );
}
