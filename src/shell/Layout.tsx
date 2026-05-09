import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../shared/context/I18nContext';

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { lang, toggleLang, t } = useI18n();

  return (
    <>
      <header className="header">
        <Link to="/" className="header-brand">
          <span className="dot" />
          Efficient Tools
        </Link>
        <nav className="header-nav">
          <Link
            to="/"
            className={`header-link${location.pathname === '/' ? ' active' : ''}`}
          >
            {t('nav.home')}
          </Link>
          <Link
            to="/about"
            className={`header-link${location.pathname === '/about' ? ' active' : ''}`}
          >
            {t('nav.about')}
          </Link>
          <button className="header-lang-btn" onClick={toggleLang} title={lang === 'zh' ? '切换到 English' : 'Switch to 中文'}>
            {lang === 'zh' ? '中' : 'EN'}
          </button>
        </nav>
      </header>
      <main className="main">{children}</main>
    </>
  );
}
