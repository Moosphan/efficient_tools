import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';

export default function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState<Record<string, boolean>>({ g: true, i: false, m: false, s: false });
  const [testStr, setTestStr] = useState('');

  const toggleFlag = (f: string) => setFlags((prev) => ({ ...prev, [f]: !prev[f] }));
  const flagStr = Object.entries(flags).filter(([, v]) => v).map(([k]) => k).join('');

  const result = useMemo(() => {
    if (!pattern || !testStr) return null;
    try {
      const re = new RegExp(pattern, flagStr);
      const matches: { index: number; match: string; groups: string[] }[] = [];
      if (flagStr.includes('g')) {
        let m: RegExpExecArray | null;
        while ((m = re.exec(testStr)) !== null) {
          matches.push({ index: m.index, match: m[0], groups: m.slice(1) });
          if (m[0].length === 0) re.lastIndex++;
        }
      } else {
        const m = re.exec(testStr);
        if (m) matches.push({ index: m.index, match: m[0], groups: m.slice(1) });
      }
      return { matches, error: null };
    } catch (e) {
      return { matches: [], error: e instanceof Error ? e.message : 'Invalid regex' };
    }
  }, [pattern, flagStr, testStr]);

  const highlighted = useMemo(() => {
    if (!result || !result.matches.length || !testStr) return null;
    const parts: { text: string; highlight: boolean }[] = [];
    let last = 0;
    for (const m of result.matches) {
      if (m.index > last) parts.push({ text: testStr.slice(last, m.index), highlight: false });
      parts.push({ text: m.match, highlight: true });
      last = m.index + m.match.length;
    }
    if (last < testStr.length) parts.push({ text: testStr.slice(last), highlight: false });
    return parts;
  }, [result, testStr]);

  return (
    <ToolShell title="正则验证器" description="实时测试正则表达式，高亮匹配结果">
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            正则表达式
            <div className="panel-actions">
              {Object.keys(flags).map((f) => (
                <button
                  key={f}
                  className={`flag-btn${flags[f] ? ' on' : ''}`}
                  onClick={() => toggleFlag(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="regex-input-row">
            <span className="delim">/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="输入正则表达式…"
            />
            <span className="delim">/</span>
            <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>
              {flagStr}
            </span>
          </div>
          <div className="panel-header">测试字符串</div>
          <textarea
            className="tool-textarea"
            value={testStr}
            onChange={(e) => setTestStr(e.target.value)}
            placeholder="输入要测试的文本…"
            style={{ minHeight: 200 }}
          />
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            匹配结果
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {result ? `${result.matches.length} 个匹配` : '0 个匹配'}
            </span>
          </div>
          <div className="output-area" style={{ minHeight: 200 }}>
            {result?.error ? (
              <div className="error-msg">正则语法错误: {result.error}</div>
            ) : highlighted ? (
              <span>
                {highlighted.map((part, i) =>
                  part.highlight ? (
                    <span key={i} className="match-highlight">{part.text}</span>
                  ) : (
                    <span key={i}>{part.text}</span>
                  )
                )}
              </span>
            ) : (
              <span style={{ color: 'var(--muted)' }}>输入正则和文本后自动匹配…</span>
            )}
          </div>
          <div className="panel-header">匹配列表</div>
          <div style={{ maxHeight: 250, overflow: 'auto' }}>
            {result?.matches.length ? (
              result.matches.map((m, i) => (
                <div key={i} className="match-item">
                  <span className="match-idx">#{i + 1}</span>
                  <span>{m.match}</span>
                  {m.groups.length > 0 && (
                    <span className="match-group">
                      groups: {m.groups.map((g) => g || '—').join(', ')}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: 16, color: 'var(--muted)', fontSize: 13 }}>暂无匹配</div>
            )}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
