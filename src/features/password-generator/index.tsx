import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

const CHARS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

type CharSet = keyof typeof CHARS;

function generatePassword(length: number, charSets: Record<CharSet, boolean>): string {
  let pool = '';
  for (const [key, enabled] of Object.entries(charSets)) {
    if (enabled) pool += CHARS[key as CharSet];
  }
  if (!pool) return '';
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (v) => pool[v % pool.length]).join('');
}

function calcStrength(length: number, charSets: Record<CharSet, boolean>): { level: number; label: string; color: string } {
  let poolSize = 0;
  if (charSets.uppercase) poolSize += 26;
  if (charSets.lowercase) poolSize += 26;
  if (charSets.digits) poolSize += 10;
  if (charSets.symbols) poolSize += 28;
  if (poolSize === 0) return { level: 0, label: '—', color: 'var(--muted)' };
  const entropy = Math.log2(poolSize) * length;
  if (entropy < 28) return { level: 1, label: 'Weak', color: 'var(--red)' };
  if (entropy < 60) return { level: 2, label: 'Fair', color: 'var(--amber)' };
  if (entropy < 120) return { level: 3, label: 'Strong', color: 'var(--green)' };
  return { level: 4, label: 'Very Strong', color: 'var(--accent)' };
}

export default function PasswordGenerator() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('password');
  const [length, setLength] = useState(16);
  const [count, setCount] = useState(5);
  const [charSets, setCharSets] = useState<Record<CharSet, boolean>>({ uppercase: true, lowercase: true, digits: true, symbols: true });
  const [results, setResults] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const toggleCharSet = (key: CharSet) => setCharSets((prev) => ({ ...prev, [key]: !prev[key] }));

  const generate = () => {
    const passwords = Array.from({ length: Math.min(count, 20) }, () => generatePassword(length, charSets));
    setResults(passwords);
    setCopiedIdx(null);
  };

  const copyOne = (pw: string, idx: number) => {
    navigator.clipboard.writeText(pw);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(results.join('\n'));
    setCopiedIdx(-1);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const strength = calcStrength(length, charSets);

  const charSetKeys: CharSet[] = ['uppercase', 'lowercase', 'digits', 'symbols'];

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">{t('common.settings')}</div>
          <div className="uuid-config">
            <div className="uuid-config-row">
              <label>{ui.length}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <input type="range" min={4} max={128} value={length} onChange={(e) => setLength(parseInt(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', minWidth: 32, textAlign: 'right' }}>{length}</span>
              </div>
            </div>
            <div className="uuid-config-row">
              <label>{ui.count}</label>
              <input type="number" min={1} max={20} value={count} onChange={(e) => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))} className="uuid-count-input" />
            </div>
            <div className="uuid-config-row">
              <label>{ui.charSets}</label>
              <div className="panel-actions" style={{ flexWrap: 'wrap' }}>
                {charSetKeys.map((key) => (
                  <button key={key} className={`panel-btn panel-btn-sm${charSets[key] ? ' accent' : ''}`} onClick={() => toggleCharSet(key)}>{ui[key]}</button>
                ))}
              </div>
            </div>
            <div className="uuid-config-row">
              <label>{ui.strength}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ width: `${(strength.level / 4) * 100}%`, height: '100%', background: strength.color, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 12, color: strength.color, fontWeight: 600, minWidth: 72 }}>{strength.label}</span>
              </div>
            </div>
            <button className="panel-btn accent" onClick={generate} style={{ marginTop: 8, width: '100%' }}>{t('common.generate')}</button>
          </div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.output')}
            {results.length > 0 && (
              <div className="panel-actions">
                <button className="panel-btn" onClick={copyAll}>{copiedIdx === -1 ? t('common.copied') : t('common.copy')}</button>
              </div>
            )}
          </div>
          <div className="uuid-results">
            {results.length > 0 ? results.map((pw, i) => (
              <div key={i} className="uuid-item" onClick={() => copyOne(pw, i)}>
                <span className="uuid-num">{i + 1}</span>
                <span className="uuid-value" style={{ fontFamily: 'var(--font-mono)', letterSpacing: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{pw}</span>
                <span style={{ fontSize: 11, color: copiedIdx === i ? 'var(--green)' : 'var(--muted)', marginLeft: 'auto', flexShrink: 0, whiteSpace: 'nowrap' }}>{copiedIdx === i ? t('common.copied') : t('common.copy')}</span>
              </div>
            )) : (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{t('common.waiting')}</div>
            )}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
