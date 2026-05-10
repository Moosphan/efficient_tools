import { useState, useEffect } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

export default function TimestampConverter() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('timestamp');
  const [now, setNow] = useState(Date.now());
  const [tsInput, setTsInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [tsResult, setTsResult] = useState('');
  const [dateResult, setDateResult] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';

  const tsToDate = () => {
    const raw = tsInput.trim();
    if (!raw) return;
    const num = Number(raw);
    if (isNaN(num)) { setTsResult(t('common.error') + '：' + (lang === 'zh' ? '请输入有效数字' : 'Please enter a valid number')); return; }
    const ms = raw.length <= 10 ? num * 1000 : num;
    const d = new Date(ms);
    if (isNaN(d.getTime())) { setTsResult(t('common.error') + '：' + (lang === 'zh' ? '无效时间戳' : 'Invalid timestamp')); return; }
    setTsResult([
      `${lang === 'zh' ? '本地时间' : 'Local Time'}: ${d.toLocaleString(locale)}`,
      `${lang === 'zh' ? 'UTC 时间' : 'UTC Time'}: ${d.toUTCString()}`,
      `ISO 8601: ${d.toISOString()}`,
      `${ui.seconds || 'Seconds'}: ${Math.floor(ms / 1000)}`,
      `${ui.milliseconds || 'Milliseconds'}: ${ms}`,
      `${ui.relative || 'Relative'}: ${getRelativeTime(ms, lang)}`,
    ].join('\n'));
  };

  const dateToTs = () => {
    const raw = dateInput.trim();
    if (!raw) return;
    const d = new Date(raw);
    if (isNaN(d.getTime())) { setDateResult(t('common.error') + '：' + (lang === 'zh' ? '请输入有效日期格式' : 'Please enter a valid date')); return; }
    setDateResult([
      `${ui.seconds || 'Seconds'}: ${Math.floor(d.getTime() / 1000)}`,
      `${ui.milliseconds || 'Milliseconds'}: ${d.getTime()}`,
      `${lang === 'zh' ? '本地时间' : 'Local Time'}: ${d.toLocaleString(locale)}`,
      `${lang === 'zh' ? 'UTC 时间' : 'UTC Time'}: ${d.toUTCString()}`,
      `ISO 8601: ${d.toISOString()}`,
    ].join('\n'));
  };

  const setCurrentTs = () => setTsInput(String(Math.floor(Date.now() / 1000)));

  const setCurrentDate = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setDateInput(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
  };

  return (
    <ToolShell title={name} description={desc}>
      <div className="ts-clock">
        <div className="ts-clock-label">{ui.now || 'Current Time'}</div>
        <div className="ts-clock-value">{new Date(now).toLocaleString(locale)}</div>
        <div className="ts-clock-ts">{Math.floor(now / 1000)}</div>
      </div>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {ui.tsToDate || 'Timestamp to Date'}
            <div className="panel-actions">
              <button className="panel-btn" onClick={setCurrentTs}>{ui.now || 'Current Time'}</button>
              <button className="panel-btn accent" onClick={tsToDate}>{lang === 'zh' ? '转换' : 'Convert'}</button>
            </div>
          </div>
          <input
            type="text"
            className="tool-input"
            value={tsInput}
            onChange={(e) => setTsInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && tsToDate()}
            placeholder={lang === 'zh' ? '输入 Unix 时间戳（秒或毫秒）' : 'Enter Unix timestamp (seconds or milliseconds)'}
          />
          <div className="output-area">{tsResult || (lang === 'zh' ? '输入时间戳后点击转换…' : 'Enter a timestamp and click Convert…')}</div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {ui.dateToTs || 'Date to Timestamp'}
            <div className="panel-actions">
              <button className="panel-btn" onClick={setCurrentDate}>{ui.now || 'Current Time'}</button>
              <button className="panel-btn accent" onClick={dateToTs}>{lang === 'zh' ? '转换' : 'Convert'}</button>
            </div>
          </div>
          <input
            type="text"
            className="tool-input"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && dateToTs()}
            placeholder="2024-01-15 10:30:00"
          />
          <div className="output-area">{dateResult || (lang === 'zh' ? '输入日期后点击转换…' : 'Enter a date and click Convert…')}</div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}

function getRelativeTime(ms: number, lang: string): string {
  const diff = Date.now() - ms;
  const abs = Math.abs(diff);

  if (lang === 'zh') {
    const suffix = diff > 0 ? '前' : '后';
    if (abs < 60_000) return `${Math.floor(abs / 1000)} 秒${suffix}`;
    if (abs < 3_600_000) return `${Math.floor(abs / 60_000)} 分钟${suffix}`;
    if (abs < 86_400_000) return `${Math.floor(abs / 3_600_000)} 小时${suffix}`;
    if (abs < 2_592_000_000) return `${Math.floor(abs / 86_400_000)} 天${suffix}`;
    return `${Math.floor(abs / 2_592_000_000)} 个月${suffix}`;
  }

  const suffix = diff > 0 ? ' ago' : ' from now';
  if (abs < 60_000) return `${Math.floor(abs / 1000)} second${abs >= 2000 ? 's' : ''}${suffix}`;
  if (abs < 3_600_000) return `${Math.floor(abs / 60_000)} minute${abs >= 120_000 ? 's' : ''}${suffix}`;
  if (abs < 86_400_000) return `${Math.floor(abs / 3_600_000)} hour${abs >= 7_200_000 ? 's' : ''}${suffix}`;
  if (abs < 2_592_000_000) return `${Math.floor(abs / 86_400_000)} day${abs >= 172_800_000 ? 's' : ''}${suffix}`;
  return `${Math.floor(abs / 2_592_000_000)} month${abs >= 5_184_000_000 ? 's' : ''}${suffix}`;
}
