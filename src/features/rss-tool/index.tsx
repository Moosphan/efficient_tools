import { useState, useMemo, useCallback } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

// ── Types ──

type Tab = 'reader' | 'generator' | 'validator';
type FeedFormat = 'rss20' | 'atom';

interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author?: string;
  category?: string;
}

interface FeedMeta {
  title: string;
  link: string;
  description: string;
  language?: string;
  pubDate?: string;
  author?: string;
}

interface ValidationResult {
  level: 'error' | 'warning' | 'info';
  message: string;
}

// ── XML Helpers ──

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function getText(parent: Element | null, tag: string): string {
  const el = parent?.getElementsByTagName(tag)[0];
  return el?.textContent?.trim() ?? '';
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + '…';
}

// ── Parse RSS 2.0 ──

function parseRss(doc: Document): { meta: FeedMeta; items: FeedItem[] } | null {
  const channel = doc.querySelector('channel');
  if (!channel) return null;
  const meta: FeedMeta = {
    title: getText(channel, 'title'),
    link: getText(channel, 'link'),
    description: getText(channel, 'description'),
    language: getText(channel, 'language') || undefined,
    pubDate: getText(channel, 'pubDate') || undefined,
    author: getText(channel, 'managingEditor') || getText(channel, 'author') || undefined,
  };
  const items: FeedItem[] = [];
  const itemEls = channel.querySelectorAll('item');
  itemEls.forEach((el) => {
    items.push({
      title: getText(el, 'title'),
      link: getText(el, 'link'),
      description: getText(el, 'description'),
      pubDate: getText(el, 'pubDate') || getText(el, 'dc:date') || undefined as unknown as string,
      author: getText(el, 'author') || getText(el, 'dc:creator') || undefined,
      category: getText(el, 'category') || undefined,
    });
  });
  return { meta, items };
}

// ── Parse Atom ──

function parseAtom(doc: Document): { meta: FeedMeta; items: FeedItem[] } | null {
  const feed = doc.querySelector('feed');
  if (!feed) return null;
  const linkEl = feed.querySelector('link[rel="alternate"]') || feed.querySelector('link');
  const linkHref = linkEl?.getAttribute('href') ?? '';
  const meta: FeedMeta = {
    title: getText(feed, 'title'),
    link: linkHref,
    description: getText(feed, 'subtitle') || getText(feed, 'summary'),
    language: feed.getAttribute('xml:lang') || feed.getAttribute('lang') || undefined,
    pubDate: getText(feed, 'updated') || undefined,
    author: getText(feed.querySelector('author'), 'name') || undefined,
  };
  const items: FeedItem[] = [];
  const entryEls = feed.querySelectorAll('entry');
  entryEls.forEach((el) => {
    const entryLink = el.querySelector('link[rel="alternate"]') || el.querySelector('link');
    items.push({
      title: getText(el, 'title'),
      link: entryLink?.getAttribute('href') ?? '',
      description: getText(el, 'summary') || getText(el, 'content'),
      pubDate: getText(el, 'updated') || getText(el, 'published') || undefined as unknown as string,
      author: getText(el.querySelector('author'), 'name') || undefined,
      category: el.querySelector('category')?.getAttribute('term') || undefined,
    });
  });
  return { meta, items };
}

// ── Detect & Parse ──

function parseFeed(xml: string): { meta: FeedMeta; items: FeedItem[]; format: string } | { error: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const parseErr = doc.querySelector('parsererror');
  if (parseErr) return { error: parseErr.textContent || 'XML parsing error' };

  const rss = parseRss(doc);
  if (rss) return { ...rss, format: 'RSS 2.0' };
  const atom = parseAtom(doc);
  if (atom) return { ...atom, format: 'Atom' };
  return { error: 'Unrecognized feed format. Expected RSS <channel> or Atom <feed>.' };
}

// ── Validation ──

