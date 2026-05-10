import { useState, useEffect } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

interface IpInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string; // lat,lng
  org?: string;
  timezone?: string;
  postal?: string;
  asn?: string;
}

// Use ipinfo.io free API (50k/month)
async function lookupIp(ip?: string): Promise<IpInfo> {
  const url = ip ? `https://ipinfo.io/${encodeURIComponent(ip)}/json` : 'https://ipinfo.io/json';
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message || 'IP lookup failed');
  return data;
}

function formatOrg(org: string): { asn: string; name: string } {
  const match = org.match(/^(AS\d+)\s+(.+)$/);
  if (match) return { asn: match[1], name: match[2] };
  return { asn: '', name: org };
}

export default function IpLookup() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('ipLookup');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<IpInfo | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [myIp, setMyIp] = useState<string | null>(null);

  // Auto-detect user's IP on mount
  useEffect(() => {
    lookupIp().then((info) => {
      setMyIp(info.ip);
      setResult(info);
    }).catch(() => {});
  }, []);

  const lookup = async (targetIp?: string) => {
    const ip = targetIp ?? input.trim();
    if (!ip && !targetIp) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const info = await lookupIp(ip || undefined);
      setResult(info);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'IP lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string) => navigator.clipboard.writeText(text);
  const org = result?.org ? formatOrg(result.org) : null;

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">{ui.query}</div>
          <div style={{ padding: '10px 16px 12px' }}>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && lookup()} placeholder={ui.placeholder} style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, fontFamily: 'var(--font-mono)', boxSizing: 'border-box' }} />
          </div>
          <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8 }}>
            <button className="panel-btn accent" onClick={() => lookup()} disabled={loading} style={{ flex: 1 }}>{loading ? ui.querying : ui.queryBtn}</button>
            <button className="panel-btn" onClick={() => lookup(myIp ?? '')} disabled={loading}>{ui.myIp}</button>
          </div>
          <div style={{ padding: '0 16px 12px', fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
            {ui.apiNote}
          </div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">{ui.result}</div>
          {loading && <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{ui.querying}…</div>}
          {error && <div className="error-msg" style={{ margin: 16 }}>{error}</div>}
          {result && (
            <div style={{ padding: 16 }}>
              {/* IP address header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8 }}>
                <span style={{ fontSize: 20 }}>🌐</span>
                <div>
                  <div style={{ fontSize: 18, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{result.ip}</div>
                  {org && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{org.name}</div>}
                </div>
                <button className="panel-btn panel-btn-sm" onClick={() => copy(result.ip)} style={{ marginLeft: 'auto' }}>{t('common.copy')}</button>
              </div>

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: ui.country, value: result.country, icon: '🏳️' },
                  { label: ui.region, value: result.region, icon: '📍' },
                  { label: ui.city, value: result.city, icon: '🏙️' },
                  { label: ui.postal, value: result.postal, icon: '📮' },
                  { label: ui.timezone, value: result.timezone, icon: '🕐' },
                  { label: 'ASN', value: org?.asn || result.asn, icon: '🔗' },
                ].filter((item) => item.value).map((item, i) => (
                  <div key={i} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{item.icon} {item.label}</div>
                    <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Location link */}
              {result.loc && (
                <div style={{ marginTop: 12 }}>
                  <a
                    href={`https://www.google.com/maps?q=${result.loc}`}
                    target="_blank"
                    rel="noopener"
                    style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}
                  >
                    📍 {ui.viewOnMap} ({result.loc})
                  </a>
                </div>
              )}
            </div>
          )}
          {!result && !loading && !error && (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{t('common.waiting')}</div>
          )}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
