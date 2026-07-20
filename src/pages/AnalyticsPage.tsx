import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../api/client';
import { BarChart3, Users, Activity, Trash2 } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { DataTable } from '../components/DataTable';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface AnalyticsSummary {
  totalEvents: number;
  uniqueUsers: number;
  byPlatform: Array<{ platform: string; count: number }>;
  byEvent: Array<{ event_type: string; count: number }>;
  byDay: Array<{ day: string; platform: string; count: number }>;
  days: number;
}

interface AnalyticsEvent {
  id: string;
  platform: string;
  event_type: string;
  event_data: any;
  device_info: string;
  app_version: string;
  created_at: string;
  user_id: string;
}

export default function AnalyticsPage() {
  const { token, user } = useAuthStore();
  const isSuperadmin = user?.adminRole === 'superadmin';
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventsPage, setEventsPage] = useState(1);
  const [platformFilter, setPlatformFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);

  const LIMIT = 30;

  const loadSummary = async (days = 7) => {
    setLoading(true);
    try {
      const data = await api.get(`/admin/analytics/summary?days=${days}`, token!);
      setSummary(data as unknown as AnalyticsSummary);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
    }
    setLoading(false);
  };

  const loadEvents = async (p = eventsPage, platform = platformFilter) => {
    setEventsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (platform) params.set('platform', platform);
      const data = await api.get(`/admin/analytics/events?${params}`, token!);
      setEvents((data as any)?.data ?? []);
      setEventsTotal((data as any)?.total ?? 0);
    } catch (err: any) {
      console.error('Failed to load events:', err);
    }
    setEventsLoading(false);
  };

  useEffect(() => { loadSummary(); loadEvents(1, ''); }, [token]);

  const handleCleanup = async () => {
    if (!confirm('Delete analytics events older than 30 days?')) return;
    try {
      await api.post('/admin/analytics/cleanup', {}, token!);
      loadSummary();
      loadEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to cleanup');
    }
  };

  const chartData = summary?.byDay?.reduce((acc: any[], item: any) => {
    const existing = acc.find(a => a.day === item.day);
    if (existing) {
      existing[item.platform] = item.count;
    } else {
      acc.push({ day: item.day, [item.platform]: item.count });
    }
    return acc;
  }, []) ?? [];

  const eventColumns = [
    {
      key: 'created_at',
      header: 'Time',
      render: (e: AnalyticsEvent) => <span className="text-gray-500 text-xs whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</span>,
    },
    {
      key: 'platform',
      header: 'Platform',
      render: (e: AnalyticsEvent) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          e.platform === 'desktop' ? 'bg-blue-50 text-blue-700' :
          e.platform === 'mobile' ? 'bg-purple-50 text-purple-700' :
          'bg-green-50 text-green-700'
        }`}>{e.platform}</span>
      ),
    },
    {
      key: 'event_type',
      header: 'Event',
      render: (e: AnalyticsEvent) => <span className="font-mono text-xs">{e.event_type}</span>,
    },
    {
      key: 'event_data',
      header: 'Data',
      render: (e: AnalyticsEvent) => <span className="text-gray-500 text-xs max-w-[200px] truncate block">{e.event_data && Object.keys(e.event_data).length > 0 ? JSON.stringify(e.event_data) : '-'}</span>,
    },
    {
      key: 'app_version',
      header: 'Version',
      render: (e: AnalyticsEvent) => <span className="text-gray-500 text-xs">{e.app_version || '-'}</span>,
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usage Analytics</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => loadSummary(d)} className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">{d}d</button>
            ))}
          </div>
          {isSuperadmin && (
            <button onClick={handleCleanup} className="btn-secondary flex items-center gap-2 text-sm">
              <Trash2 className="w-4 h-4" /> Cleanup Old
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard label="Total Events" value={summary.totalEvents} icon={BarChart3} color="text-blue-600" bgColor="bg-blue-50" subtitle={`Last ${summary.days} days`} />
            <StatCard label="Unique Users" value={summary.uniqueUsers} icon={Users} color="text-green-600" bgColor="bg-green-50" />
            {summary.byPlatform.map(p => (
              <StatCard
                key={p.platform}
                label={p.platform}
                value={p.count}
                icon={Activity}
                color={p.platform === 'desktop' ? 'text-blue-600' : p.platform === 'mobile' ? 'text-purple-600' : 'text-green-600'}
                bgColor={p.platform === 'desktop' ? 'bg-blue-50' : p.platform === 'mobile' ? 'bg-purple-50' : 'bg-green-50'}
              />
            ))}
          </div>

          {chartData.length > 0 && (
            <div className="card p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Events by Day</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="desktop" fill="#2563eb" radius={[4, 4, 0, 0]} name="Desktop" />
                  <Bar dataKey="mobile" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Mobile" />
                  <Bar dataKey="web" fill="#10b981" radius={[4, 4, 0, 0]} name="Web" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {summary.byEvent.length > 0 && (
            <div className="card p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Top Events</h2>
              <div className="space-y-2">
                {summary.byEvent.map(e => (
                  <div key={e.event_type} className="flex items-center justify-between">
                    <span className="font-mono text-sm">{e.event_type}</span>
                    <span className="text-sm font-medium">{e.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Events</h2>
        <div className="flex gap-2">
          {['', 'desktop', 'mobile'].map(p => (
            <button
              key={p}
              onClick={() => { setPlatformFilter(p); setEventsPage(1); loadEvents(1, p); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                platformFilter === p ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p || 'All'}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={eventColumns}
        data={events}
        loading={eventsLoading}
        page={eventsPage}
        total={eventsTotal}
        totalPages={Math.ceil(eventsTotal / LIMIT)}
        onPageChange={(p) => { setEventsPage(p); loadEvents(p); }}
        emptyMessage="No events recorded yet"
        rowKey={(e) => e.id}
      />
    </div>
  );
}
