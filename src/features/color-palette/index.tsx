import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

type HarmonyMode = 'complementary' | 'analogous' | 'triadic' | 'split' | 'tetradic' | 'monochromatic';

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generatePalette(base: string, mode: HarmonyMode): string[] {
  const [h, s, l] = hexToHsl(base);
  switch (mode) {
    case 'complementary': return [base, hslToHex(h + 180, s, l)];
    case 'analogous': return [hslToHex(h - 30, s, l), base, hslToHex(h + 30, s, l)];
    case 'triadic': return [base, hslToHex(h + 120, s, l), hslToHex(h + 240, s, l)];
    case 'split': return [base, hslToHex(h + 150, s, l), hslToHex(h + 210, s, l)];
    case 'tetradic': return [base, hslToHex(h + 90, s, l), hslToHex(h + 180, s, l), hslToHex(h + 270, s, l)];
    case 'monochromatic': return [hslToHex(h, s, l - 20), hslToHex(h, s, l - 10), base, hslToHex(h, s, l + 10), hslToHex(h, s, l + 20)];
  }
}

function generateTintsAndShades(hex: string, count: number): string[] {
  const [h, s] = hexToHsl(hex);
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const l = 10 + (80 / (count - 1)) * i;
    result.push(hslToHex(h, s, l));
  }
  return result;
}

function randomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

export default function ColorPalette() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('colorPalette');
  const [baseColor, setBaseColor] = useState('#6366f1');
  const [mode, setMode] = useState<HarmonyMode>('analogous');

  const palette = useMemo(() => generatePalette(baseColor, mode), [baseColor, mode]);
  const shades = useMemo(() => generateTintsAndShades(baseColor, 9), [baseColor]);

  const copy = (text: string) => navigator.clipboard.writeText(text);

  const HARMONY_MODES: { value: HarmonyMode; labelKey: string }[] = [
    { value: 'complementary', labelKey: 'complementary' },
    { value: 'analogous', labelKey: 'analogous' },
    { value: 'triadic', labelKey: 'triadic' },
    { value: 'split', labelKey: 'splitComplementary' },
    { value: 'tetradic', labelKey: 'tetradic' },
    { value: 'monochromatic', labelKey: 'monochromatic' },
  ];

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">{t('common.settings')}</div>
          <div className="uuid-config">
            <div className="uuid-config-row">
              <label>{ui.baseColor}</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                <input type="color" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} style={{ width: 40, height: 32, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                <input type="text" value={baseColor} onChange={(e) => /^#[0-9a-fA-F]{6}$/.test(e.target.value) && setBaseColor(e.target.value)} style={{ width: 80, padding: '4px 8px', background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, fontFamily: 'var(--font-mono)' }} />
                <button className="panel-btn panel-btn-sm" onClick={() => setBaseColor(randomColor())}>{ui.random}</button>
              </div>
            </div>
            <div className="uuid-config-row">
              <label>{ui.harmony}</label>
              <div className="panel-actions" style={{ flexWrap: 'wrap' }}>
                {HARMONY_MODES.map((m) => (
                  <button key={m.value} className={`panel-btn panel-btn-sm${mode === m.value ? ' accent' : ''}`} onClick={() => setMode(m.value)}>{ui[m.labelKey]}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Harmony palette */}
          <div className="panel-header">{ui.harmony}</div>
          <div style={{ padding: '0 16px 16px', display: 'flex', gap: 4, borderRadius: 8, overflow: 'hidden' }}>
            {palette.map((c, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div onClick={() => copy(c)} title={c} style={{ width: '100%', height: 64, background: c, cursor: 'pointer', borderRadius: i === 0 ? '8px 0 0 8px' : i === palette.length - 1 ? '0 8px 8px 0' : 0 }} />
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginTop: 4 }}>{c.toUpperCase()}</span>
              </div>
            ))}
          </div>

          {/* Tints and Shades */}
          <div className="panel-header">{ui.shades}</div>
          <div style={{ padding: '0 16px 16px', display: 'flex', gap: 2, borderRadius: 8, overflow: 'hidden' }}>
            {shades.map((c, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div onClick={() => copy(c)} title={c} style={{ width: '100%', height: 40, background: c, cursor: 'pointer', borderRadius: i === 0 ? '6px 0 0 6px' : i === shades.length - 1 ? '0 6px 6px 0' : 0 }} />
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginTop: 2 }}>{c.toUpperCase()}</span>
              </div>
            ))}
          </div>

          {/* CSS variables export */}
          <div className="panel-header">CSS</div>
          <pre style={{ margin: '0 16px 16px', padding: 12, background: 'var(--surface-2)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg)', overflow: 'auto' }}>
{`:root {\n${palette.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n')}\n}`}
          </pre>
        </div>
        <div className="tool-panel">
          <div className="panel-header">{ui.preview}</div>
          <div style={{ padding: 16 }}>
            {/* Text preview on palette colors */}
            {palette.map((c, i) => {
              const [h, s, l] = hexToHsl(c);
              const textColor = l > 55 ? '#000000' : '#ffffff';
              return (
                <div key={i} style={{ background: c, color: textColor, padding: '12px 16px', marginBottom: 4, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>{ui.sampleText}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, opacity: 0.8 }}>{c.toUpperCase()}</span>
                </div>
              );
            })}

            {/* Gradient preview */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{ui.gradient}</div>
              <div style={{ height: 40, borderRadius: 8, background: `linear-gradient(135deg, ${palette.join(', ')})` }} />
            </div>
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
