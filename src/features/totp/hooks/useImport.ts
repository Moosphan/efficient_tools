import { useCallback } from 'react';
import jsQR from 'jsqr';
import { parseOtpauthUri, parsedToEntry } from '../crypto/otpauth';
import { sanitizeSecret, isValidBase32, isOtpauthUri } from '../utils/sanitize';
import { base32Decode } from '../crypto/base32';
import { generateId } from '../utils/id';
import type { TotpEntry } from '../types';

// Multi-strategy jsQR decode with Otsu thresholding
function tryDecode(canvas: HTMLCanvasElement): string | null {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  // Strategy 1: raw with jsQR's built-in inversion
  let code = jsQR(data, width, height, { inversionAttempts: 'attemptBoth' });
  if (code) return code.data;

  // Compute Otsu threshold
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    histogram[Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])]++;
  }
  const total = data.length / 4;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];
  let sumB = 0, wB = 0, maxVar = 0, otsuThresh = 128;
  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * histogram[t];
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const v = wB * wF * (mB - mF) ** 2;
    if (v > maxVar) { maxVar = v; otsuThresh = t; }
  }

  const binAndTry = (threshold: number, invert: boolean): string | null => {
    const processed = ctx.createImageData(width, height);
    const d = processed.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const v = invert ? (gray < threshold ? 255 : 0) : (gray > threshold ? 255 : 0);
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    const c = jsQR(d, width, height, { inversionAttempts: 'attemptBoth' });
    return c?.data ?? null;
  };

  // Strategy 2-4: Otsu / Otsu-inverted / fixed-128
  return binAndTry(otsuThresh, false) ?? binAndTry(otsuThresh, true) ?? binAndTry(128, false);
}

export function useImport() {
  const parseQrImage = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX_DIM = 2000;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          const s = MAX_DIM / Math.max(width, height);
          width = Math.round(width * s);
          height = Math.round(height * s);
        }

        // Draw original image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        // Auto-crop: find tight bounds of non-white content
        const imageData = ctx.getImageData(0, 0, width, height);
        const d = imageData.data;
        const isBg = (i: number) => d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240;
        let top = 0, bottom = height - 1, left = 0, right = width - 1;

        topScan: for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (!isBg((y * width + x) * 4)) { top = y; break topScan; }
          }
        }
        btmScan: for (let y = height - 1; y > top; y--) {
          for (let x = 0; x < width; x++) {
            if (!isBg((y * width + x) * 4)) { bottom = y; break btmScan; }
          }
        }
        lftScan: for (let x = 0; x < width; x++) {
          for (let y = top; y <= bottom; y++) {
            if (!isBg((y * width + x) * 4)) { left = x; break lftScan; }
          }
        }
        rgtScan: for (let x = width - 1; x > left; x--) {
          for (let y = top; y <= bottom; y++) {
            if (!isBg((y * width + x) * 4)) { right = x; break rgtScan; }
          }
        }

        const cropW = right - left + 1;
        const cropH = bottom - top + 1;
        const margin = Math.round(Math.max(cropW, cropH) * 0.05);

        // Upscale small images for better detection
        const MIN_DETECT = 600;
        const innerW = cropW + margin * 2;
        const innerH = cropH + margin * 2;
        const upscale = Math.max(1, Math.ceil(MIN_DETECT / Math.max(innerW, innerH)));
        const outW = innerW * upscale;
        const outH = innerH * upscale;

        const offscreen = document.createElement('canvas');
        offscreen.width = outW;
        offscreen.height = outH;
        const oCtx = offscreen.getContext('2d')!;
        oCtx.fillStyle = '#ffffff';
        oCtx.fillRect(0, 0, outW, outH);
        oCtx.imageSmoothingEnabled = false;

        const sx = Math.max(0, left - margin);
        const sy = Math.max(0, top - margin);
        const sw = Math.min(width - sx, cropW + margin * 2);
        const sh = Math.min(height - sy, cropH + margin * 2);
        oCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, outW, outH);

        // Try cropped+upscaled first, then original as fallback
        let result = tryDecode(offscreen);
        if (!result) result = tryDecode(canvas);

        URL.revokeObjectURL(url);
        if (result) {
          resolve(result);
        } else {
          reject(new Error('No QR code found in image'));
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
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
