import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: '首页' },
  { path: '/about', label: '关于' },
];

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <>
      <header className="header">
        <Link to="/" className="header-brand">
          <span className="dot" />
          Efficient Tools
        </Link>
        <nav className="header-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`header-link${location.pathname === item.path ? ' active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="main">{children}</main>
    </>
  );
}
