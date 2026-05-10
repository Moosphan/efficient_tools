import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

export default function UrlCodec() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('url');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [component, setComponent] = useState(false);
  const [params, setParams] = useState<{ key: string; value: string }[]>([]);

  useCleanup(() => { setInput(''); setOutput(''); setParams([]); });

  const process = () => {
    const raw = input;
    if (!raw) { setOutput(''); setError(''); setParams([]); return; }
    try {
      if (mode === 'encode') {
        setOutput(component ? encodeURIComponent(raw) : encodeURI(raw));
      } else {
        const decoded = component ? decodeURIComponent(raw) : decodeURI(raw);
        setOutput(decoded);
        tryParseParams(decoded);
      }
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '处理失败');
      setOutput('');
    }
  };

  const tryParseParams = (str: string) => {
    try {
      const url = new URL(str);
      const p: { key: string; value: string }[] = [];
      url.searchParams.forEach((value, key) => p.push({ key, value }));
      if (p.length > 0) { setParams(p); return; }
    } catch { /* not a full URL */ }
    if (str.includes('=')) {
      const p: { key: string; value: string }[] = [];
      const sp = new URLSearchParams(str.startsWith('?') ? str : `?${str}`);
      sp.forEach((value, key) => p.push({ key, value }));
      setParams(p);
    } else {
      setParams([]);
    }
  };

  const swap = () => {
    setInput(output);
    setOutput('');
    setParams([]);
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };

  const copy = () => {
    if (output) navigator.clipboard.writeText(output);
  };

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {mode === 'encode' ? t('common.input') : 'Base64'}
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => { setInput(''); setOutput(''); setError(''); setParams([]); }}>{t('common.clear')}</button>
            </div>
          </div>
          <textarea
            className="tool-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ui.placeholder}
          />
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {mode === 'encode' ? t('common.output') : t('common.output')}
            <div className="panel-actions">
              <button className={`panel-btn${component ? ' accent' : ''}`} onClick={() => setComponent(!component)}>{ui.component}</button>
              <button className="panel-btn accent" onClick={process}>{mode === 'encode' ? t('common.encode') : t('common.decode')}</button>
              <button className="panel-btn" onClick={swap}>⇄ {t('common.swap')}</button>
              <button className="panel-btn" onClick={copy}>{t('common.copy')}</button>
            </div>
          </div>
          <div className="output-area">{output || t('common.waiting')}</div>
          {error && <div className="error-msg">{t('common.error')}: {error}</div>}
          {params.length > 0 && (
            <>
              <div className="panel-header">{ui.params}</div>
              <div className="url-params">
                {params.map((p, i) => (
                  <div key={i} className="url-param-row">
                    <span className="url-param-key">{p.key}</span>
                    <span className="url-param-sep">=</span>
                    <span className="url-param-value">{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
