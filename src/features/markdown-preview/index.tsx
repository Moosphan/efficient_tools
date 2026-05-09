import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderMarkdown(md: string): string {
  // Normalize line endings: \r\n and \r → \n
  let html = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="md-code-block"><code class="lang-${lang || 'text'}">${escapeHtml(code.trimEnd())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

  // Tables (line-by-line parsing, before headers)
  {
    const lines = html.split('\n');
    const result: string[] = [];
    let i = 0;

    const isTableRow = (line: string) => /^\|.+\|$/.test(line.trim());
    const isSepRow = (line: string) => /^\|[-| :]+$/.test(line.trim()) && line.trim().includes('-');

    while (i < lines.length) {
      if (isTableRow(lines[i]) && i + 1 < lines.length && isSepRow(lines[i + 1])) {
        const parseCells = (line: string) =>
          line.trim().slice(1, -1).split('|').map((c) => c.trim());

        const headers = parseCells(lines[i]);
        const aligns = parseCells(lines[i + 1]).map((s) => {
          const t = s.replace(/\s/g, '');
          if (t.startsWith(':') && t.endsWith(':')) return 'center';
          if (t.endsWith(':')) return 'right';
          return 'left';
        });

        let table = '<table class="md-table"><thead><tr>';
        headers.forEach((h, hi) => {
          table += `<th style="text-align:${aligns[hi] || 'left'}">${h}</th>`;
        });
        table += '</tr></thead><tbody>';

        i += 2;
        while (i < lines.length && isTableRow(lines[i])) {
          const cells = parseCells(lines[i]);
          table += '<tr>';
          cells.forEach((c, ci) => {
            table += `<td style="text-align:${aligns[ci] || 'left'}">${c}</td>`;
          });
          table += '</tr>';
          i++;
        }
        table += '</tbody></table>';
        result.push(table);
      } else {
        result.push(lines[i]);
        i++;
      }
    }
    html = result.join('\n');
  }

  // Headers
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Horizontal rule
  html = html.replace(/^---+$/gm, '<hr>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Links and images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img">');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Blockquotes
  html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>');

  // Unordered list (skip lines starting with | to avoid breaking table rows)
  html = html.replace(/^(?!\|)[\s]*[-*+]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul class="md-list">$1</ul>');

  // Ordered list
  html = html.replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li>$1</li>');

  // Task list
  html = html.replace(/<li>\[x\]\s*(.*?)<\/li>/g, '<li class="md-task done"><input type="checkbox" checked disabled> $1</li>');
  html = html.replace(/<li>\[\s?\]\s*(.*?)<\/li>/g, '<li class="md-task"><input type="checkbox" disabled> $1</li>');

  // Paragraphs: wrap remaining lines
  html = html.replace(/^(?!<[a-z])((?!^\s*$).+)$/gm, (match) => {
    if (match.startsWith('<')) return match;
    return `<p>${match}</p>`;
  });

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

function buildPrintHtml(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>Markdown Export</title>
<style>
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  @page { margin: 1.5cm; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; max-width: 720px; margin: 0 auto; line-height: 1.7; color: #1a1a1a; font-size: 14px; padding: 0; }
  h1 { font-size: 24px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
  h2 { font-size: 20px; }
  h3 { font-size: 17px; }
  pre { background: #f5f5f5 !important; padding: 14px; border-radius: 6px; overflow-x: auto; border: 1px solid #e0e0e0; }
  pre code { font-family: "JetBrains Mono", Menlo, monospace; font-size: 13px; background: none !important; padding: 0; border: none; }
  code { font-family: "JetBrains Mono", Menlo, monospace; font-size: 12px; padding: 2px 5px; background: #f0f0f0 !important; border-radius: 3px; border: 1px solid #e0e0e0; }
  blockquote { border-left: 3px solid #ddd; margin: 12px 0; padding: 4px 16px; color: #666; }
  hr { border: none; border-top: 1px solid #eee; margin: 24px 0; }
  ul, ol { padding-left: 24px; }
  img { max-width: 100%; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background: #f5f5f5 !important; font-weight: 600; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

const SAMPLE = `# Markdown 预览

这是一段 **加粗** 和 *斜体* 文本，还有 ~~删除线~~。

## 表格

| 名称 | 类型 | 说明 |
|------|:----:|-----:|
| id | number | 主键 |
| name | string | 名称 |
| active | boolean | 状态 |

## 列表

- 项目一
- 项目二
- 项目三

## 任务列表

- [x] 已完成的任务
- [ ] 待完成的任务

## 代码

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

行内代码: \`const x = 42;\`

## 链接

访问 [GitHub](https://github.com)

## 引用

> 这是一段引用文字。

---

\`---\` 分隔线`;

export default function MarkdownPreview() {
  const [input, setInput] = useState('');

  useCleanup(() => { setInput(''); });

  const html = renderMarkdown(input);

  const exportHtml = () => {
    const blob = new Blob([buildPrintHtml(html)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportPdf = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(buildPrintHtml(html));
    win.document.close();
    setTimeout(() => {
      // Auto-trigger print dialog; user should uncheck "Headers and footers" in print settings
      win.print();
    }, 500);
  };

  return (
    <ToolShell title="Markdown 预览" description="实时 Markdown 渲染预览">
      <div className="tool-layout md-layout">
        <div className="tool-panel md-panel">
          <div className="panel-header">
            Markdown 源码
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => setInput(SAMPLE)}>示例</button>
              <button className="panel-btn" onClick={() => setInput('')}>清空</button>
            </div>
          </div>
          <textarea
            className="tool-textarea md-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入 Markdown 文本…"
          />
        </div>
        <div className="tool-panel md-panel">
          <div className="panel-header">
            预览
            <div className="panel-actions">
              <button className="panel-btn" onClick={exportHtml}>导出 HTML</button>
              <button className="panel-btn accent" onClick={exportPdf}>导出 PDF</button>
            </div>
          </div>
          <div className="md-preview" dangerouslySetInnerHTML={{ __html: html || '<span style="color:var(--muted)">输入 Markdown 后实时预览…</span>' }} />
        </div>
      </div>
    </ToolShell>
  );
}
