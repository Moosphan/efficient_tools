import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

type DiffLine = { type: 'equal' | 'add' | 'remove'; content: string; oldLine?: number; newLine?: number };

function computeLineDiff(oldText: string, newText: string, ignoreWhitespace: boolean): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const normalize = (s: string) => ignoreWhitespace ? s.trim().replace(/\s+/g, ' ') : s;
  const m = oldLines.length, n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = normalize(oldLines[i - 1]) === normalize(newLines[j - 1]) ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const result: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normalize(oldLines[i - 1]) === normalize(newLines[j - 1])) { result.unshift({ type: 'equal', content: oldLines[i - 1], oldLine: i, newLine: j }); i--; j--; }
    else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) { result.unshift({ type: 'add', content: newLines[j - 1], newLine: j }); j--; }
    else { result.unshift({ type: 'remove', content: oldLines[i - 1], oldLine: i }); i--; }
  }
  return result;
}

export default function DiffViewer() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('diff');
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'inline'>('split');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  const diff = useMemo(() => (!oldText && !newText) ? null : computeLineDiff(oldText, newText, ignoreWhitespace), [oldText, newText, ignoreWhitespace]);
  const stats = useMemo(() => {
    if (!diff) return null;
    return { added: diff.filter((d) => d.type === 'add').length, removed: diff.filter((d) => d.type === 'remove').length, unchanged: diff.filter((d) => d.type === 'equal').length };
  }, [diff]);
  const clear = () => { setOldText(''); setNewText(''); };

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">{ui.original}<div className="panel-actions"><button className="panel-btn" onClick={() => setOldText('')}>{t('common.clear')}</button></div></div>
          <textarea className="tool-textarea" value={oldText} onChange={(e) => setOldText(e.target.value)} placeholder={ui.originalPlaceholder} />
        </div>
        <div className="tool-panel">
          <div className="panel-header">{ui.modified}<div className="panel-actions"><button className="panel-btn" onClick={() => setNewText('')}>{t('common.clear')}</button></div></div>
          <textarea className="tool-textarea" value={newText} onChange={(e) => setNewText(e.target.value)} placeholder={ui.modifiedPlaceholder} />
        </div>
      </div>
      {diff && (
        <div className="tool-panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            {ui.result}
            <div className="panel-actions">
              <button className={`panel-btn${viewMode === 'split' ? ' accent' : ''}`} onClick={() => setViewMode('split')}>{ui.sideBySide}</button>
              <button className={`panel-btn${viewMode === 'inline' ? ' accent' : ''}`} onClick={() => setViewMode('inline')}>{ui.inline}</button>
              <button className={`panel-btn${ignoreWhitespace ? ' accent' : ''}`} onClick={() => setIgnoreWhitespace(!ignoreWhitespace)}>{ui.ignoreWhitespace}</button>
              <button className="panel-btn" onClick={clear}>{t('common.clear')}</button>
            </div>
          </div>
          {stats && (
            <div className="diff-stats">
              <span className="diff-stat-add">+{stats.added}</span>
              <span className="diff-stat-remove">-{stats.removed}</span>
              <span className="diff-stat-unchanged">{stats.unchanged} {ui.unchanged}</span>
            </div>
          )}
          {viewMode === 'split' ? <SplitView diff={diff} /> : <InlineView diff={diff} />}
        </div>
      )}
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}

function SplitView({ diff }: { diff: DiffLine[] }) {
  const leftLines: { type: string; content: string; line?: number }[] = [];
  const rightLines: { type: string; content: string; line?: number }[] = [];
  for (const d of diff) {
    if (d.type === 'equal') { leftLines.push({ type: 'equal', content: d.content, line: d.oldLine }); rightLines.push({ type: 'equal', content: d.content, line: d.newLine }); }
    else if (d.type === 'remove') { leftLines.push({ type: 'remove', content: d.content, line: d.oldLine }); rightLines.push({ type: 'empty', content: '' }); }
    else { leftLines.push({ type: 'empty', content: '' }); rightLines.push({ type: 'add', content: d.content, line: d.newLine }); }
  }
  return (
    <div className="diff-split">
      <div className="diff-split-pane">{leftLines.map((line, i) => <DiffLineRow key={i} lineNum={line.line} type={line.type} content={line.content} />)}</div>
      <div className="diff-split-pane">{rightLines.map((line, i) => <DiffLineRow key={i} lineNum={line.line} type={line.type} content={line.content} />)}</div>
    </div>
  );
}

function InlineView({ diff }: { diff: DiffLine[] }) {
  const lines: { type: string; content: string; line?: number }[] = [];
  for (const d of diff) {
    if (d.type === 'equal') lines.push({ type: 'equal', content: d.content, line: d.oldLine });
    else if (d.type === 'remove') lines.push({ type: 'remove', content: d.content, line: d.oldLine });
    else lines.push({ type: 'add', content: d.content, line: d.newLine });
  }
  return <div className="diff-inline">{lines.map((line, i) => <DiffLineRow key={i} lineNum={line.line} type={line.type} content={line.content} />)}</div>;
}

function DiffLineRow({ lineNum, type, content }: { lineNum?: number; type: string; content: string }) {
  const prefix = type === 'add' ? '+' : type === 'remove' ? '-' : ' ';
  return (
    <div className={`diff-line diff-line-${type}`}>
      <span className="diff-line-num">{lineNum ?? ''}</span>
      <span className="diff-line-prefix">{prefix}</span>
      <span className="diff-line-content">{content || ' '}</span>
    </div>
  );
}
