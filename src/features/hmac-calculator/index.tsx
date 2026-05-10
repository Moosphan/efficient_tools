import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

type Algorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

const ALGOS: { value: Algorithm; label: string }[] = [
  { value: 'SHA-1', label: 'HMAC-SHA1' },
  { value: 'SHA-256', label: 'HMAC-SHA256' },
  { value: 'SHA-384', label: 'HMAC-SHA384' },
  { value: 'SHA-512', label: 'HMAC-SHA512' },
];

async function computeHmac(message: string, secret: string, algo: Algorithm, encoding: 'hex' | 'base64'): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: algo }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const bytes = new Uint8Array(sig);
  if (encoding === 'base64') {
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
  }
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function HmacCalculator() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('hmac');
  const [message, setMessage] = useState('');
  const [secret, setSecret] = useState('');
  const [algo, setAlgo] = useState<Algorithm>('SHA-256');
  const [encoding, setEncoding] = useState<'hex' | 'base64'>('hex');
  const [results, setResults] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const compute = async () => {
    if (!message || !secret) { setResults({}); setError(''); return; }
    try {
      const hash = await computeHmac(message, secret, algo, encoding);
      setResults({ [`${algo}-${encoding}`]: hash });
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'HMAC error');
    }
  };

  const computeAll = async () => {
    if (!message || !secret) { setResults({}); setError(''); return; }
    try {
      const entries = await Promise.all(
        ALGOS.map(async (a) => {
          const hex = await computeHmac(message, secret, a.value, 'hex');
          return [a.value, hex] as const;
        })
      );
      setResults(Object.fromEntries(entries));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'HMAC error');
    }
  };

  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">{ui.message}</div>
          <textarea className="tool-textarea" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={ui.messagePlaceholder} style={{ minHeight: 120 }} />
          <div className="panel-header">{ui.secret}</div>
          <input type="text" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder={ui.secretPlaceholder} style={{ margin: '0 16px 12px', padding: '8px 12px', width: 'calc(100% - 32px)', boxSizing: 'border-box', fontFamily: 'var(--font-mono)', fontSize: 13, background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 6 }} />
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {ui.algorithm}
            <div className="panel-actions">
              {ALGOS.map((a) => (
                <button key={a.value} className={`panel-btn panel-btn-sm${algo === a.value ? ' accent' : ''}`} onClick={() => setAlgo(a.value)}>{a.label}</button>
              ))}
            </div>
          </div>
          <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{ui.outputFormat}</span>
            <button className={`panel-btn panel-btn-sm${encoding === 'hex' ? ' accent' : ''}`} onClick={() => setEncoding('hex')}>HEX</button>
            <button className={`panel-btn panel-btn-sm${encoding === 'base64' ? ' accent' : ''}`} onClick={() => setEncoding('base64')}>Base64</button>
          </div>
          <div style={{ padding: '8px 16px', display: 'flex', gap: 8 }}>
            <button className="panel-btn accent" onClick={compute} style={{ flex: 1 }}>{ui.compute}</button>
            <button className="panel-btn" onClick={computeAll} style={{ flex: 1 }}>{ui.computeAll}</button>
          </div>
          <div style={{ padding: '8px 16px' }}>
            {Object.entries(results).map(([key, hash]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', minWidth: 90, fontFamily: 'var(--font-mono)' }}>{key}</span>
                <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12, wordBreak: 'break-all', color: 'var(--fg)' }}>{hash}</span>
                <button className="panel-btn panel-btn-sm" onClick={() => copy(hash)} style={{ flexShrink: 0 }}>{t('common.copy')}</button>
              </div>
            ))}
            {error && <div className="error-msg">{t('common.error')}: {error}</div>}
            {Object.keys(results).length === 0 && !error && <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: 24 }}>{t('common.waiting')}</div>}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
