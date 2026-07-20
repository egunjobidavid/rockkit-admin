import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../api/client';
import { Search, Ban, CheckCircle, Eye, Edit, LogIn, Download } from 'lucide-react';
import { downloadCsv } from '../utils/export';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { TENANT_STATUS, PLAN_COLORS } from '../constants/admin';
import type { AdminUser } from '../types/admin';

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
  const { token, user } = useAuthStore();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editPlan, setEditPlan] = useState('');
  const [impersonateData, setImpersonateData] = useState<any>(null);

  const isSuperadmin = user?.adminRole === 'superadmin';
  const LIMIT = 20;

  const load = async (p = page, q = search) => {
    setLoading(true);
    try {
      const data = await api.get(`/admin/tenants?page=${p}&limit=${LIMIT}&search=${q}`, token!);
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

  const handleExport = () => {
    downloadCsv(tenants.map(t => ({
      name: t.name,
      slug: t.slug,
      plan: t.plan,
      users: t.user_count,
      status: t.status,
      created: new Date(t.created_at).toLocaleDateString(),
    })), 'tenants');
  };

  const handleImpersonate = async (id: string) => {
    try {
      const data = await api.post(`/admin/tenants/${id}/impersonate`, {}, token!);
      setImpersonateData(data);
    } catch (err: any) {
      alert(err.message || 'Failed to impersonate');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (t: Tenant) => (
        <div>
          <div className="font-medium text-gray-900">{t.name}</div>
          <div className="text-xs text-gray-500">{t.slug}</div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (t: Tenant) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PLAN_COLORS[t.plan] || 'bg-gray-100 text-gray-600'}`}>
          {t.plan}
        </span>
      ),
    },
    {
      key: 'user_count',
      header: 'Users',
      render: (t: Tenant) => <span>{t.user_count}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t: Tenant) => <StatusBadge status={t.status} map={TENANT_STATUS} />,
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (t: Tenant) => <span className="text-gray-500">{new Date(t.created_at).toLocaleDateString()}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (t: Tenant) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => handleView(t.id)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded" title="View">
            <Eye className="w-4 h-4" />
          </button>
          {isSuperadmin && (
            <>
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
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{total} total</span>
          {tenants.length > 0 && (
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
        </div>
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

      <DataTable
        columns={columns}
        data={tenants}
        loading={loading}
        page={page}
        total={total}
        totalPages={Math.ceil(total / LIMIT)}
        onPageChange={(p) => { setPage(p); load(p); }}
        emptyMessage="No tenants found"
        rowKey={(t) => t.id}
      />

      <Modal open={!!selectedTenant} onClose={() => setSelectedTenant(null)} title={selectedTenant?.name || 'Tenant'}>
        <div className="space-y-2 text-sm">
          <p><span className="text-gray-500">Slug:</span> {selectedTenant?.slug}</p>
          <p><span className="text-gray-500">Plan:</span> {selectedTenant?.plan}</p>
          <p><span className="text-gray-500">Status:</span> {selectedTenant?.status}</p>
          <p><span className="text-gray-500">Currency:</span> {selectedTenant?.currency}</p>
          <p><span className="text-gray-500">Users:</span> {selectedTenant?.userCount}</p>
          {selectedTenant?.subscription && (
            <p><span className="text-gray-500">Subscription:</span> {selectedTenant.subscription.plan} ({selectedTenant.subscription.status})</p>
          )}
        </div>
      </Modal>

      <Modal
        open={!!editingTenant}
        onClose={() => setEditingTenant(null)}
        title={`Edit Plan: ${editingTenant?.name || ''}`}
        footer={
          <>
            <button onClick={handleSavePlan} className="btn-primary">Save</button>
            <button onClick={() => setEditingTenant(null)} className="btn-secondary">Cancel</button>
          </>
        }
      >
        <select className="input" value={editPlan} onChange={(e) => setEditPlan(e.target.value)}>
          <option value="free">Free</option>
          <option value="growth">Growth</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </Modal>

      <Modal open={!!impersonateData} onClose={() => setImpersonateData(null)} title="Impersonate Tenant">
        <div className="space-y-2 text-sm">
          <p><span className="text-gray-500">Tenant:</span> {impersonateData?.tenantName ?? '-'}</p>
          <p><span className="text-gray-500">Plan:</span> {impersonateData?.tenantPlan ?? '-'}</p>
          <p><span className="text-gray-500">MD Name:</span> {impersonateData?.mdFullName ?? '-'}</p>
          <p><span className="text-gray-500">MD Email:</span> {impersonateData?.mdEmail ?? '-'}</p>
          {impersonateData?.message && <p className="text-xs text-gray-400 mt-3 italic">{impersonateData.message}</p>}
        </div>
      </Modal>
    </div>
  );
}
