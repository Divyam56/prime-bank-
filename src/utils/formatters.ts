/**
 * PrimeBank - Formatting Utilities
 * 
 * Consistent locale formatting for Indian Rupee (INR), dates, and account masking.
 */

/**
 * Formats a number to Indian Rupee (INR) currency representation.
 * Example: 125000.5 -> "₹1,25,000.50"
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Masks an account number for security, showing only the first 2 and last 4 digits.
 * Example: "SB100001" -> "SB••0001"
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber || accountNumber.length < 6) {
    return accountNumber;
  }
  const prefix = accountNumber.slice(0, 2);
  const suffix = accountNumber.slice(-4);
  return `${prefix}••${suffix}`;
}

/**
 * Formats an ISO or standard date string to readable human format.
 * Example: "2026-10-06" -> "06 Oct 2026"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}
