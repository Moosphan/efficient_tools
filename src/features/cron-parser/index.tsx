import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';

const DOW_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const MONTH_NAMES = ['', '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

function parseCronField(field: string, min: number, max: number): number[] {
  const values = new Set<number>();

  for (const part of field.split(',')) {
    if (part === '*') {
      for (let i = min; i <= max; i++) values.add(i);
    } else if (part.startsWith('*/')) {
      const step = parseInt(part.slice(2));
      if (isNaN(step) || step <= 0) throw new Error(`无效步长: ${part}`);
      for (let i = min; i <= max; i += step) values.add(i);
    } else if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr), end = parseInt(endStr);
      if (isNaN(start) || isNaN(end)) throw new Error(`无效范围: ${part}`);
      for (let i = start; i <= end; i++) values.add(i);
    } else {
      const val = parseInt(part);
      if (isNaN(val)) throw new Error(`无效值: ${part}`);
      values.add(val);
    }
  }

  return Array.from(values).sort((a, b) => a - b);
}

function describeCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error('Cron 表达式需要 5 个字段: 分 时 日 月 周');

  const [minField, hourField, domField, monthField, dowField] = parts;
  const desc: string[] = [];

  // Month
  if (monthField !== '*') {
    const months = parseCronField(monthField, 1, 12);
    desc.push(months.map((m) => MONTH_NAMES[m] || m + '月').join(', '));
  }

  // Day of week
  if (dowField !== '*') {
    const dows = parseCronField(dowField, 0, 6);
    desc.push('每' + dows.map((d) => DOW_NAMES[d]).join(', '));
  }

  // Day of month
  if (domField !== '*') {
    const doms = parseCronField(domField, 1, 31);
    desc.push('每月 ' + doms.join(', ') + ' 日');
  }

  // Time
  if (minField === '*' && hourField === '*') {
    desc.push('每分钟');
  } else if (hourField === '*' && minField.startsWith('*/')) {
    desc.push(`每 ${minField.slice(2)} 分钟`);
  } else if (hourField === '*') {
    const mins = parseCronField(minField, 0, 59);
    desc.push(`每小时的第 ${mins.join(', ')} 分钟`);
  } else if (minField === '*') {
    const hours = parseCronField(hourField, 0, 23);
    desc.push(`每小时 ${hours.join(', ')}:00`);
  } else {
    const hours = parseCronField(hourField, 0, 23);
    const mins = parseCronField(minField, 0, 59);
    const times: string[] = [];
    for (const h of hours) {
      for (const m of mins) {
        times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    desc.push(times.join(', '));
  }

  return desc.join('，');
}

function getNextRuns(expr: string, count: number = 5): Date[] {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  const [minField, hourField, domField, monthField, dowField] = parts;
  const validMinutes = parseCronField(minField, 0, 59);
  const validHours = parseCronField(hourField, 0, 23);
  const validDoms = parseCronField(domField, 1, 31);
  const validMonths = parseCronField(monthField, 1, 12);
  const validDows = parseCronField(dowField, 0, 6);

  const results: Date[] = [];
  const now = new Date();
  const d = new Date(now);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);

  const maxIterations = 525_600; // 1 year of minutes
  for (let i = 0; i < maxIterations && results.length < count; i++) {
    if (
      validMinutes.includes(d.getMinutes()) &&
      validHours.includes(d.getHours()) &&
      validDoms.includes(d.getDate()) &&
      validMonths.includes(d.getMonth() + 1) &&
      validDows.includes(d.getDay())
    ) {
      results.push(new Date(d));
    }
    d.setMinutes(d.getMinutes() + 1);
  }

  return results;
}

const PRESETS = [
  { label: '每分钟', value: '* * * * *' },
  { label: '每小时', value: '0 * * * *' },
  { label: '每天零点', value: '0 0 * * *' },
  { label: '每天 8:30', value: '30 8 * * *' },
  { label: '工作日 9:00', value: '0 9 * * 1-5' },
  { label: '每周一 10:00', value: '0 10 * * 1' },
  { label: '每月1号', value: '0 0 1 * *' },
  { label: '每5分钟', value: '*/5 * * * *' },
];

export default function CronParser() {
  const [expr, setExpr] = useState('30 8 * * 1-5');

  const result = useMemo(() => {
    const trimmed = expr.trim();
    if (!trimmed) return null;
    try {
      const description = describeCron(trimmed);
      const nextRuns = getNextRuns(trimmed);
      return { description, nextRuns, error: null };
    } catch (e) {
      return { description: '', nextRuns: [], error: e instanceof Error ? e.message : '解析失败' };
    }
  }, [expr]);

  return (
    <ToolShell title="Cron 表达式解析" description="Cron 表达式转自然语言，展示最近执行时间">
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">Cron 表达式</div>
          <div className="cron-input-row">
            <input
              type="text"
              className="tool-input cron-expr-input"
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
              placeholder="* * * * *"
            />
          </div>
          <div className="cron-field-labels">
            <span>分</span><span>时</span><span>日</span><span>月</span><span>周</span>
          </div>
          <div className="panel-header">常用预设</div>
          <div className="cron-presets">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                className={`cron-preset${expr === p.value ? ' active' : ''}`}
                onClick={() => setExpr(p.value)}
              >
                {p.label}
                <span className="cron-preset-value">{p.value}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">含义</div>
          <div className="cron-description">
            {result?.error ? (
              <div className="error-msg">{result.error}</div>
            ) : result?.description ? (
              <div className="cron-desc-text">{result.description}</div>
            ) : (
              <div style={{ padding: 16, color: 'var(--muted)', fontSize: 13 }}>输入 Cron 表达式后自动解析…</div>
            )}
          </div>
          <div className="panel-header">最近 {result?.nextRuns.length || 0} 次执行时间</div>
          <div className="cron-next-runs">
            {result?.nextRuns.map((d, i) => (
              <div key={i} className="cron-run-item">
                <span className="cron-run-idx">#{i + 1}</span>
                <span className="cron-run-time">{d.toLocaleString('zh-CN')}</span>
              </div>
            ))}
            {result && result.nextRuns.length === 0 && !result.error && (
              <div style={{ padding: 16, color: 'var(--muted)', fontSize: 13 }}>无匹配的执行时间</div>
            )}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
