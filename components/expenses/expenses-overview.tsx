"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { TableActionButtons } from "@/components/ui/table-action-buttons";
import { DateRangeFilter } from "@/components/reports/date-range-filter";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
  Search,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationCircle,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { useCurrency } from "@/hooks/use-currency";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface Expense {
  expense_name: string;
  expense_category: string;
  expense_amount: number;
  date: string;
  expense_description: string;
  mode_of_payment: string;
  status: number;
}

interface ExpenseCategory {
  expense_category: string;
}

interface PaymentMode {
  mode_of_payment: string;
}

export function ExpensesOverview() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submittingExpense, setSubmittingExpense] = useState<Expense | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "submitted"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const [formData, setFormData] = useState({
    expense_category: "",
    expense_amount: "",
    date: new Date().toISOString().split("T")[0],
    expense_description: "",
    mode_of_payment: "Cash",
    warehouse_id: "",
  });

  const [newCategory, setNewCategory] = useState("");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30); // Default to last 30 days
    return { from, to };
  });

  const { formatCurrency, currency } = useCurrency();

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
    fetchPaymentModes();
  }, []);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const warehouse = sessionStorage.getItem("selected_warehouse") || "";

      if (!warehouse) {
        setError("Please select a warehouse first");
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `/api/expenses/list?warehouse_id=${encodeURIComponent(warehouse)}`
      );

      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
      } else {
        setError("Failed to fetch expenses");
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      setError("An error occurred while fetching expenses");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const warehouse = sessionStorage.getItem("selected_warehouse") || "";

      if (!warehouse) return;

      const response = await fetch(
        `/api/expenses/categories?warehouse_id=${encodeURIComponent(warehouse)}`
      );

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchPaymentModes = async () => {
    try {
      const response = await fetch("/api/payments/modes");
      if (response.ok) {
        const data = await response.json();
        const modes = data.modes || [];
        setPaymentModes(Array.isArray(modes) ? modes : []);
      }
    } catch (error) {
      console.error("Failed to fetch payment modes:", error);
      // Fallback to default modes if API fails
      setPaymentModes([
        { mode_of_payment: "Cash" },
        { mode_of_payment: "Mpesa" },
        { mode_of_payment: "Card" },
        { mode_of_payment: "Paid to Till" },
      ]);
    }
  };

  const handleSaveExpense = async () => {
    if (!formData.expense_category || !formData.expense_amount) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      const endpoint = editingExpense
        ? "/api/expenses/update"
        : "/api/expenses/create";

      const warehouse = sessionStorage.getItem("selected_warehouse") || "";

      const payload = {
        warehouse_id: warehouse,
        expense_category: formData.expense_category,
        expense_amount: Number(formData.expense_amount),
        date: formData.date,
        expense_description: formData.expense_description,
        mode_of_payment: formData.mode_of_payment,
        ...(editingExpense && { expense_name: editingExpense.expense_name }),
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchExpenses();
        resetForm();
        setShowDialog(false);
      }
    } catch (error) {
      console.error("Failed to save expense:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrDeleteExpense = async () => {
    if (!deletingExpense) return;

    try {
      const response = await fetch(`/api/expenses/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expense_name: deletingExpense.expense_name }),
      });

      if (response.ok) {
        await fetchExpenses();
        setShowDeleteDialog(false);
        setDeletingExpense(null);
      }
    } catch (error) {
      console.error("Failed to cancel/delete expense:", error);
    }
  };

  const handleSubmitExpense = async () => {
    if (!submittingExpense) return;

    try {
      const response = await fetch(`/api/expenses/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expense_name: submittingExpense.expense_name,
        }),
      });

      if (response.ok) {
        await fetchExpenses();
        setShowSubmitDialog(false);
        setSubmittingExpense(null);
      }
    } catch (error) {
      console.error("Failed to submit expense:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      expense_category: "",
      expense_amount: "",
      date: new Date().toISOString().split("T")[0],
      expense_description: "",
      mode_of_payment: "Cash",
      warehouse_id: "",
    });
    setEditingExpense(null);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      expense_category: expense.expense_category,
      expense_amount: expense.expense_amount.toString(),
      date: expense.date,
      expense_description: expense.expense_description,
      mode_of_payment: expense.mode_of_payment,
      warehouse_id: "",
    });
    setShowDialog(true);
  };

  const handleCreateCategory = async () => {
    if (!newCategory) return;

    try {
      const warehouse = sessionStorage.getItem("selected_warehouse") || "";
      const response = await fetch("/api/expenses/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouse_id: warehouse,
          expense_category: newCategory,
        }),
      });

      if (response.ok) {
        await fetchCategories();
        setNewCategory("");
        setShowCategoryDialog(false);
      }
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  };

  const filteredExpenses = expenses
    .filter((expense) => {
      const matchesSearch =
        expense.expense_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.expense_category
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "draft" && expense.status === 0) ||
        (statusFilter === "submitted" && expense.status === 1);

      const matchesCategory =
        !categoryFilter ||
        categoryFilter === "all" ||
        expense.expense_category === categoryFilter;

      const expenseDate = new Date(expense.date);
      const matchesDate =
        expenseDate >= dateRange.from && expenseDate <= dateRange.to;

      return matchesSearch && matchesStatus && matchesDate && matchesCategory;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("");
    setDateRange({
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date(),
    });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);

  const totalExpenses = filteredExpenses.reduce(
    (sum, e) => sum + (Number(e.expense_amount) || 0),
    0
  );

  const renderPaginationButtons = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }

    return pages.map((page, index) => {
      if (page === "...") {
        return (
          <span
            key={`ellipsis-${index}`}
            className="px-3 py-1 text-muted-foreground"
          >
            ...
          </span>
        );
      }
      return (
        <Button
          key={page}
          onClick={() => setCurrentPage(page as number)}
          variant={currentPage === page ? "default" : "outline"}
          size="sm"
          className={currentPage === page ? "btn-warning" : ""}
        >
          {page}
        </Button>
      );
    });
  };

  return (
    <div className="space-y-4">
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={
          deletingExpense?.status === 0 ? "Delete Expense?" : "Cancel Expense?"
        }
        description={
          deletingExpense?.status === 0
            ? `This action cannot be undone. The expense ${deletingExpense?.expense_name} will be permanently deleted.`
            : `Are you sure you want to cancel expense ${deletingExpense?.expense_name}? This action cannot be undone.`
        }
        onConfirm={handleCancelOrDeleteExpense}
        variant="danger"
        confirmText={deletingExpense?.status === 0 ? "Delete" : "Cancel"}
      />

      <ConfirmationDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        title="Submit Expense?"
        description={`Are you sure you want to submit expense ${submittingExpense?.expense_name}? This action cannot be undone.`}
        onConfirm={handleSubmitExpense}
        variant="success"
        confirmText="Submit"
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-3">
          <FontAwesomeIcon
            icon={faExclamationCircle as IconProp}
            className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
          />
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex gap-2 flex-col sm:flex-row">
          <Button
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="btn-create gap-2"
          >
            <Plus className="w-4 h-4" />
            New Expense
          </Button>
          <Button
            onClick={() => setShowCategoryDialog(true)}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Category
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <Input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 input-base"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="input-base px-3 py-2"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-base px-3 py-2"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.expense_category} value={cat.expense_category}>
              {cat.expense_category}
            </option>
          ))}
        </select>
        <DateRangeFilter
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
        {(searchTerm ||
          statusFilter !== "all" ||
          dateRange.from.getTime() !==
            new Date(
              new Date().setDate(new Date().getDate() - 30)
            ).getTime()) && (
          <Button onClick={clearFilters} variant="outline" size="sm">
            Clear Filters
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
      </div>

      <Card className="card-base table-card">
        {isLoading ? (
          <div className="p-6 text-center text-foreground text-sm">
            Loading expenses...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto text-xs sm:text-sm">
              <table className="reports-table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Expense ID</th>
                    <th className="table-header-cell">Category</th>
                    <th className="table-header-cell">Amount</th>
                    <th className="table-header-cell">Date</th>
                    <th className="table-header-cell">Payment Mode</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-foreground"
                      >
                        {searchTerm || statusFilter !== "all"
                          ? "No expenses match your filters"
                          : "No expenses found. Create one to get started."}
                      </td>
                    </tr>
                  ) : (
                    paginatedExpenses.map((expense) => (
                      <tr key={expense.expense_name} className="table-row">
                        <td className="table-cell">{expense.expense_name}</td>
                        <td className="table-cell">
                          {expense.expense_category}
                        </td>
                        <td className="table-cell text-warning font-semibold">
                          {formatCurrency(expense.expense_amount)}
                        </td>
                        <td className="table-cell-secondary">{expense.date}</td>
                        <td className="table-cell-secondary">
                          {expense.mode_of_payment}
                        </td>
                        <td className="table-cell">
                          <span
                            className={
                              expense.status === 1
                                ? "badge-success"
                                : "badge-warning"
                            }
                          >
                            {expense.status === 1 ? "Submitted" : "Draft"}
                          </span>
                        </td>
                        <td className="table-cell">
                          <TableActionButtons
                            showEdit={expense.status === 0}
                            showCancel={true}
                            showSubmit={expense.status === 0}
                            onEdit={() => handleEditExpense(expense)}
                            onCancel={() => {
                              setDeletingExpense(expense);
                              setShowDeleteDialog(true);
                            }}
                            onSubmit={() => {
                              setSubmittingExpense(expense);
                              setShowSubmitDialog(true);
                            }}
                            docstatus={expense.status}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredExpenses.length)} of{" "}
                  {filteredExpenses.length} expenses
                </div>
                <div className="flex gap-1 items-center">
                  <Button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronFirst className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {renderPaginationButtons()}
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
                  <Button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLast className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="dialog-content">
          <DialogHeader>
            <DialogTitle className="dialog-title">
              {editingExpense ? "Edit Expense" : "Create New Expense"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="form-label">Category</Label>
              <Select
                value={formData.expense_category}
                onValueChange={(value) =>
                  setFormData({ ...formData, expense_category: value })
                }
              >
                <SelectTrigger className="input-base">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="dialog-content">
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat.expense_category}
                      value={cat.expense_category}
                    >
                      {cat.expense_category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="form-label">Amount ({currency.code})</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.expense_amount}
                onChange={(e) =>
                  setFormData({ ...formData, expense_amount: e.target.value })
                }
                className="input-base"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label className="form-label">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="input-base"
              />
            </div>

            <div className="space-y-2">
              <Label className="form-label">Payment Mode</Label>
              <Select
                value={formData.mode_of_payment}
                onValueChange={(value) =>
                  setFormData({ ...formData, mode_of_payment: value })
                }
              >
                <SelectTrigger className="input-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dialog-content">
                  {paymentModes.length > 0 ? (
                    paymentModes.map((mode) => (
                      <SelectItem
                        key={mode.mode_of_payment}
                        value={mode.mode_of_payment}
                      >
                        {mode.mode_of_payment}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Mpesa">M-Pesa</SelectItem>
                      <SelectItem value="Paid to Pochi">
                        Paid to Pochi
                      </SelectItem>
                      <SelectItem value="Paid to Till">Paid to Till</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="form-label">Description</Label>
              <Textarea
                value={formData.expense_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expense_description: e.target.value,
                  })
                }
                className="input-base"
                placeholder="Expense details..."
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSaveExpense}
                disabled={isLoading}
                className="flex-1 btn-success"
              >
                {isLoading
                  ? "Saving..."
                  : editingExpense
                  ? "Update Expense"
                  : "Save Expense"}
              </Button>
              <Button
                onClick={() => {
                  setShowDialog(false);
                  resetForm();
                }}
                className="flex-1 btn-cancel"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="dialog-content">
          <DialogHeader>
            <DialogTitle className="dialog-title">
              Create New Category
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="form-label">Category Name</Label>
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="input-base"
                placeholder="e.g., Transport, Utilities"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateCategory}
                className="flex-1 btn-success"
              >
                Create Category
              </Button>
              <Button
                onClick={() => setShowCategoryDialog(false)}
                className="flex-1 btn-cancel"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
