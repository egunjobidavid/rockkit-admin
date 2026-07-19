import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../api/client';
import { Database, Server, Clock, Users, Building2 } from 'lucide-react';

export default function HealthPage() {
  const { token } = useAuthStore();
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.get('/admin/health', token)
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!health) return <div className="p-8 text-red-500">Failed to load health data</div>;

  const items = [
    { label: 'Database', value: health.database, icon: Database, ok: health.database === 'healthy' },
    { label: 'Uptime', value: `${Math.floor((health.uptime ?? 0) / 60)}m ${Math.floor((health.uptime ?? 0) % 60)}s`, icon: Clock, ok: true },
    { label: 'Total Tenants', value: health.totalTenants ?? 0, icon: Building2, ok: true },
    { label: 'Total Users', value: health.totalUsers ?? 0, icon: Users, ok: true },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">System Health</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div key={item.label} className="card p-6">
            <div className="flex items-center gap-4">
              <div className={`${item.ok ? 'bg-green-50' : 'bg-red-50'} p-3 rounded-xl`}>
                <item.icon className={`w-6 h-6 ${item.ok ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card p-6 mt-6">
        <h2 className="text-lg font-semibold mb-2">Raw Health Data</h2>
        <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-4 overflow-x-auto">
          {JSON.stringify(health, null, 2)}
        </pre>
      </div>
    </div>
  );
}
