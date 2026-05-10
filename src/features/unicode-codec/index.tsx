import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

function toUnicodeEscape(str: string): string {
  return Array.from(str).map((ch) => {
    const code = ch.codePointAt(0)!;
    if (code > 0xFFFF) return `\\u{${code.toString(16).toUpperCase()}}`;
    return `\\u${code.toString(16).toUpperCase().padStart(4, '0')}`;
  }).join('');
}

function toCodePoints(str: string): string {
  return Array.from(str).map((ch) => `U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`).join(' ');
}

function toHtmlEntities(str: string): string {
  return Array.from(str).map((ch) => `&#${ch.codePointAt(0)};`).join('');
}

function fromUnicodeEscape(str: string): string {
  return str.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g, (_, g1, g2) => {
    const code = parseInt(g1 || g2, 16);
    return String.fromCodePoint(code);
  });
}

function fromCodePoints(str: string): string {
  return str.replace(/U\+([0-9a-fA-F]{4,6})/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
}

function fromHtmlEntities(str: string): string {
  return str.replace(/&#x([0-9a-fA-F]+);|&#(\d+);/g, (_, hex, dec) => {
    const code = parseInt(hex || dec, hex ? 16 : 10);
    return String.fromCodePoint(code);
  });
}

type OutputMode = 'escape' | 'codepoint' | 'html';

export default function UnicodeCodec() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('unicode');
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<OutputMode>('escape');

  const encode = () => {
    if (!input) return '';
    if (mode === 'escape') return toUnicodeEscape(input);
    if (mode === 'codepoint') return toCodePoints(input);
    return toHtmlEntities(input);
  };

  const decode = () => {
    if (!input) return '';
    if (mode === 'escape') return fromUnicodeEscape(input);
    if (mode === 'codepoint') return fromCodePoints(input);
    return fromHtmlEntities(input);
  };

  const encoded = encode();
  const decoded = decode();
  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.input')}
            <div className="panel-actions">
              {(['escape', 'codepoint', 'html'] as OutputMode[]).map((m) => (
                <button key={m} className={`panel-btn panel-btn-sm${mode === m ? ' accent' : ''}`} onClick={() => setMode(m)}>{ui[m]}</button>
              ))}
            </div>
          </div>
          <textarea className="tool-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={ui.placeholder} />
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {ui.encoded}
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => copy(encoded)}>{t('common.copy')}</button>
            </div>
          </div>
          <div className="output-area">{encoded || t('common.waiting')}</div>
          <div className="panel-header">
            {ui.decoded}
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => copy(decoded)}>{t('common.copy')}</button>
            </div>
          </div>
          <div className="output-area">{decoded || t('common.waiting')}</div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
