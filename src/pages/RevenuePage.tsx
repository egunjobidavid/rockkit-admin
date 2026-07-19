import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../api/client';
import { TrendingUp, DollarSign, Users, BarChart3 } from 'lucide-react';

export default function RevenuePage() {
  const { token } = useAuthStore();
  const [summary, setSummary] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.get('/admin/revenue/summary', token).catch(() => ({})),
      api.get('/admin/revenue/by-plan', token).catch(() => []),
      api.get('/admin/revenue/history', token).catch(() => []),
    ]).then(([s, p, h]) => {
      setSummary(s);
      setPlans(Array.isArray(p) ? p : []);
      setHistory(Array.isArray(h) ? h : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

  const s = (summary as any)?.summary ?? {};
  const planBreakdown = (summary as any)?.plans ?? plans;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Revenue</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-xl"><Users className="w-6 h-6 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Total Tenants</p>
              <p className="text-2xl font-bold">{s.total_tenants ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-xl"><DollarSign className="w-6 h-6 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Active Subs</p>
              <p className="text-2xl font-bold">{s.active_subscriptions ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-50 p-3 rounded-xl"><TrendingUp className="w-6 h-6 text-purple-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Paid Tenants</p>
              <p className="text-2xl font-bold">{s.paid_tenants ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="bg-amber-50 p-3 rounded-xl"><BarChart3 className="w-6 h-6 text-amber-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Est. MRR</p>
              <p className="text-2xl font-bold">₦{plans.reduce((sum: number, p: any) => sum + (p.estimated_mrr ?? 0), 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Plan Breakdown</h2>
          {planBreakdown.length === 0 ? (
            <p className="text-gray-500 text-sm">No data yet</p>
          ) : (
            <div className="space-y-3">
              {planBreakdown.map((p: any) => (
                <div key={p.plan} className="flex items-center justify-between">
                  <span className="capitalize text-sm font-medium">{p.plan}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{p.count} tenants</span>
                    <span className="text-sm font-medium">₦{(p.estimated_mrr ?? 0).toLocaleString()}/mo</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Monthly History</h2>
          {history.length === 0 ? (
            <p className="text-gray-500 text-sm">No history yet</p>
          ) : (
            <div className="space-y-2">
              {history.map((h: any) => (
                <div key={h.month} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{h.month}</span>
                  <div className="flex gap-4">
                    <span>{h.new_subscriptions} new</span>
                    <span className="font-medium">{h.active_count} active</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
