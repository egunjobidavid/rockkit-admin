import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../api/client';
import { Building2, Users, DollarSign, HeartPulse, Loader2 } from 'lucide-react';

interface Stats {
  totalTenants: number;
  activeSubscriptions: number;
  totalUsers: number;
  healthy: boolean;
  openTickets: number;
  memory: { heapUsedMB: number; heapTotalMB: number };
}

export default function DashboardPage() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<Stats>({ totalTenants: 0, activeSubscriptions: 0, totalUsers: 0, healthy: true, openTickets: 0, memory: { heapUsedMB: 0, heapTotalMB: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.get('/admin/health', token).catch(() => ({})),
      api.get('/admin/tenants?limit=1', token).catch(() => ({ total: 0 })),
    ]).then(([health, tenants]) => {
      setStats({
        totalTenants: (tenants as any)?.total ?? 0,
        activeSubscriptions: (health as any)?.activeSubscriptions ?? 0,
        totalUsers: (health as any)?.totalUsers ?? 0,
        healthy: (health as any)?.database === 'healthy',
        openTickets: (health as any)?.openTickets ?? 0,
        memory: (health as any)?.memory ?? { heapUsedMB: 0, heapTotalMB: 0 },
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  const cards = [
    { label: 'Total Tenants', value: stats.totalTenants, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Open Tickets', value: stats.openTickets, icon: HeartPulse, color: stats.openTickets > 0 ? 'text-red-600' : 'text-green-600', bg: stats.openTickets > 0 ? 'bg-red-50' : 'bg-green-50' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Platform Dashboard</h1>
      {loading ? (
        <div className="flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin h-5 w-5" /> Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-3">System Status</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Database</p>
                <p className={`font-medium ${stats.healthy ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.healthy ? 'Healthy' : 'Unhealthy'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Memory Used</p>
                <p className="font-medium">{stats.memory.heapUsedMB}MB / {stats.memory.heapTotalMB}MB</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
