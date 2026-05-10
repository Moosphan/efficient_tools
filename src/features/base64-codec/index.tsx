import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

const B32_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bits = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    result += B32_ALPHA[parseInt(chunk, 2)];
  }
  const pad = (8 - (result.length % 8)) % 8;
  return result + '='.repeat(pad);
}

function base32Decode(str: string): string {
  const cleaned = str.replace(/=+$/, '').toUpperCase();
  let bits = '';
  for (const ch of cleaned) {
    const idx = B32_ALPHA.indexOf(ch);
    if (idx === -1) throw new Error(`Invalid Base32 char: ${ch}`);
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

type CodecFormat = 'base64' | 'base32';

export default function Base64Codec() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('base64');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [format, setFormat] = useState<CodecFormat>('base64');
  const [urlSafe, setUrlSafe] = useState(false);

  useCleanup(() => { setInput(''); setOutput(''); });

  const process = () => {
    const raw = input;
    if (!raw) { setOutput(''); setError(''); return; }
    try {
      if (format === 'base32') {
        setOutput(mode === 'encode' ? base32Encode(raw) : base32Decode(raw));
      } else {
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
            {t('common.output')}
            <div className="panel-actions">
              <button className={`panel-btn panel-btn-sm${format === 'base64' ? ' accent' : ''}`} onClick={() => setFormat('base64')}>Base64</button>
              <button className={`panel-btn panel-btn-sm${format === 'base32' ? ' accent' : ''}`} onClick={() => setFormat('base32')}>Base32</button>
              {format === 'base64' && <button className={`panel-btn${urlSafe ? ' accent' : ''}`} onClick={() => setUrlSafe(!urlSafe)}>URL-safe</button>}
            </div>
          </div>
          <div style={{ padding: '8px 16px', display: 'flex', gap: 8 }}>
            <button className="panel-btn accent" onClick={process}>{mode === 'encode' ? t('common.encode') : t('common.decode')}</button>
            <button className="panel-btn" onClick={swap}>⇄ {t('common.swap')}</button>
            <button className="panel-btn" onClick={copy}>{t('common.copy')}</button>
          </div>
          <div className="output-area">{output || t('common.waiting')}</div>
          {error && <div className="error-msg">{t('common.error')}: {error}</div>}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
