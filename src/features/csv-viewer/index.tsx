import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

function parseCsv(text: string, delimiter: string): string[][] {
  const lines = text.trim().split('\n');
  const result: string[][] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { current += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === delimiter) { row.push(current); current = ''; }
        else { current += ch; }
      }
    }
    row.push(current);
    result.push(row);
  }
  return result;
}

const SAMPLE = `Name,Age,Email,City,Role
Alice,28,alice@example.com,Beijing,Engineer
Bob,32,bob@example.com,Shanghai,Designer
Charlie,25,charlie@example.com,Shenzhen,PM
Diana,30,diana@example.com,Hangzhou,Engineer
Eve,27,eve@example.com,Beijing,Designer`;

export default function CsvViewer() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('csvViewer');
  const [input, setInput] = useState('');
  const [delimiter, setDelimiter] = useState(',');
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [filterText, setFilterText] = useState('');

  useCleanup(() => { setInput(''); setSortCol(null); setFilterText(''); });

  const data = useMemo(() => {
    if (!input.trim()) return null;
    return parseCsv(input, delimiter);
  }, [input, delimiter]);

  const displayData = useMemo(() => {
    if (!data || data.length < 2) return data;
    const [header, ...rows] = data;
    let filtered = rows;
    if (filterText) {
      const q = filterText.toLowerCase();
      filtered = rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(q)));
    }
    if (sortCol !== null) {
      filtered = [...filtered].sort((a, b) => {
        const va = a[sortCol] ?? '', vb = b[sortCol] ?? '';
        const na = parseFloat(va), nb = parseFloat(vb);
        if (!isNaN(na) && !isNaN(nb)) return sortAsc ? na - nb : nb - na;
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return [header, ...filtered];
  }, [data, sortCol, sortAsc, filterText]);

  const handleSort = (col: number) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  const exportJson = () => {
    if (!data || data.length < 2) return;
    const [header, ...rows] = data;
    const json = rows.map((row) => {
      const obj: Record<string, string> = {};
      header.forEach((h, i) => { obj[h] = row[i] ?? ''; });
      return obj;
    });
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
  };

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.input')}
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => setInput(SAMPLE)}>{t('common.example')}</button>
              <button className="panel-btn" onClick={() => { setInput(''); setSortCol(null); setFilterText(''); }}>{t('common.clear')}</button>
            </div>
          </div>
          <textarea className="tool-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={ui.placeholder} style={{ minHeight: 180 }} />
          <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{ui.delimiter}</span>
            {[',', ';', '\t'].map((d) => (
              <button key={d} className={`panel-btn panel-btn-sm${delimiter === d ? ' accent' : ''}`} onClick={() => setDelimiter(d)}>{d === ',' ? 'Comma' : d === ';' ? 'Semicolon' : 'Tab'}</button>
            ))}
          </div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {ui.table}
            {data && data.length > 1 && (
              <div className="panel-actions">
                <input type="text" value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder={ui.filter} style={{ padding: '3px 8px', fontSize: 12, background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, width: 120 }} />
                <button className="panel-btn panel-btn-sm" onClick={exportJson}>{ui.exportJson}</button>
              </div>
            )}
          </div>
          {displayData && displayData.length > 0 ? (
            <div style={{ overflow: 'auto', maxHeight: 500 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                <thead>
                  <tr>
                    {displayData[0].map((h, i) => (
                      <th key={i} onClick={() => handleSort(i)} style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '2px solid var(--border)', cursor: 'pointer', userSelect: 'none', position: 'sticky', top: 0, background: 'var(--surface)', whiteSpace: 'nowrap' }}>
                        {h} {sortCol === i ? (sortAsc ? '↑' : '↓') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayData.slice(1).map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cell}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '6px 10px', fontSize: 11, color: 'var(--muted)' }}>{displayData.length - 1} {ui.rows}</div>
            </div>
          ) : (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{t('common.waiting')}</div>
          )}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
