import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

function formatXml(xml: string, indent: number): string {
  let formatted = '';
  let level = 0;
  const pad = ' '.repeat(indent);
  // Normalize and split into tags
  const nodes = xml.replace(/>\s*</g, '><').replace(/(<[^>]+>)/g, '\n$1\n').split('\n').filter((s) => s.trim());

  for (const node of nodes) {
    const trimmed = node.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('</')) {
      level = Math.max(0, level - 1);
      formatted += pad.repeat(level) + trimmed + '\n';
    } else if (trimmed.startsWith('<?') || trimmed.startsWith('<!')) {
      formatted += trimmed + '\n';
    } else if (trimmed.endsWith('/>')) {
      formatted += pad.repeat(level) + trimmed + '\n';
    } else if (trimmed.startsWith('<')) {
      formatted += pad.repeat(level) + trimmed + '\n';
      level++;
    } else {
      // Text content
      formatted += pad.repeat(level) + trimmed + '\n';
    }
  }
  return formatted.trimEnd();
}

function minifyXml(xml: string): string {
  return xml.replace(/>\s+</g, '><').replace(/\n\s*/g, '').trim();
}

function xmlToJson(xml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) throw new Error(errorNode.textContent || 'XML parse error');

  function nodeToObj(node: Element): unknown {
    const children = Array.from(node.childNodes).filter((n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent?.trim()));
    const obj: Record<string, unknown> = {};
    // Attributes
    for (const attr of Array.from(node.attributes)) {
      obj[`@${attr.name}`] = attr.value;
    }
    if (children.length === 0 && Object.keys(obj).length === 0) return null;
    if (children.length === 1 && children[0].nodeType === 3) {
      const text = children[0].textContent?.trim() ?? '';
      if (Object.keys(obj).length === 0) return text;
      obj['#text'] = text;
      return obj;
    }
    for (const child of children) {
      if (child.nodeType === 3) {
        const text = child.textContent?.trim();
        if (text) obj['#text'] = (obj['#text'] ?? '') + text;
        continue;
      }
      const el = child as Element;
      const key = el.tagName;
      const val = nodeToObj(el);
      if (obj[key] !== undefined) {
        if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
        (obj[key] as unknown[]).push(val);
      } else {
        obj[key] = val;
      }
    }
    return obj;
  }

  const root = doc.documentElement;
  const result: Record<string, unknown> = {};
  result[root.tagName] = nodeToObj(root);
  return JSON.stringify(result, null, 2);
}

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <user id="1">
    <name>张三</name>
    <age>28</age>
    <email>zhangsan@example.com</email>
  </user>
  <user id="2">
    <name>李四</name>
    <age>32</age>
    <email>lisi@example.com</email>
  </user>
</root>`;

export default function XmlFormatter() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('xml');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [indent, setIndent] = useState(2);

  useCleanup(() => { setInput(''); setOutput(''); setError(''); });

  const process = (action: 'format' | 'minify' | 'json') => {
    if (!input.trim()) { setOutput(''); setError(''); return; }
    try {
      if (action === 'format') setOutput(formatXml(input, indent));
      else if (action === 'minify') setOutput(minifyXml(input));
      else setOutput(xmlToJson(input));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'XML parse error');
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
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.output')}
            <div className="panel-actions">
              <button className="panel-btn accent" onClick={() => process('format')}>{ui.format}</button>
              <button className="panel-btn" onClick={() => process('minify')}>{ui.minify}</button>
              <button className="panel-btn" onClick={() => process('json')}>{ui.toJson}</button>
              <button className="panel-btn" onClick={copy}>{t('common.copy')}</button>
            </div>
          </div>
          <div className="output-area">{output || t('common.waiting')}</div>
          {error && <div className="error-msg">{ui.errorPrefix}: {error}</div>}
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
