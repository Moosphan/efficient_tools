import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

type Base = 2 | 8 | 10 | 16;

const BASES: { value: Base; label: string; prefix: string }[] = [
  { value: 2, label: 'BIN', prefix: '0b' },
  { value: 8, label: 'OCT', prefix: '0o' },
  { value: 10, label: 'DEC', prefix: '' },
  { value: 16, label: 'HEX', prefix: '0x' },
];

const HEX_CHARS = '0123456789ABCDEFabcdef';

function isValidForBase(value: string, base: Base): boolean {
  if (!value) return true;
  const cleaned = value.replace(/^[-+]/, '').replace(/^0[xXoObB]/, '');
  if (base === 2) return /^[01]+$/.test(cleaned);
  if (base === 8) return /^[0-7]+$/.test(cleaned);
  if (base === 10) return /^[0-9]+$/.test(cleaned);
  if (base === 16) return /^[0-9a-fA-F]+$/.test(cleaned);
  return false;
}

function convertBase(value: string, fromBase: Base, toBase: Base): string {
  if (!value.trim()) return '';
  try {
    const cleaned = value.trim().replace(/^0[xXoObB]/, '');
    const num = parseInt(cleaned, fromBase);
    if (isNaN(num)) return '';
    if (toBase === 10) return num.toString(10);
    if (toBase === 16) return num.toString(16).toUpperCase();
    return num.toString(toBase);
  } catch {
    return '';
  }
}

function formatWithSpaces(value: string, groupSize: number): string {
  if (!value || groupSize <= 0) return value;
  const result: string[] = [];
  for (let i = value.length; i > 0; i -= groupSize) {
    result.unshift(value.slice(Math.max(0, i - groupSize), i));
  }
  return result.join(' ');
}

export default function BaseConverter() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('baseConv');
  const [inputBase, setInputBase] = useState<Base>(10);
  const [inputValue, setInputValue] = useState('');
  const [grouped, setGrouped] = useState(false);

  const results = BASES.map((b) => {
    const raw = convertBase(inputValue, inputBase, b.value);
    return { ...b, base: b.value, raw, display: grouped ? formatWithSpaces(raw, b.value === 2 ? 4 : b.value === 16 ? 2 : 0) : raw };
  });

  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.input')}
            <div className="panel-actions">
              {BASES.map((b) => (
                <button key={b.value} className={`panel-btn panel-btn-sm${inputBase === b.value ? ' accent' : ''}`} onClick={() => { setInputBase(b.value); setInputValue(''); }}>{b.label}</button>
              ))}
            </div>
          </div>
          <textarea
            className="tool-textarea"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={ui.placeholder}
            style={{ minHeight: 120 }}
          />
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.output')}
            <div className="panel-actions">
              <button className={`panel-btn panel-btn-sm${grouped ? ' accent' : ''}`} onClick={() => setGrouped(!grouped)}>{ui.grouped}</button>
            </div>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.filter((r) => r.base !== inputBase).map((r) => (
              <div key={r.base} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', minWidth: 32, fontFamily: 'var(--font-mono)' }}>{r.label}</span>
                <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 14, letterSpacing: 0.5, wordBreak: 'break-all', color: inputValue ? 'var(--fg)' : 'var(--muted)' }}>{inputValue ? r.display || '—' : '—'}</span>
                <button className="panel-btn panel-btn-sm" onClick={() => copy(r.raw)} style={{ flexShrink: 0 }}>{t('common.copy')}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
