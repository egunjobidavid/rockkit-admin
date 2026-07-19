import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../api/client';
import { Search, UserX, Eye } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  status: string;
  is_superadmin: boolean;
  created_at: string;
  memberships: Array<{ tenant_id: string; role: string }>;
}

export default function UsersPage() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const load = async (p = page, q = search) => {
    setLoading(true);
    try {
      const data = await api.get(`/admin/users?page=${p}&limit=20&search=${q}`, token!);
      setUsers((data as any)?.data ?? []);
      setTotal((data as any)?.total ?? 0);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(1, ''); }, [token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(1, search);
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this user?')) return;
    await api.patch(`/admin/users/${id}/deactivate`, {}, token!);
    load();
  };

  const handleView = async (id: string) => {
    try {
      const data = await api.get(`/admin/users/${id}`, token!);
      setSelectedUser(data);
    } catch { /* ignore */ }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="input pl-10"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary">Search</button>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">{u.full_name || '-'}</td>
                <td className="px-4 py-3">
                  {u.is_superadmin ? (
                    <span className="badge-yellow">Superadmin</span>
                  ) : u.memberships?.length > 0 ? (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {u.memberships[0].role}
                    </span>
                  ) : (
                    <span className="badge-gray">No tenant</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.status === 'active' ? (
                    <span className="badge-green">Active</span>
                  ) : (
                    <span className="badge-red">{u.status}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleView(u.id)} className="text-gray-400 hover:text-gray-600">
                      <Eye className="w-4 h-4" />
                    </button>
                    {u.status === 'active' && !u.is_superadmin && (
                      <button onClick={() => handleDeactivate(u.id)} className="text-red-400 hover:text-red-600">
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
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

      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
          <div className="card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{selectedUser.email}</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Name:</span> {selectedUser.full_name || '-'}</p>
              <p><span className="text-gray-500">Status:</span> {selectedUser.status}</p>
              <p><span className="text-gray-500">Superadmin:</span> {selectedUser.is_superadmin ? 'Yes' : 'No'}</p>
              {selectedUser.memberships?.length > 0 && (
                <div>
                  <p className="text-gray-500 mb-1">Memberships:</p>
                  {selectedUser.memberships.map((m: any, i: number) => (
                    <p key={i} className="ml-4">{m.tenant_name || m.tenant_id}: {m.role}</p>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setSelectedUser(null)} className="btn-secondary mt-6">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
