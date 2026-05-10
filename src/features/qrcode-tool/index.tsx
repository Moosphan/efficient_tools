import { useState, useRef, useEffect, useCallback } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

// ── Types ──

type DotStyle = 'square' | 'rounded' | 'circle';
type CornerStyle = 'square' | 'rounded' | 'circle';
type ErrorLevel = 'L' | 'M' | 'Q' | 'H';
type TabMode = 'generate' | 'parse';

interface Theme {
  id: string;
  nameKey: string;
  fg: string;
  bg: string;
  fg2?: string;
  dotStyle: DotStyle;
  cornerStyle: CornerStyle;
  isGradient?: boolean;
  glow?: boolean;
}

// ── Preset themes ──

const THEMES: Theme[] = [
  { id: 'classic', nameKey: 'themeClassic', fg: '#000000', bg: '#ffffff', dotStyle: 'square', cornerStyle: 'square' },
  { id: 'dark', nameKey: 'themeDark', fg: '#ffffff', bg: '#1a1a2e', dotStyle: 'square', cornerStyle: 'square' },
  { id: 'ocean', nameKey: 'themeOcean', fg: '#0c3483', fg2: '#6b8cce', bg: '#ffffff', dotStyle: 'rounded', cornerStyle: 'rounded', isGradient: true },
  { id: 'forest', nameKey: 'themeForest', fg: '#134e4a', fg2: '#2dd4bf', bg: '#f0fdf4', dotStyle: 'circle', cornerStyle: 'circle', isGradient: true },
  { id: 'sunset', nameKey: 'themeSunset', fg: '#ea580c', fg2: '#fbbf24', bg: '#fffbeb', dotStyle: 'rounded', cornerStyle: 'rounded', isGradient: true },
  { id: 'neon', nameKey: 'themeNeon', fg: '#00f5ff', fg2: '#ff00ff', bg: '#0a0a0a', dotStyle: 'rounded', cornerStyle: 'square', isGradient: true, glow: true },
  { id: 'vintage', nameKey: 'themeVintage', fg: '#78350f', bg: '#fef3c7', dotStyle: 'square', cornerStyle: 'rounded' },
  { id: 'purple', nameKey: 'themePurple', fg: '#4c1d95', fg2: '#a78bfa', bg: '#f5f3ff', dotStyle: 'circle', cornerStyle: 'rounded', isGradient: true },
];

// ── Helpers ──

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
}

function isEye(moduleCount: number, row: number, col: number): boolean {
  // Top-left eye
  if (row < 7 && col < 7) return true;
  // Top-right eye
  if (row < 7 && col >= moduleCount - 7) return true;
  // Bottom-left eye
  if (row >= moduleCount - 7 && col < 7) return true;
  return false;
}

