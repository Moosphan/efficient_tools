import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';
import type { Lang } from '../../shared/context/I18nContext';

// Word maps for describeCron() localization
const CRON_WORDS: Record<Lang, {
  dowNames: string[];
  monthNames: string[];
  every: string;
  everyMonth: string;
  monthSuffix: string;
  minute: string;
  minutes: string;
  minuteOfHour: string;
  hour: string;
  dayOfMonthSuffix: string;
  at: string;
  everyMinute: string;
  everyNMinutes: (n: string) => string;
  everyHourAtMinutes: (mins: string) => string;
  atHoursZero: (hours: string) => string;
  sep: string;
  invalidLen: string;
  invalidStep: (p: string) => string;
  invalidRange: (p: string) => string;
  invalidValue: (p: string) => string;
}> = {
  zh: {
    dowNames: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    monthNames: ['', '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    every: '每',
    everyMonth: '每月 ',
    monthSuffix: '月',
    minute: '分钟',
    minutes: '分钟',
    minuteOfHour: '分钟',
    hour: '小时',
    dayOfMonthSuffix: ' 日',
    at: '',
    everyMinute: '每分钟',
    everyNMinutes: (n) => `每 ${n} 分钟`,
    everyHourAtMinutes: (mins) => `每小时的第 ${mins} 分钟`,
    atHoursZero: (hours) => `每小时 ${hours}:00`,
    sep: '，',
    invalidLen: 'Cron 表达式需要 5 个字段: 分 时 日 月 周',
    invalidStep: (p) => `无效步长: ${p}`,
    invalidRange: (p) => `无效范围: ${p}`,
    invalidValue: (p) => `无效值: ${p}`,
  },
  en: {
    dowNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    monthNames: ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    every: 'Every ',
    everyMonth: 'In ',
    monthSuffix: '',
    minute: 'minute',
    minutes: 'minutes',
    minuteOfHour: 'minute',
    hour: 'hour',
    dayOfMonthSuffix: '',
    at: 'At ',
    everyMinute: 'Every minute',
    everyNMinutes: (n) => `Every ${n} minutes`,
    everyHourAtMinutes: (mins) => `At minute ${mins} of every hour`,
    atHoursZero: (hours) => `At ${hours}:00`,
    sep: ', ',
    invalidLen: 'Cron expression requires 5 fields: minute hour day month weekday',
    invalidStep: (p) => `Invalid step: ${p}`,
    invalidRange: (p) => `Invalid range: ${p}`,
    invalidValue: (p) => `Invalid value: ${p}`,
  },
};

function parseCronField(field: string, min: number, max: number, lang: Lang): number[] {
  const w = CRON_WORDS[lang];
  const values = new Set<number>();

  for (const part of field.split(',')) {
    if (part === '*') {
      for (let i = min; i <= max; i++) values.add(i);
    } else if (part.startsWith('*/')) {
      const step = parseInt(part.slice(2));
      if (isNaN(step) || step <= 0) throw new Error(w.invalidStep(part));
      for (let i = min; i <= max; i += step) values.add(i);
    } else if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr), end = parseInt(endStr);
      if (isNaN(start) || isNaN(end)) throw new Error(w.invalidRange(part));
      for (let i = start; i <= end; i++) values.add(i);
    } else {
      const val = parseInt(part);
      if (isNaN(val)) throw new Error(w.invalidValue(part));
      values.add(val);
    }
  }

  return Array.from(values).sort((a, b) => a - b);
}

