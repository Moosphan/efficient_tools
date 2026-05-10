import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

export default function Base64Codec() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('base64');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [urlSafe, setUrlSafe] = useState(false);

  useCleanup(() => { setInput(''); setOutput(''); });

  const process = () => {
    const raw = input;
    if (!raw) { setOutput(''); setError(''); return; }
    try {
      if (mode === 'encode') {
        let encoded = btoa(unescape(encodeURIComponent(raw)));
        if (urlSafe) encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        setOutput(encoded);
      } else {
        let str = raw;
        if (urlSafe) str = str.replace(/-/g, '+').replace(/_/g, '/');
        const pad = str.length % 4;
        if (pad) str += '='.repeat(4 - pad);
        setOutput(decodeURIComponent(escape(atob(str))));
      }
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '处理失败');
      setOutput('');
    }
  };

  const swap = () => {
    setInput(output);
    setOutput('');
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
            {mode === 'encode' ? ui.encode : ui.decode}
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => { setInput(''); setOutput(''); setError(''); }}>{t('common.clear')}</button>
            </div>
          </div>
          <textarea
            className="tool-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? ui.placeholder : ui.decodePlaceholder}
          />
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {mode === 'encode' ? 'Base64' : t('common.output')}
            <div className="panel-actions">
              <button className={`panel-btn${urlSafe ? ' accent' : ''}`} onClick={() => setUrlSafe(!urlSafe)}>URL-safe</button>
              <button className="panel-btn accent" onClick={process}>{mode === 'encode' ? t('common.encode') : t('common.decode')}</button>
              <button className="panel-btn" onClick={swap}>⇄ {t('common.swap')}</button>
              <button className="panel-btn" onClick={copy}>{t('common.copy')}</button>
            </div>
          </div>
          <div className="output-area">{output || t('common.waiting')}</div>
          {error && <div className="error-msg">{t('common.error')}: {error}</div>}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
