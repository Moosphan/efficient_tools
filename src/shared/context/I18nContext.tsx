import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type Lang = 'zh' | 'en';

interface I18nContextValue {
  lang: Lang;
  toggleLang: () => void;
  t: (key: string) => string;
}

const translations: Record<Lang, Record<string, string>> = {
  zh: {
    'hero.badge': '个工具可用',
    'hero.title1': '开发者的',
    'hero.title2': '效率工具箱',
    'hero.desc': '一站式汇集日常开发中最常用的小工具，纯前端运行，数据不出浏览器。',
    'stats.tools': '内置工具',
    'stats.categories': '工具分类',
    'stats.client': '客户端运行',
    'search.placeholder': '搜索工具…',
    'cat.all': '全部',
    'cat.格式化': '格式化',
    'cat.编解码': '编解码',
    'cat.文本': '文本',
    'cat.图片': '图片',
    'cat.安全': '安全',
    'cat.网络': '网络',
    'cat.开发': '开发',
    'cat.其他': '其他',
    'status.available': '可用',
    'status.developing': '开发中',
    'card.open': '打开 →',
    'security.note': '本地运行 · 数据不出浏览器',
    'nav.home': '首页',
    'nav.about': '关于',
    'about.title': '关于 Efficient Tools',
    'about.desc': '面向开发者的一站式效率工具集合，所有工具均在浏览器端运行，无需后端服务。',
    'about.principles': '设计原则',
    'about.tech': '技术栈',
    'about.tools': '工具列表',
    'about.privacy': '隐私声明',
    'about.privacy.desc': '所有数据处理在浏览器本地完成，不上传任何输入至服务器。',
    // Common tool UI strings
    'common.input': '输入',
    'common.output': '输出',
    'common.clear': '清空',
    'common.copy': '复制',
    'common.copied': '已复制',
    'common.example': '示例',
    'common.settings': '配置',
    'common.preview': '预览',
    'common.generate': '生成',
    'common.encode': '编码',
    'common.decode': '解码',
    'common.swap': '交换',
    'common.error': '错误',
    'common.waiting': '等待输入…',
    'common.download': '下载',
    'common.upload': '上传',
    'common.paste': '粘贴',
    'common.features': '功能特点',
    'common.usage': '使用说明',
    'common.params': '参数说明',
  },
  en: {
    'hero.badge': ' tools available',
    'hero.title1': "Developer's ",
    'hero.title2': 'Efficiency Toolbox',
    'hero.desc': 'A collection of essential dev tools, running entirely in your browser. No data leaves your device.',
    'stats.tools': 'Built-in Tools',
    'stats.categories': 'Categories',
    'stats.client': 'Client-side',
    'search.placeholder': 'Search tools…',
    'cat.all': 'All',
    'cat.格式化': 'Format',
    'cat.编解码': 'Codec',
    'cat.文本': 'Text',
    'cat.图片': 'Image',
    'cat.安全': 'Security',
    'cat.网络': 'Network',
    'cat.开发': 'Dev',
    'cat.其他': 'Other',
    'status.available': 'Available',
    'status.developing': 'Coming Soon',
    'card.open': 'Open →',
    'security.note': 'Runs locally · Data never leaves your browser',
    'nav.home': 'Home',
    'nav.about': 'About',
    'about.title': 'About Efficient Tools',
    'about.desc': 'A one-stop collection of developer efficiency tools, all running client-side with no backend required.',
    'about.principles': 'Design Principles',
    'about.tech': 'Tech Stack',
    'about.tools': 'Tool List',
    'about.privacy': 'Privacy',
    'about.privacy.desc': 'All data processing happens locally in the browser. No input is uploaded to any server.',
    // Common tool UI strings
    'common.input': 'Input',
    'common.output': 'Output',
    'common.clear': 'Clear',
    'common.copy': 'Copy',
    'common.copied': 'Copied',
    'common.example': 'Example',
    'common.settings': 'Settings',
    'common.preview': 'Preview',
    'common.generate': 'Generate',
    'common.encode': 'Encode',
    'common.decode': 'Decode',
    'common.swap': 'Swap',
    'common.error': 'Error',
    'common.waiting': 'Waiting for input…',
    'common.download': 'Download',
    'common.upload': 'Upload',
    'common.paste': 'Paste',
    'common.features': 'Features',
    'common.usage': 'Usage Guide',
    'common.params': 'Parameters',
  },
};

