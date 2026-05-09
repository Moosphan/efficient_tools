const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Decode(input: string): Uint8Array {
  const cleaned = input.replace(/[\s=\-]/g, '').toUpperCase();
  if (!cleaned) throw new Error('Empty Base32 input');

  let bits = '';
  for (const c of cleaned) {
    const v = BASE32_ALPHABET.indexOf(c);
    if (v === -1) throw new Error(`Invalid Base32 character: ${c}`);
    bits += v.toString(2).padStart(5, '0');
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substring(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}

export function base32Encode(bytes: Uint8Array): string {
  let bits = '';
  for (const b of bytes) {
    bits += b.toString(2).padStart(8, '0');
  }

  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5).padEnd(5, '0');
    result += BASE32_ALPHABET[parseInt(chunk, 2)];
  }

  const padding = (8 - (result.length % 8)) % 8;
  return result + '='.repeat(padding);
}

export function sanitizeSecret(input: string): string {
  return input.replace(/[\s=\-]/g, '').toUpperCase();
}
