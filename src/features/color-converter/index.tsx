import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';

interface RGBA { r: number; g: number; b: number; a: number }

function parseHex(hex: string): RGBA | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{3,8})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length === 4) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  if (h.length < 6) return null;
  // 8位格式为 #AARRGGBB（ARGB）
  if (h.length === 8) {
    const a = parseInt(h.slice(0, 2), 16) / 255;
    const r = parseInt(h.slice(2, 4), 16);
    const g = parseInt(h.slice(4, 6), 16);
    const b = parseInt(h.slice(6, 8), 16);
    return { r, g, b, a };
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b, a: 1 };
}

function toHex(r: number, g: number, b: number, a: number): string {
  const rgb = [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  if (a < 1) {
    // ARGB 格式: #AARRGGBB
    return '#' + Math.round(a * 255).toString(16).padStart(2, '0') + rgb;
  }
  return '#' + rgb;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v }; }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(c1: RGBA, c2: RGBA): number {
  const l1 = relativeLuminance(c1.r, c1.g, c1.b);
  const l2 = relativeLuminance(c2.r, c2.g, c2.b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function toCssColor(c: RGBA): string {
  if (c.a < 1) return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a.toFixed(4)})`;
  return `rgb(${c.r}, ${c.g}, ${c.b})`;
}

export default function ColorConverter() {
  const [hexInput, setHexInput] = useState('#5b7fff');
  const [rInput, setRInput] = useState('91');
  const [gInput, setGInput] = useState('127');
  const [bInput, setBInput] = useState('255');
  const [aInput, setAInput] = useState('100');
  const [hInput, setHInput] = useState('225');
  const [sInput, setSInput] = useState('100');
  const [lInput, setLInput] = useState('68');
  const [bgHex, setBgHex] = useState('#ffffff');

  const parsed = useMemo(() => parseHex(hexInput), [hexInput]);

  const syncFromColor = (c: RGBA) => {
    setRInput(String(c.r));
    setGInput(String(c.g));
    setBInput(String(c.b));
    setAInput(String(Math.round(c.a * 100)));
    const hsl = rgbToHsl(c.r, c.g, c.b);
    setHInput(String(hsl.h));
    setSInput(String(hsl.s));
    setLInput(String(hsl.l));
  };

  const updateFromHex = (hex: string) => {
    setHexInput(hex);
    const c = parseHex(hex);
    if (c) syncFromColor(c);
  };

  const updateFromRgb = (r: string, g: string, b: string, a: string) => {
    setRInput(r); setGInput(g); setBInput(b); setAInput(a);
    const ri = parseInt(r), gi = parseInt(g), bi = parseInt(b), ai = parseInt(a);
    if (isNaN(ri) || isNaN(gi) || isNaN(bi) || isNaN(ai)) return;
    const alpha = Math.max(0, Math.min(100, ai)) / 100;
    setHexInput(toHex(ri, gi, bi, alpha));
    const hsl = rgbToHsl(ri, gi, bi);
    setHInput(String(hsl.h));
    setSInput(String(hsl.s));
    setLInput(String(hsl.l));
  };

  const updateFromHsl = (h: string, s: string, l: string) => {
    setHInput(h); setSInput(s); setLInput(l);
    const hi = parseInt(h), si = parseInt(s), li = parseInt(l);
    if (isNaN(hi) || isNaN(si) || isNaN(li)) return;
    const rgb = hslToRgb(hi, si, li);
    setRInput(String(rgb.r));
    setGInput(String(rgb.g));
    setBInput(String(rgb.b));
    const alpha = parseInt(aInput) / 100;
    setHexInput(toHex(rgb.r, rgb.g, rgb.b, isNaN(alpha) ? 1 : alpha));
  };

  const contrast = useMemo(() => {
    if (!parsed) return null;
    const bg = parseHex(bgHex);
    if (!bg) return null;
    return contrastRatio(parsed, bg);
  }, [parsed, bgHex]);

  const alpha = parsed?.a ?? 1;
  const hasAlpha = alpha < 1;
  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <ToolShell title="颜色格式转换" description="HEX / RGBA / HSL 互转，支持透明度，对比度检查">
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">HEX</div>
          <div className="color-input-row">
            <div
              className="color-preview"
              style={{ background: parsed ? toCssColor(parsed) : hexInput, backgroundImage: hasAlpha ? `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)` : undefined, backgroundSize: hasAlpha ? '8px 8px' : undefined, backgroundPosition: hasAlpha ? '0 0, 0 4px, 4px -4px, -4px 0' : undefined }}
            />
            <input
              type="text"
              className="tool-input"
              value={hexInput}
              onChange={(e) => updateFromHex(e.target.value)}
              placeholder="#5b7fff 或 #AARRGGBB"
            />
            <button className="panel-btn" onClick={() => copy(hexInput)}>复制</button>
          </div>

          <div className="panel-header">RGBA</div>
          <div className="color-input-row color-rgb-row">
            <div className="color-field">
              <label>R</label>
              <input type="number" min="0" max="255" value={rInput} onChange={(e) => updateFromRgb(e.target.value, gInput, bInput, aInput)} />
            </div>
            <div className="color-field">
              <label>G</label>
              <input type="number" min="0" max="255" value={gInput} onChange={(e) => updateFromRgb(rInput, e.target.value, bInput, aInput)} />
            </div>
            <div className="color-field">
              <label>B</label>
              <input type="number" min="0" max="255" value={bInput} onChange={(e) => updateFromRgb(rInput, gInput, e.target.value, aInput)} />
            </div>
            <div className="color-field">
              <label>A%</label>
              <input type="number" min="0" max="100" value={aInput} onChange={(e) => updateFromRgb(rInput, gInput, bInput, e.target.value)} />
            </div>
            <button className="panel-btn" onClick={() => copy(`rgba(${rInput}, ${gInput}, ${bInput}, ${(parseInt(aInput) / 100).toFixed(2)})`)}>复制</button>
          </div>

          <div className="panel-header">HSL</div>
          <div className="color-input-row color-rgb-row">
            <div className="color-field">
              <label>H</label>
              <input type="number" min="0" max="360" value={hInput} onChange={(e) => updateFromHsl(e.target.value, sInput, lInput)} />
            </div>
            <div className="color-field">
              <label>S%</label>
              <input type="number" min="0" max="100" value={sInput} onChange={(e) => updateFromHsl(hInput, e.target.value, lInput)} />
            </div>
            <div className="color-field">
              <label>L%</label>
              <input type="number" min="0" max="100" value={lInput} onChange={(e) => updateFromHsl(hInput, sInput, e.target.value)} />
            </div>
            <button className="panel-btn" onClick={() => copy(`hsl(${hInput}, ${sInput}%, ${lInput}%)`)}>复制</button>
          </div>

          <div className="panel-header">CSS 输出</div>
          <div className="color-css-output">
            <code>{hasAlpha
              ? `background: rgba(${rInput}, ${gInput}, ${bInput}, ${(parseInt(aInput) / 100).toFixed(2)});`
              : `background: ${hexInput};`
            }</code>
            <button className="panel-btn" onClick={() => copy(hasAlpha
              ? `rgba(${rInput}, ${gInput}, ${bInput}, ${(parseInt(aInput) / 100).toFixed(2)})`
              : hexInput
            )}>复制</button>
          </div>
        </div>

        <div className="tool-panel">
          <div className="panel-header">预览</div>
          <div className="color-preview-checker">
            <div className="color-preview-large" style={{ background: parsed ? toCssColor(parsed) : hexInput }}>
              <span style={{ color: (contrast && contrast >= 4.5) ? '#fff' : '#000' }}>Aa</span>
            </div>
          </div>

          <div className="panel-header">对比度检查</div>
          <div className="color-contrast">
            <div className="color-contrast-bg">
              <label>背景色</label>
              <div className="color-input-row">
                <div className="color-preview-sm" style={{ background: bgHex }} />
                <input
                  type="text"
                  className="tool-input"
                  value={bgHex}
                  onChange={(e) => setBgHex(e.target.value)}
                  placeholder="#ffffff"
                />
              </div>
            </div>
            {contrast !== null && (
              <div className="color-contrast-result">
                <div className="color-contrast-ratio">{contrast.toFixed(2)}:1</div>
                <div className="color-contrast-badges">
                  <span className={`contrast-badge ${contrast >= 4.5 ? 'pass' : 'fail'}`}>
                    AA {contrast >= 4.5 ? '✓' : '✗'}
                  </span>
                  <span className={`contrast-badge ${contrast >= 7 ? 'pass' : 'fail'}`}>
                    AAA {contrast >= 7 ? '✓' : '✗'}
                  </span>
                </div>
                <div className="color-contrast-preview" style={{ background: bgHex, color: parsed ? toCssColor(parsed) : hexInput }}>
                  The quick brown fox jumps over the lazy dog.
                </div>
              </div>
            )}
          </div>

          <div className="panel-header">调色板</div>
          <div className="color-palette">
            {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((l) => {
              const h = parseInt(hInput) || 0;
              const s = parseInt(sInput) || 0;
              const rgb = hslToRgb(h, s, l);
              const hex = toHex(rgb.r, rgb.g, rgb.b, 1);
              return (
                <div
                  key={l}
                  className="color-palette-swatch"
                  style={{ background: hex }}
                  title={hex}
                  onClick={() => updateFromHex(hex)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