// Tool i18n data with ui strings and help content
export const toolI18n: Record<string, {
  name: Record<Lang, string>;
  desc: Record<Lang, string>;
  ui?: Record<Lang, Record<string, string>>;
  help?: Record<Lang, {
    title: string;
    features: string[];
    usage: string[];
    params?: { label: string; desc: string }[];
  }>;
}> = {
  // ── json ──
  json: {
    name: { zh: 'JSON 格式化', en: 'JSON Formatter' },
    desc: { zh: '格式化、压缩、验证 JSON 数据，支持语法高亮和错误定位', en: 'Format, minify, and validate JSON with syntax highlighting and error detection' },
    ui: {
      zh: { format: '格式化', minify: '压缩', sample: '示例', placeholder: '粘贴 JSON…', errorPrefix: 'JSON 解析错误' },
      en: { format: 'Format', minify: 'Minify', sample: 'Example', placeholder: 'Paste JSON…', errorPrefix: 'JSON parse error' },
    },
    help: {
      zh: { title: '使用说明', features: ['JSON 美化格式化，自动缩进排版', 'JSON 压缩为单行，去除空白字符', '语法错误定位，快速排查格式问题', '支持大文件处理，纯本地运行'], usage: ['在左侧输入框粘贴或输入 JSON 数据', '点击「格式化」美化缩进，或「压缩」去除空白', '右侧实时显示处理结果或错误信息', '点击「复制」将结果复制到剪贴板'] },
      en: { title: 'Usage Guide', features: ['Pretty-print JSON with auto-indentation', 'Minify JSON to single line, remove whitespace', 'Syntax error detection with precise location', 'Handles large files, runs entirely locally'], usage: ['Paste or type JSON data in the left panel', 'Click "Format" to pretty-print or "Minify" to compress', 'Results or error messages appear in real-time on the right', 'Click "Copy" to copy the result to clipboard'] },
    },
  },
  // ── regex ──
  regex: {
    name: { zh: '正则验证器', en: 'Regex Tester' },
    desc: { zh: '实时测试正则表达式，高亮匹配结果，支持捕获组查看和结构可视化', en: 'Test regex patterns in real-time with match highlighting, capture groups, and structure visualization' },
    ui: {
      zh: { pattern: '正则表达式', flags: '标志', testStr: '测试文本', placeholder: '输入正则表达式…', textPlaceholder: '输入要匹配的文本…', matches: '匹配结果', matchList: '匹配列表', noMatch: '无匹配', groups: '捕获组', visual: '结构可视化', showVisual: '显示结构图' },
      en: { pattern: 'Regular Expression', flags: 'Flags', testStr: 'Test String', placeholder: 'Enter regex pattern…', textPlaceholder: 'Enter text to match…', matches: 'Matches', matchList: 'Match List', noMatch: 'No matches', groups: 'Capture Groups', visual: 'Structure Visualization', showVisual: 'Show Structure' },
    },
    help: {
      zh: { title: '使用说明', features: ['实时高亮匹配结果', '正则表达式结构可视化（分组/字符类/量词/锚点）', '支持 g/i/m/s 等标志位', '捕获组分组展示'], usage: ['在上方输入正则表达式', '结构图实时展示正则的分组和量词关系', '在下方输入要匹配的测试文本', '匹配结果高亮显示，点击查看捕获组'] },
      en: { title: 'Usage Guide', features: ['Real-time match highlighting', 'Regex structure visualization (groups/classes/quantifiers/anchors)', 'Supports g/i/m/s flags', 'Capture group display'], usage: ['Enter a regex pattern in the top field', 'Structure diagram shows groups and quantifiers in real-time', 'Enter test text in the bottom field', 'Matches are highlighted, click to view capture groups'] },
    },
  },
  // ── timestamp ──
  timestamp: {
    name: { zh: '时间戳转换', en: 'Timestamp Converter' },
    desc: { zh: 'Unix 时间戳与日期互转，支持秒/毫秒、多时区', en: 'Convert between Unix timestamps and dates, supports seconds/milliseconds and timezones' },
    ui: {
      zh: { now: '当前时间', seconds: '秒', milliseconds: '毫秒', dateToTs: '日期转时间戳', tsToDate: '时间戳转日期', placeholder: '输入时间戳或日期…', relative: '相对时间' },
      en: { now: 'Current Time', seconds: 'Seconds', milliseconds: 'Milliseconds', dateToTs: 'Date to Timestamp', tsToDate: 'Timestamp to Date', placeholder: 'Enter timestamp or date…', relative: 'Relative Time' },
    },
    help: {
      zh: { title: '使用说明', features: ['Unix 时间戳与日期双向转换', '支持秒级和毫秒级时间戳', '显示相对时间（如"3分钟前"）', '实时显示当前时间戳'], usage: ['输入时间戳自动转换为日期', '输入日期自动转换为时间戳', '点击「当前时间」获取此刻的时间戳', '支持秒/毫秒切换'] },
      en: { title: 'Usage Guide', features: ['Bidirectional Unix timestamp conversion', 'Supports both seconds and milliseconds', 'Shows relative time (e.g. "3 minutes ago")', 'Real-time current timestamp display'], usage: ['Enter a timestamp to convert to date', 'Enter a date to convert to timestamp', 'Click "Current Time" to get the current timestamp', 'Toggle between seconds and milliseconds'] },
    },
  },
  // ── base64 ──
  base64: {
    name: { zh: 'Base64/Base32 编解码', en: 'Base64/Base32 Codec' },
    desc: { zh: '文本的 Base64/Base32 编解码，支持 URL-safe 格式', en: 'Encode and decode Base64/Base32 text with URL-safe format support' },
    ui: {
      zh: { encode: '编码', decode: '解码', urlSafe: 'URL-safe', placeholder: '输入要编码的文本…', decodePlaceholder: '粘贴 Base64 字符串…' },
      en: { encode: 'Encode', decode: 'Decode', urlSafe: 'URL-safe', placeholder: 'Enter text to encode…', decodePlaceholder: 'Paste Base64 string…' },
    },
    help: {
      zh: { title: '使用说明', features: ['文本 Base64 编码与解码', '支持 Base32 编码/解码（RFC 4648）', '支持 URL-safe 格式（+/→-_）', '适合 2FA/OTP 密钥配置和 DNS TXT 记录'], usage: ['选择编码格式：Base64 或 Base32', '输入文本后点击「编码」', '粘贴编码字符串后点击「解码」还原', 'Base64 可勾选 URL-safe 使用安全字符'] },
      en: { title: 'Usage Guide', features: ['Text Base64 encoding and decoding', 'Base32 encode/decode support (RFC 4648)', 'URL-safe format support (+/ → -_ )', 'Great for 2FA/OTP keys and DNS TXT records'], usage: ['Select format: Base64 or Base32', 'Enter text and click "Encode"', 'Paste encoded string and click "Decode"', 'Base64 supports URL-safe characters option'] },
    },
  },
  // ── url ──
  url: {
    name: { zh: 'URL 编解码', en: 'URL Codec' },
    desc: { zh: 'URL 编码/解码，自动解析查询参数', en: 'Encode and decode URLs with automatic query parameter parsing' },
    ui: {
      zh: { encode: '编码', decode: '解码', component: '组件解析', placeholder: '输入 URL 或含中文的文本…', params: '查询参数' },
      en: { encode: 'Encode', decode: 'Decode', component: 'Component', placeholder: 'Enter URL or text with special characters…', params: 'Query Parameters' },
    },
    help: {
      zh: { title: '使用说明', features: ['URL 编码与解码', '自动解析查询参数为表格', '组件模式分解 URL 各部分', '处理含中文的 URL'], usage: ['输入 URL 自动解码并解析参数', '输入文本点击「编码」生成 URL 编码', '切换「组件解析」查看 URL 各部分分解', '参数表格支持一键复制'] },
      en: { title: 'Usage Guide', features: ['URL encoding and decoding', 'Auto-parse query parameters into a table', 'Component mode breaks down URL parts', 'Handles URLs with non-ASCII characters'], usage: ['Enter a URL to auto-decode and parse parameters', 'Enter text and click "Encode" for URL encoding', 'Switch to "Component" to see URL breakdown', 'Parameter table supports one-click copy'] },
    },
  },
  // ── diff ──
  diff: {
    name: { zh: '文本 Diff 对比', en: 'Text Diff' },
    desc: { zh: '行级/字符级差异对比，支持并排和内联视图', en: 'Line and character-level diff with side-by-side and inline views' },
    ui: {
      zh: { original: '原始文本', modified: '修改文本', sideBySide: '并排', inline: '内联', stats: '统计', added: '新增', removed: '删除', unchanged: '未变', result: '差异结果', ignoreWhitespace: '忽略空白', originalPlaceholder: '粘贴原始文本…', modifiedPlaceholder: '粘贴修改后的文本…' },
      en: { original: 'Original', modified: 'Modified', sideBySide: 'Side by Side', inline: 'Inline', stats: 'Stats', added: 'Added', removed: 'Removed', unchanged: 'unchanged', result: 'Diff Result', ignoreWhitespace: 'Ignore Whitespace', originalPlaceholder: 'Paste original text…', modifiedPlaceholder: 'Paste modified text…' },
    },
    help: {
      zh: { title: '使用说明', features: ['行级和字符级差异对比', '并排和内联两种视图模式', '统计新增/删除/未变行数', '支持大文本对比'], usage: ['在左侧粘贴原始文本', '在右侧粘贴修改后的文本', '差异结果实时高亮显示', '切换并排/内联视图模式'] },
      en: { title: 'Usage Guide', features: ['Line and character-level diff', 'Side-by-side and inline view modes', 'Stats for added/removed/unchanged lines', 'Handles large text comparison'], usage: ['Paste original text on the left', 'Paste modified text on the right', 'Differences are highlighted in real-time', 'Toggle between side-by-side and inline views'] },
    },
  },
  // ── hash ──
  hash: {
    name: { zh: 'Hash 生成器', en: 'Hash Generator' },
    desc: { zh: 'MD5/SHA-1/SHA-256/SHA-512 哈希计算和对比', en: 'Generate MD5/SHA-1/SHA-256/SHA-512 hashes with comparison' },
    ui: {
      zh: { input: '输入文本', hashValue: '哈希值', compare: '对比', match: '一致', mismatch: '不一致', uppercase: '大写', algorithms: '算法', format: '输出格式', allAlgos: '全部算法', placeholder: '输入要计算 Hash 的文本…' },
      en: { input: 'Input Text', hashValue: 'Hash Value', compare: 'Compare', match: 'Match', mismatch: 'Mismatch', uppercase: 'Uppercase', algorithms: 'Algorithms', format: 'Output Format', allAlgos: 'All Algorithms', placeholder: 'Enter text to hash…' },
    },
    help: {
      zh: { title: '使用说明', features: ['支持 MD5/SHA-1/SHA-256/SHA-512', '同时计算多算法哈希值', '支持大写/小写输出格式', '哈希值对比验证'], usage: ['输入文本自动计算各算法哈希值', '勾选大写切换输出格式', '在对比框中粘贴哈希值进行验证'] },
      en: { title: 'Usage Guide', features: ['Supports MD5/SHA-1/SHA-256/SHA-512', 'Calculates multiple algorithms simultaneously', 'Uppercase/lowercase output toggle', 'Hash comparison and verification'], usage: ['Enter text to auto-calculate hashes for all algorithms', 'Check uppercase to toggle output format', 'Paste a hash in the compare field to verify'] },
    },
  },
  // ── color ──
  color: {
    name: { zh: '颜色格式转换', en: 'Color Converter' },
    desc: { zh: 'HEX/RGB/HSL/oklch 互转，颜色选择器，对比度检查', en: 'Convert between HEX/RGB/HSL/oklch with color picker and contrast check' },
    ui: {
      zh: { hex: 'HEX', rgb: 'RGB', hsl: 'HSL', oklch: 'oklch', picker: '取色器', contrast: '对比度', aa: 'AA 标准', aaa: 'AAA 标准', pass: '通过', fail: '未通过', foreground: '前景色', background: '背景色', preview: '预览' },
      en: { hex: 'HEX', rgb: 'RGB', hsl: 'HSL', oklch: 'oklch', picker: 'Picker', contrast: 'Contrast', aa: 'AA Standard', aaa: 'AAA Standard', pass: 'Pass', fail: 'Fail', foreground: 'Foreground', background: 'Background', preview: 'Preview' },
    },
    help: {
      zh: { title: '使用说明', features: ['HEX/RGB/HSL/oklch 四种格式互转', '内置颜色选择器', 'WCAG AA/AAA 对比度检测', '实时预览文字效果'], usage: ['在任一格式输入框中输入颜色值', '其他格式自动同步转换', '使用取色器可视化选择颜色', '查看对比度检测结果'] },
      en: { title: 'Usage Guide', features: ['Convert between HEX/RGB/HSL/oklch formats', 'Built-in color picker', 'WCAG AA/AAA contrast ratio check', 'Live text preview'], usage: ['Enter a color value in any format field', 'Other formats update automatically', 'Use the picker to visually select a color', 'View contrast ratio check results'] },
    },
  },
  // ── jwt ──
  jwt: {
    name: { zh: 'JWT 解析器', en: 'JWT Decoder' },
    desc: { zh: '解码 JWT Token，展示 Header/Payload/Signature', en: 'Decode JWT tokens showing Header, Payload, and Signature' },
    ui: {
      zh: { header: 'Header', payload: 'Payload', signature: 'Signature', placeholder: '粘贴 JWT Token…', expired: '已过期', expiresIn: '过期时间', invalid: '无效的 JWT' },
      en: { header: 'Header', payload: 'Payload', signature: 'Signature', placeholder: 'Paste JWT Token…', expired: 'Expired', expiresIn: 'Expires', invalid: 'Invalid JWT' },
    },
    help: {
      zh: { title: '使用说明', features: ['解码 JWT 的 Header/Payload/Signature', '高亮显示过期时间和签发时间', 'JSON 格式化展示各部分内容', '支持各种签名算法的 Token'], usage: ['粘贴完整的 JWT Token', '自动解析并展示三部分内容', '过期时间高亮提醒（红/绿）', '各段内容支持一键复制'] },
      en: { title: 'Usage Guide', features: ['Decode JWT Header/Payload/Signature', 'Highlights expiry and issued-at times', 'JSON-formatted display of each section', 'Supports tokens with any signing algorithm'], usage: ['Paste a complete JWT token', 'Auto-parses and displays all three sections', 'Expiry time highlighted (red/green)', 'Each section supports one-click copy'] },
    },
  },
  // ── cron ──
  cron: {
    name: { zh: 'Cron 表达式解析', en: 'Cron Parser' },
    desc: { zh: 'Cron 表达式转自然语言，展示最近执行时间', en: 'Convert cron expressions to natural language with next run times' },
    ui: {
      zh: { expression: 'Cron 表达式', description: '自然语言描述', nextRuns: '最近执行时间', presets: '常用预设', placeholder: '* * * * *', minute: '分', hour: '时', day: '日', month: '月', weekday: '周', everyMinute: '每分钟', everyHour: '每小时', dailyMidnight: '每天零点', daily830: '每天 8:30', weekday900: '工作日 9:00', monday1000: '每周一 10:00', firstOfMonth: '每月1号', every5min: '每5分钟' },
      en: { expression: 'Cron Expression', description: 'Description', nextRuns: 'Next Run Times', presets: 'Presets', placeholder: '* * * * *', minute: 'Min', hour: 'Hour', day: 'Day', month: 'Month', weekday: 'Weekday', everyMinute: 'Every minute', everyHour: 'Every hour', dailyMidnight: 'Daily at midnight', daily830: 'Daily at 8:30', weekday900: 'Weekdays at 9:00', monday1000: 'Mondays at 10:00', firstOfMonth: '1st of month', every5min: 'Every 5 minutes' },
    },
    help: {
      zh: { title: '使用说明', features: ['Cron 表达式转自然语言描述', '预览最近 5 次执行时间', '常用预设一键填入', '支持 5 位标准 Cron 格式'], usage: ['输入 5 位 Cron 表达式（分 时 日 月 周）', '自动生成自然语言描述', '查看最近 5 次预计执行时间', '点击常用预设快速填入'] },
      en: { title: 'Usage Guide', features: ['Convert cron to natural language', 'Preview next 5 execution times', 'One-click common presets', 'Supports standard 5-field cron format'], usage: ['Enter a 5-field cron expression (min hour day month weekday)', 'Auto-generates natural language description', 'View next 5 scheduled execution times', 'Click a preset to fill in quickly'] },
    },
  },
  // ── markdown ──
  markdown: {
    name: { zh: 'Markdown 预览', en: 'Markdown Preview' },
    desc: { zh: '实时 Markdown 渲染预览，支持代码高亮', en: 'Real-time Markdown rendering with code syntax highlighting' },
    ui: {
      zh: { editor: '编辑', preview: '预览', placeholder: '输入 Markdown…', print: '打印', exportHtml: '导出 HTML', exportPdf: '导出 PDF' },
      en: { editor: 'Editor', preview: 'Preview', placeholder: 'Enter Markdown…', print: 'Print', exportHtml: 'Export HTML', exportPdf: 'Export PDF' },
    },
    help: {
      zh: { title: '使用说明', features: ['实时 Markdown 渲染预览', '代码块语法高亮', '支持表格、任务列表等扩展语法', '导出 HTML 和打印功能'], usage: ['在左侧输入 Markdown 文本', '右侧实时显示渲染效果', '支持标题/列表/表格/代码块等语法', '点击「打印」或「导出 HTML」保存结果'] },
      en: { title: 'Usage Guide', features: ['Real-time Markdown preview', 'Code block syntax highlighting', 'Supports tables, task lists, and extensions', 'Export HTML and print functions'], usage: ['Enter Markdown text on the left', 'Live preview appears on the right', 'Supports headings/lists/tables/code blocks', 'Click "Print" or "Export HTML" to save'] },
    },
  },
  // ── logs ──
  logs: {
    name: { zh: '日志分析器', en: 'Log Analyzer' },
    desc: { zh: '粘贴日志后按级别、关键词筛选，快速定位问题', en: 'Paste logs and filter by level and keywords to quickly find issues' },
    ui: {
      zh: { placeholder: '粘贴日志内容…', filter: '筛选', level: '级别', keyword: '关键词', keywordPlaceholder: '关键词搜索…', stats: '统计', total: '总计', errors: '错误', warnings: '警告', info: '信息', analyze: '分析', allLevels: '所有级别', lines: '行' },
      en: { placeholder: 'Paste log content…', filter: 'Filter', level: 'Level', keyword: 'Keyword', keywordPlaceholder: 'Search keywords…', stats: 'Stats', total: 'Total', errors: 'Errors', warnings: 'Warnings', info: 'Info', analyze: 'Analyze', allLevels: 'All Levels', lines: 'lines' },
    },
    help: {
      zh: { title: '使用说明', features: ['自动识别日志级别（ERROR/WARN/INFO）', '按级别和关键词快速筛选', '统计各级别日志数量', '支持 Android logcat 和标准格式'], usage: ['粘贴日志内容到输入框', '点击级别标签快速筛选', '输入关键词进一步过滤', '查看统计信息了解日志分布'] },
      en: { title: 'Usage Guide', features: ['Auto-detect log levels (ERROR/WARN/INFO)', 'Filter by level and keywords', 'Count logs per level', 'Supports Android logcat and standard formats'], usage: ['Paste log content into the input area', 'Click level tags to filter quickly', 'Enter keywords for further filtering', 'View stats to understand log distribution'] },
    },
  },
  // ── translate ──
  translate: {
    name: { zh: '快速翻译', en: 'Quick Translate' },
    desc: { zh: '翻译代码注释、文档片段，支持多语言互译', en: 'Translate code comments and docs with multi-language support' },
    ui: {
      zh: { source: '源语言', target: '目标语言', placeholder: '输入要翻译的文本…', swap: '交换语言', translating: '翻译中…', error: '翻译失败，请检查网络', autoDetect: '自动检测', langSettings: '语言设置', translateBtn: '翻译', quickPhrases: '常见报错快捷翻译' },
      en: { source: 'Source', target: 'Target', placeholder: 'Enter text to translate…', swap: 'Swap Languages', translating: 'Translating…', error: 'Translation failed, check your network', autoDetect: 'Auto Detect', langSettings: 'Language Settings', translateBtn: 'Translate', quickPhrases: 'Quick Error Phrases' },
    },
    help: {
      zh: { title: '使用说明', features: ['基于 Google Translate 免费接口', '支持多语言互译', '自动检测源语言', '适合翻译代码注释和文档片段'], usage: ['输入要翻译的文本', '选择源语言和目标语言', '点击「翻译」获取结果', '支持一键交换源/目标语言'] },
      en: { title: 'Usage Guide', features: ['Based on Google Translate free API', 'Multi-language translation support', 'Auto-detect source language', 'Great for code comments and doc snippets'], usage: ['Enter text to translate', 'Select source and target languages', 'Click "Translate" to get the result', 'Swap source/target languages with one click'] },
    },
  },
  // ── uuid ──
  uuid: {
    name: { zh: 'UUID 生成器', en: 'UUID Generator' },
    desc: { zh: '生成 v4/v7 UUID，批量生成，自定义格式', en: 'Generate v4/v7 UUIDs with batch generation and custom formats' },
    ui: {
      zh: { version: '版本', count: '数量', format: '格式', uppercase: '大写', noDash: '无连字符', standard: '标准格式', generate: '生成', batch: '批量生成' },
      en: { version: 'Version', count: 'Count', format: 'Format', uppercase: 'Uppercase', noDash: 'No Dashes', standard: 'Standard', generate: 'Generate', batch: 'Batch Generate' },
    },
    help: {
      zh: { title: '使用说明', features: ['支持 UUID v4（随机）和 v7（时间排序）', '批量生成，一次最多 100 个', '可选大写/小写、有/无横线格式', '一键复制全部结果'], usage: ['选择 UUID 版本（v4 或 v7）', '设置生成数量', '配置格式选项（大写/横线）', '点击「生成」后一键复制'] },
      en: { title: 'Usage Guide', features: ['UUID v4 (random) and v7 (time-sorted)', 'Batch generate up to 100 at once', 'Uppercase/lowercase, with/without dashes', 'One-click copy all results'], usage: ['Select UUID version (v4 or v7)', 'Set the generation count', 'Configure format options (case/dashes)', 'Click "Generate" then copy all'] },
    },
  },
  // ── qrcode ──
  qrcode: {
    name: { zh: '二维码工具', en: 'QR Code Tool' },
    desc: { zh: '生成/解析二维码，支持多种主题样式和 Logo 嵌入', en: 'Generate and decode QR codes with multiple themes and logo embedding' },
    ui: {
      zh: {
        generate: '生成', parse: '解析', theme: '主题样式', size: '尺寸', errorLevel: '纠错级别',
        logo: '中心 Logo', uploadLogo: '上传图片', removeLogo: '移除', downloadPng: '下载 PNG',
        downloadSvg: '下载 SVG', selfCheck: '自检', preview: '预览', inputType: '内容类型',
        text: '文本', url: '网址', email: '邮箱', phone: '电话', wifi: 'WiFi',
        ssid: '网络名 (SSID)', security: '加密方式', password: '密码', hidden: '隐藏网络',
        dropzone: '点击上传或拖拽图片到此处', pasteHint: '也支持 Ctrl+V 粘贴剪贴板中的截图',
        parseResult: '解析结果', copyResult: '复制结果', openLink: '打开链接',
        noQr: '未检测到二维码，请确保图片清晰、二维码完整可见。', inputPlaceholder: '输入内容…',
        config: '配置', wifiName: 'WiFi 名称', noPassword: '无密码', wifiPasswordPlaceholder: 'WiFi 密码',
        noPwdPlaceholder: '无需密码', logoSize: 'Logo 大小', logoSizeTip: '≤12% 安全 · 12~18% 建议配合 Q/H 纠错',
        export: '导出', selfCheckFail: '自检失败：无法解码矩阵数据', imageLoadFail: '图片加载失败',
        generatePlaceholder: '输入内容后自动生成二维码', generateHint: '支持文本、网址、WiFi、邮箱等多种格式',
        parseUploadTitle: '上传二维码图片',
        themeClassic: '经典黑', themeDark: '暗夜模式', themeOcean: '海洋渐变', themeForest: '森林绿',
        themeSunset: '日落橙', themeNeon: '霓虹炫彩', themeVintage: '复古牛皮纸', themePurple: '紫韵',
        wpa: 'WPA/WPA2', wep: 'WEP',
        elLow: '低 (~7%)', elMed: '中 (~15%)', elQuart: '较高 (~25%)', elHigh: '高 (~30%)',
        helpTitle: '使用说明',
        helpLevel: '纠错级别', helpLevelCol1: '级别', helpLevelCol2: '容错率', helpLevelCol3: '适用场景',
        helpLevelL: '信息密度高、展示空间小，如在标签、名片上使用',
        helpLevelM: '日常使用首选，平衡数据密度与容错',
        helpLevelQ: '需要嵌入 Logo 或可能被部分遮挡的场景',
        helpLevelH: 'Logo 占比大、印刷品、户外标识等易磨损环境',
        helpQrKnowledge: '二维码知识', helpLogoTips: 'Logo 技巧', helpScanTips: '扫码解析',
        helpQrDesc: '是一种矩阵式二维条码，信息存储在黑白模块（点阵）中',
        helpQrFinder: '三个角落的', helpQrFinderEnd: '（回字形）帮助扫描设备快速识别方向和位置',
        helpQrCapacity1: '二维码容量：最多可存储', helpQrCapacityAlpha: '4296 个字母数字', helpQrCapacityOr: '或', helpQrCapacityByte: '2953 个字节',
        helpQrLocal: '本工具所有数据', helpQrLocalBold: '纯本地处理', helpQrLocalEnd: '，不会上传到任何服务器',
        helpLogoSquare: '建议使用', helpLogoSquareBold: '正方形图片', helpLogoSquareEnd: '（如 200×200px），自动居中裁剪',
        helpLogoArea: 'Logo 面积建议不超过二维码的', helpLogoAreaBold: '20%',
        helpLogoEC: '添加 Logo 后建议将纠错级别提升至', helpLogoECBold: 'Q 或 H',
        helpLogoRemove: '移除 Logo 后纠错级别可恢复为 M，以减小二维码密度',
        helpScanUpload: '支持', helpScanUploadBold1: '上传图片', helpScanUploadSep: '、', helpScanUploadBold2: '拖拽', helpScanUploadOr: '或', helpScanUploadBold3: 'Ctrl+V 粘贴截图',
        helpScanPreprocess: '先用灰度二值化预处理，再尝试正常+反色识别，适配深色主题',
        helpScanStyled: '对样式化二维码（圆角/渐变），建议用「', helpScanStyledBold: '自检', helpScanStyledEnd: '」按钮直接从 canvas 解码',
        helpScanFormats: '支持常见二维码格式：URL、文本、WiFi、vCard 等',
        helpScanLocal: '解析完全在浏览器本地完成，图片不会上传',
      },
      en: {
        generate: 'Generate', parse: 'Parse', theme: 'Theme', size: 'Size', errorLevel: 'Error Correction',
        logo: 'Center Logo', uploadLogo: 'Upload Image', removeLogo: 'Remove', downloadPng: 'Download PNG',
        downloadSvg: 'Download SVG', selfCheck: 'Self-Check', preview: 'Preview', inputType: 'Content Type',
        text: 'Text', url: 'URL', email: 'Email', phone: 'Phone', wifi: 'WiFi',
        ssid: 'SSID', security: 'Security', password: 'Password', hidden: 'Hidden Network',
        dropzone: 'Click or drag image here', pasteHint: 'Also supports Ctrl+V paste from clipboard',
        parseResult: 'Parse Result', copyResult: 'Copy Result', openLink: 'Open Link',
        noQr: 'No QR code detected. Make sure the image is clear and the QR code is fully visible.', inputPlaceholder: 'Enter content…',
        config: 'Settings', wifiName: 'WiFi Name', noPassword: 'No Password', wifiPasswordPlaceholder: 'WiFi Password',
        noPwdPlaceholder: 'No password needed', logoSize: 'Logo Size', logoSizeTip: '≤12% safe · 12~18% recommended with Q/H error correction',
        export: 'Export', selfCheckFail: 'Self-check failed: unable to decode matrix data', imageLoadFail: 'Image load failed',
        generatePlaceholder: 'QR code is generated automatically after entering content', generateHint: 'Supports text, URL, WiFi, email, and more',
        parseUploadTitle: 'Upload QR Code Image',
        themeClassic: 'Classic', themeDark: 'Dark Mode', themeOcean: 'Ocean Gradient', themeForest: 'Forest Green',
        themeSunset: 'Sunset Orange', themeNeon: 'Neon Glow', themeVintage: 'Vintage Paper', themePurple: 'Purple Haze',
        wpa: 'WPA/WPA2', wep: 'WEP',
        elLow: 'Low (~7%)', elMed: 'Medium (~15%)', elQuart: 'Quartile (~25%)', elHigh: 'High (~30%)',
        helpTitle: 'Usage Guide',
        helpLevel: 'Error Correction Levels', helpLevelCol1: 'Level', helpLevelCol2: 'Tolerance', helpLevelCol3: 'Use Case',
        helpLevelL: 'High data density, small display space, e.g. labels and business cards',
        helpLevelM: 'Default for everyday use, balanced data density and fault tolerance',
        helpLevelQ: 'When embedding a logo or the code may be partially obscured',
        helpLevelH: 'Large logos, print media, outdoor signage, and other wear-prone environments',
        helpQrKnowledge: 'QR Code Basics', helpLogoTips: 'Logo Tips', helpScanTips: 'Scanning & Parsing',
        helpQrDesc: 'is a matrix 2D barcode that stores information in black and white modules (dot matrix)',
        helpQrFinder: 'Three corner', helpQrFinderEnd: 'finder patterns (concentric squares) help scanners quickly identify orientation and position',
        helpQrCapacity1: 'QR capacity: up to', helpQrCapacityAlpha: '4,296 alphanumeric characters', helpQrCapacityOr: 'or', helpQrCapacityByte: '2,953 bytes',
        helpQrLocal: 'All data is', helpQrLocalBold: 'processed locally', helpQrLocalEnd: '— nothing is uploaded to any server',
        helpLogoSquare: 'Use', helpLogoSquareBold: 'square images', helpLogoSquareEnd: '(e.g. 200×200px); auto-centered and cropped',
        helpLogoArea: 'Logo area should not exceed', helpLogoAreaBold: '20% of the QR code',
        helpLogoEC: 'After adding a logo, raise error correction to', helpLogoECBold: 'Q or H',
        helpLogoRemove: 'After removing the logo, error correction can be lowered to M to reduce density',
        helpScanUpload: 'Supports', helpScanUploadBold1: 'file upload', helpScanUploadSep: ', ', helpScanUploadBold2: 'drag & drop', helpScanUploadOr: 'or', helpScanUploadBold3: 'Ctrl+V clipboard paste',
        helpScanPreprocess: 'Grayscale binarization preprocessing, then tries normal + inverted detection for dark themes',
        helpScanStyled: 'For styled QR codes (rounded/gradient), use the "', helpScanStyledBold: 'Self-Check', helpScanStyledEnd: '" button to decode directly from canvas',
        helpScanFormats: 'Supports common QR formats: URL, text, WiFi, vCard, etc.',
        helpScanLocal: 'Parsing is done entirely in the browser; images are never uploaded',
      },
    },
    help: {
      zh: { title: '使用说明', features: ['支持 8 种主题样式和渐变色彩', '可嵌入中心 Logo，自动调整纠错级别', '支持文本/网址/WiFi/邮箱等多种格式', '二维码解析支持上传、拖拽、粘贴截图'], usage: ['输入内容自动生成二维码', '选择主题样式和纠错级别', '可选上传 Logo 嵌入中心', '导出 PNG 或 SVG 格式'] },
      en: { title: 'Usage Guide', features: ['8 theme styles with gradient colors', 'Center logo embedding with auto error correction', 'Supports text/URL/WiFi/email formats', 'QR parsing via upload, drag, or clipboard paste'], usage: ['Enter content to auto-generate QR code', 'Choose theme style and error correction level', 'Optionally upload a logo for the center', 'Export as PNG or SVG'] },
    },
  },
  // ── totp ──
  totp: {
    name: { zh: '2FA 验证码', en: '2FA Authenticator' },
    desc: { zh: '基于 TOTP 协议生成二步验证码，支持密钥导入和隐私保护', en: 'Generate TOTP-based two-factor codes with key import and privacy protection' },
    ui: {
      zh: { secretKey: '密钥', addAccount: '添加账户', accountName: '账户名称', issuer: '发行者', placeholder: '粘贴 TOTP 密钥…', countdown: '倒计时', copyCode: '复制验证码', delete: '删除', showCode: '显示验证码', hideCode: '隐藏验证码', setupGuide: '使用说明', step1: '进入账户安全设置', step1Desc: '登录要开启两步验证的服务，找到安全设置页面。', step2: '选择「身份验证器」', step2Desc: '选择"认证器应用"作为验证方式，会显示一个密钥。', step3: '复制密钥字符串', step3Desc: '点击"无法扫描二维码"，复制显示的 Base32 密钥。', step4: '粘贴到下方输入框', step4Desc: '将密钥粘贴到输入框，点击"生成"即可看到验证码。', services: '常见服务', history: '历史记录' },
      en: { secretKey: 'Secret Key', addAccount: 'Add Account', accountName: 'Account Name', issuer: 'Issuer', placeholder: 'Paste TOTP secret…', countdown: 'Countdown', copyCode: 'Copy Code', delete: 'Delete', showCode: 'Show Code', hideCode: 'Hide Code', setupGuide: 'Setup Guide', step1: 'Go to account security settings', step1Desc: 'Log in to the service and find the security settings page.', step2: 'Select "Authenticator App"', step2Desc: 'Choose "Authenticator App" as verification method, a secret key will be shown.', step3: 'Copy the secret key string', step3Desc: 'Click "Can\'t scan QR code" and copy the Base32 secret key.', step4: 'Paste into the input box below', step4Desc: 'Paste the key into the input box and click "Generate" to see the code.', services: 'Popular Services', history: 'History' },
    },
    help: {
      zh: { title: '使用说明', features: ['基于 TOTP 协议生成 6/8 位验证码', '支持多个账户同时管理', '密钥仅存储在浏览器本地', '30 秒自动刷新验证码'], usage: ['进入目标网站的安全设置页面', '找到「两步验证」或「身份验证器」选项', '复制提供的密钥（Secret Key）', '粘贴到本工具输入框即可生成验证码'] },
      en: { title: 'Usage Guide', features: ['Generate 6/8-digit codes via TOTP protocol', 'Manage multiple accounts simultaneously', 'Keys stored only in browser locally', 'Auto-refresh codes every 30 seconds'], usage: ['Go to the target website\'s security settings', 'Find "Two-factor" or "Authenticator" option', 'Copy the provided secret key', 'Paste it here to start generating codes'] },
    },
  },
  // ── adb ──
  adb: {
    name: { zh: 'ADB 自动化', en: 'ADB Automation' },
    desc: { zh: '常用 ADB 命令封装，设备管理、应用安装、日志抓取', en: 'Common ADB commands for device management, app install, and log capture' },
    ui: {
      zh: { device: '设备', command: '命令', copy: '复制命令', search: '搜索命令', all: '全部', deviceMgmt: '设备管理', appMgmt: '应用管理', screen: '屏幕', file: '文件', debug: '调试' },
      en: { device: 'Device', command: 'Command', copy: 'Copy Command', search: 'Search Commands', all: 'All', deviceMgmt: 'Device', appMgmt: 'App', screen: 'Screen', file: 'File', debug: 'Debug' },
    },
    help: {
      zh: { title: '使用说明', features: ['常用 ADB 命令一键复制', '按类别分组：设备/应用/屏幕/文件/调试', '每条命令附带中文说明', '支持搜索快速定位命令'], usage: ['确保设备已连接并开启 USB 调试', '按类别或搜索找到需要的命令', '点击命令卡片复制到剪贴板', '在终端中粘贴执行'] },
      en: { title: 'Usage Guide', features: ['One-click copy for common ADB commands', 'Grouped by category: Device/App/Screen/File/Debug', 'Each command includes a description', 'Search to quickly find commands'], usage: ['Ensure device is connected with USB debugging enabled', 'Browse by category or search for the command', 'Click a command card to copy to clipboard', 'Paste and run in your terminal'] },
    },
  },
  // ── unicode ──
  unicode: {
    name: { zh: 'Unicode 编解码', en: 'Unicode Codec' },
    desc: { zh: 'Unicode 码点与字符互转，支持 \\uXXXX、U+XXXX、HTML Entity', en: 'Convert between Unicode code points and characters, supports \\uXXXX, U+XXXX, HTML entities' },
    ui: {
      zh: { escape: '\\uXXXX', codepoint: 'U+XXXX', html: 'HTML Entity', placeholder: '输入文本或 Unicode 编码…', encoded: '编码结果', decoded: '解码结果' },
      en: { escape: '\\uXXXX', codepoint: 'U+XXXX', html: 'HTML Entity', placeholder: 'Enter text or Unicode codes…', encoded: 'Encoded', decoded: 'Decoded' },
    },
    help: {
      zh: { title: '使用说明', features: ['文本 → Unicode 转义序列（\\uXXXX）', '文本 → 码点表示（U+XXXX）', '文本 → HTML 数字实体（&#NNNN;）', '支持完整 Unicode 范围含 Emoji'], usage: ['选择输出格式：\\uXXXX / U+XXXX / HTML Entity', '输入文本自动编码', '输入 Unicode 编码自动解码为文本', '点击复制结果'] },
      en: { title: 'Usage Guide', features: ['Text → Unicode escape sequences (\\uXXXX)', 'Text → Code point notation (U+XXXX)', 'Text → HTML numeric entities (&#NNNN;)', 'Full Unicode range including Emoji'], usage: ['Select output format: \\uXXXX / U+XXXX / HTML Entity', 'Enter text to auto-encode', 'Enter Unicode codes to auto-decode', 'Click to copy result'] },
    },
  },
  // ── hex ──
  hex: {
    name: { zh: 'Hex 编解码', en: 'Hex Codec' },
    desc: { zh: '十六进制与文本/字节互转，支持 DEC/BIN 预览', en: 'Convert between hex and text/bytes with DEC/BIN preview' },
    ui: {
      zh: { encodePlaceholder: '输入要编码的文本…', decodePlaceholder: '输入十六进制字符串…（如 48 65 6C 6C 6F）', separator: '分隔符', none: '无', preview: '字节预览' },
      en: { encodePlaceholder: 'Enter text to encode…', decodePlaceholder: 'Enter hex string… (e.g. 48 65 6C 6C 6F)', separator: 'Separator', none: 'None', preview: 'Byte Preview' },
    },
    help: {
      zh: { title: '使用说明', features: ['文本 ↔ 十六进制双向转换', '可选分隔符（空格/冒号/横线/无）', '附带十进制和二进制字节预览', '支持 UTF-8 多字节编码'], usage: ['选择编码或解码模式', '输入文本或十六进制字符串', '编码模式可选分隔符格式', '查看字节预览后复制结果'] },
      en: { title: 'Usage Guide', features: ['Bidirectional text ↔ hex conversion', 'Configurable separator (space/colon/dash/none)', 'DEC and binary byte preview', 'Supports UTF-8 multi-byte encoding'], usage: ['Select encode or decode mode', 'Enter text or hex string', 'Choose separator format in encode mode', 'Preview bytes and copy the result'] },
    },
  },
  // ── htmlEntity ──
  htmlEntity: {
    name: { zh: 'HTML Entity 编解码', en: 'HTML Entity Codec' },
    desc: { zh: 'HTML 实体与字符互转，支持命名实体和数字实体', en: 'Convert between HTML entities and characters, supports named and numeric entities' },
    ui: {
      zh: { placeholder: '输入文本或 HTML 实体…（如 &amp; 或 &#20013;）', encoded: '编码结果', decoded: '解码结果' },
      en: { placeholder: 'Enter text or HTML entities… (e.g. &amp; or &#20013;)', encoded: 'Encoded', decoded: 'Decoded' },
    },
    help: {
      zh: { title: '使用说明', features: ['字符 → HTML 实体（命名实体优先）', '支持 &amp; &#1234; &#xABCD; 三种格式', '内置 30+ 常用命名实体（©®™€ 等）', '适合调试 XSS 和 HTML 模板'], usage: ['输入文本自动编码为 HTML 实体', '输入 HTML 实体自动解码为字符', '支持同时输入混合格式', '点击复制结果'] },
      en: { title: 'Usage Guide', features: ['Characters → HTML entities (named entities preferred)', 'Supports &amp; &#1234; &#xABCD; formats', '30+ built-in named entities (©®™€ etc.)', 'Great for debugging XSS and HTML templates'], usage: ['Enter text to auto-encode to HTML entities', 'Enter HTML entities to auto-decode to characters', 'Supports mixed format input', 'Click to copy result'] },
    },
  },
  // ── textCase ──
  textCase: {
    name: { zh: '文本大小写转换', en: 'Text Case Converter' },
    desc: { zh: '大写/小写/首字母大写/驼峰/蛇形等 8 种命名风格转换', en: 'Convert between 8 naming styles: upper/lower/title/camel/snake/kebab and more' },
    ui: {
      zh: { placeholder: '输入要转换的文本…', upper: '全大写', lower: '全小写', title: '首字母大写', sentence: '句首大写', camel: '小驼峰', pascal: '大驼峰', snake: '蛇形', kebab: '横线' },
      en: { placeholder: 'Enter text to convert…', upper: 'UPPER', lower: 'lower', title: 'Title Case', sentence: 'Sentence case', camel: 'camelCase', pascal: 'PascalCase', snake: 'snake_case', kebab: 'kebab-case' },
    },
    help: {
      zh: { title: '使用说明', features: ['8 种命名风格一键转换', 'UPPER / lower / Title Case / Sentence case', 'camelCase / PascalCase / snake_case / kebab-case', '适合代码重构和变量命名风格切换'], usage: ['输入文本后 8 种格式实时同步', '点击「复制」复制单个结果', '支持中英文混合文本'] },
      en: { title: 'Usage Guide', features: ['8 naming styles in one click', 'UPPER / lower / Title Case / Sentence case', 'camelCase / PascalCase / snake_case / kebab-case', 'Perfect for code refactoring and naming conventions'], usage: ['Enter text — all 8 formats update in real-time', 'Click "Copy" to copy any result', 'Works with mixed CJK and English text'] },
    },
  },
  // ── asciiArt ──
  asciiArt: {
    name: { zh: 'ASCII 艺术字', en: 'ASCII Art Text' },
    desc: { zh: '文字转 ASCII Art，支持 8 种字体、8 种主题和图片导出', en: 'Convert text to ASCII art with 8 fonts, 8 themes, and image export' },
    ui: {
      zh: { font: '字体', theme: '主题', placeholder: '输入文字…（最多 20 字符）', supportedChars: '支持 A-Z、0-9 和常见符号', downloadPng: '下载 PNG', font_standard: '标准', font_slant: '斜体', font_banner: '旗帜', font_small: '小型', font_big: '大型', font_block: '方块', font_double: '双线', font_shadow: '阴影', themeClassic: '经典', themeMatrix: '矩阵', themeAmber: '琥珀', themeOcean: '海洋', themeSolarized: '日晒', themeDracula: '德古拉', themeLight: '明亮', themeHacker: '黑客' },
      en: { font: 'Font', theme: 'Theme', placeholder: 'Enter text… (max 20 chars)', supportedChars: 'Supports A-Z, 0-9, and common symbols', downloadPng: 'Download PNG', font_standard: 'Standard', font_slant: 'Slant', font_banner: 'Banner', font_small: 'Small', font_big: 'Big', font_block: 'Block', font_double: 'Double', font_shadow: 'Shadow', themeClassic: 'Classic', themeMatrix: 'Matrix', themeAmber: 'Amber', themeOcean: 'Ocean', themeSolarized: 'Solarized', themeDracula: 'Dracula', themeLight: 'Light', themeHacker: 'Hacker' },
    },
    help: {
      zh: { title: '使用说明', features: ['8 种 ASCII 字体：标准 / 斜体 / 旗帜 / 小型 / 大型 / 方块 / 双线 / 阴影', '8 种主题配色：经典 / 矩阵 / 琥珀 / 海洋 / 日晒 / 德古拉 / 明亮 / 黑客', '支持 A-Z、0-9 和常见符号', '一键复制文本或下载 PNG 图片', '适合终端欢迎信息、CI/CD 注释、开源项目 Banner'], usage: ['输入文字（最多 20 字符）', '选择字体和主题配色', '实时预览 ASCII Art 效果', '点击「复制」复制文本，或「下载 PNG」导出图片'] },
      en: { title: 'Usage Guide', features: ['8 ASCII fonts: Standard / Slant / Banner / Small / Big / Block / Double / Shadow', '8 theme colors: Classic / Matrix / Amber / Ocean / Solarized / Dracula / Light / Hacker', 'Supports A-Z, 0-9, and common symbols', 'Copy text or download PNG image', 'Perfect for terminal banners, CI/CD comments, open-source project banners'], usage: ['Enter text (max 20 characters)', 'Choose a font and color theme', 'Preview ASCII art in real-time', 'Click "Copy" for text or "Download PNG" for image export'] },
    },
  },
  // ── lorem ──
  lorem: {
    name: { zh: 'Lorem Ipsum 生成器', en: 'Lorem Ipsum Generator' },
    desc: { zh: '生成占位文本，支持拉丁文和中文，可选段落/句子/词', en: 'Generate placeholder text in Latin or Chinese, choose paragraphs/sentences/words' },
    ui: {
      zh: { language: '语言', chinese: '中文', type: '类型', count: '数量', paragraphs: '段落', sentences: '句子', words: '词', generate: '生成' },
      en: { language: 'Language', chinese: 'Chinese', type: 'Type', count: 'Count', paragraphs: 'Paragraphs', sentences: 'Sentences', words: 'Words', generate: 'Generate' },
    },
    help: {
      zh: { title: '使用说明', features: ['支持 Lorem Ipsum 拉丁文和中文占位文本', '可选按段落、句子或词生成', '数量可调 1-20', '适合 UI 设计阶段快速填充内容'], usage: ['选择语言（拉丁文/中文）', '选择生成类型（段落/句子/词）', '调整数量后点击「生成」', '点击「复制」复制到剪贴板'] },
      en: { title: 'Usage Guide', features: ['Latin Lorem Ipsum and Chinese placeholder text', 'Generate by paragraphs, sentences, or words', 'Adjustable count 1-20', 'Perfect for UI design prototyping'], usage: ['Select language (Latin/Chinese)', 'Choose type (Paragraphs/Sentences/Words)', 'Adjust count and click "Generate"', 'Click "Copy" to copy to clipboard'] },
    },
  },
  // ── charRef ──
  charRef: {
    name: { zh: '字符对照表', en: 'Character Reference' },
    desc: { zh: 'ASCII/Unicode 码表速查，字符反查编码', en: 'ASCII/Unicode character table lookup and reverse encoding search' },
    ui: {
      zh: { lookup: '字符反查', lookupPlaceholder: '输入字符查看编码…', table: '码表', searchPlaceholder: '搜索字符或名称…', details: '字符网格', detailsDesc: '点击字符复制到剪贴板', clickToCopy: '点击任意字符可复制', printable: '可打印字符', digits: '数字', uppercase: '大写字母', lowercase: '小写字母', symbols: '符号', control: '控制字符', extended: '扩展字符' },
      en: { lookup: 'Character Lookup', lookupPlaceholder: 'Enter a character to see its encoding…', table: 'Character Table', searchPlaceholder: 'Search character or name…', details: 'Character Grid', detailsDesc: 'Click a character to copy to clipboard', clickToCopy: 'Click any character to copy', printable: 'Printable', digits: 'Digits', uppercase: 'Uppercase', lowercase: 'Lowercase', symbols: 'Symbols', control: 'Control', extended: 'Extended' },
    },
    help: {
      zh: { title: '使用说明', features: ['ASCII 码表速查：可打印字符/数字/字母/符号/控制字符', '输入字符反查 DEC/HEX/OCT/BIN 编码', '支持按类别筛选和搜索', '点击字符一键复制'], usage: ['在顶部输入字符查看编码详情', '按类别筛选码表内容', '输入关键词搜索字符', '点击码表中的字符复制到剪贴板'] },
      en: { title: 'Usage Guide', features: ['ASCII table: printable/digits/letters/symbols/control chars', 'Input character to reverse-lookup DEC/HEX/OCT/BIN', 'Filter by category and search', 'Click character to copy'], usage: ['Enter a character at the top to see encoding details', 'Filter the table by category', 'Search by keyword', 'Click any character in the table to copy'] },
    },
  },
  // ── yaml ──
  yaml: {
    name: { zh: 'YAML 格式化', en: 'YAML Formatter' },
    desc: { zh: 'YAML 美化、压缩、验证，支持转 JSON', en: 'Beautify, minify, and validate YAML with JSON conversion' },
    ui: {
      zh: { format: '格式化', minify: '压缩', toJson: '转 JSON', placeholder: '粘贴 YAML…', errorPrefix: 'YAML 解析错误' },
      en: { format: 'Format', minify: 'Minify', toJson: 'To JSON', placeholder: 'Paste YAML…', errorPrefix: 'YAML parse error' },
    },
    help: {
      zh: { title: '使用说明', features: ['YAML 美化格式化，自动缩进排版', 'YAML 压缩为紧凑格式', 'YAML 转 JSON 一键转换', '语法错误定位，快速排查格式问题'], usage: ['在左侧输入框粘贴或输入 YAML 数据', '点击「格式化」美化缩进，或「压缩」去除空白', '点击「转 JSON」将 YAML 转换为 JSON 格式', '右侧实时显示处理结果或错误信息'] },
      en: { title: 'Usage Guide', features: ['Pretty-print YAML with auto-indentation', 'Minify YAML to compact format', 'One-click YAML to JSON conversion', 'Syntax error detection with precise location'], usage: ['Paste or type YAML data in the left panel', 'Click "Format" to pretty-print or "Minify" to compress', 'Click "To JSON" to convert YAML to JSON format', 'Results or error messages appear in real-time on the right'] },
    },
  },
  // ── jsonSchema ──
  jsonSchema: {
    name: { zh: 'JSON Schema 验证器', en: 'JSON Schema Validator' },
    desc: { zh: '根据 JSON Schema 校验 JSON 数据，高亮错误位置', en: 'Validate JSON data against a JSON Schema with error highlighting' },
    ui: {
      zh: { schema: 'Schema 定义', data: 'JSON 数据', validate: '验证', result: '验证结果', valid: '✓ 通过', invalid: '✗ 不通过', schemaPlaceholder: '粘贴 JSON Schema…', dataPlaceholder: '粘贴待验证的 JSON 数据…' },
      en: { schema: 'Schema', data: 'JSON Data', validate: 'Validate', result: 'Result', valid: '✓ Valid', invalid: '✗ Invalid', schemaPlaceholder: 'Paste JSON Schema…', dataPlaceholder: 'Paste JSON data to validate…' },
    },
    help: {
      zh: { title: '使用说明', features: ['基于 ajv 引擎，支持 JSON Schema Draft 2020-12', '高亮显示每个验证错误的位置和原因', '支持嵌套对象和数组校验', '提供内置示例快速体验'], usage: ['在左侧粘贴 JSON Schema 定义', '在右侧粘贴待验证的 JSON 数据', '点击「验证」查看结果', '错误列表显示路径和具体原因'] },
      en: { title: 'Usage Guide', features: ['Powered by ajv, supports JSON Schema Draft 2020-12', 'Highlights each validation error with location', 'Supports nested object and array validation', 'Built-in example for quick testing'], usage: ['Paste JSON Schema definition on the left', 'Paste JSON data to validate on the right', 'Click "Validate" to see results', 'Error list shows path and reason for each issue'] },
    },
  },
  // ── jsonCsv ──
  jsonCsv: {
    name: { zh: 'JSON ↔ CSV 转换', en: 'JSON ↔ CSV Converter' },
    desc: { zh: 'JSON 数组与 CSV 双向转换，支持自定义分隔符和嵌套展开', en: 'Bidirectional JSON array ↔ CSV conversion with custom delimiters and nested object flattening' },
    ui: {
      zh: { convert: '转换', delimiter: '分隔符', jsonPlaceholder: '粘贴 JSON 数组…\n[{"name":"张三","age":28},{"name":"李四","age":32}]', csvPlaceholder: '粘贴 CSV 数据…\nname,age\n张三,28\n李四,32' },
      en: { convert: 'Convert', delimiter: 'Delimiter', jsonPlaceholder: 'Paste JSON array…\n[{"name":"Alice","age":28},{"name":"Bob","age":32}]', csvPlaceholder: 'Paste CSV data…\nname,age\nAlice,28\nBob,32' },
    },
    help: {
      zh: { title: '使用说明', features: ['JSON 数组 → CSV 一键转换', 'CSV → JSON 数组反向转换', '嵌套对象自动展开为列名（如 address.city）', '支持逗号/分号/Tab 分隔符'], usage: ['选择转换方向：JSON → CSV 或 CSV → JSON', '选择分隔符类型', '在输入框粘贴数据', '点击「转换」后复制结果'] },
      en: { title: 'Usage Guide', features: ['JSON array → CSV one-click conversion', 'CSV → JSON array reverse conversion', 'Nested objects flatten to dot-notation columns (e.g. address.city)', 'Supports comma/semicolon/Tab delimiters'], usage: ['Select direction: JSON → CSV or CSV → JSON', 'Choose delimiter type', 'Paste data in the input area', 'Click "Convert" and copy the result'] },
    },
  },
  // ── xml ──
  xml: {
    name: { zh: 'XML 格式化', en: 'XML Formatter' },
    desc: { zh: 'XML 美化、压缩、转 JSON', en: 'Beautify, minify, and convert XML to JSON' },
    ui: {
      zh: { format: '格式化', minify: '压缩', toJson: '转 JSON', indent: '缩进', placeholder: '粘贴 XML…', errorPrefix: 'XML 解析错误' },
      en: { format: 'Format', minify: 'Minify', toJson: 'To JSON', indent: 'Indent', placeholder: 'Paste XML…', errorPrefix: 'XML parse error' },
    },
    help: {
      zh: { title: '使用说明', features: ['XML 美化格式化，支持 2/4 空格缩进', 'XML 压缩为单行', 'XML 转 JSON 一键转换', '自动处理属性和嵌套元素'], usage: ['在左侧粘贴 XML 数据', '选择缩进大小（2 或 4 空格）', '点击「格式化」「压缩」或「转 JSON」', '右侧实时显示结果'] },
      en: { title: 'Usage Guide', features: ['Pretty-print XML with 2/4 space indentation', 'Minify XML to single line', 'One-click XML to JSON conversion', 'Auto-handles attributes and nested elements'], usage: ['Paste XML data on the left', 'Select indent size (2 or 4 spaces)', 'Click "Format", "Minify", or "To JSON"', 'Results appear in real-time on the right'] },
    },
  },
  // ── mockGen ──
  mockGen: {
    name: { zh: 'Mock API 生成器', en: 'Mock API Generator' },
    desc: { zh: '定义 API 端点生成 Mock 代码，支持批量生成测试数据', en: 'Define API endpoints and generate mock server code, with batch test data generation' },
    ui: {
      zh: { apiMock: 'API Mock', testData: '测试数据', endpoints: 'API 端点', addEndpoint: '添加端点', preview: '预览', generateCode: '生成代码', fields: '字段定义', addField: '添加字段', dataCount: '数量', generateData: '生成数据', injectToApi: '注入到 API' },
      en: { apiMock: 'API Mock', testData: 'Test Data', endpoints: 'API Endpoints', addEndpoint: 'Add Endpoint', preview: 'Preview', generateCode: 'Generate Code', fields: 'Fields', addField: 'Add Field', dataCount: 'Count', generateData: 'Generate Data', injectToApi: 'Inject to API' },
    },
    help: {
      zh: { title: '使用说明', features: ['API Mock：可视化定义端点，生成 MSW/json-server/fetch-mock 代码', '测试数据：按字段定义批量生成 Mock 数据（姓名/邮箱/手机/地址等）', '内置 4 种数据模板（用户/商品/订单/文章）', '生成的测试数据可一键注入为 API 响应体'], usage: ['API Mock Tab：定义端点 → 选格式 → 生成代码', '测试数据 Tab：选模板或自定义字段 → 生成数据', '可将生成的数据注入到 API 端点作为响应体', '复制代码到项目中使用'] },
      en: { title: 'Usage Guide', features: ['API Mock: visual endpoint definition, generate MSW/json-server/fetch-mock code', 'Test Data: batch generate mock data from field definitions (name/email/phone/address)', '4 built-in data templates (User/Product/Order/Post)', 'Generated data can be injected as API response body'], usage: ['API Mock tab: define endpoints → choose format → generate code', 'Test Data tab: select template or customize fields → generate data', 'Inject generated data into API endpoints as response body', 'Copy code to your project'] },
    },
  },
  // ── emoji ──
  emoji: {
    name: { zh: 'Emoji 搜索', en: 'Emoji Browser' },
    desc: { zh: 'Emoji 搜索与复制，支持中英文关键词和平台差异说明', en: 'Search and copy emojis with CJK/English keywords and platform difference notes' },
    ui: {
      zh: { search: '搜索 Emoji', placeholder: '搜索表情…（支持中文如"笑"、英文如"smile"）', all: '全部', details: '详情', platformNotes: '平台差异说明', clickToCopy: '点击复制到剪贴板', noResults: '未找到匹配的 Emoji', showingFirst: '仅显示前 200 个结果，请使用搜索缩小范围' },
      en: { search: 'Search Emoji', placeholder: 'Search emojis… (e.g. "smile", "love", "笑")', all: 'All', details: 'Details', platformNotes: 'Platform Notes', clickToCopy: 'Click to copy', noResults: 'No matching emojis found', showingFirst: 'Showing first 200 results — use search to narrow down' },
    },
    help: {
      zh: { title: '使用说明', features: ['Emoji 搜索支持中英文关键词', '按类别筛选：表情/手势/符号/物品/旗帜', '点击一键复制到剪贴板', '内置平台差异说明（Apple/Google/Microsoft/Samsung/Twitter 渲染差异）'], usage: ['输入关键词搜索（如"笑"、"love"、"bug"）', '按类别筛选缩小范围', '点击 Emoji 复制到剪贴板', '点击「平台差异说明」查看各平台渲染差异'] },
      en: { title: 'Usage Guide', features: ['Search emojis with CJK or English keywords', 'Filter by category: Smileys/Gestures/Symbols/Objects/Flags', 'One-click copy to clipboard', 'Built-in platform difference notes (Apple/Google/Microsoft/Samsung/Twitter rendering)'], usage: ['Type a keyword to search (e.g. "smile", "love", "bug")', 'Filter by category to narrow results', 'Click an emoji to copy to clipboard', 'Click "Platform Notes" to view cross-platform rendering differences'] },
    },
  },
  // ── barcode ──
  barcode: {
    name: { zh: '条形码生成器', en: 'Barcode Generator' },
    desc: { zh: '支持 Code128/EAN-13/UPC 等多种条码格式，可导出 PNG/SVG', en: 'Generate barcodes in Code128/EAN-13/UPC and more, export PNG/SVG' },
    ui: {
      zh: { format: '条码格式', value: '编码内容', placeholder: '输入编码内容…', height: '条码高度', colors: '颜色', showText: '显示文字' },
      en: { format: 'Format', value: 'Value', placeholder: 'Enter value…', height: 'Height', colors: 'Colors', showText: 'Show Text' },
    },
    help: {
      zh: { title: '使用说明', features: ['支持 Code128/Code39/EAN-13/EAN-8/UPC-A/ITF-14 等格式', '自定义条码颜色和背景色', '可选是否显示底部文字', '导出 PNG（2x）和 SVG 矢量格式'], usage: ['选择条码格式', '输入编码内容', '调整高度和颜色', '下载 PNG 或 SVG'] },
      en: { title: 'Usage Guide', features: ['Supports Code128/Code39/EAN-13/EAN-8/UPC-A/ITF-14', 'Custom barcode and background colors', 'Toggle bottom text display', 'Export PNG (2x) and SVG vector formats'], usage: ['Select barcode format', 'Enter the value to encode', 'Adjust height and colors', 'Download PNG or SVG'] },
    },
  },
  // ── imgBase64 ──
  imgBase64: {
    name: { zh: '图片 Base64', en: 'Image Base64' },
    desc: { zh: '图片与 Base64 互转，支持拖拽上传和多种输出格式', en: 'Convert images to/from Base64 with drag-and-drop and multiple output formats' },
    ui: {
      zh: { uploadImage: '上传图片', dropzone: '拖拽图片到此处，或点击上传', orPaste: '或粘贴 Base64 字符串', textPlaceholder: '粘贴 Base64 字符串或 Data URI…', invalidBase64: '无效的 Base64 字符串', invalidImage: '无法解析为图片' },
      en: { uploadImage: 'Upload Image', dropzone: 'Drag image here, or click to upload', orPaste: 'or paste Base64 string', textPlaceholder: 'Paste Base64 string or Data URI…', invalidBase64: 'Invalid Base64 string', invalidImage: 'Cannot parse as image' },
    },
    help: {
      zh: { title: '使用说明', features: ['图片 → Base64：上传/拖拽/粘贴图片，自动生成 Data URI', 'Base64 → 图片：粘贴 Base64 或 Data URI 自动解析预览', '5 种输出格式：Data URI / 纯 Base64 / CSS / HTML / Markdown', '自动检测图片类型（PNG/JPEG/GIF/WebP）'], usage: ['上传图片或粘贴 Base64 字符串', '选择输出格式', '点击「复制」复制到剪贴板', '点击「下载」保存图片文件'] },
      en: { title: 'Usage Guide', features: ['Image → Base64: upload/drag/paste image, auto-generate Data URI', 'Base64 → Image: paste Base64 or Data URI to auto-decode and preview', '5 output formats: Data URI / Pure Base64 / CSS / HTML / Markdown', 'Auto-detect image type (PNG/JPEG/GIF/WebP)'], usage: ['Upload an image or paste a Base64 string', 'Select output format', 'Click "Copy" to copy to clipboard', 'Click "Download" to save the image file'] },
    },
  },
  // ── favicon ──
  favicon: {
    name: { zh: 'Favicon 生成器', en: 'Favicon Generator' },
    desc: { zh: '从文字/Emoji/图片生成多尺寸 Favicon，附带 HTML 引用代码', en: 'Generate multi-size favicons from text/emoji/image with HTML snippet' },
    ui: {
      zh: { content: '内容', contentPlaceholder: '输入 Emoji 或文字（如 ⚡ 🚀 A）', uploadImage: '上传图片', clearImage: '移除图片', fontSize: '字号', shape: '形状', square: '方形', rounded: '圆角', circle: '圆形', colors: '颜色', bg: '背景', fg: '前景', sizes: '输出尺寸', commonSizes: '常用', selectAll: '全选', downloadAll: '打包下载 ZIP', copyHtml: '复制 HTML', htmlSnippet: 'HTML 引用代码', imageScale: '图片缩放', imageRound: '圆角', imageOffset: '偏移' },
      en: { content: 'Content', contentPlaceholder: 'Enter emoji or text (e.g. ⚡ 🚀 A)', uploadImage: 'Upload', clearImage: 'Remove', fontSize: 'Font Size', shape: 'Shape', square: 'Square', rounded: 'Rounded', circle: 'Circle', colors: 'Colors', bg: 'BG', fg: 'FG', sizes: 'Output Sizes', commonSizes: 'Common', selectAll: 'All', downloadAll: 'Download ZIP', copyHtml: 'Copy HTML', htmlSnippet: 'HTML Snippet', imageScale: 'Scale', imageRound: 'Round Corners', imageOffset: 'Offset' },
    },
    help: {
      zh: { title: '使用说明', features: ['支持 Emoji、文字、上传图片三种输入方式', '19 种标准尺寸覆盖所有平台（16px ~ 512px）', '方形/圆角/圆形三种形状', '一键下载全部尺寸 + 复制 HTML 引用代码'], usage: ['选择输入方式（Emoji/文字/图片）', '调整背景色、前景色、字号和形状', '勾选需要的输出尺寸', '下载 PNG 文件或复制 HTML 代码到项目中'] },
      en: { title: 'Usage Guide', features: ['Three input modes: Emoji, Text, or Image upload', '19 standard sizes covering all platforms (16px ~ 512px)', 'Square, rounded, and circle shapes', 'One-click batch download + HTML snippet copy'], usage: ['Choose input mode (Emoji/Text/Image)', 'Adjust background, foreground, font size, and shape', 'Select output sizes', 'Download PNGs or copy the HTML snippet into your project'] },
    },
  },
  // ── addressGen ──
  addressGen: {
    name: { zh: '地址生成器', en: 'Address Generator' },
    desc: { zh: '生成真实格式的各国/地区收货地址，含邮编、街道、城市', en: 'Generate realistic shipping addresses for 10 countries with postal codes, streets, and cities' },
    ui: {
      zh: { country: '国家/地区', count: '数量', generate: '生成地址', copyAll: '复制全部' },
      en: { country: 'Country', count: 'Count', generate: 'Generate', copyAll: 'Copy All' },
    },
    help: {
      zh: { title: '使用说明', features: ['支持 10 个国家/地区：中国、美国、日本、英国、德国、韩国、法国、加拿大、澳大利亚、新加坡', '地址格式符合各国真实规范（邮编、省/州、城市、街道）', '姓名、电话、街道均使用真实数据池随机组合', '适合电商测试、表单填充、物流系统测试'], usage: ['选择国家/地区', '设置生成数量（1-20）', '点击「生成地址」', '点击「复制」复制单条或全部地址'] },
      en: { title: 'Usage Guide', features: ['10 countries: China, US, Japan, UK, Germany, Korea, France, Canada, Australia, Singapore', 'Addresses follow real national formats (postal codes, states, cities, streets)', 'Names, phones, and streets use realistic data pools', 'Perfect for e-commerce testing, form filling, logistics testing'], usage: ['Select a country/region', 'Set the count (1-20)', 'Click "Generate"', 'Click "Copy" for single or "Copy All" for all addresses'] },
    },
  },
  // ── travel ──
  travel: {
    name: { zh: '去哪玩', en: 'Travel Planner' },
    desc: { zh: '中国地图旅行路线规划，支持季节推荐、终点设置和 AI 行程生成', en: 'China travel route planner with seasonal recommendations, endpoint selection, and AI itinerary generation' },
    ui: {
      zh: { planTrip: '规划旅行', startCity: '出发城市', includeStartCity: '游玩出发城市', includeStartCityHint: '关闭后，不安排出发城市的景点与行程', days: '游玩天数', dayUnit: '天', season: '出行季节', generateRoute: '生成路线', routes: '推荐路线', attractions: '地区景点', aiSuggest: 'AI 生成行程', aiTab: 'AI 行程', aiGenerating: '正在生成行程，请稍候…', aiHint: '点击下方「AI 生成行程」按钮，AI 将为你规划详细路线', generateHint: '选择城市和天数后点击「生成路线」', seasonFilter: '按当前季节筛选', noSeasonalAttractions: '该城市当前季节暂无推荐景点', clickCityHint: '点击地图上的城市查看当地景点', llmSettings: '大模型配置', llmConfigHint: '请先配置大模型 API Key', provider: '模型厂商', apiKey: 'API Key', model: '模型', baseUrl: 'API 地址', saveConfig: '保存配置', configNote: '配置保存在浏览器本地，不会上传。支持通义千问、DeepSeek、OpenAI、月之暗面、智谱等 OpenAI 兼容接口。' },
      en: { planTrip: 'Plan Trip', startCity: 'Departure', includeStartCity: 'Visit departure city', includeStartCityHint: 'When off, the itinerary skips sightseeing in the departure city', days: 'Duration', dayUnit: 'days', season: 'Season', generateRoute: 'Generate Routes', routes: 'Routes', attractions: 'Attractions', aiSuggest: 'AI Itinerary', aiTab: 'AI Trip', aiGenerating: 'Generating itinerary, please wait…', aiHint: 'Click "AI Itinerary" below to let AI plan your detailed route', generateHint: 'Select city and days, then click "Generate Routes"', seasonFilter: 'Filtered by current season', noSeasonalAttractions: 'No seasonal attractions for this city', clickCityHint: 'Click a city on the map to view local attractions', llmSettings: 'LLM Settings', llmConfigHint: 'Please configure LLM API Key first', provider: 'Provider', apiKey: 'API Key', model: 'Model', baseUrl: 'API URL', saveConfig: 'Save', configNote: 'Config saved locally in browser. Supports Qwen, DeepSeek, OpenAI, Moonshot, Zhipu, and any OpenAI-compatible API.' },
    },
    help: {
      zh: { title: '使用说明', features: ['50+ 中国城市、200+ 真实景点数据', '6 种主题路线：自然风光/历史人文/美食/文艺小城/亲子乐园/当季最佳', '支持设置终点城市，路线顺路规划不绕路', '按季节推荐当季最佳景点（春季赏花/夏季避暑/秋季红叶/冬季冰雪）', '接入大模型 AI 生成详细每日行程（支持千问/DeepSeek/OpenAI 等）', '点击地图城市查看景点详情，路线实时可视化'], usage: ['选择出发城市、终点城市（可选）、天数和季节', '点击「生成路线」查看主题推荐', '点击路线在地图上查看轨迹', '点击 🤖 生成 AI 详细行程（需先配置 API Key）', '点击 ⚙️ 配置大模型 API'] },
      en: { title: 'Usage Guide', features: ['50+ Chinese cities, 200+ real attractions', '6 themed routes: Nature/History/Food/Art Towns/Family/Best Season', 'Endpoint selection for non-return trips with optimized routing', 'Seasonal recommendations (spring flowers/summer cool/autumn leaves/winter ice)', 'AI-powered daily itinerary via LLM (Qwen/DeepSeek/OpenAI/etc.)', 'Click cities on map for details, real-time route visualization'], usage: ['Select departure, destination (optional), days, and season', 'Click "Generate Routes" for themed recommendations', 'Click a route to view it on the map', 'Click 🤖 for AI itinerary (configure API Key first)', 'Click ⚙️ to set up LLM API'] },
    },
  },
  // ── dns ──
  dns: {
    name: { zh: 'DNS 查询', en: 'DNS Lookup' },
    desc: { zh: '查询域名的 A/AAAA/MX/CNAME/TXT/NS 等 DNS 记录', en: 'Query domain DNS records: A/AAAA/MX/CNAME/TXT/NS and more' },
    ui: {
      zh: { query: '域名查询', placeholder: '输入域名，如 example.com', queryBtn: '查询', queryAll: '查询全部', querying: '查询中', result: '查询结果', type: '类型', value: '记录值', noRecords: '该类型无 DNS 记录' },
      en: { query: 'Domain Lookup', placeholder: 'Enter domain, e.g. example.com', queryBtn: 'Lookup', queryAll: 'Lookup All', querying: 'Querying', result: 'Results', type: 'Type', value: 'Value', noRecords: 'No DNS records for this type' },
    },
    help: {
      zh: { title: '使用说明', features: ['支持 A/AAAA/MX/CNAME/TXT/NS/SRV/SOA/PTR/CAA 记录查询', '使用 Google DNS-over-HTTPS，无需安装任何工具', '「查询全部」一次获取所有常见记录类型', '显示 TTL 和格式化后的记录值'], usage: ['输入域名（如 example.com）', '选择记录类型或点击「查询全部」', '查看查询结果，点击复制单条记录', 'MX/SRV/SOA 记录自动格式化显示'] },
      en: { title: 'Usage Guide', features: ['Query A/AAAA/MX/CNAME/TXT/NS/SRV/SOA/PTR/CAA records', 'Uses Google DNS-over-HTTPS — no tools needed', 'Lookup All fetches all common record types at once', 'Shows TTL and formatted record values'], usage: ['Enter a domain (e.g. example.com)', 'Select a record type or click "Lookup All"', 'View results, click copy on any record', 'MX/SRV/SOA records are auto-formatted'] },
    },
  },
  // ── whois ──
  whois: {
    name: { zh: 'WHOIS 查询', en: 'WHOIS Lookup' },
    desc: { zh: '查询域名注册信息、到期时间、注册商', en: 'Query domain registration info, expiry date, and registrar' },
    ui: {
      zh: { query: '域名查询', placeholder: '输入域名，如 example.com', queryBtn: '查询', querying: '查询中', result: '查询结果', apiNote: '使用 RDAP 协议（WHOIS 现代替代），自动尝试多个注册局数据源。', notFound: '未查询到注册信息，可尝试下方外链查询', externalLookup: '外部 WHOIS 查询（点击跳转）', tryExternal: 'API 未返回数据，试试外部查询：', noData: '未查询到注册信息' },
      en: { query: 'Domain Lookup', placeholder: 'Enter domain, e.g. example.com', queryBtn: 'Lookup', querying: 'Querying', result: 'Results', apiNote: 'Uses RDAP protocol (modern WHOIS replacement), tries multiple registry sources automatically.', notFound: 'No data found — try external lookup below', externalLookup: 'External WHOIS lookup (click to open)', tryExternal: 'API returned no data. Try external lookup:', noData: 'No registration data found' },
    },
    help: {
      zh: { title: '使用说明', features: ['使用 RDAP 协议查询（WHOIS 的现代替代标准）', '查看域名注册日期、到期日期、最后更新时间', '查看注册商和域名状态', '查看 NS 记录'], usage: ['输入域名（如 example.com）', '点击「查询」获取注册信息', '查看域名状态、到期时间等', '点击「复制」复制单条信息'] },
      en: { title: 'Usage Guide', features: ['Uses RDAP protocol (modern WHOIS replacement standard)', 'View registration date, expiry date, last update time', 'View registrar and domain status', 'View nameservers'], usage: ['Enter a domain (e.g. example.com)', 'Click "Lookup" to get registration info', 'View domain status, expiry, etc.', 'Click "Copy" to copy any field'] },
    },
  },
  // ── ipLookup ──
  ipLookup: {
    name: { zh: 'IP 归属地查询', en: 'IP Geolocation' },
    desc: { zh: '查询 IP 地理位置、运营商、时区等信息', en: 'Query IP geolocation, ISP, timezone, and more' },
    ui: {
      zh: { query: 'IP 查询', placeholder: '输入 IP 地址（留空查询本机 IP）', queryBtn: '查询', querying: '查询中', myIp: '查本机', result: '查询结果', country: '国家', region: '地区', city: '城市', postal: '邮编', timezone: '时区', viewOnMap: '在地图中查看', apiNote: '使用 ipinfo.io 免费 API（每月 5 万次）' },
      en: { query: 'IP Lookup', placeholder: 'Enter IP address (leave empty for your IP)', queryBtn: 'Lookup', querying: 'Querying', myIp: 'My IP', result: 'Results', country: 'Country', region: 'Region', city: 'City', postal: 'Postal', timezone: 'Timezone', viewOnMap: 'View on Map', apiNote: 'Uses ipinfo.io free API (50k/month)' },
    },
    help: {
      zh: { title: '使用说明', features: ['查询 IP 的国家/地区/城市/邮编/时区', '显示 ASN 和运营商信息', '自动检测本机 IP 并显示归属地', '可直接在 Google Maps 中查看位置'], usage: ['输入 IP 地址或留空查询本机', '点击「查询」获取归属地信息', '点击「查本机」快速查看自己的 IP', '点击地图链接在 Google Maps 中查看'] },
      en: { title: 'Usage Guide', features: ['Query IP country/region/city/postal/timezone', 'Show ASN and ISP info', 'Auto-detect your IP and show its location', 'View location on Google Maps directly'], usage: ['Enter IP or leave empty for your own IP', 'Click "Lookup" to get geolocation info', 'Click "My IP" to quickly check your IP', 'Click map link to view on Google Maps'] },
    },
  },
  // ── colorPalette ──
  colorPalette: {
    name: { zh: '色板生成器', en: 'Color Palette Generator' },
    desc: { zh: '基于色彩和谐理论生成调色板，支持互补/类似/三色/单色等模式', en: 'Generate color palettes using harmony rules: complementary, analogous, triadic, and more' },
    ui: {
      zh: { baseColor: '基础色', random: '随机', harmony: '和谐模式', shades: '明暗梯度', preview: '预览', sampleText: '示例文本', gradient: '渐变预览', complementary: '互补色', analogous: '类似色', triadic: '三色组', splitComplementary: '分裂互补', tetradic: '四色组', monochromatic: '单色系' },
      en: { baseColor: 'Base Color', random: 'Random', harmony: 'Harmony', shades: 'Tints & Shades', preview: 'Preview', sampleText: 'Sample Text', gradient: 'Gradient Preview', complementary: 'Complementary', analogous: 'Analogous', triadic: 'Triadic', splitComplementary: 'Split', tetradic: 'Tetradic', monochromatic: 'Mono' },
    },
    help: {
      zh: { title: '使用说明', features: ['6 种色彩和谐模式：互补/类似/三色/分裂互补/四色/单色', '自动生成明暗梯度（9 级）', '实时文字预览和渐变预览', '一键复制色值，导出 CSS 变量'], usage: ['选择或输入基础颜色', '选择和谐模式查看配色方案', '点击色块复制色值', '查看明暗梯度和渐变效果'] },
      en: { title: 'Usage Guide', features: ['6 harmony modes: Complementary/Analogous/Triadic/Split/Tetradic/Mono', 'Auto-generate tints and shades (9 levels)', 'Live text preview and gradient preview', 'One-click copy, export as CSS variables'], usage: ['Select or enter a base color', 'Choose a harmony mode to view the palette', 'Click a color swatch to copy its value', 'View tints/shades and gradient preview'] },
    },
  },
  // ── textCipher ──
  textCipher: {
    name: { zh: '文本加密/解密', en: 'Text Cipher' },
    desc: { zh: '支持 ROT13/凯撒/盲文/颠倒字/零宽隐写等多种加密方式', en: 'Encode/decode with ROT13, Caesar, Braille, Upside-down, Zero-width steganography, and more' },
    ui: {
      zh: { cipherType: '加密方式', encode: '加密', decode: '解密', caesar: '凯撒密码', shift: '偏移量', reverse: '颠倒文字', morse: '摩斯密码', braille: '盲文', upsidedown: '颠倒字', emoji: 'Emoji 编码', zerowidth: '零宽隐写', classic: '经典', fun: '趣味', social: '社交', encoding: '编码', steganography: '隐写术', swap: '交换', inputPlaceholder: '输入要加密/解密的文本…', decodeError: '解码失败，请检查输入', zwNote: '零宽隐写使用 Unicode Tag 字符（不可见），文本看起来正常但隐藏了额外信息。复制输出文本发给对方，对方粘贴到本工具即可解码。' },
      en: { cipherType: 'Cipher Type', encode: 'Encode', decode: 'Decode', caesar: 'Caesar', shift: 'Shift', reverse: 'Reverse', morse: 'Morse Code', braille: 'Braille', upsidedown: 'Upside Down', emoji: 'Emoji Code', zerowidth: 'Zero-Width', classic: 'Classic', fun: 'Fun', social: 'Social', encoding: 'Encoding', steganography: 'Steganography', swap: 'Swap', inputPlaceholder: 'Enter text to encode/decode…', decodeError: 'Decode error — check your input', zwNote: 'Zero-width steganography uses Unicode Tag characters (invisible). Text looks normal but hides extra data. Copy the output and send to someone — they paste it here to decode.' },
    },
    help: {
      zh: { title: '使用说明', features: ['经典加密：ROT13、凯撒密码（可调偏移）、摩斯密码', '编码方式：二进制、十六进制', '社交趣味：颠倒字、盲文、Emoji 编码', '隐写术：零宽字符隐写（文本看似空白，实则隐藏信息）'], usage: ['选择加密方式', '输入文本，选择加密或解密', '点击「交换」将输出作为新输入', '零宽隐写的文本可直接粘贴到社交媒体'] },
      en: { title: 'Usage Guide', features: ['Classic: ROT13, Caesar cipher (adjustable shift), Morse code', 'Encoding: Binary, Hexadecimal', 'Social/Fun: Upside-down text, Braille, Emoji encoding', 'Steganography: Zero-width characters (text appears blank, hides data)'], usage: ['Select a cipher type', 'Enter text, choose encode or decode', 'Click "Swap" to use output as new input', 'Zero-width text can be pasted directly on social media'] },
    },
  },
  // ── worldClock ──
  worldClock: {
    name: { zh: '世界时钟', en: 'World Clock' },
    desc: { zh: '全球主要城市实时时间，支持自定义城市列表', en: 'Real-time clocks for major cities worldwide with customizable city list' },
    ui: {
      zh: { addCity: '添加城市', closeAdd: '收起', remove: '移除', resetDefault: '恢复默认', beijing: '北京', shanghai: '上海', hongkong: '香港', tokyo: '东京', seoul: '首尔', singapore: '新加坡', mumbai: '孟买', dubai: '迪拜', moscow: '莫斯科', istanbul: '伊斯坦布尔', london: '伦敦', paris: '巴黎', berlin: '柏林', rome: '罗马', madrid: '马德里', amsterdam: '阿姆斯特丹', newyork: '纽约', chicago: '芝加哥', denver: '丹佛', losangeles: '洛杉矶', vancouver: '温哥华', toronto: '多伦多', saopaulo: '圣保罗', sydney: '悉尼', auckland: '奥克兰' },
      en: { addCity: 'Add City', closeAdd: 'Close', remove: 'Remove', resetDefault: 'Reset', beijing: 'Beijing', shanghai: 'Shanghai', hongkong: 'Hong Kong', tokyo: 'Tokyo', seoul: 'Seoul', singapore: 'Singapore', mumbai: 'Mumbai', dubai: 'Dubai', moscow: 'Moscow', istanbul: 'Istanbul', london: 'London', paris: 'Paris', berlin: 'Berlin', rome: 'Rome', madrid: 'Madrid', amsterdam: 'Amsterdam', newyork: 'New York', chicago: 'Chicago', denver: 'Denver', losangeles: 'Los Angeles', vancouver: 'Vancouver', toronto: 'Toronto', saopaulo: 'São Paulo', sydney: 'Sydney', auckland: 'Auckland' },
    },
    help: {
      zh: { title: '使用说明', features: ['25 个全球主要城市实时时钟', '显示时区偏移、日期、昼夜状态', '自定义添加/移除城市', '默认显示北京、东京、伦敦、纽约、洛杉矶、悉尼'], usage: ['打开即显示实时时钟', '点击 ✕ 移除不需要的城市', '点击「添加城市」从列表中选择', '点击「恢复默认」重置城市列表'] },
      en: { title: 'Usage Guide', features: ['25 major global cities with real-time clocks', 'Shows timezone offset, date, day/night status', 'Customizable city list — add or remove', 'Default: Beijing, Tokyo, London, New York, LA, Sydney'], usage: ['Open to see real-time clocks', 'Click ✕ to remove a city', 'Click "Add City" to select from the list', 'Click "Reset" to restore default cities'] },
    },
  },
  // ── graphql ──
  graphql: {
    name: { zh: 'GraphQL 格式化', en: 'GraphQL Formatter' },
    desc: { zh: 'GraphQL query/mutation 美化、压缩', en: 'Beautify and minify GraphQL queries and mutations' },
    ui: {
      zh: { format: '格式化', minify: '压缩', indent: '缩进', placeholder: '粘贴 GraphQL query/mutation…' },
      en: { format: 'Format', minify: 'Minify', indent: 'Indent', placeholder: 'Paste GraphQL query/mutation…' },
    },
    help: {
      zh: { title: '使用说明', features: ['GraphQL query/mutation 美化格式化', '支持参数换行对齐', '支持 fragment 和嵌套字段', '压缩为单行'], usage: ['粘贴 GraphQL 查询到输入框', '选择缩进大小（2 或 4 空格）', '点击「格式化」美化或「压缩」单行', '复制结果'] },
      en: { title: 'Usage Guide', features: ['Pretty-print GraphQL queries and mutations', 'Argument alignment with line breaks', 'Supports fragments and nested fields', 'Minify to single line'], usage: ['Paste GraphQL query into the input', 'Select indent size (2 or 4 spaces)', 'Click "Format" to beautify or "Minify"', 'Copy the result'] },
    },
  },
  // ── csvViewer ──
  csvViewer: {
    name: { zh: 'CSV 查看器', en: 'CSV Viewer' },
    desc: { zh: 'CSV 数据预览、排序、筛选，支持导出 JSON', en: 'Preview, sort, and filter CSV data with JSON export' },
    ui: {
      zh: { placeholder: '粘贴 CSV 数据…\nName,Age,City\nAlice,28,Beijing\nBob,32,Shanghai', delimiter: '分隔符', table: '数据表格', filter: '筛选…', rows: '行', exportJson: '导出 JSON' },
      en: { placeholder: 'Paste CSV data…\nName,Age,City\nAlice,28,Beijing\nBob,32,Shanghai', delimiter: 'Delimiter', table: 'Data Table', filter: 'Filter…', rows: 'rows', exportJson: 'Export JSON' },
    },
    help: {
      zh: { title: '使用说明', features: ['CSV 数据表格化预览', '点击列头排序（升序/降序）', '关键词实时筛选', '支持导出为 JSON 格式'], usage: ['粘贴 CSV 数据到输入框', '选择分隔符（逗号/分号/Tab）', '点击列头排序，输入关键词筛选', '点击「导出 JSON」复制 JSON 数据'] },
      en: { title: 'Usage Guide', features: ['CSV data table preview', 'Click column headers to sort (asc/desc)', 'Real-time keyword filtering', 'Export to JSON format'], usage: ['Paste CSV data into the input', 'Select delimiter (comma/semicolon/Tab)', 'Click headers to sort, type to filter', 'Click "Export JSON" to copy JSON data'] },
    },
  },
  // ── textToolkit ──
  textToolkit: {
    name: { zh: '文本编辑工具', en: 'Text Editor' },
    desc: { zh: '大小写转换、排序/去重、批量替换、转义/反转义、对齐/表格化', en: 'Case convert, sort/dedup, find/replace, escape/unescape, align/tabulate text' },
    ui: {
      zh: { caseConvert: '大小写', sortDedup: '排序/去重', findReplace: '查找/替换', escapeUnescape: '转义/反转义', alignTable: '对齐/表格化', inputPlaceholder: '输入或粘贴文本…', run: '执行', upper: '全大写', lower: '全小写', titleCase: '首字母大写', sentenceCase: '句首大写', camelCase: '小驼峰', pascalCase: '大驼峰', snakeCase: '蛇形', kebabCase: '横线', az: 'A→Z 升序', za: 'Z→A 降序', unique: '去重', shuffle: '打乱', reverse: '反转', find: '查找…', replace: '替换为…', regex: '正则', caseSensitive: '区分大小写', escape: '转义', unescape: '反转义', left: '左对齐', right: '右对齐', center: '居中', table: '表格对齐' },
      en: { caseConvert: 'Case', sortDedup: 'Sort/Dedup', findReplace: 'Find/Replace', escapeUnescape: 'Escape/Unescape', alignTable: 'Align/Table', inputPlaceholder: 'Enter or paste text…', run: 'Run', upper: 'UPPER', lower: 'lower', titleCase: 'Title Case', sentenceCase: 'Sentence case', camelCase: 'camelCase', pascalCase: 'PascalCase', snakeCase: 'snake_case', kebabCase: 'kebab-case', az: 'A→Z Asc', za: 'Z→A Desc', unique: 'Dedup', shuffle: 'Shuffle', reverse: 'Reverse', find: 'Find…', replace: 'Replace with…', regex: 'Regex', caseSensitive: 'Case Sensitive', escape: 'Escape', unescape: 'Unescape', left: 'Left', right: 'Right', center: 'Center', table: 'Table' },
    },
    help: {
      zh: { title: '使用说明', features: ['大小写转换：UPPER/lower/Title/camelCase/PascalCase/snake_case/kebab-case', '排序/去重：A→Z、Z→A、去重、打乱、反转', '查找/替换：支持正则表达式和大小写控制', '转义/反转义：JSON/HTML/JS/URL 四种格式', '对齐/表格化：左对齐、右对齐、居中、按列对齐'], usage: ['选择功能 Tab（大小写/排序/替换/转义/对齐）', '输入文本和对应参数', '大小写 Tab 直接展示 8 种格式结果', '其他 Tab 点击「执行」查看结果'] },
      en: { title: 'Usage Guide', features: ['Case: UPPER/lower/Title/camelCase/PascalCase/snake_case/kebab-case', 'Sort/Dedup: A→Z, Z→A, deduplicate, shuffle, reverse', 'Find/Replace: regex support and case control', 'Escape/Unescape: JSON/HTML/JS/URL formats', 'Align/Table: left, right, center, column-aligned'], usage: ['Select a tab (Case/Sort/Replace/Escape/Align)', 'Enter text and configure options', 'Case tab shows all 8 formats instantly', 'Other tabs: click "Run" to see the result'] },
    },
  },
  // ── x509 ──
  x509: {
    name: { zh: 'X.509 证书解析', en: 'X.509 Certificate Parser' },
    desc: { zh: '解析 PEM 格式 SSL 证书，查看有效期、颁发者、版本等信息', en: 'Parse PEM SSL certificates to view validity, issuer, version and more' },
    ui: {
      zh: { parse: '解析证书', placeholder: '粘贴 PEM 格式证书…\n-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----', type: '证书类型' },
      en: { parse: 'Parse', placeholder: 'Paste PEM certificate…\n-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----', type: 'Certificate Type' },
    },
    help: {
      zh: { title: '使用说明', features: ['解析 PEM 格式 X.509 证书', '提取有效期起止时间和剩余天数', '识别签名算法（RSA/ECDSA）', '提取主题 CN 和颁发者 CN'], usage: ['粘贴 PEM 格式证书到输入框', '点击「解析证书」', '查看证书详情（有效期、颁发者等）', '已过期证书会红色标注'] },
      en: { title: 'Usage Guide', features: ['Parse PEM format X.509 certificates', 'Extract validity period and days remaining', 'Detect signature algorithm (RSA/ECDSA)', 'Extract Subject CN and Issuer CN'], usage: ['Paste PEM certificate into the input', 'Click "Parse"', 'View certificate details (validity, issuer, etc.)', 'Expired certificates are highlighted in red'] },
    },
  },
  // ── hmac ──
  hmac: {
    name: { zh: 'HMAC 计算器', en: 'HMAC Calculator' },
    desc: { zh: 'HMAC-SHA1/256/384/512 带密钥哈希计算', en: 'Compute HMAC with SHA-1/256/384/512 and secret key' },
    ui: {
      zh: { message: '消息内容', messagePlaceholder: '输入要签名的消息…', secret: '密钥', secretPlaceholder: '输入密钥…', algorithm: '算法', outputFormat: '输出格式', compute: '计算', computeAll: '全部算法' },
      en: { message: 'Message', messagePlaceholder: 'Enter message to sign…', secret: 'Secret Key', secretPlaceholder: 'Enter secret key…', algorithm: 'Algorithm', outputFormat: 'Output Format', compute: 'Compute', computeAll: 'All Algorithms' },
    },
    help: {
      zh: { title: '使用说明', features: ['支持 HMAC-SHA1/256/384/512', '可选 HEX 或 Base64 输出', '一键计算全部算法对比', '适合 API 签名验证调试'], usage: ['输入消息内容和密钥', '选择算法和输出格式', '点击「计算」或「全部算法」', '点击「复制」复制结果'] },
      en: { title: 'Usage Guide', features: ['Supports HMAC-SHA1/256/384/512', 'HEX or Base64 output format', 'Compute all algorithms at once', 'Perfect for API signature debugging'], usage: ['Enter message and secret key', 'Select algorithm and output format', 'Click "Compute" or "All Algorithms"', 'Click "Copy" to copy result'] },
    },
  },
  // ── textStats ──
  textStats: {
    name: { zh: '文本统计', en: 'Text Statistics' },
    desc: { zh: '字符数、词数、行数、段落数、阅读时间、字符频率分析', en: 'Count characters, words, lines, paragraphs, reading time, and character frequency' },
    ui: {
      zh: { placeholder: '粘贴或输入文本…', statistics: '统计信息', chars: '字符数', charsNoSpace: '字符(去空格)', words: '词数', lines: '行数', paragraphs: '段落数', sentences: '句数', cjkChars: '中文字符', enWords: '英文词', numbers: '数字', bytes: '字节数', readTime: '阅读时间', avgLineLen: '平均行长', charFreq: '字符频率 Top 10' },
      en: { placeholder: 'Paste or type text…', statistics: 'Statistics', chars: 'Characters', charsNoSpace: 'Chars (no space)', words: 'Words', lines: 'Lines', paragraphs: 'Paragraphs', sentences: 'Sentences', cjkChars: 'CJK Chars', enWords: 'English Words', numbers: 'Numbers', bytes: 'Bytes', readTime: 'Read Time', avgLineLen: 'Avg Line Len', charFreq: 'Character Frequency Top 10' },
    },
    help: {
      zh: { title: '使用说明', features: ['统计字符数、词数、行数、段落数、句数', '区分中英文字符和数字', '估算阅读时间（中文 ~400 字/分钟，英文 ~200 词/分钟）', '字符频率 Top 10 排行'], usage: ['粘贴或输入文本', '实时显示各项统计指标', '查看字符频率分布', '适合文章字数统计和 SEO 分析'] },
      en: { title: 'Usage Guide', features: ['Count characters, words, lines, paragraphs, sentences', 'Distinguish CJK/English characters and numbers', 'Estimate reading time (~400 CJK/min, ~200 EN words/min)', 'Top 10 character frequency ranking'], usage: ['Paste or type text', 'All stats update in real-time', 'View character frequency distribution', 'Great for word count and SEO analysis'] },
    },
  },
  // ── toml ──
  toml: {
    name: { zh: 'TOML 格式化', en: 'TOML Formatter' },
    desc: { zh: 'TOML 格式化、验证、转 JSON', en: 'Format, validate, and convert TOML to JSON' },
    ui: {
      zh: { format: '格式化', toJson: '转 JSON', validate: '验证', valid: '✓ TOML 格式正确', placeholder: '粘贴 TOML…', errorPrefix: 'TOML 解析错误' },
      en: { format: 'Format', toJson: 'To JSON', validate: 'Validate', valid: '✓ Valid TOML', placeholder: 'Paste TOML…', errorPrefix: 'TOML parse error' },
    },
    help: {
      zh: { title: '使用说明', features: ['TOML 美化格式化', 'TOML 转 JSON 一键转换', '语法验证，快速定位格式错误', '适合 Cargo.toml / pyproject.toml 等配置文件'], usage: ['在左侧粘贴 TOML 数据', '点击「格式化」美化缩进', '点击「转 JSON」查看等效 JSON', '点击「验证」检查语法是否正确'] },
      en: { title: 'Usage Guide', features: ['Pretty-print TOML files', 'One-click TOML to JSON conversion', 'Syntax validation with error location', 'Works with Cargo.toml / pyproject.toml configs'], usage: ['Paste TOML data on the left', 'Click "Format" to pretty-print', 'Click "To JSON" to see equivalent JSON', 'Click "Validate" to check syntax'] },
    },
  },
  // ── sql ──
  sql: {
    name: { zh: 'SQL 格式化', en: 'SQL Formatter' },
    desc: { zh: 'SQL 语句美化、压缩，支持关键字高亮', en: 'Beautify and minify SQL statements with keyword highlighting' },
    ui: {
      zh: { format: '格式化', minify: '压缩', indent: '缩进', placeholder: '粘贴 SQL 语句…' },
      en: { format: 'Format', minify: 'Minify', indent: 'Indent', placeholder: 'Paste SQL statement…' },
    },
    help: {
      zh: { title: '使用说明', features: ['SQL 语句美化，关键字自动换行和大写', 'SQL 压缩为单行', '支持 SELECT/INSERT/UPDATE/DELETE 等语句', '支持 2/4 空格缩进'], usage: ['粘贴 SQL 语句到输入框', '选择缩进大小（2 或 4 空格）', '点击「格式化」美化或「压缩」单行', '复制结果到剪贴板'] },
      en: { title: 'Usage Guide', features: ['SQL beautification with keyword newlines and uppercase', 'SQL minification to single line', 'Supports SELECT/INSERT/UPDATE/DELETE statements', 'Configurable 2/4 space indentation'], usage: ['Paste SQL statement into the input', 'Select indent size (2 or 4 spaces)', 'Click "Format" to beautify or "Minify" to compress', 'Copy result to clipboard'] },
    },
  },
  // ── tokenCounter ──
  tokenCounter: {
    name: { zh: 'Token 计数器', en: 'Token Counter' },
    desc: { zh: '估算文本 Token 数量和 API 调用成本', en: 'Estimate token count and API cost for LLM calls' },
    ui: {
      zh: { placeholder: '粘贴文本以估算 Token 数量…', stats: '统计信息', tokens: 'Token 数', chars: '字符数', words: '词数', lines: '行数', costEstimate: '成本估算', outputRatio: '输出/输入比', model: '模型', inputCost: '输入成本', outputCost: '输出成本', totalCost: '总计', note: '注：Token 数为估算值，实际可能有 ±20% 偏差。价格为参考值，以各平台最新定价为准。' },
      en: { placeholder: 'Paste text to estimate token count…', stats: 'Statistics', tokens: 'Tokens', chars: 'Characters', words: 'Words', lines: 'Lines', costEstimate: 'Cost Estimate', outputRatio: 'Output/Input Ratio', model: 'Model', inputCost: 'Input', outputCost: 'Output', totalCost: 'Total', note: 'Note: Token counts are estimates (±20%). Prices are references — check each provider for current pricing.' },
    },
    help: {
      zh: { title: '使用说明', features: ['估算文本的 Token 数量（英文 ~4 字符/Token，中文 ~1 字符/Token）', '统计字符数、词数、行数', '多模型 API 成本对比（GPT-4o、Claude、DeepSeek 等）', '可调节输出/输入比估算总成本'], usage: ['粘贴文本到输入框', '查看 Token 数和统计信息', '调整输出/输入比滑块', '对比不同模型的 API 调用成本'] },
      en: { title: 'Usage Guide', features: ['Estimate token count (~4 chars/token EN, ~1 char/token CJK)', 'Count characters, words, and lines', 'Multi-model API cost comparison (GPT-4o, Claude, DeepSeek)', 'Adjustable output/input ratio for total cost'], usage: ['Paste text into the input area', 'View token count and statistics', 'Adjust the output/input ratio slider', 'Compare costs across different models'] },
    },
  },
  // ── tsType ──
  tsType: {
    name: { zh: 'TypeScript 类型生成', en: 'TypeScript Type Generator' },
    desc: { zh: '从 JSON 数据自动生成 TypeScript 接口定义', en: 'Auto-generate TypeScript interfaces from JSON data' },
    ui: {
      zh: { generate: '生成类型', rootName: '根类型名', placeholder: '粘贴 JSON 数据…' },
      en: { generate: 'Generate', rootName: 'Root type name', placeholder: 'Paste JSON data…' },
    },
    help: {
      zh: { title: '使用说明', features: ['从 JSON 数据自动生成 TypeScript interface', '支持嵌套对象自动展开为独立接口', '支持数组类型推断', '可自定义根类型名称'], usage: ['粘贴 JSON 数据到输入框', '设置根类型名称（默认 RootObject）', '点击「生成类型」查看结果', '复制生成的 TypeScript 代码'] },
      en: { title: 'Usage Guide', features: ['Auto-generate TypeScript interfaces from JSON', 'Nested objects become separate interfaces', 'Array type inference', 'Customizable root type name'], usage: ['Paste JSON data into the input', 'Set root type name (default: RootObject)', 'Click "Generate" to see the result', 'Copy the generated TypeScript code'] },
    },
  },
  // ── password ──
  password: {
    name: { zh: '密码生成器', en: 'Password Generator' },
    desc: { zh: '可定制长度、字符集的安全密码批量生成', en: 'Generate secure passwords with customizable length and character sets' },
    ui: {
      zh: { length: '密码长度', count: '生成数量', charSets: '字符集', uppercase: '大写 A-Z', lowercase: '小写 a-z', digits: '数字 0-9', symbols: '特殊符号', strength: '密码强度' },
      en: { length: 'Length', count: 'Count', charSets: 'Character Sets', uppercase: 'Uppercase A-Z', lowercase: 'Lowercase a-z', digits: 'Digits 0-9', symbols: 'Symbols !@#', strength: 'Strength' },
    },
    help: {
      zh: { title: '使用说明', features: ['使用 crypto.getRandomValues() 生成密码学安全随机密码', '可配置大写/小写/数字/特殊字符四种字符集', '支持批量生成最多 20 个密码', '实时密码强度指示（基于熵值计算）'], usage: ['调整密码长度滑块（4-128 位）', '勾选需要的字符集类型', '设置生成数量后点击「生成」', '点击单个密码或「复制全部」复制到剪贴板'] },
      en: { title: 'Usage Guide', features: ['Cryptographically secure passwords via crypto.getRandomValues()', 'Configurable: uppercase/lowercase/digits/symbols', 'Batch generate up to 20 passwords at once', 'Real-time strength indicator based on entropy calculation'], usage: ['Adjust the length slider (4-128 characters)', 'Select the character set types to include', 'Set the count and click "Generate"', 'Click a single password or "Copy" to copy all'] },
    },
  },
  // ── imgCompress ──
  imgCompress: {
    name: { zh: '图片压缩', en: 'Image Compressor' },
    desc: { zh: 'PNG/JPEG/WebP 图片有损压缩，支持质量调节和尺寸缩放', en: 'Compress PNG/JPEG/WebP images with quality control and resize' },
    ui: {
      zh: { format: '输出格式', quality: '压缩质量', maxWidth: '最大宽度', noLimit: '不限制', dropzone: '点击或拖拽图片到此处', processing: '压缩中…', compress: '开始压缩', originalSize: '原始大小', compressedSize: '压缩后', dimensions: '尺寸', reduction: '压缩率', pngTip: 'PNG 为无损格式，不会降低图片质量，压缩效果有限', sizeIncreased: '压缩后文件反而变大了，建议降低质量或切换为 JPEG/WebP 格式', adjustHint: '调整压缩参数后点击「开始压缩」' },
      en: { format: 'Output Format', quality: 'Quality', maxWidth: 'Max Width', noLimit: 'No Limit', dropzone: 'Click or drag image here', processing: 'Compressing…', compress: 'Compress', originalSize: 'Original', compressedSize: 'Compressed', dimensions: 'Dimensions', reduction: 'Reduction', pngTip: 'PNG is lossless and will not reduce quality — compression is limited', sizeIncreased: 'Compressed file is larger than original. Try lower quality or switch to JPEG/WebP.', adjustHint: 'Adjust settings then click "Compress"' },
    },
    help: {
      zh: { title: '使用说明', features: ['支持 JPEG/WebP/PNG 三种输出格式', '可调节压缩质量（10%-100%）', '可限制最大宽度，自动等比缩放', '纯浏览器本地处理，图片不上传'], usage: ['选择输出格式和压缩质量', '可选设置最大宽度限制', '点击或拖拽图片到上传区域', '预览压缩效果后下载'] },
      en: { title: 'Usage Guide', features: ['Supports JPEG/WebP/PNG output formats', 'Adjustable compression quality (10%-100%)', 'Optional max width with auto-resize', 'All processing happens locally in browser'], usage: ['Select output format and quality', 'Optionally set max width limit', 'Click or drag an image to upload', 'Preview and download the result'] },
    },
  },
  // ── imgConvert ──
  imgConvert: {
    name: { zh: '图片格式转换', en: 'Image Format Converter' },
    desc: { zh: 'PNG/JPEG/WebP 图片格式互转，支持质量调节', en: 'Convert between PNG/JPEG/WebP formats with quality control' },
    ui: {
      zh: { targetFormat: '目标格式', quality: '输出质量', dropzone: '点击或拖拽图片到此处', processing: '转换中…', convert: '开始转换', from: '原始格式', to: '目标格式', originalSize: '原始大小', convertedSize: '转换后', dimensions: '尺寸', adjustHint: '选择目标格式后点击「开始转换」' },
      en: { targetFormat: 'Target Format', quality: 'Quality', dropzone: 'Click or drag image here', processing: 'Converting…', convert: 'Convert', from: 'From', to: 'To', originalSize: 'Original', convertedSize: 'Converted', dimensions: 'Dimensions', adjustHint: 'Select target format then click "Convert"' },
    },
    help: {
      zh: { title: '使用说明', features: ['支持 PNG/JPEG/WebP 格式互转', 'JPEG/WebP 可调节输出质量', '自动处理透明背景（JPEG 填充白色）', '纯浏览器本地处理，图片不上传'], usage: ['选择目标输出格式', '可选调节输出质量', '点击或拖拽图片到上传区域', '预览后下载转换结果'] },
      en: { title: 'Usage Guide', features: ['Convert between PNG/JPEG/WebP formats', 'Quality control for JPEG/WebP output', 'Auto-handle transparency (JPEG fills white)', 'All processing happens locally in browser'], usage: ['Select target output format', 'Optionally adjust output quality', 'Click or drag an image to upload', 'Preview and download the converted image'] },
    },
  },
  // ── baseConv ──
  baseConv: {
    name: { zh: '进制转换器', en: 'Base Converter' },
    desc: { zh: '二进制/八进制/十进制/十六进制互转，支持分组显示', en: 'Convert between binary, octal, decimal, and hex with grouped display' },
    ui: {
      zh: { placeholder: '输入数值…', grouped: '分组显示' },
      en: { placeholder: 'Enter a value…', grouped: 'Grouped' },
    },
    help: {
      zh: { title: '使用说明', features: ['二进制/八进制/十进制/十六进制实时互转', '支持 0x/0o/0b 前缀自动识别', '可选分组显示便于阅读长数值', '纯浏览器本地计算'], usage: ['选择输入进制类型', '输入数值后其他进制实时同步', '点击「分组显示」便于阅读二进制/十六进制', '点击「复制」将结果复制到剪贴板'] },
      en: { title: 'Usage Guide', features: ['Real-time conversion between BIN/OCT/DEC/HEX', 'Auto-detect 0x/0o/0b prefixes', 'Optional grouped display for readability', 'All calculations happen locally'], usage: ['Select the input base type', 'Enter a value — other bases update in real-time', 'Toggle "Grouped" for easier reading of binary/hex', 'Click "Copy" to copy any result to clipboard'] },
    },
  },
  // ── unitConv ──
  unitConv: {
    name: { zh: '单位换算器', en: 'Unit Converter' },
    desc: { zh: '长度/重量/温度/存储/速度/面积等单位换算', en: 'Convert between length, weight, temperature, storage, speed, and area units' },
    ui: {
      zh: { category: '类别', from: '从', to: '到', placeholder: '输入数值…', length: '长度', weight: '重量', temperature: '温度', storage: '存储', speed: '速度', area: '面积', mm: '毫米', cm: '厘米', m: '米', km: '千米', inch: '英寸', foot: '英尺', yard: '码', mile: '英里', mg: '毫克', g: '克', kg: '千克', ton: '吨', oz: '盎司', lb: '磅', celsius: '摄氏度', fahrenheit: '华氏度', kelvin: '开尔文', byte: '字节', kilobyte: '千字节', megabyte: '兆字节', gigabyte: '吉字节', terabyte: '太字节', mps: '米/秒', kmh: '千米/时', mph: '英里/时', knot: '节', sqm: '平方米', sqkm: '平方千米', ha: '公顷', sqft: '平方英尺', acre: '英亩' },
      en: { category: 'Category', from: 'From', to: 'To', placeholder: 'Enter a value…', length: 'Length', weight: 'Weight', temperature: 'Temperature', storage: 'Storage', speed: 'Speed', area: 'Area', mm: 'Millimeter', cm: 'Centimeter', m: 'Meter', km: 'Kilometer', inch: 'Inch', foot: 'Foot', yard: 'Yard', mile: 'Mile', mg: 'Milligram', g: 'Gram', kg: 'Kilogram', ton: 'Metric Ton', oz: 'Ounce', lb: 'Pound', celsius: 'Celsius', fahrenheit: 'Fahrenheit', kelvin: 'Kelvin', byte: 'Byte', kilobyte: 'Kilobyte', megabyte: 'Megabyte', gigabyte: 'Gigabyte', terabyte: 'Terabyte', mps: 'Meters/sec', kmh: 'Km/hour', mph: 'Miles/hour', knot: 'Knot', sqm: 'Sq Meter', sqkm: 'Sq Kilometer', ha: 'Hectare', sqft: 'Sq Foot', acre: 'Acre' },
    },
    help: {
      zh: { title: '使用说明', features: ['支持 6 大类单位：长度/重量/温度/存储/速度/面积', '选择类别后自动列出该类所有单位', '输入数值后实时换算', '支持交换源/目标单位'], usage: ['选择单位类别（如长度、重量等）', '选择源单位和目标单位', '输入数值后实时显示换算结果', '点击 ⇄ 按钮快速交换源和目标'] },
      en: { title: 'Usage Guide', features: ['6 categories: Length/Weight/Temperature/Storage/Speed/Area', 'Auto-lists units for selected category', 'Real-time conversion as you type', 'Swap source and target units'], usage: ['Select a unit category (e.g. Length, Weight)', 'Choose source and target units', 'Enter a value — result updates in real-time', 'Click ⇄ to swap source and target'] },
    },
  },
  // ── terminal ──
  terminal: {
    name: { zh: '终端美化器', en: 'Terminal Styler' },
    desc: { zh: '终端输出数据美化，支持 16 种主题样式、语法高亮和导出', en: 'Beautify terminal output with 16 themes, syntax highlighting, and export' },
    ui: {
      zh: { placeholder: '粘贴终端输出数据…', theme: '主题', fontSize: '字号', windowStyle: '窗口样式', lineNumbers: '行号', wordWrap: '自动换行', copyHtml: '复制 HTML', copyImage: '下载图片', ws_macos: 'macOS', ws_linux: 'Linux', ws_none: '无' },
      en: { placeholder: 'Paste terminal output…', theme: 'Theme', fontSize: 'Font Size', windowStyle: 'Window Style', lineNumbers: 'Line Numbers', wordWrap: 'Word Wrap', copyHtml: 'Copy HTML', copyImage: 'Download Image', ws_macos: 'macOS', ws_linux: 'Linux', ws_none: 'None' },
    },
    help: {
      zh: { title: '使用说明', features: ['16 种精选终端主题：Dracula / Nord / Solarized / Gruvbox / Monokai / Catppuccin / Tokyo Night / One Dark / Cyberpunk / Matrix / Ayu Dark / Palenight / Horizon / Kanagawa / Everforest / Rose Pine', '自动识别终端模式：Shell 提示符、命令、错误、警告、成功信息', '高亮文件路径、URL、数字、引号字符串', '支持 ANSI 转义序列清理', '三种窗口样式：macOS / Linux / 无窗口', '复制 HTML 或下载 PNG 图片，方便分享'], usage: ['在左侧输入框粘贴终端输出数据', '从主题网格中选择喜欢的终端主题', '调整字号、窗口样式、行号等设置', '右侧实时预览美化效果', '点击「复制 HTML」或「下载图片」导出结果'] },
      en: { title: 'Usage Guide', features: ['16 curated terminal themes: Dracula / Nord / Solarized / Gruvbox / Monokai / Catppuccin / Tokyo Night / One Dark / Cyberpunk / Matrix / Ayu Dark / Palenight / Horizon / Kanagawa / Everforest / Rose Pine', 'Auto-detect terminal patterns: shell prompts, commands, errors, warnings, success messages', 'Highlight file paths, URLs, numbers, and quoted strings', 'ANSI escape sequence stripping', 'Three window styles: macOS / Linux / Frameless', 'Copy HTML or download PNG image for sharing'], usage: ['Paste terminal output in the left panel', 'Select a theme from the theme grid', 'Adjust font size, window style, line numbers, etc.', 'Preview the beautified result in real-time on the right', 'Click "Copy HTML" or "Download Image" to export'] },
    },
  },
  // ── rss ──
  rss: {
    name: { zh: 'RSS 工具', en: 'RSS Toolkit' },
    desc: { zh: 'RSS/Atom 阅读器、生成器和验证器', en: 'RSS/Atom feed reader, generator, and validator' },
    ui: {
      zh: { tab_reader: '阅读器', tab_generator: '生成器', tab_validator: '验证器', inputFeed: '输入 Feed', pasteRss: '粘贴 RSS/Atom XML…', items: '条目', copyMarkdown: '复制 Markdown', feedMeta: 'Feed 信息', feedTitle: '标题', feedLink: '链接', feedDesc: '描述', feedLang: '语言', feedAuthor: '作者', feedItems: '条目列表', addItem: '添加条目', itemTitle: '标题', itemLink: '链接', itemDesc: '描述', itemDate: '发布日期', itemAuthor: '作者', generateXml: '生成 XML', validationResult: '验证结果', allPassed: '全部通过' },
      en: { tab_reader: 'Reader', tab_generator: 'Generator', tab_validator: 'Validator', inputFeed: 'Feed Input', pasteRss: 'Paste RSS/Atom XML…', items: 'items', copyMarkdown: 'Copy Markdown', feedMeta: 'Feed Metadata', feedTitle: 'Title', feedLink: 'Link', feedDesc: 'Description', feedLang: 'Language', feedAuthor: 'Author', feedItems: 'Items', addItem: 'Add Item', itemTitle: 'Title', itemLink: 'Link', itemDesc: 'Description', itemDate: 'Pub Date', itemAuthor: 'Author', generateXml: 'Generate XML', validationResult: 'Validation Result', allPassed: 'All checks passed' },
    },
    help: {
      zh: { title: '使用说明', features: ['阅读器：粘贴 RSS 2.0 或 Atom XML，自动解析并展示 Feed 内容', '生成器：通过表单填写 Feed 信息和条目，一键生成 RSS 2.0 或 Atom XML', '验证器：检查 Feed 结构完整性，报告错误、警告和建议', '支持导出 Markdown 格式和下载 XML 文件', '纯前端运行，无需后端服务'], usage: ['阅读器：粘贴 Feed XML 到输入框，自动解析展示', '生成器：填写 Feed 标题、链接、描述等信息，添加条目后点击「生成 XML」', '验证器：粘贴 Feed XML，自动检查结构并显示验证结果', '点击「复制 Markdown」将 Feed 内容导出为 Markdown 格式'] },
      en: { title: 'Usage Guide', features: ['Reader: paste RSS 2.0 or Atom XML to auto-parse and display feed content', 'Generator: fill in feed metadata and items via form, generate RSS 2.0 or Atom XML with one click', 'Validator: check feed structure integrity, report errors, warnings, and suggestions', 'Export as Markdown or download XML file', 'Runs entirely client-side'], usage: ['Reader: paste feed XML into the input area, auto-parsed and displayed', 'Generator: fill in feed title, link, description, add items, then click "Generate XML"', 'Validator: paste feed XML, auto-checks structure and shows validation results', 'Click "Copy Markdown" to export feed content as Markdown'] },
    },
  },
  // ── chart ──
  chart: {
    name: { zh: '图表生成器', en: 'Chart Generator' },
    desc: { zh: '支持 12 种图表类型和 8 种主题，数据表格输入，导出 PNG', en: '12 chart types, 8 themes, table data input, PNG export' },
    ui: {
      zh: { chartType: '图表类型', theme: '主题', dataInput: '数据输入', title: '标题', legend: '图例位置', gridLines: '网格线', animation: '动画效果', showValues: '显示数值', showPercent: '显示百分比', none: '无', addSeries: '添加系列', addRow: '添加行', csvPlaceholder: '粘贴 CSV/TSV 数据…\n第一行为表头，第一列为标签', downloadPng: '下载 PNG', bar: '柱状图', hbar: '水平柱状图', line: '折线图', area: '面积图', pie: '饼图', doughnut: '环形图', radar: '雷达图', polar: '极坐标图', funnel: '漏斗图', wordcloud: '词云', graph: '关系图', gantt: '甘特图', themeMaterial: '材质', themeVibrant: '活力', themePastel: '柔和', themeAurora: '极光', themeNord: '北欧', themeSunset: '日落', themeOcean: '海洋', themeNeon: '霓虹' },
      en: { chartType: 'Chart Type', theme: 'Theme', dataInput: 'Data Input', title: 'Title', legend: 'Legend', gridLines: 'Grid Lines', animation: 'Animation', showValues: 'Show Values', showPercent: 'Show Percent', none: 'None', addSeries: 'Add Series', addRow: 'Add Row', csvPlaceholder: 'Paste CSV/TSV data…\nFirst row = headers, first column = labels', downloadPng: 'Download PNG', bar: 'Bar', hbar: 'H-Bar', line: 'Line', area: 'Area', pie: 'Pie', doughnut: 'Doughnut', radar: 'Radar', polar: 'Polar', funnel: 'Funnel', wordcloud: 'Word Cloud', graph: 'Graph', gantt: 'Gantt', themeMaterial: 'Material', themeVibrant: 'Vibrant', themePastel: 'Pastel', themeAurora: 'Aurora', themeNord: 'Nord', themeSunset: 'Sunset', themeOcean: 'Ocean', themeNeon: 'Neon' },
    },
    help: {
      zh: { title: '使用说明', features: ['12 种图表类型：柱状图 / 水平柱状图 / 折线图 / 面积图 / 饼图 / 环形图 / 雷达图 / 极坐标图 / 漏斗图 / 词云 / 关系图 / 甘特图', '8 种配色主题：Material / Vibrant / Pastel / Aurora / Nord / Sunset / Ocean / Neon', '表格编辑数据，支持 CSV/TSV 粘贴导入', '自定义标题、图例位置、网格线、动画效果', '一键导出 PNG 图片（3x 高清）'], usage: ['选择图表类型，自动加载示例数据', '在数据表格中编辑标签和数值，或切换 CSV 模式粘贴数据', '选择配色主题，调整图表选项', '点击「下载 PNG」导出图表'] },
      en: { title: 'Usage Guide', features: ['12 chart types: Bar / H-Bar / Line / Area / Pie / Doughnut / Radar / Polar / Funnel / Word Cloud / Graph / Gantt', '8 color themes: Material / Vibrant / Pastel / Aurora / Nord / Sunset / Ocean / Neon', 'Table-based data editing with CSV/TSV paste import', 'Customizable title, legend position, grid lines, animation', 'One-click PNG export (3x HD)'], usage: ['Select a chart type, sample data loads automatically', 'Edit labels and values in the data table, or switch to CSV mode to paste data', 'Choose a color theme and adjust chart options', 'Click "Download PNG" to export the chart'] },
    },
  },
  // ── slug ──
  slug: {
    name: { zh: '文本转 Slug', en: 'Text to Slug' },
    desc: { zh: '将文本转换为 URL 友好的 slug 格式，支持多种分隔符和大小写选项', en: 'Convert text to URL-friendly slug with separator and case options' },
    ui: {
      zh: { placeholder: '输入要转换的文本…', separator: '分隔符', case: '大小写', case_lower: '小写', case_upper: '大写', case_title: '首字母大写', maxLength: '最大长度', trim: '去除首尾分隔符', removeStop: '去除停用词', variants: '变体', lowercase: '全小写', uppercase: '全大写', titleCase: '首字母大写', noStopWords: '去除停用词' },
      en: { placeholder: 'Enter text to convert…', separator: 'Separator', case: 'Case', case_lower: 'Lower', case_upper: 'Upper', case_title: 'Title', maxLength: 'Max Length', trim: 'Trim', removeStop: 'Remove Stop Words', variants: 'Variants', lowercase: 'Lowercase', uppercase: 'Uppercase', titleCase: 'Title Case', noStopWords: 'No Stop Words' },
    },
    help: {
      zh: { title: '使用说明', features: ['支持连字符、下划线、点号三种分隔符', '小写、大写、首字母大写三种大小写模式', '可选去除英文停用词（a, the, and 等）', '自定义最大长度，智能截断', '同时展示多种变体供选择'], usage: ['输入要转换的文本', '选择分隔符和大小写模式', '可选设置最大长度、去除停用词', '点击变体快速复制不同格式'] },
      en: { title: 'Usage Guide', features: ['Supports hyphen, underscore, dot separators', 'Lower, upper, title case modes', 'Optional English stop word removal', 'Custom max length with smart truncation', 'Shows multiple variants at once'], usage: ['Enter text to convert', 'Choose separator and case mode', 'Optionally set max length, remove stop words', 'Click variants to copy different formats'] },
    },
  },
  // ── mime ──
  mime: {
    name: { zh: 'MIME Type 查询', en: 'MIME Type Lookup' },
    desc: { zh: '查询常见 MIME 类型及其文件扩展名', en: 'Look up common MIME types and file extensions' },
    ui: {
      zh: { placeholder: '搜索 MIME 类型、扩展名…', extension: '扩展名', category: '分类', all: '全部', types: '种类型' },
      en: { placeholder: 'Search MIME type, extension…', extension: 'Extension', category: 'Category', all: 'All', types: 'types' },
    },
    help: {
      zh: { title: '使用说明', features: ['收录 50+ 常见 MIME 类型', '按分类筛选：Text / Image / Audio / Video / Font / Data / Archive 等', '支持按类型名、扩展名、分类搜索', '点击行复制 MIME Type'], usage: ['输入关键词搜索', '点击分类标签筛选', '点击结果行复制 MIME Type'] },
      en: { title: 'Usage Guide', features: ['50+ common MIME types', 'Filter by category: Text / Image / Audio / Video / Font / Data / Archive', 'Search by type name, extension, or category', 'Click row to copy MIME Type'], usage: ['Type to search', 'Click category tags to filter', 'Click result row to copy MIME Type'] },
    },
  },
  // ── httpStatus ──
  httpStatus: {
    name: { zh: 'HTTP 状态码', en: 'HTTP Status Codes' },
    desc: { zh: 'HTTP 状态码速查，含中英文说明和 RFC 引用', en: 'HTTP status code reference with bilingual descriptions and RFC links' },
    ui: {
      zh: { placeholder: '搜索状态码、描述…', all: '全部' },
      en: { placeholder: 'Search status code, description…', all: 'All' },
    },
    help: {
      zh: { title: '使用说明', features: ['涵盖 1xx-5xx 常用状态码', '中英文描述切换', '按类别筛选：1xx / 2xx / 3xx / 4xx / 5xx', '显示 RFC 规范引用', '点击卡片复制状态码'], usage: ['输入状态码或描述搜索', '点击分类标签筛选', '点击卡片复制状态码到剪贴板'] },
      en: { title: 'Usage Guide', features: ['Covers 1xx-5xx common status codes', 'Bilingual descriptions (zh/en)', 'Filter by category: 1xx / 2xx / 3xx / 4xx / 5xx', 'Shows RFC spec references', 'Click card to copy status code'], usage: ['Search by code or description', 'Click category tags to filter', 'Click card to copy status code'] },
    },
  },
  // ── ua ──
  ua: {
    name: { zh: 'UA 解析器', en: 'User Agent Parser' },
    desc: { zh: '解析 User-Agent 字符串，识别浏览器、操作系统和设备类型', en: 'Parse User-Agent strings to identify browser, OS, and device type' },
    ui: {
      zh: { placeholder: '粘贴 User-Agent 字符串…', browser: '浏览器', os: '操作系统', device: '设备类型', engine: '渲染引擎', isMobile: '移动设备', isBot: '爬虫/Bot' },
      en: { placeholder: 'Paste User-Agent string…', browser: 'Browser', os: 'OS', device: 'Device', engine: 'Engine', isMobile: 'Mobile', isBot: 'Bot' },
    },
    help: {
      zh: { title: '使用说明', features: ['识别主流浏览器：Chrome / Firefox / Safari / Edge / Opera 等', '识别操作系统：Windows / macOS / iOS / Android / Linux', '识别设备类型：Desktop / Mobile / Tablet / Bot', '识别渲染引擎：WebKit / Gecko / Blink / Trident', '内置常用 UA 示例'], usage: ['粘贴 User-Agent 字符串', '自动解析并展示浏览器、系统、设备等信息'] },
      en: { title: 'Usage Guide', features: ['Detects Chrome / Firefox / Safari / Edge / Opera and more', 'Detects Windows / macOS / iOS / Android / Linux', 'Detects device type: Desktop / Mobile / Tablet / Bot', 'Detects engine: WebKit / Gecko / Blink / Trident', 'Built-in common UA examples'], usage: ['Paste a User-Agent string', 'Auto-parses and displays browser, OS, device info'] },
    },
  },
  // ── watermark ──
  watermark: {
    name: { zh: '图片水印', en: 'Image Watermark' },
    desc: { zh: '为图片添加文字水印，支持位置、透明度、旋转和平铺', en: 'Add text watermarks to images with position, opacity, rotation, and tiling' },
    ui: {
      zh: { text: '水印文字', textPlaceholder: '输入水印文字…', fontSize: '字号', opacity: '透明度', rotation: '旋转角度', color: '颜色', position: '位置', download: '下载图片', dropHint: '拖拽图片到此处', selectFile: '选择图片' },
      en: { text: 'Watermark Text', textPlaceholder: 'Enter watermark text…', fontSize: 'Font Size', opacity: 'Opacity', rotation: 'Rotation', color: 'Color', position: 'Position', download: 'Download', dropHint: 'Drag & drop image here', selectFile: 'Select Image' },
    },
    help: {
      zh: { title: '使用说明', features: ['拖拽或选择图片上传', '自定义水印文字、字号、颜色', '调整透明度和旋转角度', '支持 6 种位置：左上 / 右上 / 居中 / 左下 / 右下 / 平铺', '纯前端处理，图片不上传服务器'], usage: ['拖拽图片或点击选择文件', '输入水印文字，调整样式参数', '选择水印位置（含平铺模式）', '预览效果后点击「下载图片」'] },
      en: { title: 'Usage Guide', features: ['Drag & drop or select image', 'Customize text, font size, color', 'Adjust opacity and rotation', '6 positions: top-left / top-right / center / bottom-left / bottom-right / tile', 'Client-side processing, no upload'], usage: ['Drag image or click to select', 'Enter watermark text, adjust style', 'Choose position (including tile mode)', 'Preview and click "Download"'] },
    },
  },
  // ── privacy ──
  privacy: {
    name: { zh: '隐私协议生成器', en: 'Privacy Policy Generator' },
    desc: { zh: '一键生成 APP 隐私政策和服务条款，覆盖主流应用市场审核要求', en: 'Generate APP privacy policy and terms of service for major app store compliance' },
    ui: {
      zh: { tab_privacy: '隐私政策', tab_terms: '服务条款', tab_checklist: '合规检查', basicInfo: '基本信息', appName: '应用名称', appNamePlaceholder: '我的应用', companyName: '公司/开发者名称', companyNamePlaceholder: 'XX科技有限公司', contactEmail: '联系邮箱', contactAddress: '联系地址', website: '官方网站', effectiveDate: '生效日期', lastUpdatedDate: '最后更新日期', jurisdiction: '适用法律', dataCollection: '数据收集', thirdParty: '第三方服务', targetMarket: '目标市场', storePlatform: '应用商店', complianceScore: '合规评分', required: '必需', advancedSettings: '高级设置', dataRetention: '数据保留期限', retentionPlaceholder: '如：账号注销后 15 个工作日内删除', dpoContact: '个人信息保护负责人', dpoPlaceholder: '邮箱或电话', hasSubscription: '包含订阅/内购服务', hasAccountSystem: '包含用户账号系统', storageType: '数据存储方式', storageLocal: '纯本地存储', storageCloud: '云端/服务器存储', storageBoth: '混合存储（本地 + 云端）', d_clipboard: '剪贴板', d_adId: '广告标识符 (IDFA/GAID)', formatMarkdown: 'Markdown', formatHTML: 'HTML', downloadHTML: '下载 HTML', preview: '预览', fixAll: '一键修复全部', fixItem: '一键修复', suggestion: '修改建议', references: '参考资源', mustFix: '必须修复', recommended: '建议优化', manualAction: '需手动处理', notApplicable: '不适用', viewRef: '查看参考', refChina: '中国法规', refApple: 'Apple 审核', refGoogle: 'Google Play', refEU: '欧盟/美国', d_personal: '个人信息', d_location: '位置信息', d_deviceId: '设备标识', d_contacts: '通讯录', d_photos: '相册/存储', d_camera: '相机', d_microphone: '麦克风', d_health: '健康数据', d_financial: '财务信息', d_browsing: '浏览记录', d_cookies: 'Cookie', t_analytics: '数据分析', t_ads: '广告', t_payment: '支付', t_social: '社交登录', t_cloud: '云存储', t_push: '推送通知', m_china: '中国大陆', m_eu: '欧盟 (GDPR)', m_us: '美国', m_children: '面向儿童', s_appstore: 'Apple App Store', s_googleplay: 'Google Play', s_huawei: '华为应用市场', s_xiaomi: '小米应用商店', s_oppo: 'OPPO 软件商店', s_vivo: 'vivo 应用商店' },
      en: { tab_privacy: 'Privacy Policy', tab_terms: 'Terms of Service', tab_checklist: 'Compliance', basicInfo: 'Basic Info', appName: 'App Name', appNamePlaceholder: 'My App', companyName: 'Company/Developer', companyNamePlaceholder: 'Example Inc.', contactEmail: 'Contact Email', contactAddress: 'Contact Address', website: 'Website', effectiveDate: 'Effective Date', lastUpdatedDate: 'Last Updated Date', jurisdiction: 'Jurisdiction', dataCollection: 'Data Collection', thirdParty: 'Third-Party Services', targetMarket: 'Target Market', storePlatform: 'Store Platform', complianceScore: 'Compliance Score', required: 'Required', advancedSettings: 'Advanced', dataRetention: 'Data Retention Period', retentionPlaceholder: 'e.g., Within 15 business days after account deletion', dpoContact: 'Data Protection Officer', dpoPlaceholder: 'Email or phone', hasSubscription: 'Has subscription / IAP', hasAccountSystem: 'Has user account system', storageType: 'Data Storage', storageLocal: 'Local only', storageCloud: 'Cloud / Server', storageBoth: 'Hybrid (local + cloud)', d_clipboard: 'Clipboard', d_adId: 'Advertising ID (IDFA/GAID)', formatMarkdown: 'Markdown', formatHTML: 'HTML', downloadHTML: 'Download HTML', preview: 'Preview', fixAll: 'Fix All', fixItem: 'Fix', suggestion: 'Suggestion', references: 'References', mustFix: 'Must Fix', recommended: 'Recommended', manualAction: 'Manual Action', notApplicable: 'N/A', viewRef: 'View', refChina: 'China Laws', refApple: 'Apple Review', refGoogle: 'Google Play', refEU: 'EU / US', d_personal: 'Personal Info', d_location: 'Location', d_deviceId: 'Device ID', d_contacts: 'Contacts', d_photos: 'Photos/Storage', d_camera: 'Camera', d_microphone: 'Microphone', d_health: 'Health Data', d_financial: 'Financial', d_browsing: 'Browsing', d_cookies: 'Cookies', t_analytics: 'Analytics', t_ads: 'Advertising', t_payment: 'Payment', t_social: 'Social Login', t_cloud: 'Cloud Storage', t_push: 'Push Notifications', m_china: 'China', m_eu: 'EU (GDPR)', m_us: 'United States', m_children: 'Children', s_appstore: 'Apple App Store', s_googleplay: 'Google Play', s_huawei: 'Huawei AppGallery', s_xiaomi: 'Xiaomi GetApps', s_oppo: 'OPPO Store', s_vivo: 'vivo Store' },
    },
    help: {
      zh: { title: '使用说明', features: ['一键生成符合主流应用市场审核要求的隐私政策', '一键生成服务条款文档（含订阅/内购条款）', '内置合规检查清单，覆盖 Apple App Store / Google Play / 中国应用市场 / GDPR / COPPA', '支持中英文双语输出', '支持导出 Markdown 和 HTML 文件', '覆盖数据收集、第三方服务、目标市场等关键配置', '符合中国《个人信息保护法》和 PIPL 要求'], usage: ['填写应用基本信息（名称、公司、联系方式等）', '勾选应用收集的数据类型', '勾选使用的第三方服务', '选择目标市场和应用商店', '切换到隐私政策或服务条款标签页查看生成结果', '切换到合规检查标签页查看审核要点', '选择输出格式（Markdown/HTML），点击下载'] },
      en: { title: 'Usage Guide', features: ['One-click privacy policy generation for major app stores', 'One-click terms of service with subscription/IAP clauses', 'Built-in compliance checklist for Apple App Store / Google Play / Chinese stores / GDPR / COPPA', 'Bilingual output (Chinese/English)', 'Markdown & HTML export', 'Covers data collection, third-party services, target markets', 'PIPL (China) compliant'], usage: ['Fill in basic app info (name, company, contact)', 'Check data types your app collects', 'Check third-party services you use', 'Select target markets and app stores', 'Switch to Privacy Policy or Terms tab to preview', 'Switch to Compliance tab to review requirements', 'Choose format (Markdown/HTML), click download'] },
    },
  },
  // ── license ──
  license: {
    name: { zh: '开源许可证生成器', en: 'Open Source License Generator' },
    desc: { zh: '一键生成开源许可证文件，支持 MIT、Apache、GPL 等 10 种常见协议，含适用场景和真实案例', en: 'Generate open source license files with 10 common licenses, usage scenarios and real-world examples' },
    ui: {
      zh: { selectLicense: '选择许可证', authorName: '作者/组织名称', authorPlaceholder: '你的名字或组织名', year: '年份', licenseText: '许可证文本', licenseInfo: '许可证信息', downloadLicense: '下载 LICENSE', permissions: '允许', limitations: '限制', conditions: '条件', bestFor: '适用场景', examples: '使用该协议的项目' },
      en: { selectLicense: 'Select License', authorName: 'Author / Organization', authorPlaceholder: 'Your name or org', year: 'Year', licenseText: 'License Text', licenseInfo: 'License Info', downloadLicense: 'Download LICENSE', permissions: 'Permissions', limitations: 'Limitations', conditions: 'Conditions', bestFor: 'Best For', examples: 'Projects Using This License' },
    },
    help: {
      zh: { title: '使用说明', features: ['支持 MIT、Apache 2.0、GPL 3.0、LGPL 3.0、BSD 2-Clause、BSD 3-Clause、MPL 2.0、AGPL 3.0、ISC、Unlicense 共 10 种协议', '每种协议包含权限、限制、条件、适用场景和真实项目案例', '自动替换作者名称和年份', '支持复制和下载为 LICENSE 文件', '帮助开发者选择最适合自己项目的开源协议'], usage: ['选择一种开源许可证', '填写作者/组织名称和年份', '查看许可证信息了解协议特点', '切换到许可证文本标签页查看生成结果', '点击「下载 LICENSE」导出文件'] },
      en: { title: 'Usage Guide', features: ['Supports 10 licenses: MIT, Apache 2.0, GPL 3.0, LGPL 3.0, BSD 2-Clause, BSD 3-Clause, MPL 2.0, AGPL 3.0, ISC, Unlicense', 'Each license includes permissions, limitations, conditions, use cases, and real project examples', 'Auto-replaces author name and year', 'Copy and download as LICENSE file', 'Helps developers choose the right license for their project'], usage: ['Select an open source license', 'Fill in author/organization name and year', 'View license info to understand the terms', 'Switch to License Text tab to preview', 'Click "Download LICENSE" to export'] },
    },
  },
  // ── spinWheel ──
  spinWheel: {
    name: { zh: '随机转盘', en: 'Spin the Wheel' },
    desc: { zh: '炫酷随机转盘，支持自定义主题和选项，帮你做随机决策', en: 'Stylish spinning wheel with custom themes and options for random decisions' },
    ui: {
      zh: { theme: '主题', spinDuration: '旋转时长', segments: '选项', edit: '编辑', done: '完成', addSegment: '添加选项', remove: '删除', customColor: '自定义颜色', clickToSpin: '点击转盘开始', result: '结果', spinAgain: '再来一次' },
      en: { theme: 'Theme', spinDuration: 'Duration', segments: 'Segments', edit: 'Edit', done: 'Done', addSegment: 'Add Segment', remove: 'Remove', customColor: 'Custom Color', clickToSpin: 'Click to Spin', result: 'Result', spinAgain: 'Spin Again' },
    },
    help: {
      zh: { title: '使用说明', features: ['6 种炫酷主题：霓虹、日落、海洋、森林、糖果、极简', '支持 2-12 个自定义选项', '可自定义每个选项的颜色', '可调节旋转时长（2-8 秒）', 'Canvas 高性能渲染，流畅动画'], usage: ['选择一个主题风格', '点击编辑按钮自定义选项内容和颜色', '调节旋转时长', '点击转盘或中心按钮开始旋转', '等待结果展示'] },
      en: { title: 'Usage Guide', features: ['6 stunning themes: Neon, Sunset, Ocean, Forest, Candy, Minimal', 'Support 2-12 custom segments', 'Custom color per segment', 'Adjustable spin duration (2-8 seconds)', 'Canvas high-performance rendering'], usage: ['Choose a theme', 'Click Edit to customize segments and colors', 'Adjust spin duration', 'Click the wheel to spin', 'Wait for the result'] },
    },
  },
};

