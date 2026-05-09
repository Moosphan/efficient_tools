import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './shell/Layout';
import { HomePage } from './shell/HomePage';
import { AboutPage } from './shell/AboutPage';
import { ToastProvider } from './shared/context/ToastContext';
import { I18nProvider } from './shared/context/I18nContext';
import { tools } from './registry';

const LazyTool = ({ loader }: { loader: () => Promise<{ default: React.ComponentType }> }) => {
  const Component = lazy(loader);
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>}>
      <Component />
    </Suspense>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <I18nProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            {tools.map((tool) => (
              <Route
                key={tool.id}
                path={tool.path}
                element={<LazyTool loader={tool.component} />}
              />
            ))}
          </Routes>
        </Layout>
      </BrowserRouter>
      </I18nProvider>
    </ToastProvider>
  );
}
