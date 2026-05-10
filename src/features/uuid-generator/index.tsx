import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

function generateUUIDv4(): string {
  return crypto.randomUUID();
}

function generateUUIDv7(): string {
  const now = BigInt(Date.now());
  const rand = new Uint8Array(10);
  crypto.getRandomValues(rand);
  const tsHex = now.toString(16).padStart(12, '0');
  const randHex = Array.from(rand).map((b) => b.toString(16).padStart(2, '0')).join('');
  const timeHi = tsHex.slice(0, 8);
  const timeLo = tsHex.slice(8, 12);
  return `${timeHi}-${timeLo.slice(0, 3)}7-${timeLo.slice(3, 4)}${randHex.slice(0, 3)}-8${randHex.slice(3, 4)}${randHex.slice(4, 7)}-${randHex.slice(7, 19)}`;
}

export default function UuidGenerator() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('uuid');
  const [results, setResults] = useState<string[]>([]);
  const [version, setVersion] = useState<'v4' | 'v7'>('v4');
  const [count, setCount] = useState(1);
  const [noDashes, setNoDashes] = useState(false);

  const generate = () => {
    const fn = version === 'v4' ? generateUUIDv4 : generateUUIDv7;
    setResults(Array.from({ length: Math.min(count, 1000) }, () => fn()));
  };

  const displayResults = noDashes ? results.map((u) => u.replace(/-/g, '')) : results;
  const copyAll = () => navigator.clipboard.writeText(displayResults.join('\n'));
  const copyOne = (uuid: string) => navigator.clipboard.writeText(uuid);

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">{t('common.settings')}</div>
          <div className="uuid-config">
            <div className="uuid-config-row">
              <label>{ui.version}</label>
              <div className="panel-actions">
                <button className={`panel-btn${version === 'v4' ? ' accent' : ''}`} onClick={() => setVersion('v4')}>v4</button>
                <button className={`panel-btn${version === 'v7' ? ' accent' : ''}`} onClick={() => setVersion('v7')}>v7</button>
              </div>
            </div>
            <div className="uuid-config-row">
              <label>{ui.count}</label>
              <input type="number" min="1" max="1000" value={count} onChange={(e) => setCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))} className="uuid-count-input" />
            </div>
            <div className="uuid-config-row">
              <label>{ui.format}</label>
              <button className={`panel-btn${noDashes ? ' accent' : ''}`} onClick={() => setNoDashes(!noDashes)}>{noDashes ? ui.noDash : ui.standard}</button>
            </div>
            <button className="panel-btn accent" onClick={generate} style={{ marginTop: 8, width: '100%' }}>{t('common.generate')}</button>
          </div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.output')}
            {results.length > 0 && (
              <div className="panel-actions">
                <button className="panel-btn" onClick={copyAll}>{t('common.copy')}</button>
              </div>
            )}
          </div>
          <div className="uuid-results">
            {displayResults.length > 0 ? (
              displayResults.map((uuid, i) => (
                <div key={i} className="uuid-item" onClick={() => copyOne(uuid)}>
                  <span className="uuid-num">{i + 1}</span>
                  <span className="uuid-value">{uuid}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{t('common.waiting')}</div>
            )}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
