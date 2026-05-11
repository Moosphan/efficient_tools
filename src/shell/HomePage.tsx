import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { tools, categories } from '../registry';
import { useI18n, toolI18n } from '../shared/context/I18nContext';

const catMap: Record<string, string> = {
  'all': 'cat.all',
  '格式化': 'cat.格式化',
  '编解码': 'cat.编解码',
  '文本': 'cat.文本',
  '图片': 'cat.图片',
  '安全': 'cat.安全',
  '网络': 'cat.网络',
  '开发': 'cat.开发',
  '其他': 'cat.其他',
};

export function HomePage() {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const { lang, t } = useI18n();

  const filtered = useMemo(() => {
    return tools.filter((tool) => {
      const matchCat = activeCat === 'all' || tool.category === activeCat;
      const i18n = toolI18n[tool.id];
      const name = i18n?.name[lang] || tool.name;
      const desc = i18n?.desc[lang] || tool.description;
      const matchSearch =
        !search ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        desc.toLowerCase().includes(search.toLowerCase()) ||
        tool.keywords.some((k) => k.includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [search, activeCat, lang]);

  const availableCount = tools.filter((tool) => tool.status === '可用').length;

  return (
    <>
      <div className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          {availableCount}{t('hero.badge')}
        </div>
        <h1>
          {t('hero.title1')}<span className="accent">{t('hero.title2')}</span>
        </h1>
        <p>{t('hero.desc')}</p>
      </div>

      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-num">{tools.length}</div>
          <div className="stat-label">{t('stats.tools')}</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">0</div>
          <div className="stat-label">{t('stats.deps')}</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">100%</div>
          <div className="stat-label">{t('stats.client')}</div>
        </div>
      </div>

      <div className="search-bar">
        <span className="search-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          placeholder={t('search.placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="cat-filter">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`cat-btn${activeCat === cat.id ? ' active' : ''}`}
            onClick={() => setActiveCat(cat.id)}
          >
            {t(catMap[cat.id] || cat.label)}
          </button>
        ))}
      </div>

      <div className="flow-grid">
        {filtered.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>

      <div className="security-note">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        {t('security.note')}
      </div>
    </>
  );
}

function ToolCard({ tool }: { tool: typeof tools[number] }) {
  const isAvailable = tool.status === '可用';

  if (isAvailable) {
    return (
      <Link to={tool.path} className={`flow-card${tool.featured ? ' featured' : ''}`}>
        <ToolCardContent tool={tool} />
      </Link>
    );
  }

  return (
    <div className={`flow-card${tool.featured ? ' featured' : ''}`} style={{ opacity: 0.5, cursor: 'default' }}>
      <ToolCardContent tool={tool} />
    </div>
  );
}

const CATEGORY_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  '格式化': { bg: 'var(--amber-bg)', color: 'var(--amber)', border: 'var(--amber)' },
  '编解码': { bg: 'var(--green-bg)', color: 'var(--green)', border: 'var(--green)' },
  '文本': { bg: 'var(--accent-bg)', color: 'var(--accent)', border: 'var(--accent)' },
  '图片': { bg: 'var(--cyan-bg, rgba(6,182,212,0.1))', color: 'var(--cyan, #06b6d4)', border: 'var(--cyan, #06b6d4)' },
  '安全': { bg: 'var(--red-bg)', color: 'var(--red)', border: 'var(--red)' },
  '网络': { bg: 'var(--green-bg)', color: 'var(--green)', border: 'var(--green)' },
  '开发': { bg: 'var(--violet-bg, rgba(139,92,246,0.1))', color: 'var(--violet, #8b5cf6)', border: 'var(--violet, #8b5cf6)' },
  '其他': { bg: 'var(--surface-2)', color: 'var(--muted)', border: 'var(--border)' },
};

function ToolCardContent({ tool }: { tool: typeof tools[number] }) {
  const isAvailable = tool.status === '可用';
  const { lang, t } = useI18n();
  const i18n = toolI18n[tool.id];
  const name = i18n?.name[lang] || tool.name;
  const desc = i18n?.desc[lang] || tool.description;
  const catStyle = CATEGORY_STYLES[tool.category] ?? CATEGORY_STYLES['其他'];

  return (
    <>
      <div className="flow-card-head">
        <div className={`flow-card-icon ${tool.iconClass}`}>
          {tool.icon.startsWith('<svg') ? (
            <span dangerouslySetInnerHTML={{ __html: tool.icon }} />
          ) : (
            tool.icon
          )}
        </div>
        <div>
          <h3>{name}</h3>
        </div>
      </div>
      <p>{desc}</p>
      {tool.preview && <div className="flow-card-preview">{tool.preview}</div>}
      <div className="flow-card-footer">
        <span
          className="flow-card-tag"
          style={{
            background: catStyle.bg,
            color: catStyle.color,
            border: `1px solid ${catStyle.border}`,
          }}
        >
          {t(catMap[tool.category] || tool.category)}
        </span>
        {isAvailable && <span className="flow-card-action">{t('card.open')}</span>}
      </div>
    </>
  );
}
