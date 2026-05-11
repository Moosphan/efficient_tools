import { useState, useRef, useCallback, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

// ── Theme Definitions ──

interface TerminalTheme {
  id: string;
  name: string;
  bg: string;
  fg: string;
  selection: string;
  cursor: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

const THEMES: TerminalTheme[] = [
  {
    id: 'dracula', name: 'Dracula',
    bg: '#282a36', fg: '#f8f8f2', selection: '#44475a', cursor: '#f8f8f2',
    black: '#21222c', red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c',
    blue: '#bd93f9', magenta: '#ff79c6', cyan: '#8be9fd', white: '#f8f8f2',
    brightBlack: '#6272a4', brightRed: '#ff6e6e', brightGreen: '#69ff94', brightYellow: '#ffffa5',
    brightBlue: '#d6acff', brightMagenta: '#ff92df', brightCyan: '#a4ffff', brightWhite: '#ffffff',
  },
  {
    id: 'nord', name: 'Nord',
    bg: '#2e3440', fg: '#eceff4', selection: '#434c5e', cursor: '#eceff4',
    black: '#3b4252', red: '#bf616a', green: '#a3be8c', yellow: '#ebcb8b',
    blue: '#81a1c1', magenta: '#b48ead', cyan: '#88c0d0', white: '#e5e9f0',
    brightBlack: '#4c566a', brightRed: '#bf616a', brightGreen: '#a3be8c', brightYellow: '#ebcb8b',
    brightBlue: '#81a1c1', brightMagenta: '#b48ead', brightCyan: '#8fbcbb', brightWhite: '#eceff4',
  },
  {
    id: 'solarized', name: 'Solarized Dark',
    bg: '#002b36', fg: '#839496', selection: '#073642', cursor: '#839496',
    black: '#073642', red: '#dc322f', green: '#859900', yellow: '#b58900',
    blue: '#268bd2', magenta: '#d33682', cyan: '#2aa198', white: '#eee8d5',
    brightBlack: '#586e75', brightRed: '#cb4b16', brightGreen: '#586e75', brightYellow: '#657b83',
    brightBlue: '#839496', brightMagenta: '#6c71c4', brightCyan: '#93a1a1', brightWhite: '#fdf6e3',
  },
  {
    id: 'gruvbox', name: 'Gruvbox',
    bg: '#282828', fg: '#ebdbb2', selection: '#504945', cursor: '#ebdbb2',
    black: '#282828', red: '#cc241d', green: '#98971a', yellow: '#d79921',
    blue: '#458588', magenta: '#b16286', cyan: '#689d6a', white: '#a89984',
    brightBlack: '#928374', brightRed: '#fb4934', brightGreen: '#b8bb26', brightYellow: '#fabd2f',
    brightBlue: '#83a598', brightMagenta: '#d3869b', brightCyan: '#8ec07c', brightWhite: '#ebdbb2',
  },
  {
    id: 'monokai', name: 'Monokai',
    bg: '#272822', fg: '#f8f8f2', selection: '#49483e', cursor: '#f8f8f2',
    black: '#272822', red: '#f92672', green: '#a6e22e', yellow: '#f4bf75',
    blue: '#66d9ef', magenta: '#ae81ff', cyan: '#a1efe4', white: '#f8f8f2',
    brightBlack: '#75715e', brightRed: '#f92672', brightGreen: '#a6e22e', brightYellow: '#f4bf75',
    brightBlue: '#66d9ef', brightMagenta: '#ae81ff', brightCyan: '#a1efe4', brightWhite: '#f9f8f5',
  },
  {
    id: 'catppuccin', name: 'Catppuccin Mocha',
    bg: '#1e1e2e', fg: '#cdd6f4', selection: '#45475a', cursor: '#f5e0dc',
    black: '#45475a', red: '#f38ba8', green: '#a6e3a1', yellow: '#f9e2af',
    blue: '#89b4fa', magenta: '#f5c2e7', cyan: '#94e2d5', white: '#bac2de',
    brightBlack: '#585b70', brightRed: '#f38ba8', brightGreen: '#a6e3a1', brightYellow: '#f9e2af',
    brightBlue: '#89b4fa', brightMagenta: '#f5c2e7', brightCyan: '#94e2d5', brightWhite: '#a6adc8',
  },
  {
    id: 'tokyonight', name: 'Tokyo Night',
    bg: '#1a1b26', fg: '#a9b1d6', selection: '#33467c', cursor: '#c0caf5',
    black: '#15161e', red: '#f7768e', green: '#9ece6a', yellow: '#e0af68',
    blue: '#7aa2f7', magenta: '#bb9af7', cyan: '#7dcfff', white: '#a9b1d6',
    brightBlack: '#414868', brightRed: '#f7768e', brightGreen: '#9ece6a', brightYellow: '#e0af68',
    brightBlue: '#7aa2f7', brightMagenta: '#bb9af7', brightCyan: '#7dcfff', brightWhite: '#c0caf5',
  },
  {
    id: 'onedark', name: 'One Dark',
    bg: '#282c34', fg: '#abb2bf', selection: '#3e4451', cursor: '#528bff',
    black: '#282c34', red: '#e06c75', green: '#98c379', yellow: '#e5c07b',
    blue: '#61afef', magenta: '#c678dd', cyan: '#56b6c2', white: '#abb2bf',
    brightBlack: '#5c6370', brightRed: '#e06c75', brightGreen: '#98c379', brightYellow: '#e5c07b',
    brightBlue: '#61afef', brightMagenta: '#c678dd', brightCyan: '#56b6c2', brightWhite: '#ffffff',
  },
  {
    id: 'cyberpunk', name: 'Cyberpunk',
    bg: '#0d0221', fg: '#00ff9f', selection: '#1a0a3e', cursor: '#ff003c',
    black: '#0d0221', red: '#ff003c', green: '#00ff9f', yellow: '#fcee09',
    blue: '#00d4ff', magenta: '#ff00e1', cyan: '#00ffcc', white: '#d0d0d0',
    brightBlack: '#555555', brightRed: '#ff3366', brightGreen: '#33ff99', brightYellow: '#ffff66',
    brightBlue: '#33ddff', brightMagenta: '#ff33cc', brightCyan: '#33ffcc', brightWhite: '#ffffff',
  },
  {
    id: 'matrix', name: 'Matrix',
    bg: '#000000', fg: '#00ff00', selection: '#003300', cursor: '#00ff00',
    black: '#000000', red: '#007700', green: '#00ff00', yellow: '#00cc00',
    blue: '#009900', magenta: '#00bb00', cyan: '#00dd00', white: '#00ff00',
    brightBlack: '#004400', brightRed: '#00aa00', brightGreen: '#33ff33', brightYellow: '#22dd22',
    brightBlue: '#00cc00', brightMagenta: '#00ee00', brightCyan: '#44ff44', brightWhite: '#66ff66',
  },
  {
    id: 'ayu-dark', name: 'Ayu Dark',
    bg: '#0a0e14', fg: '#bfbdb6', selection: '#12171d', cursor: '#e6b450',
    black: '#0a0e14', red: '#ff3333', green: '#b8cc52', yellow: '#e6b450',
    blue: '#36a3d9', magenta: '#f07178', cyan: '#95e6cb', white: '#bfbdb6',
    brightBlack: '#4d5566', brightRed: '#ff3333', brightGreen: '#b8cc52', brightYellow: '#e6b450',
    brightBlue: '#36a3d9', brightMagenta: '#f07178', brightCyan: '#95e6cb', brightWhite: '#ffffff',
  },
  {
    id: 'palenight', name: 'Palenight',
    bg: '#292d3e', fg: '#959dcb', selection: '#3c3f58', cursor: '#ffcb6b',
    black: '#292d3e', red: '#f07178', green: '#c3e88d', yellow: '#ffcb6b',
    blue: '#82aaff', magenta: '#c792ea', cyan: '#89ddff', white: '#959dcb',
    brightBlack: '#676e95', brightRed: '#f07178', brightGreen: '#c3e88d', brightYellow: '#ffcb6b',
    brightBlue: '#82aaff', brightMagenta: '#c792ea', brightCyan: '#89ddff', brightWhite: '#ffffff',
  },
  {
    id: 'horizon', name: 'Horizon',
    bg: '#1c1e26', fg: '#cbced0', selection: '#2e303e', cursor: '#cbced0',
    black: '#1c1e26', red: '#e95678', green: '#29d398', yellow: '#fab795',
    blue: '#26bbd9', magenta: '#ee64ac', cyan: '#3fc5de', white: '#cbced0',
    brightBlack: '#6c6f93', brightRed: '#ec6a88', brightGreen: '#3fdaa4', brightYellow: '#fbc3a7',
    brightBlue: '#3fc4de', brightMagenta: '#f075b5', brightCyan: '#5ccfe6', brightWhite: '#ffffff',
  },
  {
    id: 'kanagawa', name: 'Kanagawa',
    bg: '#1f1f28', fg: '#dcd7ba', selection: '#2d4f67', cursor: '#c8c093',
    black: '#16161d', red: '#c34043', green: '#76946a', yellow: '#c0a36e',
    blue: '#7e9cd8', magenta: '#957fb8', cyan: '#6a9589', white: '#c8c093',
    brightBlack: '#727169', brightRed: '#e82424', brightGreen: '#98bb6c', brightYellow: '#e6c384',
    brightBlue: '#7fb4ca', brightMagenta: '#938aa9', brightCyan: '#7aa89f', brightWhite: '#dcd7ba',
  },
  {
    id: 'everforest', name: 'Everforest',
    bg: '#2b3339', fg: '#d3c6aa', selection: '#425047', cursor: '#d3c6aa',
    black: '#4b565c', red: '#e67e80', green: '#a7c080', yellow: '#dbbc7f',
    blue: '#7fbbb3', magenta: '#d699b6', cyan: '#83c092', white: '#d3c6aa',
    brightBlack: '#56635f', brightRed: '#e67e80', brightGreen: '#a7c080', brightYellow: '#dbbc7f',
    brightBlue: '#7fbbb3', brightMagenta: '#d699b6', brightCyan: '#83c092', brightWhite: '#d3c6aa',
  },
  {
    id: 'rose-pine', name: 'Rose Pine',
    bg: '#191724', fg: '#e0def4', selection: '#2a283e', cursor: '#524f67',
    black: '#26233a', red: '#eb6f92', green: '#31748f', yellow: '#f6c177',
    blue: '#9ccfd8', magenta: '#c4a7e7', cyan: '#ebbcba', white: '#e0def4',
    brightBlack: '#6e6a86', brightRed: '#eb6f92', brightGreen: '#31748f', brightYellow: '#f6c177',
    brightBlue: '#9ccfd8', brightMagenta: '#c4a7e7', brightCyan: '#ebbcba', brightWhite: '#e0def4',
  },
];

// ── Window Chrome ──

type ChromeStyle = 'macos' | 'linux' | 'none';

function TerminalChrome({ style, children }: { style: ChromeStyle; children: React.ReactNode }) {
  if (style === 'none') return <>{children}</>;
  const isMac = style === 'macos';
  return (
    <div className={`terminal-chrome terminal-chrome-${style}`}>
      <div className="terminal-titlebar">
        {isMac ? (
          <div className="terminal-dots">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
          </div>
        ) : (
          <div className="terminal-dots">
            <span className="dot dot-close" />
          </div>
        )}
        <span className="terminal-title">Terminal</span>
        <span className="terminal-titlebar-spacer" />
      </div>
      {children}
    </div>
  );
}

// ── ANSI Parsing ──

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

// ── Pattern Highlighting ──

interface Token {
  text: string;
  type: 'default' | 'prompt' | 'command' | 'error' | 'warning' | 'success' | 'path' | 'url' | 'string' | 'number' | 'comment' | 'flag';
}

const PROMPT_RE = /^(\s*(?:[\w@.\-~]+[@:][\w.\-~]*\s*)?(?:\$|#|>|❯|➜|C:\\.*>|PS>)\s?)/;
const ERROR_RE = /\b(error|ERROR|Error|fatal|FATAL|fatal:|FAILED|failed|panic|PANIC|exception|Exception|traceback|Traceback)\b/;
const WARN_RE = /\b(warn(?:ing)?|WARN(?:ING)?|deprecated|DEPRECATED|caution|CAUTION)\b/i;
const SUCCESS_RE = /\b(success|SUCCESS|done|DONE|ok|OK|✓|✔|passed|PASSED|complete|COMPLETE|compiled|built)\b/i;
const URL_RE = /(https?:\/\/[^\s"'`<>)}\]]+)/;
const PATH_RE = /((?:\/[\w.\-]+)+(?:\/[\w.\-]*)?|(?:\.{0,2}\/[\w.\-]+)+|~\/[\w.\-\/]+)/;
const FLAG_RE = /(\s)(--?[\w][\w-]*)/g;
const NUMBER_RE = /(?<!\w)(\d+(?:\.\d+)?(?:ms|s|kb|mb|gb|%|px)?)\b/gi;
const QUOTED_RE = /("[^"]*"|'[^']*'|`[^`]*`)/;

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  const promptMatch = line.match(PROMPT_RE);

  if (promptMatch) {
    tokens.push({ text: promptMatch[1], type: 'prompt' });
    const rest = line.slice(promptMatch[1].length);
    if (rest) tokens.push({ text: rest, type: 'command' });
    return tokens;
  }

  if (ERROR_RE.test(line)) {
    return tokenizeSegments(line, 'error');
  }
  if (WARN_RE.test(line)) {
    return tokenizeSegments(line, 'warning');
  }
  if (SUCCESS_RE.test(line)) {
    return tokenizeSegments(line, 'success');
  }

  return tokenizeSegments(line, 'default');
}

function tokenizeSegments(line: string, lineType: Token['type']): Token[] {
  const tokens: Token[] = [];
  let remaining = line;

  while (remaining.length > 0) {
    let earliest = -1;
    let earliestMatch: { index: number; length: number; type: Token['type'] } | null = null;

    const urlM = remaining.match(URL_RE);
    if (urlM && urlM.index !== undefined) {
      if (earliest === -1 || urlM.index < earliest) {
        earliest = urlM.index;
        earliestMatch = { index: urlM.index, length: urlM[0].length, type: 'url' };
      }
    }

    const pathM = remaining.match(PATH_RE);
    if (pathM && pathM.index !== undefined && pathM.index > 0) {
      if (earliest === -1 || pathM.index < earliest) {
        earliest = pathM.index;
        earliestMatch = { index: pathM.index, length: pathM[0].length, type: 'path' };
      }
    }

    const quotedM = remaining.match(QUOTED_RE);
    if (quotedM && quotedM.index !== undefined) {
      if (earliest === -1 || quotedM.index < earliest) {
        earliest = quotedM.index;
        earliestMatch = { index: quotedM.index, length: quotedM[0].length, type: 'string' };
      }
    }

    if (!earliestMatch) {
      tokens.push({ text: remaining, type: lineType });
      break;
    }

    if (earliestMatch.index > 0) {
      tokens.push({ text: remaining.slice(0, earliestMatch.index), type: lineType });
    }
    tokens.push({ text: remaining.slice(earliestMatch.index, earliestMatch.index + earliestMatch.length), type: earliestMatch.type });
    remaining = remaining.slice(earliestMatch.index + earliestMatch.length);
  }

  return tokens;
}

// ── Render highlighted tokens as React elements ──

function HighlightedLine({ tokens, theme }: { tokens: Token[]; theme: TerminalTheme }) {
  return (
    <>
      {tokens.map((token, i) => {
        const style: React.CSSProperties = {};
        switch (token.type) {
          case 'prompt': style.color = theme.green; style.fontWeight = 600; break;
          case 'command': style.color = theme.brightWhite; break;
          case 'error': style.color = theme.red; break;
          case 'warning': style.color = theme.yellow; break;
          case 'success': style.color = theme.green; break;
          case 'url': style.color = theme.cyan; style.textDecoration = 'underline'; break;
          case 'path': style.color = theme.magenta; break;
          case 'string': style.color = theme.yellow; break;
          case 'number': style.color = theme.magenta; break;
          case 'flag': style.color = theme.cyan; break;
          case 'comment': style.color = theme.brightBlack; break;
          default: style.color = theme.fg;
        }
        return <span key={i} style={style}>{token.text}</span>;
      })}
    </>
  );
}

// ── Settings types ──

type WindowStyle = ChromeStyle;

// ── Sample data ──

const SAMPLE_ZH = `$ git log --oneline -5
a1b2c3d feat: add terminal styler tool
e4f5g6h fix: resolve CSS overflow issue
i7j8k9l refactor: improve theme engine
m0n1o2p docs: update README with screenshots
q3r4s5t chore: bump version to 2.1.0

$ npm run build
> efficient-tools@2.1.0 build
> tsc && vite build

vite v5.4.0 building for production...
transforming (12) src/main.tsx
✓ 12 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html              0.45 kB │ gzip:  0.30 kB
dist/assets/index-Dk2f.css  45.21 kB │ gzip:  8.12 kB
dist/assets/index-Hx8m.js  312.67 kB │ gzip: 95.43 kB
✓ built in 2.34s

$ docker compose up -d
[+] Running 3/3
 ✔ Container redis     Started   0.8s
 ✔ Container postgres  Started   1.2s
 ✔ Container app       Started   2.1s

WARN  deprecated: use --new-flag instead
ERROR connect ECONNREFUSED 127.0.0.1:5432
FATAL: password authentication failed for user "admin"`;

const SAMPLE_EN = `$ git status
On branch main
Your branch is up to date with 'origin/main'.

Changes to be committed:
  modified:   src/features/terminal-styler/index.tsx
  new file:   src/styles/terminal.css

$ npm test -- --coverage
 PASS  src/utils/format.test.ts
 PASS  src/components/Button.test.tsx
 Test Suites: 2 passed, 2 total
 Tests:       14 passed, 14 total
 Time:        3.241s

$ curl -s https://api.github.com/users/octocat | jq '.login'
"octocat"

$ ./deploy.sh --env production --region us-east-1
Deploying to production (us-east-1)...
Building image sha256:a1b2c3d...
Pushing to registry.example.com/app:latest
✓ Image pushed successfully
Running database migrations...
✓ 3 migrations applied
Starting application on port 8080...
✓ Application started at http://localhost:8080

WARN  TLS certificate expires in 7 days
ERROR timeout after 30000ms waiting for response
panic: runtime error: index out of range [5] with length 3`;

// ── Export helpers ──

function generateStyledHtml(lines: string[][], theme: TerminalTheme, fontSize: number, lineNum: boolean): string {
  const tokenColor = (type: Token['type']): string => {
    switch (type) {
      case 'prompt': return theme.green;
      case 'command': return theme.brightWhite;
      case 'error': return theme.red;
      case 'warning': return theme.yellow;
      case 'success': return theme.green;
      case 'url': return theme.cyan;
      case 'path': return theme.magenta;
      case 'string': return theme.yellow;
      case 'number': return theme.magenta;
      default: return theme.fg;
    }
  };

  let html = `<pre style="background:${theme.bg};color:${theme.fg};font-family:'JetBrains Mono',monospace;font-size:${fontSize}px;padding:20px;border-radius:8px;overflow-x:auto;line-height:1.6;margin:0">`;
  lines.forEach((tokens, idx) => {
    if (lineNum) {
      html += `<span style="color:${theme.brightBlack};user-select:none;display:inline-block;width:3em;text-align:right;margin-right:1em">${idx + 1}</span>`;
    }
    for (const token of tokens) {
      const escaped = token.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (token.type === 'default') {
        html += escaped;
      } else {
        html += `<span style="color:${tokenColor(token.type)}${token.type === 'url' ? ';text-decoration:underline' : ''}${token.type === 'prompt' ? ';font-weight:600' : ''}">${escaped}</span>`;
      }
    }
    html += '\n';
  });
  html += '</pre>';
  return html;
}

function downloadTerminalImage(terminalEl: HTMLElement, theme: TerminalTheme, fontSize: number): boolean {
  try {
    const scale = 2;
    // Use actual rendered dimensions to account for word wrap
    const w = terminalEl.scrollWidth;
    const h = terminalEl.scrollHeight;

    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, w, h);

    // Walk each rendered line and its spans, matching DOM positions
    const domLines = terminalEl.querySelectorAll('.terminal-line');
    const computed = getComputedStyle(terminalEl);
    const padLeft = parseFloat(computed.paddingLeft) || 16;
    const padTop = parseFloat(computed.paddingTop) || 16;

    domLines.forEach((lineEl) => {
      const lineRect = lineEl.getBoundingClientRect();
      const containerRect = terminalEl.getBoundingClientRect();
      const baseY = lineRect.top - containerRect.top;
      const baseX = lineRect.left - containerRect.left;

      const spans = lineEl.querySelectorAll('span');
      let x = baseX;
      spans.forEach((span) => {
        const spanStyle = getComputedStyle(span);
        ctx.fillStyle = spanStyle.color;
        const weight = spanStyle.fontWeight;
        const weightStr = (weight === 'bold' || parseInt(weight) >= 600) ? 'bold ' : '';
        ctx.font = `${weightStr}${fontSize}px 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', Consolas, monospace`;

        // Handle multi-line wrapped text within a single span
        const text = span.textContent || '';
        const spanWidth = span.getBoundingClientRect().width;
        const charWidth = ctx.measureText('m').width;
        const maxCharsPerLine = Math.max(1, Math.floor(spanWidth / charWidth));

        if (spanStyle.whiteSpace !== 'pre' && spanStyle.whiteSpace !== 'nowrap' && ctx.measureText(text).width > spanWidth) {
          // Word-wrapped span: split into lines
          const words = text.split(/(\s+)/);
          let line = '';
          let lineY = baseY + fontSize;
          for (const word of words) {
            const test = line + word;
            if (ctx.measureText(test).width > spanWidth && line) {
              ctx.fillText(line, x, lineY);
              line = word.trimStart();
              lineY += fontSize * 1.6;
            } else {
              line = test;
            }
          }
          if (line) ctx.fillText(line, x, lineY);
          x += spanWidth;
        } else {
          ctx.fillText(text, x, baseY + fontSize);
          x += ctx.measureText(text).width;
        }
      });
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'terminal.png';
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
    return true;
  } catch {
    return false;
  }
}

// ── Main Component ──

export default function TerminalStyler() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('terminal');
  const [input, setInput] = useState('');
  const [themeId, setThemeId] = useState('dracula');
  const [fontSize, setFontSize] = useState(13);
  const [showLineNums, setShowLineNums] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [windowStyle, setWindowStyle] = useState<WindowStyle>('macos');
  const [copiedType, setCopiedType] = useState<'html' | 'image' | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useCleanup(() => { setInput(''); });

  const theme = useMemo(() => THEMES.find((t) => t.id === themeId) || THEMES[0], [themeId]);

  const tokenizedLines = useMemo(() => {
    if (!input.trim()) return [];
    const raw = stripAnsi(input);
    return raw.split('\n').map((line) => tokenizeLine(line));
  }, [input]);

  const handleCopyHtml = useCallback(async () => {
    if (!tokenizedLines.length) return;
    const html = generateStyledHtml(tokenizedLines, theme, fontSize, showLineNums);
    const blob = new Blob([html], { type: 'text/html' });
    const plainText = tokenizedLines.map((tokens) => tokens.map((t) => t.text).join('')).join('\n');
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': blob,
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      }),
    ]);
    setCopiedType('html');
    setTimeout(() => setCopiedType(null), 1500);
  }, [tokenizedLines, theme, fontSize, showLineNums]);

  const handleCopyImage = useCallback(() => {
    if (!previewRef.current) return;
    if (downloadTerminalImage(previewRef.current, theme, fontSize)) {
      setCopiedType('image');
      setTimeout(() => setCopiedType(null), 1500);
    }
  }, [theme, fontSize]);

  const loadSample = () => setInput(lang === 'zh' ? SAMPLE_ZH : SAMPLE_EN);

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout terminal-styler-layout">
        {/* ── Left Panel: Input + Settings ── */}
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.input')}
            <div className="panel-actions">
              <button className="panel-btn" onClick={loadSample}>{t('common.example')}</button>
              <button className="panel-btn" onClick={() => setInput('')}>{t('common.clear')}</button>
            </div>
          </div>
          <textarea
            className="tool-textarea terminal-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ui.placeholder}
            style={{ minHeight: 200 }}
          />

          {/* Settings */}
          <div className="terminal-settings">
            <div className="terminal-settings-section">
              <label className="terminal-settings-label">{ui.theme}</label>
              <div className="theme-grid">
                {THEMES.map((th) => (
                  <button
                    key={th.id}
                    className={`theme-card${themeId === th.id ? ' theme-card-active' : ''}`}
                    onClick={() => setThemeId(th.id)}
                    title={th.name}
                  >
                    <div className="theme-card-preview" style={{ background: th.bg }}>
                      <span style={{ color: th.green }}>$</span>
                      <span style={{ color: th.fg }}>_</span>
                      <span style={{ color: th.red }}>✕</span>
                      <span style={{ color: th.blue }}>●</span>
                    </div>
                    <span className="theme-card-name">{th.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="terminal-settings-row">
              <div className="terminal-settings-group">
                <label className="terminal-settings-label">{ui.fontSize}</label>
                <div className="terminal-slider-row">
                  <input
                    type="range"
                    min={10}
                    max={20}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="terminal-slider"
                  />
                  <span className="terminal-slider-value">{fontSize}px</span>
                </div>
              </div>

              <div className="terminal-settings-group">
                <label className="terminal-settings-label">{ui.windowStyle}</label>
                <div className="panel-actions" style={{ flexWrap: 'wrap' }}>
                  {(['macos', 'linux', 'none'] as WindowStyle[]).map((ws) => (
                    <button
                      key={ws}
                      className={`panel-btn panel-btn-sm${windowStyle === ws ? ' accent' : ''}`}
                      onClick={() => setWindowStyle(ws)}
                    >
                      {ui[`ws_${ws}`] || ws}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="terminal-settings-row">
              <label className="terminal-toggle">
                <input type="checkbox" checked={showLineNums} onChange={(e) => setShowLineNums(e.target.checked)} />
                <span>{ui.lineNumbers}</span>
              </label>
              <label className="terminal-toggle">
                <input type="checkbox" checked={wordWrap} onChange={(e) => setWordWrap(e.target.checked)} />
                <span>{ui.wordWrap}</span>
              </label>
            </div>
          </div>
        </div>

        {/* ── Right Panel: Preview ── */}
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.preview')}
            <div className="panel-actions">
              <button className="panel-btn" onClick={handleCopyHtml} disabled={!input.trim()}>
                {copiedType === 'html' ? t('common.copied') : ui.copyHtml}
              </button>
              <button className="panel-btn" onClick={handleCopyImage} disabled={!input.trim()}>
                {copiedType === 'image' ? t('common.copied') : ui.copyImage}
              </button>
            </div>
          </div>
          <div className="terminal-preview-wrapper">
            <TerminalChrome style={windowStyle}>
              <div
                ref={previewRef}
                className="terminal-content"
                style={{
                  background: theme.bg,
                  fontSize: `${fontSize}px`,
                  whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
                  wordBreak: wordWrap ? 'break-all' : 'normal',
                }}
              >
                {tokenizedLines.length === 0 ? (
                  <div className="terminal-empty" style={{ color: theme.brightBlack }}>
                    {t('common.waiting')}
                  </div>
                ) : (
                  tokenizedLines.map((tokens, idx) => (
                    <div key={idx} className="terminal-line">
                      {showLineNums && (
                        <span className="terminal-line-num" style={{ color: theme.brightBlack }}>
                          {String(idx + 1).padStart(String(tokenizedLines.length).length, ' ')}
                        </span>
                      )}
                      <HighlightedLine tokens={tokens} theme={theme} />
                    </div>
                  ))
                )}
              </div>
            </TerminalChrome>
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
