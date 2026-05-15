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

// ── Trending Palettes ──

interface PaletteCollection {
  id: string;
  name: { zh: string; en: string };
  palettes: { name: { zh: string; en: string }; colors: string[] }[];
}

const TRENDING_PALETTES: PaletteCollection[] = [
  {
    id: 'pantone2026',
    name: { zh: 'Pantone 2026', en: 'Pantone 2026' },
    palettes: [
      { name: { zh: '2026 年度色：数字薰衣草', en: '2026 Color of Year: Digital Lavender' }, colors: ['#B8A9E8', '#9B8EC4', '#D4C6F0', '#7B6BA4', '#E8DFF5'] },
      { name: { zh: '宁静蓝', en: 'Tranquil Blue' }, colors: ['#5B8FB9', '#89CFF0', '#3A7CA5', '#B6D0E2', '#1E3A5F'] },
      { name: { zh: '未来暮色', en: 'Future Dusk' }, colors: ['#4A3162', '#6B4D7A', '#8B6F9E', '#2D1B4E', '#C9A0DC'] },
    ],
  },
  {
    id: 'pantone2025',
    name: { zh: 'Pantone 2024-2025', en: 'Pantone 2024-2025' },
    palettes: [
      { name: { zh: '2025 年度色：摩卡慕斯', en: '2025 Color of Year: Mocha Mousse' }, colors: ['#A47764', '#C4A882', '#8B6F5E', '#D4C4B0', '#5C4033'] },
      { name: { zh: '2024 年度色：柔和蜜桃', en: '2024 Color of Year: Peach Fuzz' }, colors: ['#FFBE98', '#E8956D', '#FFD4B8', '#C47A5A', '#FFA07A'] },
      { name: { zh: '经典蓝调', en: 'Classic Blue Tones' }, colors: ['#0F4C75', '#3282B8', '#BBE1FA', '#1B262C', '#00B4D8'] },
    ],
  },
  {
    id: 'morandi',
    name: { zh: '莫兰迪色系', en: 'Morandi Palette' },
    palettes: [
      { name: { zh: '莫兰迪粉灰', en: 'Morandi Pink Grey' }, colors: ['#C9B1A0', '#D4A5A5', '#B8A9C9', '#8E9AAF', '#C0C0C0'] },
      { name: { zh: '莫兰迪蓝绿', en: 'Morandi Blue Green' }, colors: ['#7F9DAF', '#A5C4C7', '#B5CDA3', '#C9B99A', '#D4CCC5'] },
      { name: { zh: '莫兰迪暖调', en: 'Morandi Warm Tones' }, colors: ['#D4A574', '#C4956A', '#B8860B', '#D2B48C', '#DEB887'] },
    ],
  },
  {
    id: 'tech',
    name: { zh: '科技感配色', en: 'Tech & Digital' },
    palettes: [
      { name: { zh: '赛博朋克', en: 'Cyberpunk' }, colors: ['#00F5FF', '#FF00FF', '#FFD700', '#0D0221', '#FF1493'] },
      { name: { zh: '极光渐变', en: 'Aurora Gradient' }, colors: ['#00C9FF', '#92FE9D', '#00C9FF', '#FF6B6B', '#4ECDC4'] },
      { name: { zh: '深空紫蓝', en: 'Deep Space Purple' }, colors: ['#2D1B69', '#6C63FF', '#3F8EFC', '#1A1A2E', '#16213E'] },
      { name: { zh: '霓虹绿', en: 'Neon Green' }, colors: ['#00FF87', '#60EFFF', '#0D1117', '#FF61F6', '#7B2FBE'] },
    ],
  },
  {
    id: 'earth',
    name: { zh: '大地色系', en: 'Earth Tones' },
    palettes: [
      { name: { zh: '森林绿意', en: 'Forest Greens' }, colors: ['#2D5F2D', '#4A7C59', '#88B04B', '#C1E1C1', '#1A3C1A'] },
      { name: { zh: '沙漠暖阳', en: 'Desert Sunset' }, colors: ['#E67E22', '#F39C12', '#D35400', '#C0392B', '#8B4513'] },
      { name: { zh: '海洋蓝调', en: 'Ocean Blues' }, colors: ['#1ABC9C', '#16A085', '#2980B9', '#3498DB', '#2C3E50'] },
    ],
  },
  {
    id: 'vintage',
    name: { zh: '复古配色', en: 'Vintage & Retro' },
    palettes: [
      { name: { zh: '70 年代复古', en: '70s Retro' }, colors: ['#E74C3C', '#F39C12', '#27AE60', '#8E44AD', '#2C3E50'] },
      { name: { zh: '胶片质感', en: 'Film Grain' }, colors: ['#D4A574', '#8B7355', '#6B4423', '#C8B496', '#3E2723'] },
      { name: { zh: '老海报', en: 'Vintage Poster' }, colors: ['#C0392B', '#F1C40F', '#2C3E50', '#E74C3C', '#ECF0F1'] },
    ],
  },
  {
    id: 'gradient',
    name: { zh: '流行渐变', en: 'Trending Gradients' },
    palettes: [
      { name: { zh: 'Instagram 风', en: 'Instagram Style' }, colors: ['#833AB4', '#FD1D1D', '#F77737', '#C13584', '#E1306C'] },
      { name: { zh: '日落橙粉', en: 'Sunset Orange' }, colors: ['#FF512F', '#F09819', '#DD2476', '#FF6B6B', '#FFE66D'] },
      { name: { zh: '薄荷清新', en: 'Fresh Mint' }, colors: ['#11998E', '#38EF7D', '#0575E6', '#021B79', '#4ECDC4'] },
    ],
  },
];

