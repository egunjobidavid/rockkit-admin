import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../api/client';
import { Search, MessageSquare } from 'lucide-react';

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

  const load = async (p = page, q = search, s = statusFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
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

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1);
    load(1, search, status);
  };

  const priorityBadge = (p: string) => {
    if (p === 'high') return <span className="badge-red">High</span>;
    if (p === 'medium') return <span className="badge-yellow">Medium</span>;
    return <span className="badge-gray">{p || 'Low'}</span>;
  };

  const statusBadge = (s: string) => {
    if (s === 'open') return <span className="badge-green">Open</span>;
    if (s === 'closed') return <span className="badge-gray">Closed</span>;
    if (s === 'in_progress') return <span className="badge-yellow">In Progress</span>;
    return <span className="badge-gray">{s || '-'}</span>;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <span className="text-sm text-gray-500">{total} total</span>
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

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Subject</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tenant</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Priority</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No tickets found
                </td>
              </tr>
            ) : tickets.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{t.subject}</td>
                <td className="px-4 py-3 text-gray-600">{t.tenant_name || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{t.user_email || '-'}</td>
                <td className="px-4 py-3">{statusBadge(t.status)}</td>
                <td className="px-4 py-3">{priorityBadge(t.priority)}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex items-center justify-between mt-4">
          <button disabled={page <= 1} onClick={() => { setPage(page - 1); load(page - 1); }} className="btn-secondary disabled:opacity-50">Previous</button>
          <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
          <button disabled={page * 20 >= total} onClick={() => { setPage(page + 1); load(page + 1); }} className="btn-secondary disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
