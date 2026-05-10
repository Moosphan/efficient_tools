import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

interface RegexToken { type: 'char' | 'group' | 'alt' | 'quant' | 'anchor' | 'class' | 'escape'; value: string; children?: RegexToken[]; }

function tokenizeRegex(pattern: string): RegexToken[] {
  const tokens: RegexToken[] = [];
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === '(') {
      let depth = 1, j = i + 1;
      while (j < pattern.length && depth > 0) { if (pattern[j] === '(' && pattern[j - 1] !== '\\') depth++; if (pattern[j] === ')' && pattern[j - 1] !== '\\') depth--; j++; }
      const inner = pattern.slice(i + 1, j - 1);
      tokens.push({ type: 'group', value: `(${inner})`, children: tokenizeRegex(inner) });
      i = j;
    } else if (ch === '[') {
      let j = i + 1; if (j < pattern.length && pattern[j] === '^') j++;
      while (j < pattern.length && !(pattern[j] === ']' && pattern[j - 1] !== '\\')) j++;
      tokens.push({ type: 'class', value: pattern.slice(i, j + 1) });
      i = j + 1;
    } else if (ch === '\\' && i + 1 < pattern.length) {
      tokens.push({ type: 'escape', value: pattern.slice(i, i + 2) });
      i += 2;
    } else if (ch === '|') {
      tokens.push({ type: 'alt', value: '|' });
      i++;
    } else if (ch === '*' || ch === '+' || ch === '?') {
      tokens.push({ type: 'quant', value: ch + (pattern[i + 1] === '?' ? '?' : '') });
      i += pattern[i + 1] === '?' ? 2 : 1;
    } else if (ch === '{') {
      let j = i + 1; while (j < pattern.length && pattern[j] !== '}') j++;
      tokens.push({ type: 'quant', value: pattern.slice(i, j + 1) });
      i = j + 1;
    } else if (ch === '^' || ch === '$') {
      tokens.push({ type: 'anchor', value: ch });
      i++;
    } else if (ch === '.') {
      tokens.push({ type: 'escape', value: '.' });
      i++;
    } else {
      tokens.push({ type: 'char', value: ch });
      i++;
    }
  }
  return tokens;
}

function TokenNode({ token }: { token: RegexToken }) {
  const colorMap: Record<string, string> = {
    char: 'var(--fg)',
    group: 'var(--accent)',
    alt: 'var(--red)',
    quant: 'var(--amber)',
    anchor: 'var(--green)',
    class: 'var(--accent)',
    escape: 'var(--violet, #a78bfa)',
  };
  const bgMap: Record<string, string> = {
    char: 'var(--surface-2)',
    group: 'var(--accent-bg, rgba(99,102,241,0.1))',
    alt: 'var(--red-bg, rgba(239,68,68,0.1))',
    quant: 'var(--amber-bg, rgba(245,158,11,0.1))',
    anchor: 'var(--green-bg, rgba(16,185,129,0.1))',
    class: 'var(--accent-bg, rgba(99,102,241,0.1))',
    escape: 'rgba(167,139,250,0.1)',
  };
  const labelMap: Record<string, string> = {
    char: '', group: 'Group', alt: 'OR', quant: 'Quant', anchor: 'Anchor', class: 'Class', escape: '',
  };

  if (token.type === 'group' && token.children) {
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', margin: '0 2px' }}>
        <div style={{ fontSize: 9, color: colorMap.group, marginBottom: 2, fontWeight: 600 }}>{labelMap.group}</div>
        <div style={{ border: `1.5px solid ${colorMap.group}`, borderRadius: 6, padding: '4px 6px', display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', background: bgMap.group }}>
          {token.children.map((c, i) => <TokenNode key={i} token={c} />)}
        </div>
      </div>
    );
  }

  const display = token.type === 'escape' ? token.value
    : token.type === 'anchor' ? (token.value === '^' ? 'START' : 'END')
    : token.type === 'alt' ? 'OR'
    : token.value;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: token.type === 'alt' || token.type === 'quant' ? '2px 6px' : '3px 7px',
      borderRadius: token.type === 'alt' ? 10 : 4,
      fontSize: token.type === 'anchor' ? 9 : 12,
      fontFamily: 'var(--font-mono)',
      fontWeight: token.type === 'anchor' || token.type === 'alt' ? 600 : 400,
      color: colorMap[token.type],
      background: bgMap[token.type],
      border: `1px solid ${colorMap[token.type]}20`,
      margin: '0 1px',
      whiteSpace: 'nowrap',
    }}>
      {display}
    </span>
  );
}

