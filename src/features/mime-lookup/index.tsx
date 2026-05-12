import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

const MIME_TYPES: { type: string; ext: string; category: string }[] = [
  { type: 'text/html', ext: '.html, .htm', category: 'Text' },
  { type: 'text/css', ext: '.css', category: 'Text' },
  { type: 'text/plain', ext: '.txt', category: 'Text' },
  { type: 'text/csv', ext: '.csv', category: 'Text' },
  { type: 'text/xml', ext: '.xml', category: 'Text' },
  { type: 'text/markdown', ext: '.md', category: 'Text' },
  { type: 'text/javascript', ext: '.js, .mjs', category: 'Text' },
  { type: 'text/typescript', ext: '.ts', category: 'Text' },
  { type: 'application/json', ext: '.json', category: 'Data' },
  { type: 'application/xml', ext: '.xml', category: 'Data' },
  { type: 'application/yaml', ext: '.yaml, .yml', category: 'Data' },
  { type: 'application/pdf', ext: '.pdf', category: 'Document' },
  { type: 'application/zip', ext: '.zip', category: 'Archive' },
  { type: 'application/gzip', ext: '.gz', category: 'Archive' },
  { type: 'application/x-tar', ext: '.tar', category: 'Archive' },
  { type: 'application/x-7z-compressed', ext: '.7z', category: 'Archive' },
  { type: 'application/javascript', ext: '.js', category: 'Script' },
  { type: 'application/typescript', ext: '.ts', category: 'Script' },
  { type: 'application/wasm', ext: '.wasm', category: 'Script' },
  { type: 'application/octet-stream', ext: '.bin', category: 'Binary' },
  { type: 'image/png', ext: '.png', category: 'Image' },
  { type: 'image/jpeg', ext: '.jpg, .jpeg', category: 'Image' },
  { type: 'image/gif', ext: '.gif', category: 'Image' },
  { type: 'image/svg+xml', ext: '.svg', category: 'Image' },
  { type: 'image/webp', ext: '.webp', category: 'Image' },
  { type: 'image/avif', ext: '.avif', category: 'Image' },
  { type: 'image/tiff', ext: '.tiff, .tif', category: 'Image' },
  { type: 'image/bmp', ext: '.bmp', category: 'Image' },
  { type: 'image/x-icon', ext: '.ico', category: 'Image' },
  { type: 'audio/mpeg', ext: '.mp3', category: 'Audio' },
  { type: 'audio/ogg', ext: '.ogg', category: 'Audio' },
  { type: 'audio/wav', ext: '.wav', category: 'Audio' },
  { type: 'audio/flac', ext: '.flac', category: 'Audio' },
  { type: 'audio/aac', ext: '.aac', category: 'Audio' },
  { type: 'video/mp4', ext: '.mp4', category: 'Video' },
  { type: 'video/webm', ext: '.webm', category: 'Video' },
  { type: 'video/ogg', ext: '.ogv', category: 'Video' },
  { type: 'video/quicktime', ext: '.mov', category: 'Video' },
  { type: 'video/x-msvideo', ext: '.avi', category: 'Video' },
  { type: 'font/woff', ext: '.woff', category: 'Font' },
  { type: 'font/woff2', ext: '.woff2', category: 'Font' },
  { type: 'font/ttf', ext: '.ttf', category: 'Font' },
  { type: 'font/otf', ext: '.otf', category: 'Font' },
  { type: 'application/vnd.ms-excel', ext: '.xls', category: 'Office' },
  { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: '.xlsx', category: 'Office' },
  { type: 'application/vnd.ms-powerpoint', ext: '.ppt', category: 'Office' },
  { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', ext: '.pptx', category: 'Office' },
  { type: 'application/msword', ext: '.doc', category: 'Office' },
  { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: '.docx', category: 'Office' },
];

export default function MimeLookup() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('mime');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [copied, setCopied] = useState('');

  const categories = useMemo(() => {
    const cats = new Set(MIME_TYPES.map((m) => m.category));
    return ['all', ...Array.from(cats).sort()];
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return MIME_TYPES.filter((m) => {
      if (category !== 'all' && m.category !== category) return false;
      if (!q) return true;
      return m.type.toLowerCase().includes(q) || m.ext.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
    });
  }, [query, category]);

  const copyType = (type: string) => {
    navigator.clipboard.writeText(type);
    setCopied(type);
    setTimeout(() => setCopied(''), 1200);
  };

  return (
    <ToolShell title={name} description={desc}>
      <div className="mime-layout">
        <div className="mime-toolbar">
          <input className="input-field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ui.placeholder} />
          <div className="mime-cats">
            {categories.map((c) => (
              <button key={c} className={`panel-btn panel-btn-sm${category === c ? ' accent' : ''}`} onClick={() => setCategory(c)}>{c === 'all' ? ui.all : c}</button>
            ))}
          </div>
        </div>
        <div className="mime-table-wrap">
          <table className="mime-table">
            <thead><tr><th>MIME Type</th><th>{ui.extension}</th><th>{ui.category}</th></tr></thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.type} className="mime-row" onClick={() => copyType(m.type)}>
                  <td className="mime-type">{m.type}{copied === m.type && <span className="mime-copied">✓</span>}</td>
                  <td className="mime-ext">{m.ext}</td>
                  <td><span className="mime-cat-badge">{m.category}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>{t('common.waiting')}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mime-count">{filtered.length} / {MIME_TYPES.length} {ui.types}</div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} />}
    </ToolShell>
  );
}
