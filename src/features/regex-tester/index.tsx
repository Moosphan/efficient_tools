import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

export default function RegexTester() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('regex');
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState<Record<string, boolean>>({ g: true, i: false, m: false, s: false });
  const [testStr, setTestStr] = useState('');

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
