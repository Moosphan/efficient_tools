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
    'stats.deps': '外部依赖',
    'stats.client': '客户端运行',
    'search.placeholder': '搜索工具…',
    'cat.all': '全部',
    'cat.format': '格式化',
    'cat.codec': '编解码',
    'cat.security': '安全',
    'cat.text': '文本',
    'cat.debug': '调试',
    'cat.system': '系统',
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
    'stats.deps': 'External Deps',
    'stats.client': 'Client-side',
    'search.placeholder': 'Search tools…',
    'cat.all': 'All',
    'cat.format': 'Format',
    'cat.codec': 'Codec',
    'cat.security': 'Security',
    'cat.text': 'Text',
    'cat.debug': 'Debug',
    'cat.system': 'System',
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
    desc: { zh: '实时测试正则表达式，高亮匹配结果，支持捕获组查看', en: 'Test regex patterns in real-time with match highlighting and capture groups' },
    ui: {
      zh: { pattern: '正则表达式', flags: '标志', testStr: '测试文本', placeholder: '输入正则表达式…', textPlaceholder: '输入要匹配的文本…', matches: '匹配结果', matchList: '匹配列表', noMatch: '无匹配', groups: '捕获组' },
      en: { pattern: 'Regular Expression', flags: 'Flags', testStr: 'Test String', placeholder: 'Enter regex pattern…', textPlaceholder: 'Enter text to match…', matches: 'Matches', matchList: 'Match List', noMatch: 'No matches', groups: 'Capture Groups' },
    },
    help: {
      zh: { title: '使用说明', features: ['实时高亮匹配结果', '支持 g/i/m/s 等标志位', '捕获组分组展示', '常用正则表达式预设'], usage: ['在上方输入正则表达式', '在下方输入要匹配的测试文本', '匹配结果实时高亮显示', '点击匹配项查看捕获组详情'] },
      en: { title: 'Usage Guide', features: ['Real-time match highlighting', 'Supports g/i/m/s flags', 'Capture group display', 'Common regex presets'], usage: ['Enter a regex pattern in the top field', 'Enter test text in the bottom field', 'Matches are highlighted in real-time', 'Click a match to view capture group details'] },
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
    name: { zh: 'Base64 编解码', en: 'Base64 Codec' },
    desc: { zh: '文本和文件的 Base64 编解码，支持 URL-safe 格式', en: 'Encode and decode Base64 text with URL-safe format support' },
    ui: {
      zh: { encode: '编码', decode: '解码', urlSafe: 'URL-safe', placeholder: '输入要编码的文本…', decodePlaceholder: '粘贴 Base64 字符串…' },
      en: { encode: 'Encode', decode: 'Decode', urlSafe: 'URL-safe', placeholder: 'Enter text to encode…', decodePlaceholder: 'Paste Base64 string…' },
    },
    help: {
      zh: { title: '使用说明', features: ['文本 Base64 编码与解码', '支持 URL-safe 格式（+/→-_）', '支持文件编码为 Base64'], usage: ['输入文本后点击「编码」生成 Base64', '粘贴 Base64 字符串后点击「解码」还原', '勾选 URL-safe 使用 URL 安全字符'] },
      en: { title: 'Usage Guide', features: ['Text Base64 encoding and decoding', 'URL-safe format support (+/ → -_ )', 'File encoding to Base64'], usage: ['Enter text and click "Encode" to generate Base64', 'Paste Base64 string and click "Decode" to还原', 'Check URL-safe to use URL-safe characters'] },
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
