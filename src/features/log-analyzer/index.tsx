import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'OTHER';
interface LogLine { line: number; raw: string; level: LogLevel; timestamp: string; }

const LOGCAT_LINE = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3}\s+\d+-\d+/;
const ANDROID_LEVEL: Record<string, LogLevel> = { V: 'DEBUG', D: 'DEBUG', I: 'INFO', W: 'WARN', E: 'ERROR', F: 'ERROR' };

function parseLogs(raw: string): LogLine[] {
  return raw.split('\n').map((line, i) => {
    let level: LogLevel = 'OTHER';
    if (LOGCAT_LINE.test(line)) {
      const m = line.match(/\s{2,}([VDIWEF])\s{1,}/);
      if (m) level = ANDROID_LEVEL[m[1].toUpperCase()] || 'OTHER';
    } else {
      const levelMatch = line.match(/\b(ERROR|WARN(?:ING)?|INFO|DEBUG|TRACE|FATAL)\b/i);
      if (levelMatch) {
        const l = levelMatch[1].toUpperCase();
        if (l === 'WARNING') level = 'WARN';
        else if (l === 'FATAL') level = 'ERROR';
        else level = l as LogLevel;
      }
    }
    const tsMatch = line.match(/(\d{4}[-/]\d{2}[-/]\d{2}[\sT]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?)/);
    return { line: i + 1, raw: line, level, timestamp: tsMatch ? tsMatch[1] : '' };
  });
}

const LEVEL_COLORS: Record<LogLevel, string> = { ERROR: 'var(--red)', WARN: 'var(--amber)', INFO: 'var(--accent)', DEBUG: 'var(--muted)', OTHER: 'var(--muted)' };

const SAMPLE = `2024-01-15 10:23:45 [INFO] Application started on port 3000
2024-01-15 10:23:49 [ERROR] Redis connection refused: 127.0.0.1:6379
2024-01-15 10:23:49 [WARN] Falling back to in-memory cache
2024-01-15 10:23:50 [INFO] GET /api/products 200 45ms
2024-01-15 10:23:51 [ERROR] NullPointerException at OrderService.java:142
2024-01-15 10:23:51 [DEBUG] Retrying payment gateway (1/3)
2024-01-15 10:23:53 [WARN] Memory usage: 85% (threshold: 80%)
2024-01-15 10:23:55 [ERROR] External API timeout (30000ms)
2026-05-09 17:45:11.681  3827-4022  ActivityManager  com.example.app  D  onCreate called
2026-05-09 17:45:11.705  3827-4022  ActivityManager  com.example.app  E  failed to load layout`;

export default function LogAnalyzer() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('logs');
  const [input, setInput] = useState('');
  const [filterText, setFilterText] = useState('');
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'ALL'>('ALL');
  const [parsed, setParsed] = useState<LogLine[]>([]);

  useCleanup(() => { setInput(''); setParsed([]); });
  const analyze = () => { if (!input.trim()) { setParsed([]); return; } setParsed(parseLogs(input)); };

  const filtered = useMemo(() => parsed.filter((l) => {
    if (filterLevel !== 'ALL' && l.level !== filterLevel) return false;
    if (filterText && !l.raw.toLowerCase().includes(filterText.toLowerCase())) return false;
    return true;
  }), [parsed, filterText, filterLevel]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    parsed.forEach((l) => { counts[l.level] = (counts[l.level] || 0) + 1; });
    return counts;
  }, [parsed]);

  return (
    <ToolShell title={name} description={desc}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.input')}
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => setInput(SAMPLE)}>{t('common.example')}</button>
              <button className="panel-btn accent" onClick={analyze}>{ui.analyze}</button>
            </div>
          </div>
          <textarea className="tool-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={ui.placeholder} style={{ minHeight: 150 }} />
        </div>
        {parsed.length > 0 && (
          <div className="tool-panel">
            <div className="log-controls">
              <input type="text" placeholder={ui.keywordPlaceholder} value={filterText} onChange={(e) => setFilterText(e.target.value)} />
              <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value as LogLevel | 'ALL')}>
                <option value="ALL">{ui.allLevels}</option>
                <option value="ERROR">ERROR</option>
                <option value="WARN">WARN</option>
                <option value="INFO">INFO</option>
                <option value="DEBUG">DEBUG</option>
              </select>
              <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 'auto' }}>{filtered.length} / {parsed.length} {ui.lines}</span>
            </div>
            <div className="log-output">
              {filtered.map((l) => (
                <div key={l.line} className="log-line">
                  <span className="log-line-num">{l.line}</span>
                  {l.timestamp && <span className="log-ts">{l.timestamp} </span>}
                  <span style={{ color: LEVEL_COLORS[l.level], fontWeight: l.level === 'ERROR' ? 600 : l.level === 'WARN' ? 500 : 400 }}>{l.level !== 'OTHER' ? `[${l.level}] ` : ''}</span>
                  <span>{l.level === 'OTHER' ? l.raw : l.raw.replace(/\b(ERROR|WARN(?:ING)?|INFO|DEBUG|TRACE|FATAL)\b/i, '').replace(/^\s*\[[\w]+\]\s*/, '').trim()}</span>
                </div>
              ))}
            </div>
            <div className="log-stats">
              {Object.entries(stats).map(([level, count]) => (
                <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: LEVEL_COLORS[level as LogLevel] }} />
                  {level}: {count}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
