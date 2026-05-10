import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'BETWEEN', 'LIKE',
  'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'CROSS', 'FULL', 'ON', 'AS',
  'GROUP', 'BY', 'ORDER', 'ASC', 'DESC', 'HAVING', 'LIMIT', 'OFFSET',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TABLE',
  'INDEX', 'VIEW', 'IF', 'EXISTS', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'DEFAULT',
  'UNIQUE', 'CHECK', 'CONSTRAINT', 'UNION', 'ALL', 'DISTINCT', 'TOP', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'WITH', 'RECURSIVE', 'FETCH', 'NEXT', 'ROWS', 'ONLY', 'OVER', 'PARTITION',
]);

const NEWLINE_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN',
  'CROSS JOIN', 'FULL JOIN', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
  'UNION', 'UNION ALL', 'INSERT INTO', 'VALUES', 'SET', 'ON', 'WITH',
]);

function formatSql(sql: string, indent: number): string {
  const pad = ' '.repeat(indent);
  // Tokenize: split by whitespace and parentheses, keeping them as tokens
  const tokens: string[] = [];
  let i = 0;
  while (i < sql.length) {
    if (sql[i] === ' ' || sql[i] === '\t' || sql[i] === '\n' || sql[i] === '\r') { i++; continue; }
    if (sql[i] === '\'' || sql[i] === '"') {
      const quote = sql[i]; let j = i + 1;
      while (j < sql.length && sql[j] !== quote) { if (sql[j] === '\\') j++; j++; }
      tokens.push(sql.slice(i, j + 1)); i = j + 1; continue;
    }
    if (sql[i] === '-' && sql[i + 1] === '-') {
      let j = i + 2; while (j < sql.length && sql[j] !== '\n') j++;
      tokens.push(sql.slice(i, j)); i = j; continue;
    }
    if (sql[i] === '(' || sql[i] === ')' || sql[i] === ',' || sql[i] === ';') {
      tokens.push(sql[i]); i++; continue;
    }
    let j = i; while (j < sql.length && !/[\s(),;]/.test(sql[j])) j++;
    tokens.push(sql.slice(i, j)); i = j;
  }

  let result = '';
  let level = 0;
  let newLine = true;

  for (let t = 0; t < tokens.length; t++) {
    const token = tokens[t];
    const upper = token.toUpperCase();
    const isKeyword = SQL_KEYWORDS.has(upper);

    if (token === '(') {
      result += ' (';
      level++;
      newLine = true;
      continue;
    }
    if (token === ')') {
      level = Math.max(0, level - 1);
      if (newLine) result += '\n' + pad.repeat(level);
      result += ')';
      newLine = false;
      continue;
    }
    if (token === ',') {
      result += ',\n' + pad.repeat(level);
      newLine = true;
      continue;
    }
    if (token === ';') {
      result += ';\n\n';
      newLine = true;
      continue;
    }

    // Check if this keyword should start a new line
    const multiWord = t + 1 < tokens.length ? `${upper} ${tokens[t + 1]?.toUpperCase()}` : '';
    const isNewLine = NEWLINE_KEYWORDS.has(upper) || NEWLINE_KEYWORDS.has(multiWord);

    if (isNewLine && !newLine) {
      result += '\n' + pad.repeat(level);
      newLine = true;
    }

    if (newLine) {
      if (!isNewLine) result += pad.repeat(level);
      newLine = false;
    } else {
      result += ' ';
    }

    result += isKeyword ? upper : token;

    // Skip next token if we matched a multi-word keyword
    if (NEWLINE_KEYWORDS.has(multiWord) && t + 1 < tokens.length) {
      t++;
      result += ' ' + tokens[t].toUpperCase();
    }
  }

  return result.trim();
}

const SAMPLE = `SELECT u.id, u.name, u.email, COUNT(o.id) AS order_count, SUM(o.total) AS total_spent FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.status = 'active' AND u.created_at > '2024-01-01' GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 5 ORDER BY total_spent DESC LIMIT 100;`;

export default function SqlFormatter() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('sql');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [indent, setIndent] = useState(2);

  useCleanup(() => { setInput(''); setOutput(''); });

  const format = () => {
    if (!input.trim()) { setOutput(''); return; }
    setOutput(formatSql(input, indent));
  };

  const minify = () => {
    if (!input.trim()) { setOutput(''); return; }
    setOutput(input.replace(/\s+/g, ' ').replace(/\s*([(),;])\s*/g, '$1').trim());
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
          <div className="output-area">{output || t('common.waiting')}</div>
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
