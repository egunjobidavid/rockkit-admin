import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../api/client';
import { Building2, Users, DollarSign, HeartPulse } from 'lucide-react';

interface Stats {
  totalTenants: number;
  activeSubscriptions: number;
  totalUsers: number;
  healthy: boolean;
}

export default function DashboardPage() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<Stats>({ totalTenants: 0, activeSubscriptions: 0, totalUsers: 0, healthy: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.get('/admin/health', token).catch(() => ({})),
      api.get('/admin/tenants?limit=1', token).catch(() => ({ total: 0 })),
    ]).then(([health, tenants]) => {
      setStats({
        totalTenants: (tenants as any)?.total ?? 0,
        activeSubscriptions: 0,
        totalUsers: (health as any)?.totalUsers ?? 0,
        healthy: (health as any)?.database === 'healthy',
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  const cards = [
    { label: 'Total Tenants', value: stats.totalTenants, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'System Health', value: stats.healthy ? 'Healthy' : 'Unhealthy', icon: HeartPulse, color: stats.healthy ? 'text-green-600' : 'text-red-600', bg: stats.healthy ? 'bg-green-50' : 'bg-red-50' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Platform Dashboard</h1>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div key={card.label} className="card p-6">
              <div className="flex items-center gap-4">
                <div className={`${card.bg} p-3 rounded-xl`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
