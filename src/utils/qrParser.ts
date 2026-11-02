/**
 * Helper to extract an account number from arbitrary QR code payloads.
 * Supports:
 * - Direct account number: "SB100003", "CA100002"
 * - UPI payload: "upi://pay?pa=SB100003@primebank&pn=Rahul..." or "upi://pay?pa=SB100003..."
 * - JSON payload: '{"accountNumber":"SB100003","name":"Rahul"}'
 * - URL format: "https://primebank.example/pay/SB100003"
 * - Key-value pair text: "acc=SB100003" or "account: SB100003"
 */
export function extractAccountNumberFromQR(payload: string): string | null {
  if (!payload || typeof payload !== 'string') return null;

  const trimmed = payload.trim();
  if (!trimmed) return null;

  // 1. Check for JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.accountNumber && typeof parsed.accountNumber === 'string') {
        return parsed.accountNumber.trim().toUpperCase();
      }
      if (parsed.acc && typeof parsed.acc === 'string') {
        return parsed.acc.trim().toUpperCase();
      }
    } catch (_) {}
  }

  // 2. Check for standard Indian banking UPI URI format: upi://pay?...
  if (trimmed.toLowerCase().startsWith('upi://pay')) {
    try {
      const url = new URL(trimmed.replace('upi://pay', 'http://upi.placeholder'));
      const pa = url.searchParams.get('pa');
      if (pa) {
        // e.g. "SB100003@primebank" -> "SB100003"
        const prefix = pa.split('@')[0].trim().toUpperCase();
        if (prefix) return prefix;
      }
    } catch (_) {
      const match = trimmed.match(/[?&]pa=([^&@]+)/i);
      if (match && match[1]) {
        return match[1].trim().toUpperCase();
      }
    }
  }

  // 3. Check for URL path parameter: .../pay/SB100003
  const urlMatch = trimmed.match(/\/pay\/([A-Za-z0-9]+)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].trim().toUpperCase();
  }

  // 4. Check for key-value pair format: "acc=SB100003" or "account: SB100003"
  const kvMatch = trimmed.match(/(?:acc(?:ount)?|to)\s*[:=]\s*([A-Za-z0-9]+)/i);
  if (kvMatch && kvMatch[1]) {
    return kvMatch[1].trim().toUpperCase();
  }

  // 5. Check for standard PrimeBank account number pattern (e.g., SB100001, CA100002)
  const directMatch = trimmed.match(/\b(SB\d+|CA\d+)\b/i);
  if (directMatch && directMatch[1]) {
    return directMatch[1].toUpperCase();
  }

  // 6. Direct alphanumeric token check (e.g. "SB100003" or alphanumeric account ID)
  if (/^[A-Za-z0-9]{4,18}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return null;
}
