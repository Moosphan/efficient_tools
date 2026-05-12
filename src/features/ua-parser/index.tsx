import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

interface UaResult {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  engine: string;
  engineVersion: string;
  isBot: boolean;
  isMobile: boolean;
}

const SAMPLE_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function parseUA(ua: string): UaResult {
  const result: UaResult = { browser: '', browserVersion: '', os: '', osVersion: '', device: 'Desktop', engine: '', engineVersion: '', isBot: false, isMobile: false };

  // Bot detection
  if (/bot|crawler|spider|crawling|Googlebot|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|facebot|ia_archiver/i.test(ua)) {
    result.isBot = true;
    result.device = 'Bot';
  }

  // Mobile detection
  if (/Mobile|Android|iPhone|iPad|iPod|Windows Phone|BlackBerry|Opera Mini|IEMobile/i.test(ua)) {
    result.isMobile = true;
    result.device = /iPad|Tablet/i.test(ua) ? 'Tablet' : 'Mobile';
  }

  // Browser
  const browserPatterns: [RegExp, string][] = [
    [/Edg(?:e|A|iOS)?\/([\d.]+)/i, 'Edge'],
    [/OPR\/([\d.]+)/i, 'Opera'],
    [/Brave\/([\d.]+)/i, 'Brave'],
    [/Vivaldi\/([\d.]+)/i, 'Vivaldi'],
    [/YaBrowser\/([\d.]+)/i, 'Yandex'],
    [/SamsungBrowser\/([\d.]+)/i, 'Samsung Internet'],
    [/UCBrowser\/([\d.]+)/i, 'UC Browser'],
    [/Firefox\/([\d.]+)/i, 'Firefox'],
    [/Chrome\/([\d.]+)/i, 'Chrome'],
    [/Version\/([\d.]+).*Safari/i, 'Safari'],
    [/MSIE ([\d.]+)/i, 'Internet Explorer'],
    [/Trident.*rv:([\d.]+)/i, 'Internet Explorer'],
  ];
  for (const [re, name] of browserPatterns) {
    const m = ua.match(re);
    if (m) { result.browser = name; result.browserVersion = m[1]; break; }
  }

  // OS
  const osPatterns: [RegExp, string, string?][] = [
    [/Windows NT 10\.0/i, 'Windows', '10'],
    [/Windows NT 11\.0/i, 'Windows', '11'],
    [/Windows NT 6\.3/i, 'Windows', '8.1'],
    [/Windows NT 6\.2/i, 'Windows', '8'],
    [/Windows NT 6\.1/i, 'Windows', '7'],
    [/Mac OS X ([\d_]+)/i, 'macOS'],
    [/CPU (?:iPhone )?OS ([\d_]+)/i, 'iOS'],
    [/Android ([\d.]+)/i, 'Android'],
    [/Linux/i, 'Linux'],
    [/CrOS/i, 'Chrome OS'],
    [/Ubuntu/i, 'Ubuntu'],
    [/Fedora/i, 'Fedora'],
  ];
  for (const [re, name, ver] of osPatterns) {
    const m = ua.match(re);
    if (m) {
      result.os = name;
      result.osVersion = ver || (m[1] ? m[1].replace(/_/g, '.') : '');
      break;
    }
  }

  // Engine
  const enginePatterns: [RegExp, string][] = [
    [/AppleWebKit\/([\d.]+)/i, 'WebKit'],
    [/Gecko\/([\d.]+)/i, 'Gecko'],
    [/Trident\/([\d.]+)/i, 'Trident'],
    [/Presto\/([\d.]+)/i, 'Presto'],
    [/Blink\/([\d.]+)/i, 'Blink'],
  ];
  for (const [re, name] of enginePatterns) {
    const m = ua.match(re);
    if (m) { result.engine = name; result.engineVersion = m[1]; break; }
  }

  return result;
}

const SAMPLES: { label: string; ua: string }[] = [
  { label: 'Chrome (macOS)', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
  { label: 'Safari (iPhone)', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1' },
  { label: 'Firefox (Windows)', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0' },
  { label: 'Googlebot', ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
];

export default function UaParser() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('ua');
  const [input, setInput] = useState('');

  const result = useMemo(() => input.trim() ? parseUA(input) : null, [input]);

  const fields = result ? [
    { label: ui.browser, value: result.browser ? `${result.browser} ${result.browserVersion}` : '-' },
    { label: ui.os, value: result.os ? `${result.os} ${result.osVersion}` : '-' },
    { label: ui.device, value: result.device },
    { label: ui.engine, value: result.engine ? `${result.engine} ${result.engineVersion}` : '-' },
    { label: ui.isMobile, value: result.isMobile ? '✓' : '✕' },
    { label: ui.isBot, value: result.isBot ? '✓' : '✕' },
  ] : [];

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.input')}
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => setInput(SAMPLE_UA)}>{t('common.example')}</button>
              <button className="panel-btn" onClick={() => setInput('')}>{t('common.clear')}</button>
            </div>
          </div>
          <textarea className="tool-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={ui.placeholder} style={{ minHeight: 100 }} />
          <div className="ua-samples">
            {SAMPLES.map((s) => (
              <button key={s.label} className="ua-sample-btn" onClick={() => setInput(s.ua)}>{s.label}</button>
            ))}
          </div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">{t('common.output')}</div>
          <div className="ua-result">
            {result ? (
              <div className="ua-fields">
                {fields.map((f) => (
                  <div key={f.label} className="ua-field">
                    <span className="ua-field-label">{f.label}</span>
                    <span className="ua-field-value">{f.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ua-empty">{t('common.waiting')}</div>
            )}
            {result && <div className="ua-raw"><span className="ua-raw-label">UA</span> {input}</div>}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} />}
    </ToolShell>
  );
}