export default function ColorPalette() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('colorPalette');
  const [baseColor, setBaseColor] = useState('#6366f1');
  const [mode, setMode] = useState<HarmonyMode>('analogous');
  const [showTrending, setShowTrending] = useState(false);
  const [activeCollection, setActiveCollection] = useState<string>('pantone2026');

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
          {/* Trending Palettes */}
          <button className="panel-header" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', border: 'none', width: '100%', textAlign: 'left' }} onClick={() => setShowTrending(!showTrending)}>
            <span className={`priv-advanced-arrow${showTrending ? ' priv-advanced-arrow-open' : ''}`}>&#9654;</span>
            {ui.trending || '🔥 Trending Palettes 2024-2025'}
          </button>
          {showTrending && (
            <div style={{ padding: '8px 16px 16px' }}>
              {/* Collection tabs */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                {TRENDING_PALETTES.map(col => (
                  <button
                    key={col.id}
                    className={`panel-btn panel-btn-sm${activeCollection === col.id ? ' accent' : ''}`}
                    onClick={() => setActiveCollection(col.id)}
                    style={{ fontSize: 11 }}
                  >
                    {col.name[lang] || col.name.en}
                  </button>
                ))}
              </div>
              {/* Palettes */}
              {TRENDING_PALETTES.filter(col => col.id === activeCollection).map(col => (
                <div key={col.id}>
                  {col.palettes.map((palette, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                        {palette.name[lang] || palette.name.en}
                      </div>
                      <div style={{ display: 'flex', gap: 2, borderRadius: 6, overflow: 'hidden' }}>
                        {palette.colors.map((color, j) => (
                          <div
                            key={j}
                            onClick={() => setBaseColor(color)}
                            title={color.toUpperCase()}
                            style={{
                              flex: 1,
                              height: 36,
                              background: color,
                              cursor: 'pointer',
                              transition: 'transform 0.1s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                          />
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                        {palette.colors.map((color, j) => (
                          <span key={j} style={{ flex: 1, textAlign: 'center', fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                            {color.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

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
          <div style={{ padding: '8px 16px 16px', display: 'flex', gap: 4, borderRadius: 8, overflow: 'hidden' }}>
            {palette.map((c, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div onClick={() => copy(c)} title={c} style={{ width: '100%', height: 64, background: c, cursor: 'pointer', borderRadius: i === 0 ? '8px 0 0 8px' : i === palette.length - 1 ? '0 8px 8px 0' : 0 }} />
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginTop: 4 }}>{c.toUpperCase()}</span>
              </div>
            ))}
          </div>

          {/* Tints and Shades */}
          <div className="panel-header">{ui.shades}</div>
          <div style={{ padding: '8px 16px 16px', display: 'flex', gap: 2, borderRadius: 8, overflow: 'hidden' }}>
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
