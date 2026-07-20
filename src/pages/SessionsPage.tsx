import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../api/client';
import { Monitor, Smartphone, Globe, Trash2, Sparkles } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/Badge';

interface Session {
  id: string;
  platform: string;
  user_email: string;
  tenant_name: string;
  device_info: string;
  ip_address: string;
  last_active: string;
  created_at: string;
}

const PLATFORM_ICONS: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  web: Globe,
};

const PLATFORM_COLORS: Record<string, string> = {
  desktop: 'bg-blue-50 text-blue-700',
  mobile: 'bg-purple-50 text-purple-700',
  web: 'bg-green-50 text-green-700',
};

export default function SessionsPage() {
  const { token, user } = useAuthStore();
  const isSuperadmin = user?.adminRole === 'superadmin';
  const [sessions, setSessions] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [platformFilter, setPlatformFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const LIMIT = 50;

  const load = async (p = page, platform = platformFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (platform) params.set('platform', platform);
      const data = await api.get(`/admin/sessions?${params}`, token!);
      setSessions((data as any)?.data ?? []);
      setTotal((data as any)?.total ?? 0);
    } catch (err: any) {
      console.error('Failed to load sessions:', err);
    }
    setLoading(false);
  };

  useEffect(() => { load(1, ''); }, [token]);

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this session?')) return;
    try {
      await api.delete(`/admin/sessions/${id}`, token!);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke session');
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Remove all sessions inactive for 30+ minutes?')) return;
    try {
      await api.post('/admin/sessions/cleanup', {}, token!);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to cleanup sessions');
    }
  };

  const columns = [
    {
      key: 'platform',
      header: 'Platform',
      render: (s: Session) => {
        const Icon = PLATFORM_ICONS[s.platform] || Globe;
        return (
          <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${PLATFORM_COLORS[s.platform] || 'bg-gray-100 text-gray-600'}`}>
            <Icon className="w-3 h-3" />
            {s.platform}
          </span>
        );
      },
    },
    {
      key: 'user_email',
      header: 'User',
      render: (s: Session) => <span className="font-medium text-gray-900">{s.user_email || '-'}</span>,
    },
    {
      key: 'tenant_name',
      header: 'Tenant',
      render: (s: Session) => <span className="text-gray-600">{s.tenant_name || '-'}</span>,
    },
    {
      key: 'device_info',
      header: 'Device',
      render: (s: Session) => <span className="text-gray-500 text-xs">{s.device_info || '-'}</span>,
    },
    {
      key: 'ip_address',
      header: 'IP',
      render: (s: Session) => <span className="text-gray-500 text-xs font-mono">{s.ip_address || '-'}</span>,
    },
    {
      key: 'last_active',
      header: 'Last Active',
      render: (s: Session) => {
        const diff = Date.now() - new Date(s.last_active).getTime();
        const mins = Math.floor(diff / 60000);
        const label = mins < 1 ? 'Just now' : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
        return <span className="text-gray-500 text-sm">{label}</span>;
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (s: Session) => isSuperadmin ? (
        <button onClick={() => handleRevoke(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Revoke">
          <Trash2 className="w-4 h-4" />
        </button>
      ) : null,
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Active Sessions</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{total} active</span>
          {isSuperadmin && (
            <button onClick={handleCleanup} className="btn-secondary flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4" /> Cleanup Stale
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['', 'desktop', 'mobile', 'web'].map(p => (
          <button
            key={p}
            onClick={() => { setPlatformFilter(p); setPage(1); load(1, p); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              platformFilter === p ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p || 'All'}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={sessions}
        loading={loading}
        page={page}
        total={total}
        totalPages={Math.ceil(total / LIMIT)}
        onPageChange={(p) => { setPage(p); load(p); }}
        emptyMessage="No active sessions"
        rowKey={(s) => s.id}
      />
    </div>
  );
}
