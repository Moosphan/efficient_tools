import { useCallback } from 'react';
import jsQR from 'jsqr';
import { parseOtpauthUri, parsedToEntry } from '../crypto/otpauth';
import { sanitizeSecret, isValidBase32, isOtpauthUri } from '../utils/sanitize';
import { base32Decode } from '../crypto/base32';
import { generateId } from '../utils/id';
import type { TotpEntry } from '../types';

export function useImport() {
  const parseQrImage = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Cannot create canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            resolve(code.data);
          } else {
            reject(new Error('No QR code found in image'));
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, []);

  const parseInput = useCallback((input: string): TotpEntry => {
    const trimmed = input.trim();
    if (isOtpauthUri(trimmed)) {
      return parsedToEntry(parseOtpauthUri(trimmed));
    }

    const cleaned = sanitizeSecret(trimmed);
    if (!isValidBase32(cleaned)) {
      throw new Error('Invalid Base32 secret');
    }
    base32Decode(cleaned);

    const now = Date.now();
    return {
      id: generateId(),
      issuer: '',
      account: '',
      secret: cleaned,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      createdAt: now,
      updatedAt: now,
    };
  }, []);

  return { parseQrImage, parseInput };
}
