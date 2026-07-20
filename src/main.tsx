import { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './App';
import { useAuthStore } from './stores/auth-store';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

window.onerror = (msg, url, line, col, err) => {
  console.error('[Global Error]', { msg, url, line, col, err });
};

window.addEventListener('unhandledrejection', (e) => {
  console.error('[Unhandled Promise Rejection]', e.reason);
});

function Root() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
