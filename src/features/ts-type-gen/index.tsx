import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

function jsonToTs(json: string, rootName: string): string {
  const parsed = JSON.parse(json);

  function getType(value: unknown, name: string): { type: string; interfaces: string[] } {
    if (value === null) return { type: 'null', interfaces: [] };
    if (value === undefined) return { type: 'undefined', interfaces: [] };
    if (Array.isArray(value)) {
      if (value.length === 0) return { type: 'unknown[]', interfaces: [] };
      const first = value[0];
      const { type: itemType, interfaces } = getType(first, `${name}Item`);
      return { type: `${itemType}[]`, interfaces };
    }
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const ifaceName = capitalize(name);
      const fields: string[] = [];
      const childInterfaces: string[] = [];
      for (const [key, val] of Object.entries(obj)) {
        const safeName = /^[a-zA-Z_$][\w$]*$/.test(key) ? key : `'${key}'`;
        const { type: fieldType, interfaces } = getType(val, key);
        fields.push(`  ${safeName}: ${fieldType};`);
        childInterfaces.push(...interfaces);
      }
      const iface = `interface ${ifaceName} {\n${fields.join('\n')}\n}`;
      return { type: ifaceName, interfaces: [...childInterfaces, iface] };
    }
    if (typeof value === 'string') return { type: 'string', interfaces: [] };
    if (typeof value === 'number') return { type: Number.isInteger(value) ? 'number' : 'number', interfaces: [] };
    if (typeof value === 'boolean') return { type: 'boolean', interfaces: [] };
    return { type: 'unknown', interfaces: [] };
  }

  function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/[^a-zA-Z0-9]/g, '');
  }

  if (Array.isArray(parsed)) {
    const { type: itemType, interfaces } = getType(parsed[0] ?? {}, rootName + 'Item');
    return [...interfaces, `type ${capitalize(rootName)} = ${itemType}[];`].join('\n\n');
  }

  const { interfaces } = getType(parsed, rootName);
  return interfaces.join('\n\n');
}

const SAMPLE = JSON.stringify({
  id: 1,
  name: '张三',
  email: 'zhangsan@example.com',
  active: true,
  score: 95.5,
  tags: ['developer', 'frontend'],
  address: {
    city: '北京',
    zip: '100000',
  },
}, null, 2);

export default function TsTypeGen() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('tsType');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [rootName, setRootName] = useState('RootObject');

  useCleanup(() => { setInput(''); setOutput(''); });

  const generate = () => {
    if (!input.trim()) { setOutput(''); setError(''); return; }
    try {
      setOutput(jsonToTs(input, rootName || 'RootObject'));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON parse error');
      setOutput('');
    }
  };

  const copy = () => { if (output) navigator.clipboard.writeText(output); };

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.input')}
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => setInput(lang === 'zh' ? SAMPLE : SAMPLE)}>{t('common.example')}</button>
              <button className="panel-btn" onClick={() => { setInput(''); setOutput(''); setError(''); }}>{t('common.clear')}</button>
            </div>
          </div>
          <textarea className="tool-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={ui.placeholder} />
          <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{ui.rootName}</span>
            <input type="text" value={rootName} onChange={(e) => setRootName(e.target.value)} style={{ padding: '4px 8px', background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, fontFamily: 'var(--font-mono)', width: 150 }} />
          </div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.output')}
            <div className="panel-actions">
              <button className="panel-btn accent" onClick={generate}>{ui.generate}</button>
              <button className="panel-btn" onClick={copy}>{t('common.copy')}</button>
            </div>
          </div>
          <pre style={{ flex: 1, padding: 16, margin: 0, fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7, color: output ? 'var(--fg)' : 'var(--muted)', overflow: 'auto', whiteSpace: 'pre-wrap' }}>{output || t('common.waiting')}</pre>
          {error && <div className="error-msg">{t('common.error')}: {error}</div>}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
