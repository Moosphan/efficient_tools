import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

// Simple token estimation: ~4 chars per token for English, ~1.5 chars per token for CJK
function estimateTokens(text: string): { tokens: number; chars: number; words: number; lines: number } {
  if (!text) return { tokens: 0, chars: 0, words: 0, lines: 0 };
  const chars = text.length;
  const lines = text.split('\n').length;
  // Count CJK characters
  const cjk = (text.match(/[一-鿿㐀-䶿\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}぀-ゟ゠-ヿ가-힯]/gu) || []).length;
  const nonCjk = chars - cjk;
  // English: ~4 chars per token, CJK: ~1 token per char
  const tokens = Math.ceil(nonCjk / 4) + cjk;
  // Word count: split by whitespace, filter empty
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return { tokens, chars, words, lines };
}

const MODEL_COSTS: { name: string; inputPer1k: number; outputPer1k: number }[] = [
  { name: 'GPT-4o', inputPer1k: 0.0025, outputPer1k: 0.01 },
  { name: 'GPT-4o-mini', inputPer1k: 0.00015, outputPer1k: 0.0006 },
  { name: 'Claude Sonnet', inputPer1k: 0.003, outputPer1k: 0.015 },
  { name: 'Claude Haiku', inputPer1k: 0.00025, outputPer1k: 0.00125 },
  { name: 'DeepSeek V3', inputPer1k: 0.00027, outputPer1k: 0.0011 },
];

export default function TokenCounter() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('tokenCounter');
  const [input, setInput] = useState('');
  const [outputRatio, setOutputRatio] = useState(1);

  const stats = useMemo(() => estimateTokens(input), [input]);
  const estimatedOutputTokens = Math.ceil(stats.tokens * outputRatio);

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
          <div className="panel-header">{ui.stats}</div>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{stats.tokens.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{ui.tokens}</div>
            </div>
            <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--fg)', fontFamily: 'var(--font-mono)' }}>{stats.chars.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{ui.chars}</div>
            </div>
            <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--fg)', fontFamily: 'var(--font-mono)' }}>{stats.words.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{ui.words}</div>
            </div>
            <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--fg)', fontFamily: 'var(--font-mono)' }}>{stats.lines.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{ui.lines}</div>
            </div>
          </div>

          <div className="panel-header">{ui.costEstimate}</div>
          <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{ui.outputRatio}</span>
            <input type="range" min={0.5} max={5} step={0.5} value={outputRatio} onChange={(e) => setOutputRatio(parseFloat(e.target.value))} style={{ flex: 1 }} />
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', minWidth: 24 }}>{outputRatio}x</span>
          </div>
          <div style={{ padding: '0 16px 16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 0', color: 'var(--muted)' }}>{ui.model}</th>
                  <th style={{ textAlign: 'right', padding: '6px 0', color: 'var(--muted)' }}>{ui.inputCost}</th>
                  <th style={{ textAlign: 'right', padding: '6px 0', color: 'var(--muted)' }}>{ui.outputCost}</th>
                  <th style={{ textAlign: 'right', padding: '6px 0', color: 'var(--muted)' }}>{ui.totalCost}</th>
                </tr>
              </thead>
              <tbody>
                {MODEL_COSTS.map((m) => {
                  const inputCost = (stats.tokens / 1000) * m.inputPer1k;
                  const outputCost = (estimatedOutputTokens / 1000) * m.outputPer1k;
                  return (
                    <tr key={m.name} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '6px 0', fontWeight: 500 }}>{m.name}</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${inputCost.toFixed(4)}</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${outputCost.toFixed(4)}</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)' }}>${(inputCost + outputCost).toFixed(4)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>{ui.note}</div>
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
