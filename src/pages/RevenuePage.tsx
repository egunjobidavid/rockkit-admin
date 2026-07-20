import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../api/client';
import { TrendingUp, DollarSign, Users, BarChart3 } from 'lucide-react';
import { StatCard } from '../components/StatCard';

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
  const totalMRR = plans.reduce((sum: number, p: any) => sum + (p.estimated_mrr ?? 0), 0);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Revenue</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Tenants" value={s.total_tenants ?? 0} icon={Users} color="text-blue-600" bgColor="bg-blue-50" />
        <StatCard label="Active Subs" value={s.active_subscriptions ?? 0} icon={DollarSign} color="text-green-600" bgColor="bg-green-50" />
        <StatCard label="Paid Tenants" value={s.paid_tenants ?? 0} icon={TrendingUp} color="text-purple-600" bgColor="bg-purple-50" />
        <StatCard label="Est. MRR" value={`₦${totalMRR.toLocaleString()}`} icon={BarChart3} color="text-amber-600" bgColor="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Plan Breakdown</h2>
          {plans.length === 0 ? (
            <p className="text-gray-500 text-sm">No data yet</p>
          ) : (
            <div className="space-y-3">
              {plans.map((p: any) => (
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