function validateFeed(xml: string): { results: ValidationResult[]; format: string | null; itemCount: number } {
  const results: ValidationResult[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const parseErr = doc.querySelector('parsererror');
  if (parseErr) {
    results.push({ level: 'error', message: `XML parsing error: ${parseErr.textContent?.slice(0, 200)}` });
    return { results, format: null, itemCount: 0 };
  }

  const isRss = !!doc.querySelector('rss') || !!doc.querySelector('channel');
  const isAtom = !!doc.querySelector('feed');
  let format: string | null = null;
  let itemCount = 0;

  if (isRss) {
    format = 'RSS 2.0';
    const channel = doc.querySelector('channel');
    if (!channel) {
      results.push({ level: 'error', message: 'Missing <channel> element' });
    } else {
      if (!getText(channel, 'title')) results.push({ level: 'error', message: 'Channel missing required <title>' });
      if (!getText(channel, 'link')) results.push({ level: 'error', message: 'Channel missing required <link>' });
      if (!getText(channel, 'description')) results.push({ level: 'error', message: 'Channel missing required <description>' });
      if (!getText(channel, 'language')) results.push({ level: 'warning', message: 'Channel missing recommended <language>' });
      if (!getText(channel, 'pubDate')) results.push({ level: 'warning', message: 'Channel missing recommended <pubDate>' });

      const items = channel.querySelectorAll('item');
      itemCount = items.length;
      if (itemCount === 0) {
        results.push({ level: 'warning', message: 'Feed has no <item> elements' });
      }
      items.forEach((item, i) => {
        const label = `Item #${i + 1}`;
        if (!getText(item, 'title') && !getText(item, 'description')) {
          results.push({ level: 'error', message: `${label}: missing both <title> and <description>` });
        }
        if (!getText(item, 'link')) results.push({ level: 'warning', message: `${label}: missing <link>` });
        if (!getText(item, 'pubDate')) results.push({ level: 'info', message: `${label}: missing <pubDate> (optional but recommended)` });
      });

      // Check RSS version
      const version = doc.querySelector('rss')?.getAttribute('version');
      if (version && version !== '2.0') {
        results.push({ level: 'warning', message: `RSS version is "${version}", expected "2.0"` });
      }
    }
  } else if (isAtom) {
    format = 'Atom';
    const feed = doc.querySelector('feed')!;
    if (!getText(feed, 'title')) results.push({ level: 'error', message: 'Feed missing required <title>' });
    if (!feed.querySelector('link')) results.push({ level: 'error', message: 'Feed missing required <link>' });
    if (!getText(feed, 'id')) results.push({ level: 'warning', message: 'Feed missing recommended <id>' });
    if (!getText(feed, 'updated')) results.push({ level: 'warning', message: 'Feed missing recommended <updated>' });

    const entries = feed.querySelectorAll('entry');
    itemCount = entries.length;
    if (itemCount === 0) {
      results.push({ level: 'warning', message: 'Feed has no <entry> elements' });
    }
    entries.forEach((entry, i) => {
      const label = `Entry #${i + 1}`;
      if (!getText(entry, 'title')) results.push({ level: 'error', message: `${label}: missing required <title>` });
      if (!entry.querySelector('link') && !getText(entry, 'id')) {
        results.push({ level: 'warning', message: `${label}: missing both <link> and <id>` });
      }
      if (!getText(entry, 'updated') && !getText(entry, 'published')) {
        results.push({ level: 'info', message: `${label}: missing <updated> / <published>` });
      }
    });
  } else {
    results.push({ level: 'error', message: 'Unrecognized format. Expected RSS <rss>/<channel> or Atom <feed>.' });
  }

  if (results.length === 0) {
    results.push({ level: 'info', message: 'All checks passed!' });
  }
  return { results, format, itemCount };
}

// ── Generate RSS 2.0 ──

function generateRss20(meta: FeedMeta, items: FeedItem[]): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(meta.title)}</title>
    <link>${escapeXml(meta.link)}</link>
    <description>${escapeXml(meta.description)}</description>`;
  if (meta.language) xml += `\n    <language>${escapeXml(meta.language)}</language>`;
  if (meta.author) xml += `\n    <managingEditor>${escapeXml(meta.author)}</managingEditor>`;
  xml += `\n    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`;

  for (const item of items) {
    xml += `\n    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <description>${escapeXml(item.description)}</description>`;
    if (item.pubDate) xml += `\n      <pubDate>${escapeXml(item.pubDate)}</pubDate>`;
    if (item.author) xml += `\n      <author>${escapeXml(item.author)}</author>`;
    if (item.category) xml += `\n      <category>${escapeXml(item.category)}</category>`;
    xml += `\n    </item>`;
  }

  xml += `\n  </channel>\n</rss>`;
  return xml;
}

// ── Generate Atom ──

function generateAtom(meta: FeedMeta, items: FeedItem[]): string {
  const feedId = meta.link || `urn:uuid:${crypto.randomUUID()}`;
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(meta.title)}</title>
  <link href="${escapeXml(meta.link)}" rel="alternate" />
  <id>${escapeXml(feedId)}</id>
  <updated>${new Date().toISOString()}</updated>`;
  if (meta.description) xml += `\n  <subtitle>${escapeXml(meta.description)}</subtitle>`;
  if (meta.author) xml += `\n  <author><name>${escapeXml(meta.author)}</name></author>`;

  for (const item of items) {
    const itemId = item.link || `urn:uuid:${crypto.randomUUID()}`;
    xml += `\n  <entry>
    <title>${escapeXml(item.title)}</title>
    <link href="${escapeXml(item.link)}" rel="alternate" />
    <id>${escapeXml(itemId)}</id>
    <updated>${item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()}</updated>
    <summary>${escapeXml(item.description)}</summary>`;
    if (item.author) xml += `\n    <author><name>${escapeXml(item.author)}</name></author>`;
    if (item.category) xml += `\n    <category term="${escapeXml(item.category)}" />`;
    xml += `\n  </entry>`;
  }

  xml += `\n</feed>`;
  return xml;
}

