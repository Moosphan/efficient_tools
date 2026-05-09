import { useState, useEffect } from 'react';
import { ToolShell } from '../../shell/ToolShell';

export default function TimestampConverter() {
  const [now, setNow] = useState(Date.now());
  const [tsInput, setTsInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [tsResult, setTsResult] = useState('');
  const [dateResult, setDateResult] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const tsToDate = () => {
    const raw = tsInput.trim();
    if (!raw) return;
    const num = Number(raw);
    if (isNaN(num)) { setTsResult('请输入有效数字'); return; }
    const ms = raw.length <= 10 ? num * 1000 : num;
    const d = new Date(ms);
    if (isNaN(d.getTime())) { setTsResult('无效时间戳'); return; }
    setTsResult([
      `本地时间: ${d.toLocaleString('zh-CN')}`,
      `UTC 时间: ${d.toUTCString()}`,
      `ISO 8601: ${d.toISOString()}`,
      `秒级时间戳: ${Math.floor(ms / 1000)}`,
      `毫秒时间戳: ${ms}`,
      `相对时间: ${getRelativeTime(ms)}`,
    ].join('\n'));
  };

  const dateToTs = () => {
    const raw = dateInput.trim();
    if (!raw) return;
    const d = new Date(raw);
    if (isNaN(d.getTime())) { setDateResult('请输入有效日期格式'); return; }
    setDateResult([
      `秒级时间戳: ${Math.floor(d.getTime() / 1000)}`,
      `毫秒时间戳: ${d.getTime()}`,
      `本地时间: ${d.toLocaleString('zh-CN')}`,
      `UTC 时间: ${d.toUTCString()}`,
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
    <ToolShell title="时间戳转换" description="Unix 时间戳与日期互转，支持秒/毫秒">
      <div className="ts-clock">
        <div className="ts-clock-label">当前时间</div>
        <div className="ts-clock-value">{new Date(now).toLocaleString('zh-CN')}</div>
        <div className="ts-clock-ts">{Math.floor(now / 1000)}</div>
      </div>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            时间戳 → 日期
            <div className="panel-actions">
              <button className="panel-btn" onClick={setCurrentTs}>当前时间戳</button>
              <button className="panel-btn accent" onClick={tsToDate}>转换</button>
            </div>
          </div>
          <input
            type="text"
            className="tool-input"
            value={tsInput}
            onChange={(e) => setTsInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && tsToDate()}
            placeholder="输入 Unix 时间戳（秒或毫秒）"
          />
          <div className="output-area">{tsResult || '输入时间戳后点击转换…'}</div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            日期 → 时间戳
            <div className="panel-actions">
              <button className="panel-btn" onClick={setCurrentDate}>当前时间</button>
              <button className="panel-btn accent" onClick={dateToTs}>转换</button>
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
          <div className="output-area">{dateResult || '输入日期后点击转换…'}</div>
        </div>
      </div>
    </ToolShell>
  );
}

function getRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const abs = Math.abs(diff);
  const suffix = diff > 0 ? '前' : '后';
  if (abs < 60_000) return `${Math.floor(abs / 1000)} 秒${suffix}`;
  if (abs < 3_600_000) return `${Math.floor(abs / 60_000)} 分钟${suffix}`;
  if (abs < 86_400_000) return `${Math.floor(abs / 3_600_000)} 小时${suffix}`;
  if (abs < 2_592_000_000) return `${Math.floor(abs / 86_400_000)} 天${suffix}`;
  return `${Math.floor(abs / 2_592_000_000)} 个月${suffix}`;
}
