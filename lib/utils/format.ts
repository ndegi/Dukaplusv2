export function formatCurrency(amount: number, currency = "KES"): string {
  return `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(
  date: string | Date | number,
  options?: {
    month?: "short" | "long" | "numeric";
    day?: "numeric";
    year?: "numeric" | undefined;
    includeTime?: boolean;
  }
): string {
  if (!date && date !== 0) return "";

  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return String(date);

  const { includeTime } = options || {};

  // Default: short month and numeric day, include year
  const fmt: Intl.DateTimeFormatOptions = {
    month: options?.month || "short",
    day: options?.day || "numeric",
    year: options?.year || "numeric",
  };

  const datePart = d.toLocaleDateString("en-US", fmt);
  if (includeTime) {
    const timePart = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${datePart} ${timePart}`;
  }

  return datePart;
}
