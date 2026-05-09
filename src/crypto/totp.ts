import { base32Decode } from './base32';
import type { TotpAlgorithm, TotpResult } from '../types';

const ALGORITHM_MAP: Record<TotpAlgorithm, string> = {
  'SHA1': 'SHA-1',
  'SHA256': 'SHA-256',
  'SHA512': 'SHA-512',
};

export async function generateTOTP(
  secret: string,
  algorithm: TotpAlgorithm,
  digits: 6 | 8,
  period: number
): Promise<TotpResult> {
  const key = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / period);

  const counterBytes = new Uint8Array(8);
  let t = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = t & 0xff;
    t = Math.floor(t / 256);
  }

  const hashAlgorithm = ALGORITHM_MAP[algorithm] || 'SHA-1';

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'HMAC', hash: { name: hashAlgorithm } },
    false,
    ['sign']
  );

  const hmac = new Uint8Array(
    await crypto.subtle.sign('HMAC', cryptoKey, counterBytes)
  );

  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)) %
    Math.pow(10, digits);

  return {
    code: code.toString().padStart(digits, '0'),
    remaining: period - (Math.floor(Date.now() / 1000) % period),
  };
}

export function getRemainingSeconds(period: number): number {
  return period - (Math.floor(Date.now() / 1000) % period);
}