function resolveColor(theme: Theme, ratio: number): string {
  if (!theme.isGradient || !theme.fg2) return theme.fg;
  // Simple linear interpolation between fg and fg2
  const r1 = parseInt(theme.fg.slice(1, 3), 16);
  const g1 = parseInt(theme.fg.slice(3, 5), 16);
  const b1 = parseInt(theme.fg.slice(5, 7), 16);
  const r2 = parseInt(theme.fg2.slice(1, 3), 16);
  const g2 = parseInt(theme.fg2.slice(3, 5), 16);
  const b2 = parseInt(theme.fg2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  return `rgb(${r},${g},${b})`;
}

// ── Generate QR data matrix ──

async function getQRMatrix(
  text: string,
  errorLevel: ErrorLevel,
): Promise<{ modules: (0 | 1)[][]; moduleCount: number } | null> {
  try {
    const code = QRCode.create(text, { errorCorrectionLevel: errorLevel });
    const size = code.modules.size;
    const data = code.modules.data;
    // Build 2D array from flat Uint8Array
    const modules: (0 | 1)[][] = [];
    for (let row = 0; row < size; row++) {
      const rowData: (0 | 1)[] = [];
      for (let col = 0; col < size; col++) {
        rowData.push(data[row * size + col] ? 1 : 0);
      }
      modules.push(rowData);
    }
    return { modules, moduleCount: size };
  } catch {
    return null;
  }
}

// ── Render QR to canvas ──

function renderQR(
  canvas: HTMLCanvasElement,
  modules: (0 | 1)[][],
  moduleCount: number,
  theme: Theme,
  size: number,
  logo?: HTMLImageElement | null,
  logoPct?: number,
) {
  const ctx = canvas.getContext('2d')!;
  const dpr = window.devicePixelRatio || 1;
  const moduleSize = size / moduleCount;
  const padding = moduleSize * 4;
  const totalSize = size + padding * 2;

  // Set canvas dimensions once (resets all state, including transforms)
  canvas.width = totalSize * dpr;
  canvas.height = totalSize * dpr;
  ctx.scale(dpr, dpr);

  // Background
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, totalSize, totalSize);

  // Glow effect (subtle, so module edges stay crisp)
  if (theme.glow) {
    ctx.shadowColor = theme.fg;
    ctx.shadowBlur = moduleSize * 0.5;
  }

  // Draw modules — keep shapes close to standard for scan reliability
  // Data modules: tight layout with subtle rounding
  const dataGap = moduleSize * 0.02; // tiny gap for anti-aliasing only
  const dataRadius = theme.dotStyle === 'circle' ? moduleSize * 0.4
    : theme.dotStyle === 'rounded' ? moduleSize * 0.18
    : 0;

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!modules[row]?.[col]) continue;

      const x = padding + col * moduleSize;
      const y = padding + row * moduleSize;
      const isEyeModule = isEye(moduleCount, row, col);

      const gradientRatio = (col + row) / (moduleCount * 2);
      ctx.fillStyle = resolveColor(theme, gradientRatio);

      if (isEyeModule) {
        // Eye/finder patterns: always square for maximum detection reliability
        ctx.fillRect(x, y, moduleSize, moduleSize);
      } else if (dataRadius > 0) {
        drawRoundedRect(ctx, x + dataGap, y + dataGap, moduleSize - dataGap * 2, moduleSize - dataGap * 2, dataRadius);
      } else {
        ctx.fillRect(x + dataGap, y + dataGap, moduleSize - dataGap * 2, moduleSize - dataGap * 2);
      }
    }
  }

  // Reset shadow
  ctx.shadowBlur = 0;

  // Draw logo in center if provided
  if (logo) {
    const pct = (logoPct ?? 14) / 100;
    const logoPx = size * pct;
    const logoX = padding + (size - logoPx) / 2;
    const logoY = padding + (size - logoPx) / 2;

    // Clear area behind logo (slightly larger than logo itself)
    ctx.fillStyle = theme.bg;
    const clearPad = moduleSize * 1.5;
    const clearSize = logoPx + clearPad * 2;
    const clearX = padding + (size - clearSize) / 2;
    const clearY = padding + (size - clearSize) / 2;
    drawRoundedRect(ctx, clearX, clearY, clearSize, clearSize, moduleSize * 2);

    // Draw logo with rounded corners
    ctx.save();
    ctx.beginPath();
    drawRoundedRect(ctx, logoX, logoY, logoPx, logoPx, moduleSize);
    ctx.clip();
    ctx.drawImage(logo, logoX, logoY, logoPx, logoPx);
    ctx.restore();
  }
}

// ── Component ──

