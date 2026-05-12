import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

const SEPARATORS = [
  { id: 'hyphen', label: '-', value: '-' },
  { id: 'underscore', label: '_', value: '_' },
  { id: 'dot', label: '.', value: '.' },
] as const;

type CaseMode = 'lower' | 'upper' | 'title';

function toSlug(text: string, separator: string, caseMode: CaseMode, maxLength: number, trim: boolean, removeStopWords: boolean): string {
  const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it', 'its']);

  let slug = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, separator)
    .replace(new RegExp(`[${separator}]+`, 'g'), separator);

  if (removeStopWords) {
    slug = slug.split(separator).filter((w) => !stopWords.has(w.toLowerCase())).join(separator);
  }

  switch (caseMode) {
    case 'lower': slug = slug.toLowerCase(); break;
    case 'upper': slug = slug.toUpperCase(); break;
    case 'title': slug = slug.split(separator).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(separator); break;
  }

  if (trim) {
    const esc = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    slug = slug.replace(new RegExp(`^${esc}+|${esc}+$`, 'g'), '');
  }

  if (maxLength > 0 && slug.length > maxLength) {
    slug = slug.slice(0, maxLength);
    const lastSep = slug.lastIndexOf(separator);
    if (lastSep > maxLength * 0.6) slug = slug.slice(0, lastSep);
  }

  return slug;
}

export default function SlugGenerator() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('slug');
  const [input, setInput] = useState('');
  const [separator, setSeparator] = useState('-');
  const [caseMode, setCaseMode] = useState<CaseMode>('lower');
  const [maxLength, setMaxLength] = useState(0);
  const [trim, setTrim] = useState(true);
  const [removeStop, setRemoveStop] = useState(false);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => input ? toSlug(input, separator, caseMode, maxLength, trim, removeStop) : '', [input, separator, caseMode, maxLength, trim, removeStop]);

  const variants = useMemo(() => {
    if (!input) return [];
    return [
      { label: ui.lowercase, slug: toSlug(input, separator, 'lower', 0, true, false) },
      { label: ui.uppercase, slug: toSlug(input, separator, 'upper', 0, true, false) },
      { label: ui.titleCase, slug: toSlug(input, separator, 'title', 0, true, false) },
      { label: ui.noStopWords, slug: toSlug(input, separator, caseMode, 0, true, true) },
    ];
  }, [input, separator, caseMode]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">{t('common.input')}</div>
          <textarea className="tool-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={ui.placeholder} />
          <div className="slug-settings">
            <div className="slug-row">
              <label>{ui.separator}</label>
              <div className="panel-actions">
                {SEPARATORS.map((s) => (
                  <button key={s.id} className={`panel-btn panel-btn-sm${separator === s.value ? ' accent' : ''}`} onClick={() => setSeparator(s.value)}>{s.label}</button>
                ))}
              </div>
            </div>
            <div className="slug-row">
              <label>{ui.case}</label>
              <div className="panel-actions">
                {(['lower', 'upper', 'title'] as CaseMode[]).map((m) => (
                  <button key={m} className={`panel-btn panel-btn-sm${caseMode === m ? ' accent' : ''}`} onClick={() => setCaseMode(m)}>{ui[`case_${m}`]}</button>
                ))}
              </div>
            </div>
            <div className="slug-row">
              <label>{ui.maxLength}</label>
              <input type="number" className="input-field" value={maxLength} onChange={(e) => setMaxLength(Number(e.target.value))} min={0} max={500} style={{ width: 80 }} />
              <label className="terminal-toggle" style={{ marginLeft: 12 }}><input type="checkbox" checked={trim} onChange={(e) => setTrim(e.target.checked)} /><span>{ui.trim}</span></label>
              <label className="terminal-toggle" style={{ marginLeft: 12 }}><input type="checkbox" checked={removeStop} onChange={(e) => setRemoveStop(e.target.checked)} /><span>{ui.removeStop}</span></label>
            </div>
          </div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.output')}
            {output && <div className="panel-actions"><button className="panel-btn" onClick={() => copy(output)}>{copied ? t('common.copied') : t('common.copy')}</button></div>}
          </div>
          <div className="slug-output">
            <div className="slug-result">{output || t('common.waiting')}</div>
            {variants.length > 0 && (
              <div className="slug-variants">
                <div className="slug-variants-title">{ui.variants}</div>
                {variants.map((v) => (
                  <div key={v.label} className="slug-variant" onClick={() => copy(v.slug)}>
                    <span className="slug-variant-label">{v.label}</span>
                    <span className="slug-variant-value">{v.slug}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} />}
    </ToolShell>
  );
}
