import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

function parsePem(pem: string): { type: string; der: string; base64: string } | null {
  const match = pem.match(/-----BEGIN (.*?)-----([\s\S]*?)-----END .*?-----/);
  if (!match) return null;
  return { type: match[1].trim(), der: match[2].replace(/\s/g, ''), base64: match[2].replace(/\s/g, '') };
}

function base64ToHex(b64: string): string {
  try {
    const binary = atob(b64);
    return Array.from(binary).map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join(':');
  } catch { return ''; }
}

function parseX509Details(base64: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    result['DER 字节长度'] = `${bytes.length} bytes`;

    // Simple ASN.1 DER parser for common X.509 fields
    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

    // Look for validity period dates (UTCTime format: YYMMDDHHMMSSZ)
    const utcPattern = /(\d{12})5a/gi;
    const dates: string[] = [];
    let dm: RegExpExecArray | null;
    while ((dm = utcPattern.exec(hex)) !== null) {
      const raw = dm[1];
      const yy = parseInt(raw.slice(0, 2));
      const year = yy >= 50 ? 1900 + yy : 2000 + yy;
      dates.push(`${year}-${raw.slice(2, 4)}-${raw.slice(4, 6)} ${raw.slice(6, 8)}:${raw.slice(8, 10)}:${raw.slice(10, 12)} UTC`);
    }
    if (dates.length >= 2) {
      result['有效期起始'] = dates[0];
      result['有效期截止'] = dates[1];
      const expDate = new Date(dates[1].replace(' UTC', 'Z'));
      const now = new Date();
      const daysLeft = Math.floor((expDate.getTime() - now.getTime()) / 86400000);
      result['剩余天数'] = daysLeft >= 0 ? `${daysLeft} 天` : `已过期 ${-daysLeft} 天`;
    }

    // Look for RSA public key (OID 2a864886f70d010101 = 1.2.840.113549.1.1.1)
    if (hex.includes('2a864886f70d010101')) {
      result['签名算法'] = 'RSA (sha256WithRSAEncryption 或类似)';
    }
    if (hex.includes('2a8648ce3d0201')) {
      result['签名算法'] = 'ECDSA (ecPublicKey)';
    }

    // Look for common OIDs for subject/issuer
    // CN = 550403
    const cnPattern = /550403([0-9a-f]{2})([0-9a-f]*)/gi;
    const cns: string[] = [];
    let cnm: RegExpExecArray | null;
    while ((cnm = cnPattern.exec(hex)) !== null) {
      const len = parseInt(cnm[1], 16);
      const hexStr = cnm[2].slice(0, len * 2);
      try {
        const bytes2 = hexStr.match(/.{2}/g)?.map((h) => parseInt(h, 16)) ?? [];
        const text = new TextDecoder('utf-8').decode(new Uint8Array(bytes2));
        if (text.length > 0 && text.length < 200) cns.push(text);
      } catch { /* ignore */ }
    }
    if (cns.length >= 1) result['主题 CN'] = cns[0];
    if (cns.length >= 2) result['颁发者 CN'] = cns[1];

    // Version
    if (hex.includes('a003020102')) result['版本'] = 'v3 (X.509 v3)';
    else if (hex.includes('a003020101')) result['版本'] = 'v2';
    else if (hex.includes('a003020100')) result['版本'] = 'v1';

    // Key length estimation
    const keyLenMatch = hex.match(/00300d06092a864886f70d01010[0-9a-f]050003([\da-f]{2})/i);
    if (keyLenMatch) {
      const bits = parseInt(keyLenMatch[1].slice(0, 2), 16) * 4;
      if (bits >= 1024) result['公钥长度(估)'] = `~${bits} bits`;
    }

  } catch { /* ignore parse errors */ }
  return result;
}

const SAMPLE = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAJC1HiIAZAiUMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTkwNTI5MDYyNjQ0WhcNMjkwNTI2MDYyNjQ0WjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEA0Z3VS5JJcds3xfn/ygWep4PAt3SMwXygcEJDYLFAMoGE3JkGHzIYNJwF
CwC+VfkDN0rDR0S4KLGjZnfSdJcEHBfzZyHpCFkGwC2FwyJEB0UYTkFkPWOBjAmm
kA0Lc9La5K3AkBfKbqZOlCILGVGERiE8HFmUGR5GMQPXrO0REW0QCJa35+kbnKxV
VzGz+j+BJa09eyNBJ9D5zU7NKZFg3kBxM0GJ0VXlO4JR0HL6iYPpKK0J8xQ7UG6o
DR4FN1BMG4gPa4H7IkuKmi6L2JGjMOBPBm1aOD0xjJHMx7s7EJX4oGJ4UJGk1MK1
mVFRdl2XQQ3pOOkAHjFwE4ln0wIDAQABo1AwTjAdBgNVHQ4EFgQU2U2GF4FBfcj4
qI0jQxkBe0JdYRQwHwYDVR0jBBgwFoAU2U2GF4FBfcj4qI0jQxkBe0JdYRQwDAYD
VR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAD1gmNN2eOKgB6q2OlRE12nKm
Y/6LNH+kcMFzj2E6LJmJJK2D6fvULVFSYJXRW9Q4Yb4SJ0F+BKk4j9jX0L+0U6B
-----END CERTIFICATE-----`;

export default function X509Parser() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('x509');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [pemType, setPemType] = useState('');
  const [hexPreview, setHexPreview] = useState('');

  const parse = () => {
    const pem = parsePem(input);
    if (!pem) { setResult(null); setPemType(''); setHexPreview(''); return; }
    setPemType(pem.type);
    setHexPreview(base64ToHex(pem.der).slice(0, 200) + '...');
    setResult(parseX509Details(pem.der));
  };

  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.input')}
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => setInput(SAMPLE)}>{t('common.example')}</button>
              <button className="panel-btn" onClick={() => { setInput(''); setResult(null); setPemType(''); setHexPreview(''); }}>{t('common.clear')}</button>
              <button className="panel-btn accent" onClick={parse}>{ui.parse}</button>
            </div>
          </div>
          <textarea className="tool-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={ui.placeholder} />
        </div>
        <div className="tool-panel">
          <div className="panel-header">{t('common.output')}</div>
          {result ? (
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 12, padding: '6px 10px', background: 'var(--surface-2)', borderRadius: 4 }}>
                {ui.type}: {pemType}
              </div>
              {Object.entries(result).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--muted)', minWidth: 100, flexShrink: 0, fontWeight: 500 }}>{key}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all', color: key === '剩余天数' && value.includes('已过期') ? 'var(--red)' : 'var(--fg)' }}>{value}</span>
                </div>
              ))}
              {hexPreview && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>DER HEX 预览</div>
                  <pre style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{hexPreview}</pre>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{t('common.waiting')}</div>
          )}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
