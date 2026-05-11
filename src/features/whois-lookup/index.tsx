import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

interface RdapResult {
  name?: string;
  status?: string[];
  events?: { eventAction: string; eventDate: string }[];
  entities?: { roles?: string[]; vcardArray?: any[] }[];
  nameservers?: { ldhName: string }[];
  notices?: { title?: string; description?: string[] }[];
  handle?: string;
  ldhName?: string;
}

// RDAP servers by TLD
const RDAP_SERVERS: { pattern: RegExp; url: (d: string) => string }[] = [
  { pattern: /\.(com|net)$/, url: (d) => `https://rdap.verisign.com/net/v1/domain/${d}` },
  { pattern: /\.(dev|page|app|new|how)$/, url: (d) => `https://rdap.nic.google/domain/${d}` },
  { pattern: /\.(org|ngo|ong)$/, url: (d) => `https://rdap.publicinterestregistry.org/rdap/domain/${d}` },
  { pattern: /\.(info|pro)$/, url: (d) => `https://rdap.identitydigital.services/rdap/domain/${d}` },
  { pattern: /\.(io)$/, url: (d) => `https://rdap.nic.io/domain/${d}` },
  { pattern: /\.(co)$/, url: (d) => `https://rdap.nic.co/domain/${d}` },
  { pattern: /\.(me)$/, url: (d) => `https://rdap.nic.me/domain/${d}` },
  { pattern: /\.(ru|su|рф)$/, url: (d) => `https://rdap.ru-center.net/rdap/domain/${d}` },
  { pattern: /\.(de)$/, url: (d) => `https://rdap.denic.de/domain/${d}` },
  { pattern: /\.(uk)$/, url: (d) => `https://rdap.nominet.uk/uk/domain/${d}` },
  { pattern: /\.(au)$/, url: (d) => `https://rdap.auda.org.au/domain/${d}` },
  { pattern: /\.(cn)$/, url: (d) => `https://rdap.cnnic.cn/rdap/domain/${d}` },
  { pattern: /\.(eu)$/, url: (d) => `https://rdap.eu.eu/domain/${d}` },
  { pattern: /\.(fr)$/, url: (d) => `https://rdap.nic.fr/domain/${d}` },
  { pattern: /\.(nl)$/, url: (d) => `https://rdap.sidn.nl/domain/${d}` },
];

// External WHOIS lookup links
const EXTERNAL_LINKS = [
  { name: 'Whois.com', url: (d: string) => `https://www.whois.com/whois/${d}` },
  { name: 'Who.is', url: (d: string) => `https://who.is/whois/${d}` },
  { name: 'DomainTools', url: (d: string) => `https://whois.domaintools.com/${d}` },
  { name: 'Namecheap', url: (d: string) => `https://www.namecheap.com/domains/whois/result?domain=${d}` },
  { name: '站长之家', url: (d: string) => `https://whois.chinaz.com/${d}` },
];

function extractVcardName(vcard: any[]): string {
  if (!vcard || !vcard[1]) return '';
  for (const field of vcard[1]) {
    if (field[0] === 'fn') return field[3] || '';
    if (field[0] === 'org') return field[3] || '';
  }
  return '';
}

function parseRdap(data: RdapResult) {
  const result: { label: string; value: string }[] = [];
  if (data.ldhName || data.name) result.push({ label: 'Domain', value: data.ldhName || data.name || '' });
  if (data.handle) result.push({ label: 'Handle', value: data.handle });
  if (data.status?.length) result.push({ label: 'Status', value: data.status.join(', ') });
  if (data.events?.length) {
    for (const evt of data.events) {
      const labels: Record<string, string> = { registration: 'Registered', expiration: 'Expires', 'last changed': 'Last Updated', 'last update of RDAP database': 'RDAP Updated' };
      result.push({ label: labels[evt.eventAction] || evt.eventAction, value: new Date(evt.eventDate).toLocaleString() });
    }
  }
  if (data.entities?.length) {
    for (const entity of data.entities) {
      const roles = entity.roles?.join(', ') || '';
      const name = entity.vcardArray ? extractVcardName(entity.vcardArray) : '';
      if (name) result.push({ label: roles.charAt(0).toUpperCase() + roles.slice(1), value: name });
    }
  }
  if (data.nameservers?.length) result.push({ label: 'Nameservers', value: data.nameservers.map((ns) => ns.ldhName).join('\n') });
  if (data.notices?.length) {
    for (const notice of data.notices) {
      if (notice.description?.length) result.push({ label: notice.title || 'Notice', value: notice.description.join('\n') });
    }
  }
  return result;
}