function describeCron(expr: string, lang: Lang): string {
  const w = CRON_WORDS[lang];
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error(w.invalidLen);

  const [minField, hourField, domField, monthField, dowField] = parts;
  const desc: string[] = [];

  // Month
  if (monthField !== '*') {
    const months = parseCronField(monthField, 1, 12, lang);
    desc.push(months.map((m) => w.monthNames[m] || m + w.monthSuffix).join(', '));
  }

  // Day of week
  if (dowField !== '*') {
    const dows = parseCronField(dowField, 0, 6, lang);
    desc.push(w.every + dows.map((d) => w.dowNames[d]).join(', '));
  }

  // Day of month
  if (domField !== '*') {
    const doms = parseCronField(domField, 1, 31, lang);
    desc.push(w.everyMonth + doms.join(', ') + w.dayOfMonthSuffix);
  }

  // Time
  if (minField === '*' && hourField === '*') {
    desc.push(w.everyMinute);
  } else if (hourField === '*' && minField.startsWith('*/')) {
    desc.push(w.everyNMinutes(minField.slice(2)));
  } else if (hourField === '*') {
    const mins = parseCronField(minField, 0, 59, lang);
    desc.push(w.everyHourAtMinutes(mins.join(', ')));
  } else if (minField === '*') {
    const hours = parseCronField(hourField, 0, 23, lang);
    desc.push(w.atHoursZero(hours.join(', ')));
  } else {
    const hours = parseCronField(hourField, 0, 23, lang);
    const mins = parseCronField(minField, 0, 59, lang);
    const times: string[] = [];
    for (const h of hours) {
      for (const m of mins) {
        times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    desc.push(times.join(', '));
  }

  return desc.join(w.sep);
}

function getNextRuns(expr: string, count: number = 5): Date[] {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  const [minField, hourField, domField, monthField, dowField] = parts;
  const validMinutes = parseCronField(minField, 0, 59, 'en');
  const validHours = parseCronField(hourField, 0, 23, 'en');
  const validDoms = parseCronField(domField, 1, 31, 'en');
  const validMonths = parseCronField(monthField, 1, 12, 'en');
  const validDows = parseCronField(dowField, 0, 6, 'en');

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

export default function CronParser() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('cron');
  const [expr, setExpr] = useState('30 8 * * 1-5');

  // Preset labels translated via ui keys
  const presets = useMemo(() => [
    { label: ui.everyMinute || '每分钟', value: '* * * * *' },
    { label: ui.everyHour || '每小时', value: '0 * * * *' },
    { label: ui.dailyMidnight || '每天零点', value: '0 0 * * *' },
    { label: ui.daily830 || '每天 8:30', value: '30 8 * * *' },
    { label: ui.weekday900 || '工作日 9:00', value: '0 9 * * 1-5' },
    { label: ui.monday1000 || '每周一 10:00', value: '0 10 * * 1' },
    { label: ui.firstOfMonth || '每月1号', value: '0 0 1 * *' },
    { label: ui.every5min || '每5分钟', value: '*/5 * * * *' },
  ], [ui]);

  const result = useMemo(() => {
    const trimmed = expr.trim();
    if (!trimmed) return null;
    try {
      const description = describeCron(trimmed, lang);
      const nextRuns = getNextRuns(trimmed);
      return { description, nextRuns, error: null };
    } catch (e) {
      return { description: '', nextRuns: [], error: e instanceof Error ? e.message : t('common.error') };
    }
  }, [expr, lang]);

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">{ui.expression || 'Cron 表达式'}</div>
          <div className="cron-input-row">
            <input
              type="text"
              className="tool-input cron-expr-input"
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
              placeholder={ui.placeholder || '* * * * *'}
            />
          </div>
          <div className="cron-field-labels">
            <span>{ui.minute}</span><span>{ui.hour}</span><span>{ui.day}</span><span>{ui.month}</span><span>{ui.weekday}</span>
          </div>
          <div className="panel-header">{ui.presets || '常用预设'}</div>
          <div className="cron-presets">
            {presets.map((p) => (
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
          <div className="panel-header">{ui.description || '含义'}</div>
          <div className="cron-description">
            {result?.error ? (
              <div className="error-msg">{result.error}</div>
            ) : result?.description ? (
              <div className="cron-desc-text">{result.description}</div>
            ) : (
              <div style={{ padding: 16, color: 'var(--muted)', fontSize: 13 }}>{t('common.waiting')}</div>
            )}
          </div>
          <div className="panel-header">{ui.nextRuns || '最近执行时间'} ({result?.nextRuns.length || 0})</div>
          <div className="cron-next-runs">
            {result?.nextRuns.map((d, i) => (
              <div key={i} className="cron-run-item">
                <span className="cron-run-idx">#{i + 1}</span>
                <span className="cron-run-time">{d.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US')}</span>
              </div>
            ))}
            {result && result.nextRuns.length === 0 && !result.error && (
              <div style={{ padding: 16, color: 'var(--muted)', fontSize: 13 }}>
                {lang === 'zh' ? '无匹配的执行时间' : 'No matching execution times'}
              </div>
            )}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} />}
    </ToolShell>
  );
}
