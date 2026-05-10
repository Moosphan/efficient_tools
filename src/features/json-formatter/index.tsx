import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

const SAMPLE_ZH = JSON.stringify({ name: "Efficient Tools", version: "1.0.0", tools: [{ id: "json", status: "可用" }, { id: "regex", status: "可用" }], config: { theme: "flow", lang: "zh-CN" } }, null, 2);
const SAMPLE_EN = JSON.stringify({ name: "Efficient Tools", version: "1.0.0", tools: [{ id: "json", status: "available" }, { id: "regex", status: "available" }], config: { theme: "flow", lang: "en" } }, null, 2);

export default function JsonFormatter() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('json');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  useCleanup(() => { setInput(''); setOutput(''); });

  const format = () => {
    const raw = input.trim();
    if (!raw) { setOutput(''); setError(''); return; }
    try { setOutput(JSON.stringify(JSON.parse(raw), null, 2)); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Invalid JSON'); }
  };

  const minify = () => {
    const raw = input.trim();
    if (!raw) { setOutput(''); setError(''); return; }
    try { setOutput(JSON.stringify(JSON.parse(raw))); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Invalid JSON'); }
  };

  const copy = () => { if (output) navigator.clipboard.writeText(output); };

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.input')}
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => setInput(lang === 'zh' ? SAMPLE_ZH : SAMPLE_EN)}>{t('common.example')}</button>
              <button className="panel-btn" onClick={() => { setInput(''); setOutput(''); setError(''); }}>{t('common.clear')}</button>
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
          {error && <div className="error-msg">{ui.errorPrefix}: {error}</div>}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
