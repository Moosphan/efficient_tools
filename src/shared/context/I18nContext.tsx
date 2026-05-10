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
  },
};

// Tool name/description translations
export const toolI18n: Record<string, { name: Record<Lang, string>; desc: Record<Lang, string> }> = {
  totp: { name: { zh: '2FA 验证码', en: '2FA Authenticator' }, desc: { zh: '基于 TOTP 协议生成二步验证码，支持密钥导入和隐私保护', en: 'Generate TOTP-based two-factor codes with key import and privacy protection' } },
  json: { name: { zh: 'JSON 格式化', en: 'JSON Formatter' }, desc: { zh: '格式化、压缩、验证 JSON 数据，支持语法高亮和错误定位', en: 'Format, minify, and validate JSON with syntax highlighting and error detection' } },
  regex: { name: { zh: '正则验证器', en: 'Regex Tester' }, desc: { zh: '实时测试正则表达式，高亮匹配结果，支持捕获组查看', en: 'Test regex patterns in real-time with match highlighting and capture groups' } },
  timestamp: { name: { zh: '时间戳转换', en: 'Timestamp Converter' }, desc: { zh: 'Unix 时间戳与日期互转，支持秒/毫秒', en: 'Convert between Unix timestamps and dates, supports seconds and milliseconds' } },
  base64: { name: { zh: 'Base64 编解码', en: 'Base64 Codec' }, desc: { zh: '文本的 Base64 编解码，支持 URL-safe 格式', en: 'Encode and decode Base64 text with URL-safe format support' } },
  url: { name: { zh: 'URL 编解码', en: 'URL Codec' }, desc: { zh: 'URL 编码/解码，自动解析查询参数', en: 'Encode and decode URLs with automatic query parameter parsing' } },
  diff: { name: { zh: '文本 Diff 对比', en: 'Text Diff' }, desc: { zh: '行级/字符级差异对比，支持并排和内联视图', en: 'Line and character-level diff with side-by-side and inline views' } },
  hash: { name: { zh: 'Hash 生成器', en: 'Hash Generator' }, desc: { zh: 'MD5/SHA-1/SHA-256/SHA-512 哈希计算和对比', en: 'Generate MD5/SHA-1/SHA-256/SHA-512 hashes with comparison' } },
  color: { name: { zh: '颜色格式转换', en: 'Color Converter' }, desc: { zh: 'HEX/RGB/HSL/oklch 互转，颜色选择器，对比度检查', en: 'Convert between HEX/RGB/HSL/oklch with color picker and contrast check' } },
  jwt: { name: { zh: 'JWT 解析器', en: 'JWT Decoder' }, desc: { zh: '解码 JWT Token，展示 Header/Payload/Signature', en: 'Decode JWT tokens showing Header, Payload, and Signature' } },
  cron: { name: { zh: 'Cron 表达式解析', en: 'Cron Parser' }, desc: { zh: 'Cron 表达式转自然语言，展示最近执行时间', en: 'Convert cron expressions to natural language with next run times' } },
  markdown: { name: { zh: 'Markdown 预览', en: 'Markdown Preview' }, desc: { zh: '实时 Markdown 渲染预览，支持代码高亮', en: 'Real-time Markdown rendering with code syntax highlighting' } },
  logs: { name: { zh: '日志分析器', en: 'Log Analyzer' }, desc: { zh: '粘贴日志后按级别、关键词筛选，快速定位问题', en: 'Paste logs and filter by level and keywords to quickly find issues' } },
  translate: { name: { zh: '快速翻译', en: 'Quick Translate' }, desc: { zh: '翻译代码注释、文档片段，支持多语言互译', en: 'Translate code comments and docs with multi-language support' } },
  uuid: { name: { zh: 'UUID 生成器', en: 'UUID Generator' }, desc: { zh: '生成 v4/v7 UUID，批量生成，自定义格式', en: 'Generate v4/v7 UUIDs with batch generation and custom formats' } },
  adb: { name: { zh: 'ADB 自动化', en: 'ADB Automation' }, desc: { zh: '常用 ADB 命令封装，设备管理、应用安装、日志抓取', en: 'Common ADB commands for device management, app install, and log capture' } },
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
