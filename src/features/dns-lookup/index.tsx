import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

type RecordType = 'A' | 'AAAA' | 'MX' | 'CNAME' | 'TXT' | 'NS' | 'SRV' | 'SOA' | 'CAA' | 'PTR';

const RECORD_TYPES: RecordType[] = ['A', 'AAAA', 'MX', 'CNAME', 'TXT', 'NS', 'SRV', 'SOA', 'CAA', 'PTR'];

interface DnsAnswer { name: string; type: number; TTL: number; data: string; }

const TYPE_NAMES: Record<number, string> = {
  1: 'A', 2: 'NS', 5: 'CNAME', 6: 'SOA', 15: 'MX', 16: 'TXT', 28: 'AAAA', 33: 'SRV', 257: 'CAA', 12: 'PTR',
};

function formatData(type: number, data: string): string {
  if (type === 15 && data) {
    // MX: priority + exchange
    const parts = data.split(' ');
    if (parts.length >= 2) return `${parts[0]} ${parts.slice(1).join(' ')}`;
  }
  if (type === 6 && data) {
    // SOA: format fields
    const parts = data.split(' ');
    if (parts.length >= 7) return `MNAME: ${parts[0]}\nRNAME: ${parts[1]}\nSerial: ${parts[2]}\nRefresh: ${parts[3]}s\nRetry: ${parts[4]}s\nExpire: ${parts[5]}s\nMin TTL: ${parts[6]}s`;
  }
  if (type === 33 && data) {
    // SRV: priority weight port target
    const parts = data.split(' ');
    if (parts.length >= 4) return `Priority: ${parts[0]}, Weight: ${parts[1]}, Port: ${parts[2]}, Target: ${parts[3]}`;
  }
  return data;
}

async function queryDns(domain: string, type: RecordType): Promise<DnsAnswer[]> {
  const resp = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const json = await resp.json();
  if (json.Status !== 0) {
    const statusNames: Record<number, string> = { 1: 'Format Error', 2: 'Server Failure', 3: 'Non-Existent Domain (NXDOMAIN)', 4: 'Not Implemented', 5: 'Refused' };
    throw new Error(statusNames[json.Status] || `DNS Error: ${json.Status}`);
  }
  return (json.Answer ?? []).map((a: any) => ({
    name: a.name,
    type: a.type,
    TTL: a.TTL,
    data: formatData(a.type, a.data),
  }));
}

export default function DnsLookup() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('dns');
  const [domain, setDomain] = useState('');
  const [recordType, setRecordType] = useState<RecordType>('A');
  const [results, setResults] = useState<DnsAnswer[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [queriedTypes, setQueriedTypes] = useState<RecordType[]>([]);

  const lookup = async (type?: RecordType) => {
    const qType = type ?? recordType;
    if (!domain.trim()) return;
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const answers = await queryDns(domain.trim(), qType);
      setResults(answers);
      if (!queriedTypes.includes(qType)) setQueriedTypes([...queriedTypes, qType]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'DNS lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const lookupAll = async () => {
    if (!domain.trim()) return;
    setLoading(true);
    setError('');
    setResults(null);
    const allResults: DnsAnswer[] = [];
    const types: RecordType[] = ['A', 'AAAA', 'MX', 'CNAME', 'TXT', 'NS'];
    try {
      for (const t of types) {
        try {
          const answers = await queryDns(domain.trim(), t);
          allResults.push(...answers);
        } catch { /* skip failed types */ }
      }
      setResults(allResults);
      setQueriedTypes(types);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'DNS lookup failed');
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
          <div style={{ padding: '10px 16px 8px' }}>
            <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && lookup()} placeholder={ui.placeholder} style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, fontFamily: 'var(--font-mono)', boxSizing: 'border-box' }} />
          </div>
          <div style={{ padding: '0 16px 8px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {RECORD_TYPES.map((rt) => (
              <button key={rt} className={`panel-btn panel-btn-sm${recordType === rt ? ' accent' : ''}`} onClick={() => { setRecordType(rt); }}>{rt}</button>
            ))}
          </div>
          <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8 }}>
            <button className="panel-btn accent" onClick={() => lookup()} disabled={loading} style={{ flex: 1 }}>{loading ? ui.querying : ui.queryBtn}</button>
            <button className="panel-btn" onClick={lookupAll} disabled={loading} style={{ flex: 1 }}>{ui.queryAll}</button>
          </div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">{ui.result}</div>
          {loading && <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{ui.querying}…</div>}
          {error && <div className="error-msg" style={{ margin: 16 }}>{error}</div>}
          {results && results.length > 0 && (
            <div style={{ padding: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)' }}>{ui.type}</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)' }}>TTL</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)' }}>{ui.value}</th>
                    <th style={{ padding: '6px 8px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, color: 'var(--accent)' }}>{TYPE_NAMES[r.type] ?? r.type}</td>
                      <td style={{ padding: '6px 8px', color: 'var(--muted)' }}>{r.TTL}s</td>
                      <td style={{ padding: '6px 8px', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{r.data}</td>
                      <td style={{ padding: '6px 8px' }}><button className="panel-btn panel-btn-sm" onClick={() => copy(r.data)}>{t('common.copy')}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {results && results.length === 0 && !error && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{ui.noRecords}</div>
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
