import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth-store';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import TenantsPage from './pages/TenantsPage';
import UsersPage from './pages/UsersPage';
import TicketsPage from './pages/TicketsPage';
import PricingPage from './pages/PricingPage';
import AppsPage from './pages/AppsPage';
import SessionsPage from './pages/SessionsPage';
import ConfigPage from './pages/ConfigPage';
import HelpPage from './pages/HelpPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const RevenuePage = lazy(() => import('./pages/RevenuePage'));
const HealthPage = lazy(() => import('./pages/HealthPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Suspense fallback={<PageSpinner />}><DashboardPage /></Suspense>} />
          <Route path="/tenants" element={<TenantsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/apps" element={<AppsPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/config" element={<ConfigPage />} />
          <Route path="/analytics" element={<Suspense fallback={<PageSpinner />}><AnalyticsPage /></Suspense>} />
          <Route path="/revenue" element={<Suspense fallback={<PageSpinner />}><RevenuePage /></Suspense>} />
          <Route path="/health" element={<Suspense fallback={<PageSpinner />}><HealthPage /></Suspense>} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
