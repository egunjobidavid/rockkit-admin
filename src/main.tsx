import { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './App';
import { useAuthStore } from './stores/auth-store';
import './index.css';

function Root() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, []);

  return <AppRouter />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