function RegexVisual({ pattern }: { pattern: string }) {
  const tokens = useMemo(() => tokenizeRegex(pattern), [pattern]);
  if (!tokens.length) return null;

  // Split by top-level alternations
  const groups: RegexToken[][] = [[]];
  for (const t of tokens) {
    if (t.type === 'alt') { groups.push([]); }
    else { groups[groups.length - 1].push(t); }
  }

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {groups.map((group, gi) => (
        <div key={gi} style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {gi > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', margin: '0 4px' }}>OR</span>}
          <span style={{ fontSize: 10, color: 'var(--muted)', marginRight: 2 }}>→</span>
          {group.map((token, ti) => <TokenNode key={ti} token={token} />)}
          <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 2 }}>→</span>
        </div>
      ))}
    </div>
  );
}

export default function RegexTester() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('regex');
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState<Record<string, boolean>>({ g: true, i: false, m: false, s: false });
  const [testStr, setTestStr] = useState('');
  const [showVisual, setShowVisual] = useState(true);

  const toggleFlag = (f: string) => setFlags((prev) => ({ ...prev, [f]: !prev[f] }));
  const flagStr = Object.entries(flags).filter(([, v]) => v).map(([k]) => k).join('');

  const result = useMemo(() => {
    if (!pattern || !testStr) return null;
    try {
      const re = new RegExp(pattern, flagStr);
      const matches: { index: number; match: string; groups: string[] }[] = [];
      if (flagStr.includes('g')) {
        let m: RegExpExecArray | null;
        while ((m = re.exec(testStr)) !== null) {
          matches.push({ index: m.index, match: m[0], groups: m.slice(1) });
          if (m[0].length === 0) re.lastIndex++;
        }
      } else {
        const m = re.exec(testStr);
        if (m) matches.push({ index: m.index, match: m[0], groups: m.slice(1) });
      }
      return { matches, error: null };
    } catch (e) {
      return { matches: [], error: e instanceof Error ? e.message : 'Invalid regex' };
    }
  }, [pattern, flagStr, testStr]);

  const highlighted = useMemo(() => {
    if (!result || !result.matches.length || !testStr) return null;
    const parts: { text: string; highlight: boolean }[] = [];
    let last = 0;
    for (const m of result.matches) {
      if (m.index > last) parts.push({ text: testStr.slice(last, m.index), highlight: false });
      parts.push({ text: m.match, highlight: true });
      last = m.index + m.match.length;
    }
    if (last < testStr.length) parts.push({ text: testStr.slice(last), highlight: false });
    return parts;
  }, [result, testStr]);

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {ui.pattern}
            <div className="panel-actions">
              {Object.keys(flags).map((f) => (
                <button key={f} className={`flag-btn${flags[f] ? ' on' : ''}`} onClick={() => toggleFlag(f)}>{f}</button>
              ))}
            </div>
          </div>
          <div className="regex-input-row">
            <span className="delim">/</span>
            <input type="text" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder={ui.placeholder} />
            <span className="delim">/</span>
            <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>{flagStr}</span>
          </div>
          {showVisual && pattern && (
            <div style={{ borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px' }}>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{ui.visual}</span>
                <button className="panel-btn panel-btn-sm" onClick={() => setShowVisual(false)} style={{ fontSize: 10 }}>✕</button>
              </div>
              <RegexVisual pattern={pattern} />
            </div>
          )}
          {!showVisual && pattern && (
            <div style={{ padding: '4px 16px' }}>
              <button className="panel-btn panel-btn-sm" onClick={() => setShowVisual(true)} style={{ fontSize: 11 }}>{ui.showVisual}</button>
            </div>
          )}
          <div className="panel-header">{ui.testStr}</div>
          <textarea className="tool-textarea" value={testStr} onChange={(e) => setTestStr(e.target.value)} placeholder={ui.textPlaceholder} style={{ minHeight: 200 }} />
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {ui.matches}
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{result ? `${result.matches.length}` : '0'}</span>
          </div>
          <div className="output-area" style={{ minHeight: 200 }}>
            {result?.error ? (
              <div className="error-msg">{result.error}</div>
            ) : highlighted ? (
              <span>{highlighted.map((part, i) => part.highlight ? <span key={i} className="match-highlight">{part.text}</span> : <span key={i}>{part.text}</span>)}</span>
            ) : (
              <span style={{ color: 'var(--muted)' }}>{t('common.waiting')}</span>
            )}
          </div>
          <div className="panel-header">{ui.matchList}</div>
          <div style={{ maxHeight: 250, overflow: 'auto' }}>
            {result?.matches.length ? result.matches.map((m, i) => (
              <div key={i} className="match-item">
                <span className="match-idx">#{i + 1}</span>
                <span>{m.match}</span>
                {m.groups.length > 0 && <span className="match-group">{ui.groups}: {m.groups.map((g) => g || '—').join(', ')}</span>}
              </div>
            )) : <div style={{ padding: 16, color: 'var(--muted)', fontSize: 13 }}>{ui.noMatch}</div>}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