const STORAGE_KEY = '2fa_lang';

// Timezones where Chinese is the expected primary language
const ZH_TIMEZONES = new Set([
  'Asia/Shanghai',
  'Asia/Urumqi',
  'Asia/Taipei',
  'Asia/Hong_Kong',
  'Asia/Macau',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Asia/Kuching',
]);

function detectLangFromTimezone(): Lang {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return ZH_TIMEZONES.has(tz) ? 'zh' : 'en';
  } catch {
    return 'zh';
  }
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'zh',
  toggleLang: () => {},
  t: (key) => key,
});

export function useI18n() {
  return useContext(I18nContext);
}

/** Convenience hook: get resolved i18n data for a specific tool */
export function useToolI18n(toolId: string) {
  const { lang } = useI18n();
  const entry = toolI18n[toolId];
  if (!entry) return { name: toolId, desc: '', ui: {} as Record<string, string>, help: null };
  return {
    name: entry.name[lang],
    desc: entry.desc[lang],
    ui: entry.ui?.[lang] ?? {},
    help: entry.help?.[lang] ?? null,
  };
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'zh') return saved;
    return detectLangFromTimezone();
  });

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === 'zh' ? 'en' : 'zh';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }, [lang]);

  const t = useCallback(
    (key: string) => translations[lang][key] || key,
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}