// ── Samples ──

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Efficient Tools Blog</title>
    <link>https://example.com/blog</link>
    <description>Tips and updates from the Efficient Tools team</description>
    <language>en-us</language>
    <pubDate>Sun, 11 May 2026 12:00:00 GMT</pubDate>
    <item>
      <title>New: Terminal Styler with 16 Themes</title>
      <link>https://example.com/blog/terminal-styler</link>
      <description>Beautify your terminal output with 16 curated themes including Dracula, Nord, and more.</description>
      <pubDate>Sun, 11 May 2026 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>RSS Tool: Read, Generate, Validate</title>
      <link>https://example.com/blog/rss-tool</link>
      <description>A complete RSS/Atom toolkit right in your browser.</description>
      <pubDate>Sat, 10 May 2026 15:00:00 GMT</pubDate>
    </item>
    <item>
      <title>55 Tools and Counting</title>
      <link>https://example.com/blog/55-tools</link>
      <description>Efficient Tools now ships with 55 developer utilities, all running client-side.</description>
      <pubDate>Fri, 09 May 2026 09:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

const SAMPLE_ITEMS: FeedItem[] = [
  { title: 'Getting Started with Efficient Tools', link: 'https://example.com/post/1', description: 'A quick guide to using the developer toolbox.', pubDate: 'Sun, 11 May 2026 10:00:00 GMT', author: 'editor@example.com' },
  { title: 'Top 10 JSON Formatting Tips', link: 'https://example.com/post/2', description: 'Master JSON formatting with these expert tips.', pubDate: 'Sat, 10 May 2026 12:00:00 GMT' },
];

// ── Main Component ──

export default function RssTool() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('rss');
  const [tab, setTab] = useState<Tab>('reader');

  useCleanup(() => {});

  return (
    <ToolShell title={name} description={desc}>
      <div className="rss-tabs">
        {(['reader', 'generator', 'validator'] as Tab[]).map((t) => (
          <button key={t} className={`rss-tab${tab === t ? ' rss-tab-active' : ''}`} onClick={() => setTab(t)}>
            {ui[`tab_${t}`]}
          </button>
        ))}
      </div>
      {tab === 'reader' && <ReaderTab ui={ui} lang={lang} />}
      {tab === 'generator' && <GeneratorTab ui={ui} t={t} />}
      {tab === 'validator' && <ValidatorTab ui={ui} />}
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} />}
    </ToolShell>
  );
}

// ── Reader Tab ──

