/**
 * Format a phone number string for display as the user types.
 * Expects US phone numbers (10 digits).
 */
export function formatPhoneInput(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  const limited = cleaned.slice(0, 10);

  if (limited.length >= 7) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  } else if (limited.length >= 4) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  } else if (limited.length > 0) {
    return `(${limited}`;
  }
  return "";
}

/**
 * Convert a formatted phone number to E.164 format for storage.
 */
export function cleanPhoneNumber(formatted: string): string {
  return "+1" + formatted.replace(/\D/g, "");
}

/**
 * Validate that a phone string contains exactly 10 digits.
 */
export function isValidUSPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10;
}
