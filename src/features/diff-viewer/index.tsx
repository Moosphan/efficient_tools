import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';

type DiffLine = { type: 'equal' | 'add' | 'remove'; content: string; oldLine?: number; newLine?: number };

function computeLineDiff(oldText: string, newText: string, ignoreWhitespace: boolean): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const normalize = (s: string) => ignoreWhitespace ? s.trim().replace(/\s+/g, ' ') : s;

  // LCS DP table
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (normalize(oldLines[i - 1]) === normalize(newLines[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normalize(oldLines[i - 1]) === normalize(newLines[j - 1])) {
      result.unshift({ type: 'equal', content: oldLines[i - 1], oldLine: i, newLine: j });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'add', content: newLines[j - 1], newLine: j });
      j--;
    } else {
      result.unshift({ type: 'remove', content: oldLines[i - 1], oldLine: i });
      i--;
    }
  }

  return result;
}

function computeCharDiff(oldLine: string, newLine: string): { type: 'equal' | 'add' | 'remove'; text: string }[] {
  const a = oldLine;
  const b = newLine;
  const m = a.length;
  const n = b.length;

  // LCS for characters
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const result: { type: 'equal' | 'add' | 'remove'; text: string }[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: 'equal', text: a[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'add', text: b[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'remove', text: a[i - 1] });
      i--;
    }
  }

  return result;
}

export default function DiffViewer() {
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'inline'>('split');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  const diff = useMemo(() => {
    if (!oldText && !newText) return null;
    return computeLineDiff(oldText, newText, ignoreWhitespace);
  }, [oldText, newText, ignoreWhitespace]);

  const stats = useMemo(() => {
    if (!diff) return null;
    const added = diff.filter((d) => d.type === 'add').length;
    const removed = diff.filter((d) => d.type === 'remove').length;
    const unchanged = diff.filter((d) => d.type === 'equal').length;
    return { added, removed, unchanged, total: diff.length };
  }, [diff]);

  const clear = () => { setOldText(''); setNewText(''); };

  return (
    <ToolShell title="文本 Diff 对比" description="行级/字符级差异对比，支持并排和内联视图">
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            原始文本
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => setOldText('')}>清空</button>
            </div>
          </div>
          <textarea
            className="tool-textarea"
            value={oldText}
            onChange={(e) => setOldText(e.target.value)}
            placeholder="粘贴原始文本…"
          />
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            修改后文本
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => setNewText('')}>清空</button>
            </div>
          </div>
          <textarea
            className="tool-textarea"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="粘贴修改后的文本…"
          />
        </div>
      </div>

      {diff && (
        <div className="tool-panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            差异结果
            <div className="panel-actions">
              <button className={`panel-btn${viewMode === 'split' ? ' accent' : ''}`} onClick={() => setViewMode('split')}>并排</button>
              <button className={`panel-btn${viewMode === 'inline' ? ' accent' : ''}`} onClick={() => setViewMode('inline')}>内联</button>
              <button className={`panel-btn${ignoreWhitespace ? ' accent' : ''}`} onClick={() => setIgnoreWhitespace(!ignoreWhitespace)}>忽略空白</button>
              <button className="panel-btn" onClick={clear}>清空</button>
            </div>
          </div>
          {stats && (
            <div className="diff-stats">
              <span className="diff-stat-add">+{stats.added}</span>
              <span className="diff-stat-remove">-{stats.removed}</span>
              <span className="diff-stat-unchanged">{stats.unchanged} unchanged</span>
            </div>
          )}
          {viewMode === 'split' ? (
            <SplitView diff={diff} />
          ) : (
            <InlineView diff={diff} />
          )}
        </div>
      )}
    </ToolShell>
  );
}

function SplitView({ diff }: { diff: DiffLine[] }) {
  const leftLines: { type: 'equal' | 'remove' | 'empty'; content: string; line?: number }[] = [];
  const rightLines: { type: 'equal' | 'add' | 'empty'; content: string; line?: number }[] = [];

  for (const d of diff) {
    if (d.type === 'equal') {
      leftLines.push({ type: 'equal', content: d.content, line: d.oldLine });
      rightLines.push({ type: 'equal', content: d.content, line: d.newLine });
    } else if (d.type === 'remove') {
      leftLines.push({ type: 'remove', content: d.content, line: d.oldLine });
      rightLines.push({ type: 'empty', content: '' });
    } else {
      leftLines.push({ type: 'empty', content: '' });
      rightLines.push({ type: 'add', content: d.content, line: d.newLine });
    }
  }

  return (
    <div className="diff-split">
      <div className="diff-split-pane">
        {leftLines.map((line, i) => (
          <DiffLineRow key={i} lineNum={line.line} type={line.type} content={line.content} />
        ))}
      </div>
      <div className="diff-split-pane">
        {rightLines.map((line, i) => (
          <DiffLineRow key={i} lineNum={line.line} type={line.type} content={line.content} />
        ))}
      </div>
    </div>
  );
}

function InlineView({ diff }: { diff: DiffLine[] }) {
  const lines: { type: string; content: string; line?: number }[] = [];
  for (const d of diff) {
    if (d.type === 'equal') {
      lines.push({ type: 'equal', content: d.content, line: d.oldLine });
    } else if (d.type === 'remove') {
      lines.push({ type: 'remove', content: d.content, line: d.oldLine });
    } else {
      lines.push({ type: 'add', content: d.content, line: d.newLine });
    }
  }

  return (
    <div className="diff-inline">
      {lines.map((line, i) => (
        <DiffLineRow key={i} lineNum={line.line} type={line.type as any} content={line.content} />
      ))}
    </div>
  );
}

function DiffLineRow({ lineNum, type, content }: { lineNum?: number; type: string; content: string }) {
  const prefix = type === 'add' ? '+' : type === 'remove' ? '-' : ' ';

  return (
    <div className={`diff-line diff-line-${type}`}>
      <span className="diff-line-num">{lineNum ?? ''}</span>
      <span className="diff-line-prefix">{prefix}</span>
      <span className="diff-line-content">{content || ' '}</span>
    </div>
  );
}
