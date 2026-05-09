import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { tools, categories } from '../registry';
import { useI18n, toolI18n } from '../shared/context/I18nContext';

const catMap: Record<string, string> = {
  'all': 'cat.all',
  '格式化/转换': 'cat.format',
  '编码/解码': 'cat.codec',
  '安全/加密': 'cat.security',
  '文本处理': 'cat.text',
  '开发调试': 'cat.debug',
  '系统工具': 'cat.system',
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
        <span className="search-icon">⌕</span>
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

function ToolCardContent({ tool }: { tool: typeof tools[number] }) {
  const isAvailable = tool.status === '可用';
  const { lang, t } = useI18n();
  const i18n = toolI18n[tool.id];
  const name = i18n?.name[lang] || tool.name;
  const desc = i18n?.desc[lang] || tool.description;

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
            background: isAvailable ? 'var(--green-bg)' : 'var(--surface-2)',
            color: isAvailable ? 'var(--green)' : 'var(--muted)',
            border: `1px solid ${isAvailable ? 'var(--green)' : 'var(--border)'}`,
          }}
        >
          {isAvailable ? t('status.available') : t('status.developing')}
        </span>
        {isAvailable && <span className="flow-card-action">{t('card.open')}</span>}
      </div>
    </>
  );
}
