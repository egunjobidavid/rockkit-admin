import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../api/client';
import { MessageSquare } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const data = await api.get(`/admin/tickets?page=${p}&limit=20`, token!);
      setTickets((data as any)?.data ?? []);
      setTotal((data as any)?.total ?? 0);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(1); }, [token]);

  const priorityBadge = (p: string) => {
    if (p === 'high') return <span className="badge-red">High</span>;
    if (p === 'medium') return <span className="badge-yellow">Medium</span>;
    return <span className="badge-gray">{p || 'Low'}</span>;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Subject</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tenant</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Priority</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No tickets yet
                </td>
              </tr>
            ) : tickets.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{t.subject}</td>
                <td className="px-4 py-3 text-gray-600">{t.tenant_name || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{t.user_email || '-'}</td>
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
