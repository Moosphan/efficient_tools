import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

const CHAR_CATEGORIES = [
  { id: 'printable', labelKey: 'printable', start: 32, end: 126 },
  { id: 'digits', labelKey: 'digits', start: 48, end: 57 },
  { id: 'upper', labelKey: 'uppercase', start: 65, end: 90 },
  { id: 'lower', labelKey: 'lowercase', start: 97, end: 122 },
  { id: 'symbols', labelKey: 'symbols', start: 33, end: 47 },
  { id: 'control', labelKey: 'control', start: 0, end: 31 },
  { id: 'extended', labelKey: 'extended', start: 128, end: 255 },
];

function getCharDisplay(code: number): { char: string; name: string } {
  if (code === 0) return { char: 'NUL', name: 'Null' };
  if (code === 9) return { char: '  →', name: 'Horizontal Tab' };
  if (code === 10) return { char: '↵', name: 'Line Feed' };
  if (code === 13) return { char: '↵', name: 'Carriage Return' };
  if (code === 32) return { char: '␣', name: 'Space' };
  if (code === 127) return { char: 'DEL', name: 'Delete' };
  if (code < 32) return { char: `^${String.fromCharCode(code + 64)}`, name: `Control ${code}` };
  return { char: String.fromCharCode(code), name: String.fromCharCode(code) };
}

export default function CharReference() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('charRef');
  const [catId, setCatId] = useState('printable');
  const [search, setSearch] = useState('');
  const [inputChar, setInputChar] = useState('');

  const category = CHAR_CATEGORIES.find((c) => c.id === catId) ?? CHAR_CATEGORIES[0];

  const chars = useMemo(() => {
    const result: { code: number; char: string; hex: string; oct: string; bin: string; name: string }[] = [];
    for (let i = category.start; i <= category.end; i++) {
      const { char, name } = getCharDisplay(i);
      result.push({
        code: i,
        char,
        hex: i.toString(16).toUpperCase().padStart(2, '0'),
        oct: i.toString(8).padStart(3, '0'),
        bin: i.toString(2).padStart(8, '0'),
        name,
      });
    }
    if (search) {
      const q = search.toLowerCase();
      return result.filter((c) => c.char.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.code.toString() === q || c.hex.toLowerCase() === q);
    }
    return result;
  }, [category, search]);

  // Lookup from input character
  const lookup = inputChar ? Array.from(inputChar).map((ch) => {
    const code = ch.codePointAt(0)!;
    return { char: ch, code, hex: code.toString(16).toUpperCase(), dec: code.toString(), oct: code.toString(8), bin: code.toString(2) };
  }) : [];

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {ui.lookup}
          </div>
          <input
            type="text"
            value={inputChar}
            onChange={(e) => setInputChar(e.target.value)}
            placeholder={ui.lookupPlaceholder}
            style={{ margin: '10px 16px 12px', padding: '8px 12px', width: 'calc(100% - 32px)', boxSizing: 'border-box', fontFamily: 'var(--font-mono)', fontSize: 14, background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 6 }}
          />
          {lookup.length > 0 && (
            <div style={{ padding: '0 16px 16px' }}>
              {lookup.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13, alignItems: 'center' }}>
                  <span style={{ fontSize: 24, fontFamily: 'var(--font-mono)', minWidth: 32, textAlign: 'center' }}>{l.char}</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 12px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)' }}>DEC</span><span>{l.dec}</span>
                    <span style={{ color: 'var(--muted)' }}>HEX</span><span>{l.hex}</span>
                    <span style={{ color: 'var(--muted)' }}>OCT</span><span>{l.oct}</span>
                    <span style={{ color: 'var(--muted)' }}>BIN</span><span>{l.bin}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="panel-header">{ui.table}</div>
          <div style={{ padding: '8px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CHAR_CATEGORIES.map((c) => (
              <button key={c.id} className={`panel-btn panel-btn-sm${catId === c.id ? ' accent' : ''}`} onClick={() => setCatId(c.id)}>{ui[c.labelKey] || c.labelKey}</button>
            ))}
          </div>
          <div style={{ padding: '10px 16px' }}>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ui.searchPlaceholder} style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, boxSizing: 'border-box' }} />
          </div>
          <div style={{ padding: '0 16px 16px', maxHeight: 400, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)' }}>
                  <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)' }}>DEC</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)' }}>HEX</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--muted)' }}>Char</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)' }}>Name</th>
                </tr>
              </thead>
              <tbody>
                {chars.map((c) => (
                  <tr key={c.code} style={{ borderBottom: '1px solid var(--border)' }} onClick={() => { setInputChar(c.char === '␣' ? ' ' : c.char === '↵' ? '\n' : c.char); }}>
                    <td style={{ textAlign: 'right', padding: '4px 8px', color: 'var(--muted)' }}>{c.code}</td>
                    <td style={{ textAlign: 'right', padding: '4px 8px', color: 'var(--accent)' }}>0x{c.hex}</td>
                    <td style={{ textAlign: 'center', padding: '4px 8px', fontSize: 14 }}>{c.char}</td>
                    <td style={{ padding: '4px 8px', color: 'var(--muted)' }}>{c.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">{ui.details}</div>
          <div style={{ padding: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>{ui.detailsDesc}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', gap: 4 }}>
              {Array.from({ length: category.end - category.start + 1 }, (_, i) => category.start + i).map((code) => {
                const { char } = getCharDisplay(code);
                const display = code === 32 ? '␣' : code < 32 ? `^${String.fromCharCode(code + 64)}` : char;
                return (
                  <button
                    key={code}
                    onClick={() => navigator.clipboard.writeText(char === '␣' ? ' ' : char)}
                    title={`DEC: ${code} HEX: 0x${code.toString(16).toUpperCase()} Char: ${char}`}
                    style={{ padding: '6px 0', fontSize: 14, fontFamily: 'var(--font-mono)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', color: 'var(--fg)', textAlign: 'center' }}
                  >
                    {display}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '8px 0 0' }}>{ui.clickToCopy}</p>
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
