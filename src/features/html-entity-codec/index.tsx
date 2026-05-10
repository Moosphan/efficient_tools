import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

const NAMED_ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ',
  '&copy;': '©', '&reg;': '®', '&trade;': '™', '&euro;': '€', '&pound;': '£', '&yen;': '¥',
  '&mdash;': '—', '&ndash;': '–', '&hellip;': '…', '&laquo;': '«', '&raquo;': '»',
  '&bull;': '•', '&middot;': '·', '&times;': '×', '&divide;': '÷', '&plusmn;': '±',
  '&micro;': 'µ', '&para;': '¶', '&sect;': '§', '&deg;': '°', '&not;': '¬',
};

const REVERSE_NAMED: Record<string, string> = Object.fromEntries(
  Object.entries(NAMED_ENTITIES).map(([k, v]) => [v, k])
);

function encodeEntities(str: string): string {
  return Array.from(str).map((ch) => {
    const code = ch.codePointAt(0)!;
    const named = REVERSE_NAMED[ch];
    if (named) return named;
    if (code > 127) return `&#${code};`;
    return ch;
  }).join('');
}

function decodeEntities(str: string): string {
  // Named entities
  let result = str.replace(/&[a-zA-Z]+;/g, (match) => NAMED_ENTITIES[match] ?? match);
  // Hex entities
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
  // Decimal entities
  result = result.replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
  return result;
}

export default function HtmlEntityCodec() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('htmlEntity');
  const [input, setInput] = useState('');

  const encoded = input ? encodeEntities(input) : '';
  const decoded = input ? decodeEntities(input) : '';
  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">{t('common.input')}</div>
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
