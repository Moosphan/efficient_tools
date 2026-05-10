import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

function formatGraphQL(query: string, indent: number): string {
  const pad = ' '.repeat(indent);
  let result = '';
  let level = 0;
  let i = 0;
  const q = query.trim();

  while (i < q.length) {
    const ch = q[i];

    // Skip whitespace
    if (/\s/.test(ch)) { i++; continue; }

    // Comment
    if (ch === '#') { let e = i; while (e < q.length && q[e] !== '\n') e++; result += pad.repeat(level) + q.slice(i, e) + '\n'; i = e; continue; }

    // String literal
    if (ch === '"' || ch === "'") {
      const quote = ch; let e = i + 1;
      if (q.slice(i, i + 3) === '"""') { e = i + 3; while (e < q.length && q.slice(e, e + 3) !== '"""') e++; e += 3; }
      else { while (e < q.length && q[e] !== quote) { if (q[e] === '\\') e++; e++; } e++; }
      result += q.slice(i, e); i = e; continue;
    }

    // Opening brace
    if (ch === '{') {
      // Check if this is a fragment/mutation/query definition
      const before = result.trimEnd();
      const needsSpace = before.length > 0 && !before.endsWith('{') && !before.endsWith('(');
      if (needsSpace) result += ' ';
      result += '{\n';
      level++;
      i++;
      continue;
    }

    // Closing brace
    if (ch === '}') {
      level = Math.max(0, level - 1);
      result += pad.repeat(level) + '}\n';
      i++;
      continue;
    }

    // Opening paren
    if (ch === '(') {
      result += '(';
      i++;
      // Inline content until closing paren
      let depth = 1;
      let inline = '';
      while (i < q.length && depth > 0) {
        if (q[i] === '(') depth++;
        if (q[i] === ')') depth--;
        if (depth > 0) inline += q[i];
        i++;
      }
      // Format args
      const args = inline.split(',').map((a) => a.trim()).filter(Boolean);
      if (args.length <= 2) {
        result += args.join(', ') + ')';
      } else {
        result += '\n' + args.map((a) => pad.repeat(level + 1) + a).join(',\n') + '\n' + pad.repeat(level) + ')';
      }
      continue;
    }

    // Colon (field alias or argument)
    if (ch === ':') { result += ': '; i++; continue; }

    // Spread operator
    if (ch === '.' && q[i + 1] === '.' && q[i + 2] === '.') {
      result += pad.repeat(level) + '...';
      i += 3;
      // Read fragment name
      let name = '';
      while (i < q.length && /[a-zA-Z0-9_]/.test(q[i])) { name += q[i]; i++; }
      result += name;
      continue;
    }

    // Identifier / keyword
    if (/[a-zA-Z_$@]/.test(ch)) {
      let word = '';
      while (i < q.length && /[a-zA-Z0-9_$@]/.test(q[i])) { word += q[i]; i++; }

      // Check if it's a definition keyword
      const isDef = ['query', 'mutation', 'subscription', 'fragment', 'type', 'input', 'enum', 'interface', 'union', 'extend'].includes(word);
      if (isDef) {
        if (result.trim().length > 0 && !result.endsWith('\n')) result += '\n';
        result += pad.repeat(level) + word;
      } else {
        // It's a field — indent it
        const lastChar = result.trimEnd().slice(-1);
        if (lastChar === '{' || lastChar === '\n' || result.trim().length === 0) {
          result += pad.repeat(level) + word;
        } else {
          result += ' ' + word;
        }
      }
      continue;
    }

    // Other characters
    result += ch;
    i++;
  }

  return result.trim();
}

const SAMPLE = `query GetUser($id: ID!) { user(id: $id) { name email posts(first: 10) { title createdAt comments { body author { name avatar } } } } }`;

export default function GraphqlFormatter() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('graphql');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [indent, setIndent] = useState(2);

  useCleanup(() => { setInput(''); setOutput(''); });

  const format = () => {
    if (!input.trim()) { setOutput(''); return; }
    setOutput(formatGraphQL(input, indent));
  };

  const minify = () => {
    if (!input.trim()) { setOutput(''); return; }
    setOutput(input.replace(/\s+/g, ' ').replace(/\s*([{}(),:])\s*/g, '$1').trim());
  };

  const copy = () => { if (output) navigator.clipboard.writeText(output); };

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.input')}
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => setInput(SAMPLE)}>{t('common.example')}</button>
              <button className="panel-btn" onClick={() => { setInput(''); setOutput(''); }}>{t('common.clear')}</button>
            </div>
          </div>
          <textarea className="tool-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={ui.placeholder} />
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.output')}
            <div className="panel-actions">
              <button className="panel-btn accent" onClick={format}>{ui.format}</button>
              <button className="panel-btn" onClick={minify}>{ui.minify}</button>
              <button className="panel-btn" onClick={copy}>{t('common.copy')}</button>
            </div>
          </div>
          <div className="output-area" style={{ whiteSpace: 'pre-wrap' }}>{output || t('common.waiting')}</div>
          <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{ui.indent}</span>
            {[2, 4].map((n) => (
              <button key={n} className={`panel-btn panel-btn-sm${indent === n ? ' accent' : ''}`} onClick={() => setIndent(n)}>{n}</button>
            ))}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
