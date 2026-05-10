import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

type TabMode = 'case' | 'sort' | 'replace' | 'escape' | 'align';

// ── Case ──
function changeCase(text: string, mode: string): string {
  switch (mode) {
    case 'upper': return text.toUpperCase();
    case 'lower': return text.toLowerCase();
    case 'title': return text.replace(/\b\w/g, (c) => c.toUpperCase());
    case 'sentence': return text.replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
    case 'camel': return text.replace(/[^a-zA-Z0-9一-鿿]+(.)?/g, (_, c) => c ? c.toUpperCase() : '').replace(/^[A-Z]/, (c) => c.toLowerCase());
    case 'pascal': return changeCase(text, 'camel').replace(/^[a-z]/, (c) => c.toUpperCase());
    case 'snake': return text.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/[\s\-]+/g, '_').toLowerCase();
    case 'kebab': return text.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase();
    default: return text;
  }
}

// ── Sort/Dedup ──
function sortLines(text: string, mode: 'asc' | 'desc' | 'unique' | 'shuffle' | 'reverse'): string {
  let lines = text.split('\n');
  if (mode === 'unique') lines = [...new Set(lines)];
  else if (mode === 'shuffle') { for (let i = lines.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [lines[i], lines[j]] = [lines[j], lines[i]]; } }
  else if (mode === 'reverse') lines = lines.reverse();
  else if (mode === 'desc') lines = lines.sort((a, b) => b.localeCompare(a));
  else lines = lines.sort((a, b) => a.localeCompare(b));
  return lines.join('\n');
}

// ── Replace ──
function batchReplace(text: string, find: string, replace: string, useRegex: boolean, caseSensitive: boolean): string {
  if (!find) return text;
  try {
    if (useRegex) {
      const flags = caseSensitive ? 'g' : 'gi';
      return text.replace(new RegExp(find, flags), replace);
    }
    if (caseSensitive) return text.split(find).join(replace);
    return text.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replace);
  } catch { return text; }
}

// ── Escape ──
function escapeText(text: string, format: 'json' | 'html' | 'js' | 'url'): string {
  if (format === 'json') return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
  if (format === 'html') return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  if (format === 'js') return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
  return encodeURIComponent(text);
}

function unescapeText(text: string, format: 'json' | 'html' | 'js' | 'url'): string {
  if (format === 'json') return text.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  if (format === 'html') return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));
  if (format === 'js') return text.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  return decodeURIComponent(text);
}

// ── Align ──
function alignText(text: string, mode: 'left' | 'right' | 'center' | 'table'): string {
  const lines = text.split('\n').filter((l) => l.trim());
  if (mode === 'table') {
    const rows = lines.map((l) => l.split(/\t+|\s{2,}/));
    const cols = Math.max(...rows.map((r) => r.length));
    const widths = Array.from({ length: cols }, (_, ci) => Math.max(...rows.map((r) => (r[ci] ?? '').trim().length)));
    return rows.map((r) => r.map((c, i) => c.trim().padEnd(widths[i])).join('  ')).join('\n');
  }
  const maxLen = Math.max(...lines.map((l) => l.length));
  if (mode === 'left') return lines.map((l) => l.padEnd(maxLen)).join('\n');
  if (mode === 'right') return lines.map((l) => l.padStart(maxLen)).join('\n');
  return lines.map((l) => { const pad = Math.floor((maxLen - l.length) / 2); return ' '.repeat(pad) + l; }).join('\n');
}