export default function QrcodeTool() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('qrcode');

  // Generate state
  const [tab, setTab] = useState<TabMode>('generate');
  const [input, setInput] = useState('');
  const [inputMode, setInputMode] = useState('text');
  const [themeId, setThemeId] = useState('classic');
  const [size, setSize] = useState(300);
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>('M');
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(14); // % of QR area, 14% is safe for Q-level
  const [matrix, setMatrix] = useState<{ modules: (0 | 1)[][]; moduleCount: number } | null>(null);

  // Parse state
  const [parseResult, setParseResult] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parseCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const theme = THEMES.find((th) => th.id === themeId) ?? THEMES[0];

  // ── Generate QR matrix when input changes ──

  useEffect(() => {
    const text = input.trim();
    if (!text) {
      setMatrix(null);
      return;
    }
    let abort = false;
    getQRMatrix(text, errorLevel).then((m) => {
      if (!abort) setMatrix(m);
    });
    return () => { abort = true; };
  }, [input, errorLevel]);

  // ── Render canvas ──

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matrix) return;
    renderQR(canvas, matrix.modules, matrix.moduleCount, theme, size, logo, logoSize);
  }, [matrix, theme, size, logo, logoSize]);

  // ── Handle logo upload ──

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setLogo(img);
      setLogoUrl(url);
      // Auto-bump to Q so the logo doesn't break scannability
      setErrorLevel((prev) => (prev === 'L' || prev === 'M' ? 'Q' : prev));
    };
    img.src = url;
  }, []);

  const removeLogo = useCallback(() => {
    setLogo(null);
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [logoUrl]);

  // ── Download ──

  const downloadPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const downloadSVG = useCallback(async () => {
    if (!input.trim()) return;
    try {
      const svg = await QRCode.toString(input.trim(), {
        type: 'svg',
        errorCorrectionLevel: errorLevel,
        color: { dark: theme.fg, light: theme.bg },
      });
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'qrcode.svg';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  }, [input, errorLevel, theme]);

  // ── Parse ──

  // Self-parse: re-encode matrix as a clean black-on-white QR image, then decode
  const selfParse = useCallback(() => {
    if (!matrix) return;
    const { modules, moduleCount } = matrix;
    // Build a clean standard QR image (no styling, no padding)
    const quiet = 4; // standard quiet zone
    const scale = 8; // px per module for accurate detection
    const dim = (moduleCount + quiet * 2) * scale;
    const offscreen = document.createElement('canvas');
    offscreen.width = dim;
    offscreen.height = dim;
    const ctx = offscreen.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, dim, dim);
    ctx.fillStyle = '#000000';
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (modules[r][c]) {
          ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
        }
      }
    }
    const imageData = ctx.getImageData(0, 0, dim, dim);
    const code = jsQR(imageData.data, dim, dim, {
      inversionAttempts: 'attemptBoth',
    });
    if (code) {
      setParseResult(code.data);
      setParseError(null);
      setTab('parse');
    } else {
      setParseResult(null);
      setParseError(ui.selfCheckFail || '自检失败：无法解码矩阵数据');
      setTab('parse');
    }
  }, [matrix, ui.selfCheckFail]);

  // Attempt jsQR decode with multiple preprocessing strategies
  const tryDecode = useCallback((canvas: HTMLCanvasElement): string | null => {
    const { width, height } = canvas;
    const ctx = canvas.getContext('2d')!;
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

    // Helper: binarize and try
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
  }, []);

  const handleParseImage = useCallback((file: File) => {
    setParseResult(null);
    setParseError(null);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const parseCanvas = parseCanvasRef.current;
      if (!parseCanvas) return;

      // Step 1: draw original image (cap at 2000px)
      const MAX_DIM = 2000;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const s = MAX_DIM / Math.max(width, height);
        width = Math.round(width * s);
        height = Math.round(height * s);
      }
      parseCanvas.width = width;
      parseCanvas.height = height;
      const pCtx = parseCanvas.getContext('2d')!;
      pCtx.drawImage(img, 0, 0, width, height);

      // Step 2: auto-crop — find tight bounds of non-white content
      const imageData = pCtx.getImageData(0, 0, width, height);
      const d = imageData.data;
      const isBg = (i: number) => d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240;
      let top = 0, bottom = height - 1, left = 0, right = width - 1;
      // scan from top
      topScan: for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (!isBg((y * width + x) * 4)) { top = y; break topScan; }
        }
      }
      // scan from bottom
      btmScan: for (let y = height - 1; y > top; y--) {
        for (let x = 0; x < width; x++) {
          if (!isBg((y * width + x) * 4)) { bottom = y; break btmScan; }
        }
      }
      // scan from left
      lftScan: for (let x = 0; x < width; x++) {
        for (let y = top; y <= bottom; y++) {
          if (!isBg((y * width + x) * 4)) { left = x; break lftScan; }
        }
      }
      // scan from right
      rgtScan: for (let x = width - 1; x > left; x--) {
        for (let y = top; y <= bottom; y++) {
          if (!isBg((y * width + x) * 4)) { right = x; break rgtScan; }
        }
      }

      const cropW = right - left + 1;
      const cropH = bottom - top + 1;
      // Add a small quiet zone (~5% of QR dimension)
      const margin = Math.round(Math.max(cropW, cropH) * 0.05);

      // Step 3: if cropped area is small, upscale for better detection (jsQR needs ~6-8px/module)
      const MIN_DETECT = 600;
      const innerW = cropW + margin * 2;
      const innerH = cropH + margin * 2;
      const upscale = Math.max(1, Math.ceil(MIN_DETECT / Math.max(innerW, innerH)));

      const outW = innerW * upscale;
      const outH = innerH * upscale;

      // Step 4: draw cropped+upscaled image to a fresh canvas
      const offscreen = document.createElement('canvas');
      offscreen.width = outW;
      offscreen.height = outH;
      const oCtx = offscreen.getContext('2d')!;
      oCtx.fillStyle = '#ffffff';
      oCtx.fillRect(0, 0, outW, outH);
      oCtx.imageSmoothingEnabled = false; // preserve sharp edges for QR modules

      // Clamp source rect to image bounds
      const sx = Math.max(0, left - margin);
      const sy = Math.max(0, top - margin);
      const sw = Math.min(width - sx, cropW + margin * 2);
      const sh = Math.min(height - sy, cropH + margin * 2);
      oCtx.drawImage(parseCanvas, sx, sy, sw, sh, 0, 0, outW, outH);

      // Step 5: try decode on cropped+upscaled image
      let result = tryDecode(offscreen);

      // Step 6: also try original full image as fallback
      if (!result) {
        result = tryDecode(parseCanvas);
      }

      if (result) {
        setParseResult(result);
      } else {
        setParseError(ui.noQr || '未检测到二维码，请确保图片清晰、二维码完整可见。');
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setParseError(ui.imageLoadFail || '图片加载失败');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [tryDecode, ui.noQr, ui.imageLoadFail]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) handleParseImage(file);
        break;
      }
    }
  }, [handleParseImage]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleParseImage(file);
  }, [handleParseImage]);

  // Input presets
  const presets: Record<string, { label: string; template: string; placeholder: string }> = {
    text: { label: ui.text || '文本', template: '', placeholder: ui.inputPlaceholder || '输入内容…' },
    url: { label: ui.url || '网址', template: 'https://', placeholder: 'https://example.com' },
    email: { label: ui.email || '邮箱', template: 'mailto:', placeholder: 'user@example.com' },
    phone: { label: ui.phone || '电话', template: 'tel:', placeholder: '+86 13800000000' },
    wifi: { label: ui.wifi || 'WiFi', template: 'WIFI:S:MyWiFi;T:WPA;P:12345678;;', placeholder: 'WIFI:S:SSID;T:WPA;P:password;;' },
  };

  const handleModeSwitch = (mode: string) => {
    setInputMode(mode);
    // Pre-fill template if the current input is empty or already matches another template
    const currentIsTemplate = Object.values(presets).some(
      (p) => p.template && input === p.template
    );
    if (!input.trim() || currentIsTemplate) {
      setInput(presets[mode].template);
    }
  };

  // WiFi form state
  const [wifiSsid, setWifiSsid] = useState('MyWiFi');
  const [wifiSecurity, setWifiSecurity] = useState('WPA');
  const [wifiPassword, setWifiPassword] = useState('12345678');
  const [wifiHidden, setWifiHidden] = useState(false);

  const updateWifiString = useCallback((ssid: string, security: string, password: string, hidden: boolean) => {
    const s = ssid.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');
    const p = password.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');
    let wifiStr = `WIFI:S:${s};T:${security};P:${p};;`;
    if (hidden) wifiStr = `WIFI:S:${s};T:${security};P:${p};H:true;;`;
    setInput(wifiStr);
  }, []);

  const handleWifiChange = (field: 'ssid' | 'security' | 'password' | 'hidden', value: string | boolean) => {
    const ssid = field === 'ssid' ? value as string : wifiSsid;
    const security = field === 'security' ? value as string : wifiSecurity;
    const password = field === 'password' ? value as string : wifiPassword;
    const hidden = field === 'hidden' ? value as boolean : wifiHidden;
    setWifiSsid(ssid);
    setWifiSecurity(security);
    setWifiPassword(password);
    setWifiHidden(hidden);
    updateWifiString(ssid, security, password, hidden);
  };

  // Error level titles (i18n-aware)
  const errorLevelTitles: Record<ErrorLevel, string> = {
    L: ui.elLow || '低 (~7%)',
    M: ui.elMed || '中 (~15%)',
    Q: ui.elQuart || '较高 (~25%)',
    H: ui.elHigh || '高 (~30%)',
  };

  return (
    <ToolShell title={name} description={desc}>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--surface)', borderRadius: 8, padding: 4, width: 'fit-content' }}>
        <button
          className={`panel-btn${tab === 'generate' ? ' accent' : ''}`}
          onClick={() => setTab('generate')}
        >{ui.generate || '生成'}</button>
        <button
          className={`panel-btn${tab === 'parse' ? ' accent' : ''}`}
          onClick={() => setTab('parse')}
        >{ui.parse || '解析'}</button>
      </div>

      {tab === 'generate' ? (
        <div className="tool-layout">
          {/* Left: Config */}
          <div className="tool-panel">
            <div className="panel-header">{ui.config || t('common.settings')}</div>

            {/* Input mode selector */}
            <div className="qr-config-section">
              <label className="qr-label">{ui.inputType || '内容类型'}</label>
              <div className="panel-actions" style={{ flexWrap: 'wrap' }}>
                {Object.entries(presets).map(([key, preset]) => (
                  <button
                    key={key}
                    className={`panel-btn panel-btn-sm${inputMode === key ? ' accent' : ''}`}
                    onClick={() => handleModeSwitch(key)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* WiFi form */}
            {inputMode === 'wifi' && (
              <div className="qr-config-section">
                <div className="qr-wifi-form">
                  <div className="qr-wifi-row">
                    <label>{ui.ssid || '网络名 (SSID)'}</label>
                    <input
                      className="input-field"
                      value={wifiSsid}
                      onChange={(e) => handleWifiChange('ssid', e.target.value)}
                      placeholder={ui.wifiName || 'WiFi 名称'}
                    />
                  </div>
                  <div className="qr-wifi-row">
                    <label>{ui.security || '加密方式'}</label>
                    <select
                      value={wifiSecurity}
                      onChange={(e) => handleWifiChange('security', e.target.value)}
                      className="panel-btn"
                    >
                      <option value="WPA">{ui.wpa || 'WPA/WPA2'}</option>
                      <option value="WEP">{ui.wep || 'WEP'}</option>
                      <option value="nopass">{ui.noPassword || '无密码'}</option>
                    </select>
                  </div>
                  <div className="qr-wifi-row">
                    <label>{ui.password || '密码'}</label>
                    <input
                      className="input-field"
                      value={wifiPassword}
                      onChange={(e) => handleWifiChange('password', e.target.value)}
                      placeholder={wifiSecurity === 'nopass' ? (ui.noPwdPlaceholder || '无需密码') : (ui.wifiPasswordPlaceholder || 'WiFi 密码')}
                      disabled={wifiSecurity === 'nopass'}
                    />
                  </div>
                  <div className="qr-wifi-row">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={wifiHidden}
                        onChange={(e) => handleWifiChange('hidden', e.target.checked)}
                      />
                      {ui.hidden || '隐藏网络'}
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Text input */}
            <div className="qr-config-section">
              <textarea
                className="input-field qr-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={presets[inputMode]?.placeholder ?? (ui.inputPlaceholder || '输入内容…')}
                rows={3}
              />
            </div>

            {/* Theme selector */}
            <div className="qr-config-section">
              <label className="qr-label">{ui.theme || '主题样式'}</label>
              <div className="qr-theme-grid">
                {THEMES.map((th) => (
                  <button
                    key={th.id}
                    className={`qr-theme-btn${themeId === th.id ? ' active' : ''}`}
                    onClick={() => setThemeId(th.id)}
                    title={ui[th.nameKey] || th.nameKey}
                  >
                    <span
                      className="qr-theme-swatch"
                      style={{
                        background: th.isGradient && th.fg2
                          ? `linear-gradient(135deg, ${th.fg}, ${th.fg2})`
                          : th.fg,
                        borderColor: th.bg,
                      }}
                    />
                    <span className="qr-theme-name">{ui[th.nameKey] || th.nameKey}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size slider */}
            <div className="qr-config-section">
              <label className="qr-label">{ui.size || '尺寸'}: {size}px</label>
              <input
                type="range"
                min={150}
                max={600}
                step={10}
                value={size}
                onChange={(e) => setSize(parseInt(e.target.value))}
                className="qr-slider"
              />
            </div>

            {/* Error correction */}
            <div className="qr-config-section">
              <label className="qr-label">{ui.errorLevel || '纠错级别'}</label>
              <div className="panel-actions">
                {(['L', 'M', 'Q', 'H'] as ErrorLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    className={`panel-btn panel-btn-sm${errorLevel === lvl ? ' accent' : ''}`}
                    onClick={() => setErrorLevel(lvl)}
                    title={errorLevelTitles[lvl]}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Logo upload */}
            <div className="qr-config-section">
              <label className="qr-label">{ui.logo || '中心 Logo'}</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                  id="qr-logo-upload"
                />
                <button className="panel-btn" onClick={() => fileInputRef.current?.click()}>
                  {ui.uploadLogo || '上传图片'}
                </button>
                {logo && (
                  <button className="panel-btn" onClick={removeLogo} style={{ color: 'var(--red)' }}>
                    {ui.removeLogo || '移除'}
                  </button>
                )}
              </div>
              {logo && (
                <div style={{ marginTop: 8 }}>
                  <label className="qr-label">{ui.logoSize || 'Logo 大小'}: {logoSize}%</label>
                  <input
                    type="range"
                    min={8}
                    max={18}
                    step={1}
                    value={logoSize}
                    onChange={(e) => setLogoSize(parseInt(e.target.value))}
                    className="qr-slider"
                  />
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    {ui.logoSizeTip || '≤12% 安全 · 12~18% 建议配合 Q/H 纠错'}
                  </div>
                </div>
              )}
            </div>

            {/* Download buttons */}
            <div className="qr-config-section">
              <label className="qr-label">{ui.export || '导出'}</label>
              <div className="panel-actions">
                <button className="panel-btn accent" onClick={downloadPNG} disabled={!matrix}>
                  {ui.downloadPng || '下载 PNG'}
                </button>
                <button className="panel-btn" onClick={downloadSVG} disabled={!input.trim()}>
                  {ui.downloadSvg || '下载 SVG'}
                </button>
                <button className="panel-btn" onClick={selfParse} disabled={!matrix} style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                  {ui.selfCheck || '自检'} →
                </button>
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="tool-panel">
            <div className="panel-header">{ui.preview || t('common.preview')}</div>
            <div className="qr-preview">
              {matrix ? (
                <canvas ref={canvasRef} className="qr-canvas" />
              ) : (
                <div className="qr-placeholder">
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                    {/* Background frame */}
                    <rect x="1" y="1" width="118" height="118" rx="12" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="4 3" />
                    {/* Top-left finder pattern */}
                    <rect x="16" y="16" width="28" height="28" rx="4" stroke="var(--muted)" strokeWidth="2.5" opacity="0.6" />
                    <rect x="24" y="24" width="12" height="12" rx="2" fill="var(--muted)" opacity="0.35" />
                    {/* Top-right finder pattern */}
                    <rect x="76" y="16" width="28" height="28" rx="4" stroke="var(--muted)" strokeWidth="2.5" opacity="0.6" />
                    <rect x="84" y="24" width="12" height="12" rx="2" fill="var(--muted)" opacity="0.35" />
                    {/* Bottom-left finder pattern */}
                    <rect x="16" y="76" width="28" height="28" rx="4" stroke="var(--muted)" strokeWidth="2.5" opacity="0.6" />
                    <rect x="24" y="84" width="12" height="12" rx="2" fill="var(--muted)" opacity="0.35" />
                    {/* Data modules — scattered small squares */}
                    <rect x="52" y="18" width="8" height="8" rx="1.5" fill="var(--muted)" opacity="0.18" />
                    <rect x="52" y="32" width="8" height="8" rx="1.5" fill="var(--muted)" opacity="0.25" />
                    <rect x="18" y="52" width="8" height="8" rx="1.5" fill="var(--muted)" opacity="0.2" />
                    <rect x="32" y="52" width="8" height="8" rx="1.5" fill="var(--muted)" opacity="0.15" />
                    <rect x="52" y="52" width="8" height="8" rx="1.5" fill="var(--muted)" opacity="0.22" />
                    <rect x="66" y="52" width="8" height="8" rx="1.5" fill="var(--muted)" opacity="0.18" />
                    <rect x="80" y="52" width="8" height="8" rx="1.5" fill="var(--muted)" opacity="0.25" />
                    <rect x="94" y="52" width="8" height="8" rx="1.5" fill="var(--muted)" opacity="0.15" />
                    <rect x="52" y="66" width="8" height="8" rx="1.5" fill="var(--muted)" opacity="0.2" />
                    <rect x="66" y="66" width="8" height="8" rx="1.5" fill="var(--muted)" opacity="0.15" />
                    <rect x="80" y="80" width="8" height="8" rx="1.5" fill="var(--muted)" opacity="0.2" />
                    <rect x="94" y="80" width="8" height="8" rx="1.5" fill="var(--muted)" opacity="0.25" />
                    <rect x="52" y="94" width="8" height="8" rx="1.5" fill="var(--muted)" opacity="0.18" />
                    <rect x="80" y="94" width="8" height="8" rx="1.5" fill="var(--muted)" opacity="0.15" />
                  </svg>
                  <p style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>{ui.generatePlaceholder || '输入内容后自动生成二维码'}</p>
                  <p style={{ fontSize: 12 }}>{ui.generateHint || '支持文本、网址、WiFi、邮箱等多种格式'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Parse tab */
        <div className="tool-layout">
          <div className="tool-panel">
            <div className="panel-header">{ui.parseUploadTitle || '上传二维码图片'}</div>
            <div
              className="qr-dropzone"
              onPaste={handlePaste}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleParseImage(file);
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                style={{ display: 'none' }}
                id="qr-parse-upload"
              />
              <label htmlFor="qr-parse-upload" className="qr-dropzone-label">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                <span>{ui.dropzone || '点击上传或拖拽图片到此处'}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{ui.pasteHint || '也支持 Ctrl+V 粘贴剪贴板中的截图'}</span>
              </label>
            </div>
          </div>
          <div className="tool-panel">
            <div className="panel-header">{ui.parseResult || '解析结果'}</div>
            <div className="qr-parse-result">
              {parseResult ? (
                <>
                  <div className="qr-result-text">{parseResult}</div>
                  <button
                    className="panel-btn accent"
                    onClick={() => navigator.clipboard.writeText(parseResult)}
                    style={{ marginTop: 12 }}
                  >
                    {ui.copyResult || '复制结果'}
                  </button>
                  {/^https?:\/\//.test(parseResult) && (
                    <button
                      className="panel-btn"
                      onClick={() => window.open(parseResult, '_blank')}
                      style={{ marginTop: 8, marginLeft: 8 }}
                    >
                      {ui.openLink || '打开链接'} →
                    </button>
                  )}
                </>
              ) : parseError ? (
                <div style={{ color: 'var(--red)', fontSize: 14 }}>{parseError}</div>
              ) : (
                <div className="qr-placeholder" style={{ padding: 32 }}>
                  <p>{ui.dropzone || '上传或粘贴二维码图片进行解析'}</p>
                </div>
              )}
            </div>
          </div>
          <canvas ref={parseCanvasRef} style={{ display: 'none' }} />
        </div>
      )}
      {/* Usage guide */}
      <HelpSection title={ui.helpTitle || (help?.title) || t('common.usage')}>
        <div className="qr-help-card">
          <h4>{ui.helpLevel || '纠错级别'}</h4>
          <table className="qr-help-table">
            <thead>
              <tr>
                <th>{ui.helpLevelCol1 || '级别'}</th>
                <th>{ui.helpLevelCol2 || '容错率'}</th>
                <th>{ui.helpLevelCol3 || '适用场景'}</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><strong>L</strong></td><td>~7%</td><td>{ui.helpLevelL || '信息密度高、展示空间小，如在标签、名片上使用'}</td></tr>
              <tr><td><strong>M</strong></td><td>~15%</td><td>{ui.helpLevelM || '日常使用首选，平衡数据密度与容错'}</td></tr>
              <tr><td><strong>Q</strong></td><td>~25%</td><td>{ui.helpLevelQ || '需要嵌入 Logo 或可能被部分遮挡的场景'}</td></tr>
              <tr><td><strong>H</strong></td><td>~30%</td><td>{ui.helpLevelH || 'Logo 占比大、印刷品、户外标识等易磨损环境'}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="qr-help-card">
          <h4>{ui.helpQrKnowledge || '二维码知识'}</h4>
          <ul>
            <li><strong>{lang === 'zh' ? '二维码' : 'QR code'}</strong>{ui.helpQrDesc || '是一种矩阵式二维条码，信息存储在黑白模块（点阵）中'}</li>
            <li>{ui.helpQrFinder || '三个角落的'}<strong>{lang === 'zh' ? '定位图案' : 'finder patterns'}</strong>{ui.helpQrFinderEnd || '（回字形）帮助扫描设备快速识别方向和位置'}</li>
            <li>{ui.helpQrCapacity1 || '二维码容量：最多可存储'} <strong>{ui.helpQrCapacityAlpha || '4296 个字母数字'}</strong>{ui.helpQrCapacityOr || '或'} <strong>{ui.helpQrCapacityByte || '2953 个字节'}</strong></li>
            <li>{ui.helpQrLocal || '本工具所有数据'}<strong>{ui.helpQrLocalBold || '纯本地处理'}</strong>{ui.helpQrLocalEnd || '，不会上传到任何服务器'}</li>
          </ul>
        </div>
        <div className="qr-help-card">
          <h4>{ui.helpLogoTips || 'Logo 技巧'}</h4>
          <ul>
            <li>{ui.helpLogoSquare || '建议使用'} <strong>{ui.helpLogoSquareBold || '正方形图片'}</strong>{ui.helpLogoSquareEnd || '（如 200×200px），自动居中裁剪'}</li>
            <li>{ui.helpLogoArea || 'Logo 面积建议不超过二维码的'} <strong>{ui.helpLogoAreaBold || '20%'}</strong></li>
            <li>{ui.helpLogoEC || '添加 Logo 后建议将纠错级别提升至'} <strong>{ui.helpLogoECBold || 'Q 或 H'}</strong></li>
            <li>{ui.helpLogoRemove || '移除 Logo 后纠错级别可恢复为 M，以减小二维码密度'}</li>
          </ul>
        </div>
        <div className="qr-help-card">
          <h4>{ui.helpScanTips || '扫码解析'}</h4>
          <ul>
            <li>{ui.helpScanUpload || '支持'} <strong>{ui.helpScanUploadBold1 || '上传图片'}</strong>{ui.helpScanUploadSep || '、'}<strong>{ui.helpScanUploadBold2 || '拖拽'}</strong>{ui.helpScanUploadOr || '或'} <strong>{ui.helpScanUploadBold3 || 'Ctrl+V 粘贴截图'}</strong></li>
            <li>{ui.helpScanPreprocess || '先用灰度二值化预处理，再尝试正常+反色识别，适配深色主题'}</li>
            <li>{ui.helpScanStyled || '对样式化二维码（圆角/渐变），建议用「'}<strong>{ui.helpScanStyledBold || '自检'}</strong>{ui.helpScanStyledEnd || '」按钮直接从 canvas 解码'}</li>
            <li>{ui.helpScanFormats || '支持常见二维码格式：URL、文本、WiFi、vCard 等'}</li>
            <li>{ui.helpScanLocal || '解析完全在浏览器本地完成，图片不会上传'}</li>
          </ul>
        </div>
      </HelpSection>
    </ToolShell>
  );
}
