import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

interface UnitDef { id: string; label: string; nameKey: string; toBase: (v: number) => number; fromBase: (v: number) => number; }

interface CategoryDef { id: string; labelKey: string; units: UnitDef[]; }

const CATEGORIES: CategoryDef[] = [
  {
    id: 'length', labelKey: 'length',
    units: [
      { id: 'mm', label: 'mm', nameKey: 'mm', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'cm', label: 'cm', nameKey: 'cm', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { id: 'm', label: 'm', nameKey: 'm', toBase: (v) => v, fromBase: (v) => v },
      { id: 'km', label: 'km', nameKey: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'in', label: 'in', nameKey: 'inch', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { id: 'ft', label: 'ft', nameKey: 'foot', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: 'yd', label: 'yd', nameKey: 'yard', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      { id: 'mi', label: 'mi', nameKey: 'mile', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    ],
  },
  {
    id: 'weight', labelKey: 'weight',
    units: [
      { id: 'mg', label: 'mg', nameKey: 'mg', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      { id: 'g', label: 'g', nameKey: 'g', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'kg', label: 'kg', nameKey: 'kg', toBase: (v) => v, fromBase: (v) => v },
      { id: 't', label: 't', nameKey: 'ton', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'oz', label: 'oz', nameKey: 'oz', toBase: (v) => v * 0.028349523125, fromBase: (v) => v / 0.028349523125 },
      { id: 'lb', label: 'lb', nameKey: 'lb', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
    ],
  },
  {
    id: 'temperature', labelKey: 'temperature',
    units: [
      { id: 'c', label: '°C', nameKey: 'celsius', toBase: (v) => v, fromBase: (v) => v },
      { id: 'f', label: '°F', nameKey: 'fahrenheit', toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
      { id: 'k', label: 'K', nameKey: 'kelvin', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  {
    id: 'storage', labelKey: 'storage',
    units: [
      { id: 'b', label: 'B', nameKey: 'byte', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kb', label: 'KB', nameKey: 'kilobyte', toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
      { id: 'mb', label: 'MB', nameKey: 'megabyte', toBase: (v) => v * 1024 * 1024, fromBase: (v) => v / (1024 * 1024) },
      { id: 'gb', label: 'GB', nameKey: 'gigabyte', toBase: (v) => v * 1024 ** 3, fromBase: (v) => v / 1024 ** 3 },
      { id: 'tb', label: 'TB', nameKey: 'terabyte', toBase: (v) => v * 1024 ** 4, fromBase: (v) => v / 1024 ** 4 },
    ],
  },
  {
    id: 'speed', labelKey: 'speed',
    units: [
      { id: 'ms', label: 'm/s', nameKey: 'mps', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kmh', label: 'km/h', nameKey: 'kmh', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      { id: 'mph', label: 'mph', nameKey: 'mph', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      { id: 'knot', label: 'kn', nameKey: 'knot', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
    ],
  },
  {
    id: 'area', labelKey: 'area',
    units: [
      { id: 'sqm', label: 'm²', nameKey: 'sqm', toBase: (v) => v, fromBase: (v) => v },
      { id: 'sqkm', label: 'km²', nameKey: 'sqkm', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { id: 'ha', label: 'ha', nameKey: 'ha', toBase: (v) => v * 1e4, fromBase: (v) => v / 1e4 },
      { id: 'sqft', label: 'ft²', nameKey: 'sqft', toBase: (v) => v * 0.09290304, fromBase: (v) => v / 0.09290304 },
      { id: 'acre', label: 'acre', nameKey: 'acre', toBase: (v) => v * 4046.8564224, fromBase: (v) => v / 4046.8564224 },
    ],
  },
];

function formatResult(v: number): string {
  if (!isFinite(v)) return '—';
  if (v === 0) return '0';
  const abs = Math.abs(v);
  if (abs >= 1e12 || (abs < 0.0001 && abs > 0)) return v.toExponential(6);
  if (abs >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 4 });
  return parseFloat(v.toPrecision(10)).toString();
}

export default function UnitConverter() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('unitConv');
  const [catIdx, setCatIdx] = useState(0);
  const [fromUnit, setFromUnit] = useState(CATEGORIES[0].units[0].id);
  const [toUnit, setToUnit] = useState(CATEGORIES[0].units[1].id);
  const [inputValue, setInputValue] = useState('');

  const category = CATEGORIES[catIdx];
  const fromDef = category.units.find((u) => u.id === fromUnit) ?? category.units[0];
  const toDef = category.units.find((u) => u.id === toUnit) ?? category.units[1];

  const result = useMemo(() => {
    const num = parseFloat(inputValue);
    if (isNaN(num)) return '';
    const baseValue = fromDef.toBase(num);
    return formatResult(toDef.fromBase(baseValue));
  }, [inputValue, fromDef, toDef]);

  const handleCatChange = (idx: number) => {
    setCatIdx(idx);
    setFromUnit(CATEGORIES[idx].units[0].id);
    setToUnit(CATEGORIES[idx].units.length > 1 ? CATEGORIES[idx].units[1].id : CATEGORIES[idx].units[0].id);
    setInputValue('');
  };

  const swap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    if (result) setInputValue(result);
  };

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">{t('common.settings')}</div>
          <div className="uuid-config">
            <div className="uuid-config-row">
              <label>{ui.category}</label>
              <div className="panel-actions" style={{ flexWrap: 'wrap' }}>
                {CATEGORIES.map((c, i) => (
                  <button key={c.id} className={`panel-btn panel-btn-sm${catIdx === i ? ' accent' : ''}`} onClick={() => handleCatChange(i)}>{ui[c.labelKey] || c.labelKey}</button>
                ))}
              </div>
            </div>
            <div className="uuid-config-row">
              <label>{ui.from}</label>
              <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} style={{ flex: 1, padding: '4px 8px', background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13 }}>
                {category.units.map((u) => <option key={u.id} value={u.id}>{u.label} — {ui[u.nameKey] || u.label}</option>)}
              </select>
            </div>
            <div className="uuid-config-row">
              <label>{ui.to}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <select value={toUnit} onChange={(e) => setToUnit(e.target.value)} style={{ flex: 1, padding: '4px 8px', background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13 }}>
                  {category.units.map((u) => <option key={u.id} value={u.id}>{u.label} — {ui[u.nameKey] || u.label}</option>)}
                </select>
                <button className="panel-btn panel-btn-sm" onClick={swap}>⇄</button>
              </div>
            </div>
          </div>
          <div style={{ padding: '0 16px 16px' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={ui.placeholder}
              style={{ width: '100%', padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 16, background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 6, boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">{t('common.output')}</div>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            {inputValue ? (
              <>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>{parseFloat(inputValue) || 0} {fromDef.label}</div>
                <div style={{ fontSize: 28, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--fg)', letterSpacing: 1, wordBreak: 'break-all', textAlign: 'center' }}>{result}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>{toDef.label}</div>
              </>
            ) : (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>{t('common.waiting')}</div>
            )}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
