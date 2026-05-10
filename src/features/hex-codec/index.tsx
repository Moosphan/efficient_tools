import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

function textToHex(str: string, sep: string): string {
  const bytes = new TextEncoder().encode(str);
  return Array.from(bytes).map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(sep);
}

function hexToText(hex: string): string {
  const cleaned = hex.replace(/[\s,;:-]/g, '');
  if (cleaned.length % 2 !== 0) throw new Error('Invalid hex length');
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

function hexToBytes(hex: string): number[] {
  const cleaned = hex.replace(/[\s,;:-]/g, '');
  const result: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    result.push(parseInt(cleaned.slice(i, i + 2), 16));
  }
  return result;
}

function bytesToDec(bytes: number[]): string {
  return bytes.map((b) => b.toString(10).padStart(3, ' ')).join(' ');
}

function bytesToBin(bytes: number[]): string {
  return bytes.map((b) => b.toString(2).padStart(8, '0')).join(' ');
}

export default function HexCodec() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('hex');
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [separator, setSeparator] = useState(' ');

  const process = () => {
    if (!input.trim()) return '';
    try {
      if (mode === 'encode') return textToHex(input, separator);
      return hexToText(input);
    } catch (e) {
      return `${t('common.error')}: ${e instanceof Error ? e.message : 'Invalid input'}`;
    }
  };

  const result = process();
  let preview = '';
  if (mode === 'encode' && result && !result.startsWith(t('common.error'))) {
    const bytes = new TextEncoder().encode(input);
    preview = `DEC: ${bytesToDec(Array.from(bytes))}\nBIN: ${bytesToBin(Array.from(bytes))}`;
  } else if (mode === 'decode' && result && !result.startsWith(t('common.error'))) {
    try {
      const bytes = hexToBytes(input);
      preview = `DEC: ${bytesToDec(bytes)}\nBIN: ${bytesToBin(bytes)}`;
    } catch { /* ignore */ }
  }

  const copy = () => { if (result) navigator.clipboard.writeText(result); };

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.input')}
            <div className="panel-actions">
              <button className={`panel-btn panel-btn-sm${mode === 'encode' ? ' accent' : ''}`} onClick={() => setMode('encode')}>{t('common.encode')}</button>
              <button className={`panel-btn panel-btn-sm${mode === 'decode' ? ' accent' : ''}`} onClick={() => setMode('decode')}>{t('common.decode')}</button>
            </div>
          </div>
          <textarea className="tool-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === 'encode' ? ui.encodePlaceholder : ui.decodePlaceholder} />
          {mode === 'encode' && (
            <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{ui.separator}</span>
              {[' ', ':', '-', ''].map((s) => (
                <button key={s || 'none'} className={`panel-btn panel-btn-sm${separator === s ? ' accent' : ''}`} onClick={() => setSeparator(s)}>{s === '' ? ui.none : `"${s}"`}</button>
              ))}
            </div>
          )}
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.output')}
            <div className="panel-actions">
              <button className="panel-btn" onClick={copy}>{t('common.copy')}</button>
            </div>
          </div>
          <div className="output-area" style={{ minHeight: 120 }}>{result || t('common.waiting')}</div>
          {preview && (
            <>
              <div className="panel-header">{ui.preview}</div>
              <pre style={{ padding: '8px 16px', fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{preview}</pre>
            </>
          )}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
