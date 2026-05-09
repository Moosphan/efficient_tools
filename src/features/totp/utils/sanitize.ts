export function sanitizeSecret(input: string): string {
  return sanitizeBase32(input);
}

export function sanitizeBase32(input: string): string {
  return input.replace(/[\s=\-]/g, '').toUpperCase();
}

export function isValidBase32(input: string): boolean {
  const cleaned = sanitizeBase32(input);
  if (!cleaned) return false;
  return /^[A-Z2-7]+$/.test(cleaned);
}

export function isOtpauthUri(input: string): boolean {
  return input.trim().toLowerCase().startsWith('otpauth://');
}
