import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

function analyze(text: string) {
  if (!text) return null;
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, '').length;
  const lines = text.split('\n').length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  // CJK characters
  const cjk = (text.match(/[一-鿿㐀-䶿]/g) || []).length;
  // English words
  const enWords = (text.match(/[a-zA-Z]+/g) || []).length;
  // Numbers
  const numbers = (text.match(/\d+/g) || []).length;
  // Sentences (. ! ?)
  const sentences = (text.match(/[.!?。！？]+/g) || []).length || (text.trim() ? 1 : 0);
  // Reading speed: ~200 words/min English, ~400 chars/min Chinese
  const readMin = Math.ceil((enWords / 200) + (cjk / 400));
  // Line lengths
  const lineLengths = text.split('\n').map((l) => l.length);
  const maxLineLen = Math.max(...lineLengths);
  const avgLineLen = lineLengths.length > 0 ? Math.round(lineLengths.reduce((a, b) => a + b, 0) / lineLengths.length) : 0;
  // Character frequency (top 10)
  const freq: Record<string, number> = {};
  for (const ch of text) {
    if (ch.trim()) freq[ch] = (freq[ch] || 0) + 1;
  }
  const topChars = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return {
    chars, charsNoSpace, lines, paragraphs, words, cjk, enWords, numbers, sentences,
    readMin, maxLineLen, avgLineLen, topChars,
    bytes: new TextEncoder().encode(text).length,
  };
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

export default function TextStats() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('textStats');
  const [input, setInput] = useState('');

  const stats = useMemo(() => analyze(input), [input]);

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.input')}
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => setInput('')}>{t('common.clear')}</button>
            </div>
          </div>
          <textarea className="tool-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={ui.placeholder} />
        </div>
        <div className="tool-panel">
          <div className="panel-header">{ui.statistics}</div>
          {stats ? (
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8, marginBottom: 16 }}>
                <StatCard label={ui.chars} value={stats.chars} />
                <StatCard label={ui.charsNoSpace} value={stats.charsNoSpace} />
                <StatCard label={ui.words} value={stats.words} />
                <StatCard label={ui.lines} value={stats.lines} />
                <StatCard label={ui.paragraphs} value={stats.paragraphs} />
                <StatCard label={ui.sentences} value={stats.sentences} />
                <StatCard label={ui.cjkChars} value={stats.cjk} />
                <StatCard label={ui.enWords} value={stats.enWords} />
                <StatCard label={ui.numbers} value={stats.numbers} />
                <StatCard label={ui.bytes} value={stats.bytes} sub="UTF-8" />
                <StatCard label={ui.readTime} value={`${stats.readMin} min`} />
                <StatCard label={ui.avgLineLen} value={stats.avgLineLen} sub={`max: ${stats.maxLineLen}`} />
              </div>
              {stats.topChars.length > 0 && (
                <>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{ui.charFreq}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {stats.topChars.map(([ch, count]) => (
                      <span key={ch} style={{ fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4, padding: '3px 8px' }}>
                        <span style={{ color: 'var(--accent)' }}>{ch === ' ' ? '␣' : ch}</span> ×{count}
                      </span>
                    ))}
                  </div>
                </>
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
