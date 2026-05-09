import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';

function decodeBase64Url(str: string): string {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4;
  if (pad) s += '='.repeat(4 - pad);
  return atob(s);
}

function parseJwt(token: string) {
  const parts = token.trim().split('.');
  if (parts.length !== 3) throw new Error('JWT 必须包含 3 个部分（Header.Payload.Signature）');

  const [headerB64, payloadB64, signature] = parts;

  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(decodeBase64Url(headerB64));
  } catch {
    throw new Error('Header Base64 解码失败');
  }
  try {
    payload = JSON.parse(decodeBase64Url(payloadB64));
  } catch {
    throw new Error('Payload Base64 解码失败');
  }

  return { header, payload, signature, headerB64, payloadB64 };
}

function getExpiryInfo(payload: Record<string, unknown>): { expired: boolean; text: string } | null {
  const exp = payload.exp;
  if (typeof exp !== 'number') return null;
  const expDate = new Date(exp * 1000);
  const now = new Date();
  const expired = expDate < now;
  const diff = Math.abs(expDate.getTime() - now.getTime());
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);

  if (expired) {
    return { expired: true, text: `已过期 ${hours > 0 ? hours + '小时' : ''}${minutes}分钟前（${expDate.toLocaleString('zh-CN')}）` };
  }
  return { expired: false, text: `${hours > 0 ? hours + '小时' : ''}${minutes}分钟后过期（${expDate.toLocaleString('zh-CN')}）` };
}

function formatJson(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

export default function JwtDecoder() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  useCleanup(() => { setInput(''); });

  const result = useMemo(() => {
    if (!input.trim()) return null;
    try {
      const parsed = parseJwt(input);
      setError('');
      return parsed;
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析失败');
      return null;
    }
  }, [input]);

  const expiryInfo = useMemo(() => {
    if (!result) return null;
    return getExpiryInfo(result.payload);
  }, [result]);

  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <ToolShell title="JWT 解析器" description="解码 JWT Token，展示 Header / Payload / Signature">
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            JWT Token
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => { setInput(''); setError(''); }}>清空</button>
            </div>
          </div>
          <textarea
            className="tool-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="粘贴 JWT Token…\neyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.xxx"
          />
        </div>
        <div className="tool-panel">
          {error && <div className="error-msg">{error}</div>}
          {result ? (
            <>
              <div className="panel-header">
                Header
                <span className="jwt-algo">{(result.header.alg as string) || '?'}</span>
              </div>
              <div className="jwt-section">
                <pre className="jwt-json">{formatJson(result.header)}</pre>
                <button className="panel-btn jwt-copy-btn" onClick={() => copy(formatJson(result.header))}>复制</button>
              </div>

              <div className="panel-header">
                Payload
                {expiryInfo && (
                  <span className={`jwt-expiry ${expiryInfo.expired ? 'expired' : ''}`}>{expiryInfo.text}</span>
                )}
              </div>
              <div className="jwt-section">
                <pre className="jwt-json">{formatJson(result.payload)}</pre>
                <button className="panel-btn jwt-copy-btn" onClick={() => copy(formatJson(result.payload))}>复制</button>
              </div>

              <div className="panel-header">Signature</div>
              <div className="jwt-section">
                <pre className="jwt-json jwt-signature">{result.signature}</pre>
                <button className="panel-btn jwt-copy-btn" onClick={() => copy(result.signature)}>复制</button>
              </div>
            </>
          ) : (
            <div className="output-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              粘贴 JWT Token 后自动解析…
            </div>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
