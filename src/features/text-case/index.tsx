import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

function toUpper(str: string) { return str.toUpperCase(); }
function toLower(str: string) { return str.toLowerCase(); }
function toTitle(str: string) { return str.replace(/\b\w/g, (c) => c.toUpperCase()); }
function toSentence(str: string) { return str.replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase()); }
function toCamel(str: string) {
  return str.replace(/[^a-zA-Z0-9一-鿿]+(.)?/g, (_, c) => c ? c.toUpperCase() : '').replace(/^[A-Z]/, (c) => c.toLowerCase());
}
function toPascal(str: string) { return toCamel(str).replace(/^[a-z]/, (c) => c.toUpperCase()); }
function toSnake(str: string) { return str.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/[\s\-]+/g, '_').toLowerCase(); }
function toKebab(str: string) { return str.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase(); }

interface CaseItem { key: string; label: string; fn: (s: string) => string; }

export default function TextCase() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('textCase');
  const [input, setInput] = useState('');

  const cases: CaseItem[] = useMemo(() => [
    { key: 'upper', label: ui.upper, fn: toUpper },
    { key: 'lower', label: ui.lower, fn: toLower },
    { key: 'title', label: ui.title, fn: toTitle },
    { key: 'sentence', label: ui.sentence, fn: toSentence },
    { key: 'camel', label: ui.camel, fn: toCamel },
    { key: 'pascal', label: ui.pascal, fn: toPascal },
    { key: 'snake', label: ui.snake, fn: toSnake },
    { key: 'kebab', label: ui.kebab, fn: toKebab },
  ], [ui]);

  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">{t('common.input')}</div>
          <textarea className="tool-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={ui.placeholder} />
        </div>
        <div className="tool-panel">
          <div className="panel-header">{t('common.output')}</div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cases.map((c) => {
              const result = input ? c.fn(input) : '';
              return (
                <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', minWidth: 56, textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.key}</span>
                  <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 13, color: result ? 'var(--fg)' : 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result || '—'}</span>
                  <button className="panel-btn panel-btn-sm" onClick={() => copy(result)} style={{ flexShrink: 0 }}>{t('common.copy')}</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
