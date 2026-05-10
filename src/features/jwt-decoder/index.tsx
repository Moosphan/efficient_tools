import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

function decodeBase64Url(str: string): string {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4;
  if (pad) s += '='.repeat(4 - pad);
  return atob(s);
}

function parseJwt(token: string, invalidMsg: string) {
  const parts = token.trim().split('.');
  if (parts.length !== 3) throw new Error(invalidMsg);
  const [headerB64, payloadB64, signature] = parts;
  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try { header = JSON.parse(decodeBase64Url(headerB64)); } catch { throw new Error('Header Base64 decode failed'); }
  try { payload = JSON.parse(decodeBase64Url(payloadB64)); } catch { throw new Error('Payload Base64 decode failed'); }
  return { header, payload, signature, headerB64, payloadB64 };
}

function getExpiryInfo(payload: Record<string, unknown>, lang: string): { expired: boolean; text: string } | null {
  const exp = payload.exp;
  if (typeof exp !== 'number') return null;
  const expDate = new Date(exp * 1000);
  const now = new Date();
  const expired = expDate < now;
  const diff = Math.abs(expDate.getTime() - now.getTime());
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
  const dateStr = expDate.toLocaleString(locale);
  if (lang === 'zh') {
    return { expired, text: expired
      ? `已过期 ${hours > 0 ? hours + '小时' : ''}${minutes}分钟前（${dateStr}）`
      : `${hours > 0 ? hours + '小时' : ''}${minutes}分钟后过期（${dateStr}）` };
  }
  return { expired, text: expired
    ? `Expired ${hours > 0 ? hours + 'h ' : ''}${minutes}m ago (${dateStr})`
    : `Expires in ${hours > 0 ? hours + 'h ' : ''}${minutes}m (${dateStr})` };
}

export default function JwtDecoder() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('jwt');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  useCleanup(() => { setInput(''); });

  const result = useMemo(() => {
    if (!input.trim()) return null;
    try {
      const parsed = parseJwt(input, ui.invalid);
      setError('');
      return parsed;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Parse error');
      return null;
    }
  }, [input, ui.invalid]);

  const expiryInfo = useMemo(() => result ? getExpiryInfo(result.payload, lang) : null, [result, lang]);
  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            JWT Token
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => { setInput(''); setError(''); }}>{t('common.clear')}</button>
            </div>
          </div>
          <textarea className="tool-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={ui.placeholder} />
        </div>
        <div className="tool-panel">
          {error && <div className="error-msg">{error}</div>}
          {result ? (
            <>
              <div className="panel-header">{ui.header}<span className="jwt-algo">{(result.header.alg as string) || '?'}</span></div>
              <div className="jwt-section">
                <pre className="jwt-json">{JSON.stringify(result.header, null, 2)}</pre>
                <button className="panel-btn jwt-copy-btn" onClick={() => copy(JSON.stringify(result.header, null, 2))}>{t('common.copy')}</button>
              </div>
              <div className="panel-header">{ui.payload}{expiryInfo && <span className={`jwt-expiry ${expiryInfo.expired ? 'expired' : ''}`}>{expiryInfo.text}</span>}</div>
              <div className="jwt-section">
                <pre className="jwt-json">{JSON.stringify(result.payload, null, 2)}</pre>
                <button className="panel-btn jwt-copy-btn" onClick={() => copy(JSON.stringify(result.payload, null, 2))}>{t('common.copy')}</button>
              </div>
              <div className="panel-header">{ui.signature}</div>
              <div className="jwt-section">
                <pre className="jwt-json jwt-signature">{result.signature}</pre>
                <button className="panel-btn jwt-copy-btn" onClick={() => copy(result.signature)}>{t('common.copy')}</button>
              </div>
            </>
          ) : (
            <div className="output-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>{t('common.waiting')}</div>
          )}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
