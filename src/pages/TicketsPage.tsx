import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../api/client';
import { Search, MessageSquare, Download } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/Badge';
import { TICKET_STATUS, TICKET_PRIORITY } from '../constants/admin';
import { downloadCsv } from '../utils/export';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  user_email: string;
  tenant_name: string;
}

export default function TicketsPage() {
  const { token } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const LIMIT = 20;

  const load = async (p = page, q = search, s = statusFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (q) params.set('search', q);
      if (s) params.set('status', s);
      const data = await api.get(`/admin/tickets?${params}`, token!);
      setTickets((data as any)?.data ?? []);
      setTotal((data as any)?.total ?? 0);
    } catch (err: any) {
      console.error('Failed to load tickets:', err);
    }
    setLoading(false);
  };

  useEffect(() => { load(1, '', ''); }, [token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(1, search, statusFilter);
  };

  const handleExport = () => {
    downloadCsv(tickets.map(t => ({
      subject: t.subject,
      tenant: t.tenant_name || '-',
      user: t.user_email || '-',
      status: t.status,
      priority: t.priority,
      created: new Date(t.created_at).toLocaleDateString(),
    })), 'support-tickets');
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1);
    load(1, search, status);
  };

  const columns = [
    {
      key: 'subject',
      header: 'Subject',
      render: (t: Ticket) => <span className="font-medium text-gray-900">{t.subject}</span>,
    },
    {
      key: 'tenant_name',
      header: 'Tenant',
      render: (t: Ticket) => <span className="text-gray-600">{t.tenant_name || '-'}</span>,
    },
    {
      key: 'user_email',
      header: 'User',
      render: (t: Ticket) => <span className="text-gray-600">{t.user_email || '-'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t: Ticket) => <StatusBadge status={t.status} map={TICKET_STATUS} />,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t: Ticket) => <StatusBadge status={t.priority} map={TICKET_PRIORITY} />,
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (t: Ticket) => <span className="text-gray-500">{new Date(t.created_at).toLocaleDateString()}</span>,
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{total} total</span>
          {tickets.length > 0 && (
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              className="input pl-10"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">Search</button>
        </form>
        <div className="flex gap-2">
          {['', 'open', 'in_progress', 'closed'].map((s) => (
            <button
              key={s}
              onClick={() => handleStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tickets}
        loading={loading}
        page={page}
        total={total}
        totalPages={Math.ceil(total / LIMIT)}
        onPageChange={(p) => { setPage(p); load(p); }}
        emptyMessage={
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <MessageSquare className="w-8 h-8" />
            No tickets found
          </div>
        }
        rowKey={(t) => t.id}
      />
    </div>
  );
}