function ReaderTab({ ui, lang }: { ui: Record<string, string>; lang: string }) {
  const { t } = useI18n();
  const [input, setInput] = useState('');
  const [copiedItem, setCopiedItem] = useState<number | null>(null);

  const result = useMemo(() => {
    if (!input.trim()) return null;
    return parseFeed(input);
  }, [input]);

  const loadSample = () => setInput(SAMPLE_RSS);

  const copyItemAsMarkdown = useCallback((idx: number) => {
    if (!result || 'error' in result) return;
    const item = result.items[idx];
    const md = `### [${item.title}](${item.link})\n\n${item.description}\n\n*${item.pubDate || ''}*`;
    navigator.clipboard.writeText(md);
    setCopiedItem(idx);
    setTimeout(() => setCopiedItem(null), 1200);
  }, [result]);

  const copyAllAsMarkdown = useCallback(() => {
    if (!result || 'error' in result) return;
    const lines = [`# ${result.meta.title}\n`, `> ${result.meta.description}\n`, `---\n`];
    for (const item of result.items) {
      lines.push(`### [${item.title}](${item.link})\n`);
      lines.push(`${item.description}\n`);
      if (item.pubDate) lines.push(`*${item.pubDate}*\n`);
      lines.push('');
    }
    navigator.clipboard.writeText(lines.join('\n'));
  }, [result]);

  return (
    <>
      <div className="tool-layout rss-reader-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {ui.inputFeed}
            <div className="panel-actions">
              <button className="panel-btn" onClick={loadSample}>{t('common.example')}</button>
              <button className="panel-btn" onClick={() => setInput('')}>{t('common.clear')}</button>
            </div>
          </div>
          <textarea className="tool-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={ui.pasteRss} style={{ minHeight: 220, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {result && !('error' in result) ? `${result.format} — ${result.items.length} ${ui.items}` : t('common.output')}
            {result && !('error' in result) && (
              <div className="panel-actions">
                <button className="panel-btn" onClick={copyAllAsMarkdown}>{ui.copyMarkdown}</button>
              </div>
            )}
          </div>
          <div className="rss-reader-output">
            {!result && <div className="rss-empty">{t('common.waiting')}</div>}
            {result && 'error' in result && <div className="rss-error-msg">{result.error}</div>}
            {result && !('error' in result) && (
              <>
                <div className="rss-meta-card">
                  <div className="rss-meta-title">{result.meta.title}</div>
                  {result.meta.link && <a className="rss-meta-link" href={result.meta.link} target="_blank" rel="noreferrer">{result.meta.link}</a>}
                  <div className="rss-meta-desc">{result.meta.description}</div>
                  {result.meta.language && <span className="rss-meta-tag">{result.meta.language}</span>}
                  {result.meta.author && <span className="rss-meta-tag">{result.meta.author}</span>}
                </div>
                <div className="rss-item-list">
                  {result.items.map((item, idx) => (
                    <div key={idx} className="rss-item-card">
                      <div className="rss-item-header">
                        {item.link ? (
                          <a className="rss-item-title" href={item.link} target="_blank" rel="noreferrer">{item.title || '(untitled)'}</a>
                        ) : (
                          <span className="rss-item-title">{item.title || '(untitled)'}</span>
                        )}
                        <button className="rss-item-copy" onClick={() => copyItemAsMarkdown(idx)}>
                          {copiedItem === idx ? '✓' : 'MD'}
                        </button>
                      </div>
                      {item.pubDate && <div className="rss-item-date">{item.pubDate}</div>}
                      {item.author && <div className="rss-item-author">{item.author}</div>}
                      {item.category && <span className="rss-item-cat">{item.category}</span>}
                      {item.description && <div className="rss-item-desc">{truncate(stripHtml(item.description), 300)}</div>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Generator Tab ──

function GeneratorTab({ ui, t }: { ui: Record<string, string>; t: (k: string) => string }) {
  const [format, setFormat] = useState<FeedFormat>('rss20');
  const [meta, setMeta] = useState<FeedMeta>({ title: 'My Blog', link: 'https://example.com', description: 'A sample blog feed', language: 'en-us', author: '' });
  const [items, setItems] = useState<FeedItem[]>(SAMPLE_ITEMS);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const updateMeta = (key: keyof FeedMeta, val: string) => setMeta((m) => ({ ...m, [key]: val }));
  const updateItem = (idx: number, key: keyof FeedItem, val: string) => setItems((arr) => arr.map((it, i) => i === idx ? { ...it, [key]: val } : it));
  const addItem = () => setItems((arr) => [...arr, { title: '', link: '', description: '', pubDate: '' }]);
  const removeItem = (idx: number) => setItems((arr) => arr.filter((_, i) => i !== idx));

  const generate = () => {
    const xml = format === 'rss20' ? generateRss20(meta, items) : generateAtom(meta, items);
    setOutput(xml);
  };

  const copyOutput = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const downloadOutput = () => {
    if (!output) return;
    const ext = format === 'rss20' ? 'rss' : 'xml';
    const blob = new Blob([output], { type: 'application/xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `feed.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="rss-generator">
      <div className="rss-gen-form">
        <div className="rss-gen-section-title">{ui.feedMeta}</div>
        <div className="rss-gen-row">
          <label>{ui.feedTitle} *</label>
          <input className="input-field" value={meta.title} onChange={(e) => updateMeta('title', e.target.value)} />
        </div>
        <div className="rss-gen-row">
          <label>{ui.feedLink} *</label>
          <input className="input-field" value={meta.link} onChange={(e) => updateMeta('link', e.target.value)} placeholder="https://..." />
        </div>
        <div className="rss-gen-row">
          <label>{ui.feedDesc} *</label>
          <input className="input-field" value={meta.description} onChange={(e) => updateMeta('description', e.target.value)} />
        </div>
        <div className="rss-gen-row-group">
          <div className="rss-gen-row">
            <label>{ui.feedLang}</label>
            <input className="input-field" value={meta.language || ''} onChange={(e) => updateMeta('language', e.target.value)} placeholder="en-us" />
          </div>
          <div className="rss-gen-row">
            <label>{ui.feedAuthor}</label>
            <input className="input-field" value={meta.author || ''} onChange={(e) => updateMeta('author', e.target.value)} placeholder="editor@example.com" />
          </div>
        </div>

        <div className="rss-gen-section-title">
          {ui.feedItems} ({items.length})
          <button className="panel-btn panel-btn-sm" onClick={addItem}>+ {ui.addItem}</button>
        </div>
        {items.map((item, idx) => (
          <div key={idx} className="rss-gen-item">
            <div className="rss-gen-item-header">
              <span className="rss-gen-item-num">#{idx + 1}</span>
              <button className="rss-gen-item-remove" onClick={() => removeItem(idx)} title="Remove">×</button>
            </div>
            <div className="rss-gen-row-group">
              <div className="rss-gen-row">
                <label>{ui.itemTitle} *</label>
                <input className="input-field" value={item.title} onChange={(e) => updateItem(idx, 'title', e.target.value)} />
              </div>
              <div className="rss-gen-row">
                <label>{ui.itemLink} *</label>
                <input className="input-field" value={item.link} onChange={(e) => updateItem(idx, 'link', e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div className="rss-gen-row">
              <label>{ui.itemDesc}</label>
              <textarea className="input-field" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} rows={2} style={{ resize: 'vertical' }} />
            </div>
            <div className="rss-gen-row-group">
              <div className="rss-gen-row">
                <label>{ui.itemDate}</label>
                <input className="input-field" value={item.pubDate} onChange={(e) => updateItem(idx, 'pubDate', e.target.value)} placeholder="RFC 2822 / ISO 8601" />
              </div>
              <div className="rss-gen-row">
                <label>{ui.itemAuthor}</label>
                <input className="input-field" value={item.author || ''} onChange={(e) => updateItem(idx, 'author', e.target.value)} />
              </div>
            </div>
          </div>
        ))}

        <div className="rss-gen-actions">
          <div className="rss-gen-format-toggle">
            {(['rss20', 'atom'] as FeedFormat[]).map((f) => (
              <button key={f} className={`panel-btn panel-btn-sm${format === f ? ' accent' : ''}`} onClick={() => setFormat(f)}>
                {f === 'rss20' ? 'RSS 2.0' : 'Atom'}
              </button>
            ))}
          </div>
          <button className="btn" onClick={generate}>{ui.generateXml}</button>
        </div>
      </div>

      {output && (
        <div className="tool-panel rss-gen-output-panel">
          <div className="panel-header">
            {t('common.output')}
            <div className="panel-actions">
              <button className="panel-btn" onClick={copyOutput}>{copied ? t('common.copied') : t('common.copy')}</button>
              <button className="panel-btn" onClick={downloadOutput}>{t('common.download')}</button>
            </div>
          </div>
          <pre className="rss-gen-output">{output}</pre>
        </div>
      )}
    </div>
  );
}

// ── Validator Tab ──

function ValidatorTab({ ui }: { ui: Record<string, string> }) {
  const { t } = useI18n();
  const [input, setInput] = useState('');

  const result = useMemo(() => {
    if (!input.trim()) return null;
    return validateFeed(input);
  }, [input]);

  const loadSample = () => setInput(SAMPLE_RSS);

  return (
    <div className="tool-layout rss-validator-layout">
      <div className="tool-panel">
        <div className="panel-header">
          {ui.inputFeed}
          <div className="panel-actions">
            <button className="panel-btn" onClick={loadSample}>{t('common.example')}</button>
            <button className="panel-btn" onClick={() => setInput('')}>{t('common.clear')}</button>
          </div>
        </div>
        <textarea className="tool-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={ui.pasteRss} style={{ minHeight: 260, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
      </div>
      <div className="tool-panel">
        <div className="panel-header">
          {ui.validationResult}
          {result && (
            <div className="panel-actions">
              {result.format && <span className="rss-val-badge">{result.format}</span>}
              <span className="rss-val-badge">{result.itemCount} {ui.items}</span>
            </div>
          )}
        </div>
        <div className="rss-validation-result">
          {!result && <div className="rss-empty">{t('common.waiting')}</div>}
          {result && result.results.map((r, i) => (
            <div key={i} className={`rss-validation-item rss-validation-${r.level}`}>
              <span className="rss-validation-icon">{r.level === 'error' ? '✕' : r.level === 'warning' ? '!' : '✓'}</span>
              {r.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
