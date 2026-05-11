import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

function escapeHtml(s: string): string { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

export function renderMarkdown(md: string): string {
  let html = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => `<pre class="md-code-block"><code class="lang-${lang || 'text'}">${escapeHtml(code.trimEnd())}</code></pre>`);
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');
  { const lines = html.split('\n'); const result: string[] = []; let i = 0;
    const isTableRow = (line: string) => /^\|.+\|$/.test(line.trim());
    const isSepRow = (line: string) => /^\|[-| :]+$/.test(line.trim()) && line.trim().includes('-');
    while (i < lines.length) {
      if (isTableRow(lines[i]) && i + 1 < lines.length && isSepRow(lines[i + 1])) {
        const parseCells = (line: string) => line.trim().slice(1, -1).split('|').map((c) => c.trim());
        const headers = parseCells(lines[i]); const aligns = parseCells(lines[i + 1]).map((s) => { const t = s.replace(/\s/g, ''); if (t.startsWith(':') && t.endsWith(':')) return 'center'; if (t.endsWith(':')) return 'right'; return 'left'; });
        let table = '<table class="md-table"><thead><tr>'; headers.forEach((h, hi) => { table += `<th style="text-align:${aligns[hi] || 'left'}">${h}</th>`; }); table += '</tr></thead><tbody>'; i += 2;
        while (i < lines.length && isTableRow(lines[i])) { const cells = parseCells(lines[i]); table += '<tr>'; cells.forEach((c, ci) => { table += `<td style="text-align:${aligns[ci] || 'left'}">${c}</td>`; }); table += '</tr>'; i++; }
        table += '</tbody></table>'; result.push(table);
      } else { result.push(lines[i]); i++; }
    } html = result.join('\n'); }
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>').replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>').replace(/^####\s+(.+)$/gm, '<h4>$1</h4>').replace(/^###\s+(.+)$/gm, '<h3>$1</h3>').replace(/^##\s+(.+)$/gm, '<h2>$1</h2>').replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/^---+$/gm, '<hr>');
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/~~(.+?)~~/g, '<del>$1</del>');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img">').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>');
  html = html.replace(/^(?!\|)[\s]*[-*+]\s+(.+)$/gm, '<li>$1</li>').replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul class="md-list">$1</ul>');
  html = html.replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/<li>\[x\]\s*(.*?)<\/li>/g, '<li class="md-task done"><input type="checkbox" checked disabled> $1</li>').replace(/<li>\[\s?\]\s*(.*?)<\/li>/g, '<li class="md-task"><input type="checkbox" disabled> $1</li>');
  html = html.replace(/^(?!<[a-z])((?!^\s*$).+)$/gm, (match) => match.startsWith('<') ? match : `<p>${match}</p>`);
  html = html.replace(/<p>\s*<\/p>/g, '');
  return html;
}

function buildPrintHtml(bodyHtml: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Markdown Export</title><style>*{-webkit-print-color-adjust:exact!important}@page{margin:1.5cm}body{font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;line-height:1.7;font-size:14px}h1{font-size:24px;border-bottom:1px solid #eee;padding-bottom:8px}h2{font-size:20px}pre{background:#f5f5f5!important;padding:14px;border-radius:6px;overflow-x:auto;border:1px solid #e0e0e0}pre code{font-family:monospace;font-size:13px;background:none!important;padding:0;border:none}code{font-family:monospace;font-size:12px;padding:2px 5px;background:#f0f0f0!important;border-radius:3px}blockquote{border-left:3px solid #ddd;margin:12px 0;padding:4px 16px;color:#666}hr{border:none;border-top:1px solid #eee;margin:24px 0}table{border-collapse:collapse;width:100%;margin:12px 0}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}th{background:#f5f5f5!important;font-weight:600}</style></head><body>${bodyHtml}</body></html>`;
}

const SAMPLE_ZH = `# Markdown 预览\n\n这是一段 **加粗** 和 *斜体* 文本。\n\n## 表格\n\n| 名称 | 类型 | 说明 |\n|------|:----:|-----:|\n| id | number | 主键 |\n| name | string | 名称 |\n\n## 列表\n\n- 项目一\n- 项目二\n\n## 代码\n\n\`\`\`javascript\nfunction hello() {\n  console.log("Hello!");\n}\n\`\`\`\n\n> 引用文字`;

const SAMPLE_EN = `# Markdown Preview\n\nThis is **bold** and *italic* text.\n\n## Table\n\n| Name | Type | Description |\n|------|:----:|------------:|\n| id | number | Primary key |\n| name | string | Name field |\n\n## List\n\n- Item one\n- Item two\n\n## Code\n\n\`\`\`javascript\nfunction hello() {\n  console.log("Hello!");\n}\n\`\`\`\n\n> Blockquote`;

export default function MarkdownPreview() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('markdown');
  const [input, setInput] = useState('');
  useCleanup(() => { setInput(''); });

  const html = renderMarkdown(input);
  const exportHtml = () => { const blob = new Blob([buildPrintHtml(html)], { type: 'text/html' }); const url = URL.createObjectURL(blob); window.open(url, '_blank'); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const exportPdf = () => { const win = window.open('', '_blank'); if (!win) return; win.document.write(buildPrintHtml(html)); win.document.close(); setTimeout(() => win.print(), 500); };

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout md-layout">
        <div className="tool-panel md-panel">
          <div className="panel-header">
            {ui.editor}
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => setInput(lang === 'zh' ? SAMPLE_ZH : SAMPLE_EN)}>{t('common.example')}</button>
              <button className="panel-btn" onClick={() => setInput('')}>{t('common.clear')}</button>
            </div>
          </div>
          <textarea className="tool-textarea md-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={ui.placeholder} />
        </div>
        <div className="tool-panel md-panel">
          <div className="panel-header">
            {t('common.preview')}
            <div className="panel-actions">
              <button className="panel-btn" onClick={exportHtml}>{ui.exportHtml}</button>
              <button className="panel-btn accent" onClick={exportPdf}>{ui.exportPdf}</button>
            </div>
          </div>
          <div className="md-preview" dangerouslySetInnerHTML={{ __html: html || `<span style="color:var(--muted)">${t('common.waiting')}</span>` }} />
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
