import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './shell/Layout';
import { HomePage } from './shell/HomePage';
import { AboutPage } from './shell/AboutPage';
import { ToastProvider } from './shared/context/ToastContext';

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
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/totp" element={<LazyTool loader={() => import('./features/totp')} />} />
            <Route path="/json" element={<LazyTool loader={() => import('./features/json-formatter')} />} />
            <Route path="/regex" element={<LazyTool loader={() => import('./features/regex-tester')} />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ToastProvider>
  );
}
