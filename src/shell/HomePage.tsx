import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { tools, categories } from '../registry';

export function HomePage() {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      const matchCat = activeCat === 'all' || t.category === activeCat;
      const matchSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.keywords.some((k) => k.includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [search, activeCat]);

  const availableCount = tools.filter((t) => t.status === '可用').length;

  return (
    <>
      <div className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          {availableCount} 个工具可用
        </div>
        <h1>
          开发者的<span className="accent">效率工具箱</span>
        </h1>
        <p>一站式汇集日常开发中最常用的小工具，纯前端运行，数据不出浏览器。</p>
      </div>

      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-num">{tools.length}</div>
          <div className="stat-label">内置工具</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">0</div>
          <div className="stat-label">外部依赖</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">100%</div>
          <div className="stat-label">客户端运行</div>
        </div>
      </div>

      <div className="search-bar">
        <span className="search-icon">⌕</span>
        <input
          type="text"
          placeholder="搜索工具…"
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
            {cat.label}
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
        本地运行 · 数据不出浏览器
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

  return (
    <>
      <div className="flow-card-head">
        <div className={`flow-card-icon ${tool.iconClass}`}>{tool.icon}</div>
        <div>
          <h3>{tool.name}</h3>
        </div>
      </div>
      <p>{tool.description}</p>
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
          {tool.status}
        </span>
        {isAvailable && <span className="flow-card-action">打开 →</span>}
      </div>
    </>
  );
}