async function tryFetch(url: string): Promise<RdapResult | null> {
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return null;
    return await resp.json();
  } catch { return null; }
}

async function lookupDomain(domain: string): Promise<{ results: { label: string; value: string }[]; source: string }> {
  const clean = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\.$/, '').toLowerCase();

  // Strategy 1: rdap.org (universal aggregator)
  let data = await tryFetch(`https://rdap.org/domain/${encodeURIComponent(clean)}`);
  if (data) return { results: parseRdap(data), source: 'rdap.org' };

  // Strategy 2: TLD-specific RDAP server
  for (const server of RDAP_SERVERS) {
    if (server.pattern.test(clean)) {
      data = await tryFetch(server.url(encodeURIComponent(clean)));
      if (data) return { results: parseRdap(data), source: clean.match(server.pattern)?.[0]?.slice(1) + ' RDAP' };
      break;
    }
  }

  // Strategy 3: VeriSign (covers .com/.net and many others via thick WHOIS)
  data = await tryFetch(`https://rdap.verisign.com/net/v1/domain/${encodeURIComponent(clean)}`);
  if (data) return { results: parseRdap(data), source: 'VeriSign RDAP' };

  return { results: [], source: '' };
}

export default function WhoisLookup() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('whois');
  const [domain, setDomain] = useState('');
  const [results, setResults] = useState<{ label: string; value: string }[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('');
  const [cleanDomain, setCleanDomain] = useState('');

  const lookup = async () => {
    if (!domain.trim()) return;
    setLoading(true);
    setError('');
    setResults(null);
    setSource('');
    const clean = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\.$/, '').toLowerCase();
    setCleanDomain(clean);
    try {
      const { results: data, source: src } = await lookupDomain(domain);
      if (data.length > 0) {
        setResults(data);
        setSource(src);
      } else {
        setError(ui.notFound);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'WHOIS lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">{ui.query}</div>
          <div style={{ padding: '10px 16px 12px' }}>
            <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && lookup()} placeholder={ui.placeholder} style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, fontFamily: 'var(--font-mono)', boxSizing: 'border-box' }} />
          </div>
          <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8 }}>
            <button className="panel-btn accent" onClick={lookup} disabled={loading} style={{ flex: 1 }}>{loading ? ui.querying : ui.queryBtn}</button>
          </div>
          <div style={{ padding: '0 16px 12px', fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
            {ui.apiNote}
          </div>
          {/* External links */}
          <div style={{ padding: '0 16px 12px' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{ui.externalLookup}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {EXTERNAL_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.url(cleanDomain || 'example.com')}
                  target="_blank"
                  rel="noopener"
                  className="panel-btn panel-btn-sm"
                  style={{ textDecoration: 'none', fontSize: 11 }}
                >
                  {link.name} ↗
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {ui.result}
            {source && <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>via {source}</span>}
          </div>
          {loading && <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{ui.querying}…</div>}
          {error && (
            <div style={{ padding: 16 }}>
              <div className="error-msg">{error}</div>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>{ui.tryExternal}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {EXTERNAL_LINKS.map((link) => (
                  <a
                    key={link.name}
                    href={link.url(cleanDomain)}
                    target="_blank"
                    rel="noopener"
                    className="panel-btn panel-btn-sm"
                    style={{ textDecoration: 'none', fontSize: 11 }}
                  >
                    {link.name} ↗
                  </a>
                ))}
              </div>
            </div>
          )}
          {results && results.length > 0 && (
            <div style={{ padding: 12 }}>
              {results.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 4px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 600, minWidth: 100, flexShrink: 0 }}>{r.label}</span>
                  <span style={{ flex: 1, fontFamily: 'var(--font-mono)', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{r.value}</span>
                  <button className="panel-btn panel-btn-sm" onClick={() => copy(r.value)} style={{ flexShrink: 0 }}>{t('common.copy')}</button>
                </div>
              ))}
            </div>
          )}
          {!results && !loading && !error && (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{t('common.waiting')}</div>
          )}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
