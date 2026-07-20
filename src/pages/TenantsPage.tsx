import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../api/client';
import { Search, Ban, CheckCircle, Eye, Edit, LogIn } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  created_at: string;
  user_count: number;
}

export default function TenantsPage() {
  const { token } = useAuthStore();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editPlan, setEditPlan] = useState('');
  const [impersonateData, setImpersonateData] = useState<any>(null);

  const load = async (p = page, q = search) => {
    setLoading(true);
    try {
      const data = await api.get(`/admin/tenants?page=${p}&limit=20&search=${q}`, token!);
      setTenants((data as any)?.data ?? []);
      setTotal((data as any)?.total ?? 0);
    } catch (err: any) {
      console.error('Failed to load tenants:', err);
    }
    setLoading(false);
  };

  useEffect(() => { load(1, ''); }, [token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(1, search);
  };

  const handleSuspend = async (id: string) => {
    if (!confirm('Suspend this tenant?')) return;
    try {
      await api.post(`/admin/tenants/${id}/suspend`, {}, token!);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to suspend tenant');
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await api.post(`/admin/tenants/${id}/reactivate`, {}, token!);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to reactivate tenant');
    }
  };

  const handleView = async (id: string) => {
    try {
      const data = await api.get(`/admin/tenants/${id}`, token!);
      setSelectedTenant(data);
    } catch (err: any) {
      alert(err.message || 'Failed to load tenant');
    }
  };

  const handleEditPlan = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setEditPlan(tenant.plan);
  };

  const handleSavePlan = async () => {
    if (!editingTenant) return;
    try {
      await api.patch(`/admin/tenants/${editingTenant.id}`, { plan: editPlan }, token!);
      setEditingTenant(null);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to update plan');
    }
  };

  const handleImpersonate = async (id: string) => {
    try {
      const data = await api.post(`/admin/tenants/${id}/impersonate`, {}, token!);
      setImpersonateData(data);
    } catch (err: any) {
      alert(err.message || 'Failed to impersonate');
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'active') return <span className="badge-green">Active</span>;
    if (status === 'suspended') return <span className="badge-red">Suspended</span>;
    return <span className="badge-gray">{status}</span>;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="input pl-10"
            placeholder="Search tenants..."
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
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Users</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : tenants.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No tenants found</td></tr>
            ) : tenants.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.slug}</div>
                </td>
                <td className="px-4 py-3 capitalize">{t.plan}</td>
                <td className="px-4 py-3">{t.user_count}</td>
                <td className="px-4 py-3">{statusBadge(t.status)}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleView(t.id)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded" title="View">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEditPlan(t)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Edit Plan">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleImpersonate(t.id)} className="p-1.5 text-gray-400 hover:text-purple-600 rounded" title="Impersonate">
                      <LogIn className="w-4 h-4" />
                    </button>
                    {t.status === 'active' ? (
                      <button onClick={() => handleSuspend(t.id)} className="p-1.5 text-red-400 hover:text-red-600 rounded" title="Suspend">
                        <Ban className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => handleReactivate(t.id)} className="p-1.5 text-green-400 hover:text-green-600 rounded" title="Reactivate">
                        <CheckCircle className="w-4 h-4" />
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

      {selectedTenant && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedTenant(null)}>
          <div className="card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{selectedTenant.name}</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Slug:</span> {selectedTenant.slug}</p>
              <p><span className="text-gray-500">Plan:</span> {selectedTenant.plan}</p>
              <p><span className="text-gray-500">Status:</span> {selectedTenant.status}</p>
              <p><span className="text-gray-500">Currency:</span> {selectedTenant.currency}</p>
              <p><span className="text-gray-500">Users:</span> {selectedTenant.userCount}</p>
              {selectedTenant.subscription && (
                <p><span className="text-gray-500">Subscription:</span> {selectedTenant.subscription.plan} ({selectedTenant.subscription.status})</p>
              )}
            </div>
            <button onClick={() => setSelectedTenant(null)} className="btn-secondary mt-6">Close</button>
          </div>
        </div>
      )}

      {editingTenant && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditingTenant(null)}>
          <div className="card p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Edit Plan: {editingTenant.name}</h2>
            <select className="input mb-4" value={editPlan} onChange={(e) => setEditPlan(e.target.value)}>
              <option value="free">Free</option>
              <option value="growth">Growth</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <div className="flex gap-3">
              <button onClick={handleSavePlan} className="btn-primary flex-1">Save</button>
              <button onClick={() => setEditingTenant(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {impersonateData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setImpersonateData(null)}>
          <div className="card p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Impersonate Tenant</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Tenant:</span> {impersonateData?.tenantName ?? '-'}</p>
              <p><span className="text-gray-500">Plan:</span> {impersonateData?.tenantPlan ?? '-'}</p>
              <p><span className="text-gray-500">MD Name:</span> {impersonateData?.mdFullName ?? '-'}</p>
              <p><span className="text-gray-500">MD Email:</span> {impersonateData?.mdEmail ?? '-'}</p>
              {impersonateData?.message && <p className="text-xs text-gray-400 mt-3 italic">{impersonateData.message}</p>}
            </div>
            <button onClick={() => setImpersonateData(null)} className="btn-secondary mt-6">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
