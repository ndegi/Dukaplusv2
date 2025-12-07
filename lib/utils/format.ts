// export function formatCurrency(amount: number, currency = ""): string {
//   return `${currency} ${amount.toLocaleString("en-US", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })}`
// }

// export function formatNumber(amount: number): string {
//   return amount.toLocaleString("en-US", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })
// }

// export function formatDate(dateString: string): string {
//   try {
//     const date = new Date(dateString)
//     if (isNaN(date.getTime())) {
//       return dateString
//     }
//     return date.toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//     })
//   } catch {
//     return dateString
//   }
// }