export default function TextToolkit() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('textToolkit');
  const [tab, setTab] = useState<TabMode>('case');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  // Case state
  const [caseMode, setCaseMode] = useState('upper');

  // Sort state
  const [sortMode, setSortMode] = useState<'asc' | 'desc' | 'unique' | 'shuffle' | 'reverse'>('asc');

  // Replace state
  const [findStr, setFindStr] = useState('');
  const [replaceStr, setReplaceStr] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(true);

  // Escape state
  const [escapeFormat, setEscapeFormat] = useState<'json' | 'html' | 'js' | 'url'>('json');
  const [escapeMode, setEscapeMode] = useState<'escape' | 'unescape'>('escape');

  // Align state
  const [alignMode, setAlignMode] = useState<'left' | 'right' | 'center' | 'table'>('left');

  useCleanup(() => { setInput(''); setOutput(''); setFindStr(''); setReplaceStr(''); });

  const run = () => {
    if (!input) { setOutput(''); return; }
    if (tab === 'case') setOutput(changeCase(input, caseMode));
    else if (tab === 'sort') setOutput(sortLines(input, sortMode));
    else if (tab === 'replace') setOutput(batchReplace(input, findStr, replaceStr, useRegex, caseSensitive));
    else if (tab === 'escape') setOutput(escapeMode === 'escape' ? escapeText(input, escapeFormat) : unescapeText(input, escapeFormat));
    else setOutput(alignText(input, alignMode));
  };

  const copy = () => { if (output) navigator.clipboard.writeText(output); };
  const swap = () => { setInput(output); setOutput(''); };

  const tabs: [TabMode, string][] = [
    ['case', ui.caseConvert],
    ['sort', ui.sortDedup],
    ['replace', ui.findReplace],
    ['escape', ui.escapeUnescape],
    ['align', ui.alignTable],
  ];

  return (
    <ToolShell title={name} description={desc}>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--surface)', borderRadius: 8, padding: 4, width: 'fit-content', flexWrap: 'wrap' }}>
        {tabs.map(([key, label]) => (
          <button key={key} className={`panel-btn${tab === key ? ' accent' : ''}`} onClick={() => { setTab(key); setOutput(''); }}>{label}</button>
        ))}
      </div>

      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.input')}
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => { setInput(''); setOutput(''); }}>{t('common.clear')}</button>
            </div>
          </div>
          <textarea className="tool-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={ui.inputPlaceholder} />
          {/* Tool-specific controls */}
          {tab === 'case' && (
            <div style={{ padding: '8px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([['upper', ui.upper], ['lower', ui.lower], ['title', ui.titleCase], ['sentence', ui.sentenceCase], ['camel', ui.camelCase], ['pascal', ui.pascalCase], ['snake', ui.snakeCase], ['kebab', ui.kebabCase]] as const).map(([k, l]) => (
                <button key={k} className={`panel-btn panel-btn-sm${caseMode === k ? ' accent' : ''}`} onClick={() => setCaseMode(k)}>{l}</button>
              ))}
            </div>
          )}
          {tab === 'sort' && (
            <div style={{ padding: '8px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([['asc', ui.az], ['desc', ui.za], ['unique', ui.unique], ['shuffle', ui.shuffle], ['reverse', ui.reverse]] as const).map(([k, l]) => (
                <button key={k} className={`panel-btn panel-btn-sm${sortMode === k ? ' accent' : ''}`} onClick={() => setSortMode(k)}>{l}</button>
              ))}
            </div>
          )}
          {tab === 'replace' && (
            <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input type="text" value={findStr} onChange={(e) => setFindStr(e.target.value)} placeholder={ui.find} style={{ padding: '6px 10px', background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, fontFamily: 'var(--font-mono)' }} />
              <input type="text" value={replaceStr} onChange={(e) => setReplaceStr(e.target.value)} placeholder={ui.replace} style={{ padding: '6px 10px', background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, fontFamily: 'var(--font-mono)' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}><input type="checkbox" checked={useRegex} onChange={(e) => setUseRegex(e.target.checked)} />{ui.regex}</label>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}><input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />{ui.caseSensitive}</label>
              </div>
            </div>
          )}
          {tab === 'escape' && (
            <div style={{ padding: '8px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['json', 'html', 'js', 'url'] as const).map((f) => (
                <button key={f} className={`panel-btn panel-btn-sm${escapeFormat === f ? ' accent' : ''}`} onClick={() => setEscapeFormat(f)}>{f.toUpperCase()}</button>
              ))}
              <span style={{ color: 'var(--border)', margin: '0 4px' }}>|</span>
              <button className={`panel-btn panel-btn-sm${escapeMode === 'escape' ? ' accent' : ''}`} onClick={() => setEscapeMode('escape')}>{ui.escape}</button>
              <button className={`panel-btn panel-btn-sm${escapeMode === 'unescape' ? ' accent' : ''}`} onClick={() => setEscapeMode('unescape')}>{ui.unescape}</button>
            </div>
          )}
          {tab === 'align' && (
            <div style={{ padding: '8px 16px', display: 'flex', gap: 6 }}>
              {([['left', ui.left], ['right', ui.right], ['center', ui.center], ['table', ui.table]] as const).map(([k, l]) => (
                <button key={k} className={`panel-btn panel-btn-sm${alignMode === k ? ' accent' : ''}`} onClick={() => setAlignMode(k)}>{l}</button>
              ))}
            </div>
          )}
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.output')}
            <div className="panel-actions">
              <button className="panel-btn accent" onClick={run}>{ui.run}</button>
              <button className="panel-btn" onClick={swap}>⇄</button>
              <button className="panel-btn" onClick={copy}>{t('common.copy')}</button>
            </div>
          </div>
          {tab === 'case' && output ? (
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {([['upper', ui.upper], ['lower', ui.lower], ['title', ui.titleCase], ['sentence', ui.sentenceCase], ['camel', ui.camelCase], ['pascal', ui.pascalCase], ['snake', ui.snakeCase], ['kebab', ui.kebabCase]] as const).map(([k, l]) => {
                const r = changeCase(input, k);
                return (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 4px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', minWidth: 56, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</span>
                    <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 13, color: r ? 'var(--fg)' : 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r || '—'}</span>
                    <button className="panel-btn panel-btn-sm" onClick={() => navigator.clipboard.writeText(r)} style={{ flexShrink: 0 }}>{t('common.copy')}</button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="output-area" style={{ whiteSpace: 'pre-wrap' }}>{output || t('common.waiting')}</div>
          )}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
