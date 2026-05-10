import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = value === null || value === undefined ? '' : String(value);
    }
  }
  return result;
}

function jsonToCsv(jsonStr: string, delimiter: string): string {
  const parsed = JSON.parse(jsonStr);
  const arr = Array.isArray(parsed) ? parsed : [parsed];
  if (arr.length === 0) return '';
  const flatRows = arr.map((item) => typeof item === 'object' && item !== null ? flattenObject(item) : { value: String(item) });
  const headers = [...new Set(flatRows.flatMap((r) => Object.keys(r)))];
  const escape = (v: string) => v.includes(delimiter) || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v;
  const headerLine = headers.map(escape).join(delimiter);
  const lines = flatRows.map((row) => headers.map((h) => escape(row[h] ?? '')).join(delimiter));
  return [headerLine, ...lines].join('\n');
}

function csvToJson(csvStr: string, delimiter: string): string {
  const lines = csvStr.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV needs at least a header and one data row');
  const parseRow = (line: string): string[] => {
    const result: string[] = [];
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
        else if (ch === delimiter) { result.push(current); current = ''; }
        else { current += ch; }
      }
    }
    result.push(current);
    return result;
  };
  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
    return obj;
  });
  return JSON.stringify(rows, null, 2);
}

export default function JsonCsvConverter() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('jsonCsv');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'json2csv' | 'csv2json'>('json2csv');
  const [delimiter, setDelimiter] = useState(',');

  useCleanup(() => { setInput(''); setOutput(''); setError(''); });

  const convert = () => {
    if (!input.trim()) { setOutput(''); setError(''); return; }
    try {
      if (mode === 'json2csv') {
        setOutput(jsonToCsv(input, delimiter));
      } else {
        setOutput(csvToJson(input, delimiter));
      }
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion error');
      setOutput('');
    }
  };

  const swap = () => {
    setInput(output);
    setOutput('');
    setError('');
    setMode(mode === 'json2csv' ? 'csv2json' : 'json2csv');
  };

  const copy = () => { if (output) navigator.clipboard.writeText(output); };

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.input')}
            <div className="panel-actions">
              <button className={`panel-btn panel-btn-sm${mode === 'json2csv' ? ' accent' : ''}`} onClick={() => setMode('json2csv')}>JSON → CSV</button>
              <button className={`panel-btn panel-btn-sm${mode === 'csv2json' ? ' accent' : ''}`} onClick={() => setMode('csv2json')}>CSV → JSON</button>
            </div>
          </div>
          <textarea className="tool-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === 'json2csv' ? ui.jsonPlaceholder : ui.csvPlaceholder} />
          <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{ui.delimiter}</span>
            {[',', ';', '\t'].map((d) => (
              <button key={d} className={`panel-btn panel-btn-sm${delimiter === d ? ' accent' : ''}`} onClick={() => setDelimiter(d)}>{d === ',' ? 'Comma' : d === ';' ? 'Semicolon' : 'Tab'}</button>
            ))}
          </div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.output')}
            <div className="panel-actions">
              <button className="panel-btn accent" onClick={convert}>{ui.convert}</button>
              <button className="panel-btn" onClick={swap}>⇄ {t('common.swap')}</button>
              <button className="panel-btn" onClick={copy}>{t('common.copy')}</button>
            </div>
          </div>
          <div className="output-area">{output || t('common.waiting')}</div>
          {error && <div className="error-msg">{t('common.error')}: {error}</div>}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
