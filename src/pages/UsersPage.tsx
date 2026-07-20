import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../api/client';
import { Search, UserX, UserCheck, Eye, Shield, ShieldOff, ChevronDown, Clock } from 'lucide-react';

const ADMIN_ROLES: Record<string, { label: string; color: string }> = {
  superadmin: { label: 'Superadmin', color: 'bg-red-50 text-red-700' },
  admin: { label: 'Admin', color: 'bg-blue-50 text-blue-700' },
  viewer: { label: 'Viewer', color: 'bg-gray-100 text-gray-600' },
};

interface User {
  id: string;
  email: string;
  full_name: string;
  status: string;
  is_superadmin: boolean;
  admin_role: string | null;
  created_at: string;
  memberships: Array<{ tenant_id: string; role: string; tenant_name?: string }>;
}

interface AuditLog {
  id: string;
  user_email: string;
  admin_role: string;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
  created_at: string;
}

export default function UsersPage() {
  const { token, user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [promotingUser, setPromotingUser] = useState<User | null>(null);
  const [promoteRole, setPromoteRole] = useState('');
  const [tab, setTab] = useState<'users' | 'audit'>('users');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);

  const isSuperadmin = currentUser?.isSuperadmin || currentUser?.adminRole === 'superadmin';

  const load = async (p = page, q = search) => {
    setLoading(true);
    try {
      const data = await api.get(`/admin/users?page=${p}&limit=20&search=${q}`, token!);
      setUsers((data as any)?.data ?? []);
      setTotal((data as any)?.total ?? 0);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    }
    setLoading(false);
  };

  const loadAudit = async (p = auditPage) => {
    setAuditLoading(true);
    try {
      const data = await api.get(`/admin/audit?page=${p}&limit=30`, token!);
      setAuditLogs((data as any)?.data ?? []);
      setAuditTotal((data as any)?.total ?? 0);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    }
    setAuditLoading(false);
  };

  useEffect(() => { load(1, ''); }, [token]);
  useEffect(() => { if (tab === 'audit') loadAudit(1); }, [tab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(1, search);
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await api.patch(`/admin/users/${id}/deactivate`, {}, token!);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate user');
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/reactivate`, {}, token!);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to reactivate user');
    }
  };

  const handleView = async (id: string) => {
    try {
      const data = await api.get(`/admin/users/${id}`, token!);
      setSelectedUser(data);
    } catch (err: any) {
      alert(err.message || 'Failed to load user');
    }
  };

  const handlePromote = async () => {
    if (!promotingUser) return;
    try {
      await api.patch(`/admin/users/${promotingUser.id}/admin-role`, { adminRole: promoteRole || null }, token!);
      setPromotingUser(null);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to update admin role');
    }
  };

  const roleBadge = (adminRole: string | null, isSuperadmin: boolean) => {
    const effectiveRole = adminRole || (isSuperadmin ? 'superadmin' : null);
    if (!effectiveRole) return <span className="badge-gray">-</span>;
    const config = ADMIN_ROLES[effectiveRole] || { label: effectiveRole, color: 'bg-gray-100 text-gray-600' };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>{config.label}</span>;
  };

  const actionLabel = (action: string) => {
    const map: Record<string, string> = {
      update_tenant: 'Updated tenant',
      suspend_tenant: 'Suspended tenant',
      reactivate_tenant: 'Reactivated tenant',
      deactivate_user: 'Deactivated user',
      reactivate_user: 'Reactivated user',
      impersonate_tenant: 'Impersonated tenant',
      set_admin_role: 'Changed admin role',
      update_pricing: 'Updated pricing',
      reset_pricing: 'Reset pricing',
    };
    return map[action] || action;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
        <span className="text-sm text-gray-500">{tab === 'users' ? `${total} users` : `${auditTotal} events`}</span>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        <button
          onClick={() => setTab('users')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'users' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Shield className="w-4 h-4" /> Users
        </button>
        <button
          onClick={() => setTab('audit')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'audit' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4" /> Audit Log
        </button>
      </div>

      {tab === 'users' && (
        <>
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
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Admin Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tenant Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
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
                    <td className="px-4 py-3">{roleBadge(u.admin_role, u.is_superadmin)}</td>
                    <td className="px-4 py-3">
                      {u.memberships?.length > 0 ? (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {u.memberships[0].role}
                        </span>
                      ) : (
                        <span className="badge-gray">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.status === 'active' ? (
                        <span className="badge-green">Active</span>
                      ) : (
                        <span className="badge-red">{u.status}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleView(u.id)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        {isSuperadmin && u.id !== currentUser?.id && (
                          <button
                            onClick={() => {
                              setPromotingUser(u);
                              setPromoteRole(u.admin_role || (u.is_superadmin ? 'superadmin' : ''));
                            }}
                            className="p-1.5 text-gray-400 hover:text-purple-600 rounded"
                            title="Set admin role"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        {isSuperadmin && !u.is_superadmin && (
                          u.status === 'active' ? (
                            <button onClick={() => handleDeactivate(u.id)} className="p-1.5 text-red-400 hover:text-red-600 rounded" title="Deactivate">
                              <UserX className="w-4 h-4" />
                            </button>
                          ) : (
                            <button onClick={() => handleReactivate(u.id)} className="p-1.5 text-green-400 hover:text-green-600 rounded" title="Reactivate">
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )
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
        </>
      )}

      {tab === 'audit' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Target</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {auditLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : auditLogs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No audit events yet</td></tr>
              ) : auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{log.user_email}</td>
                  <td className="px-4 py-3">{roleBadge(log.admin_role, false)}</td>
                  <td className="px-4 py-3">{actionLabel(log.action)}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {log.target_type && <span className="text-xs">{log.target_type}: {log.target_id?.slice(0, 8)}...</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {log.details && Object.keys(log.details).length > 0 ? JSON.stringify(log.details) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {auditTotal > 30 && (
            <div className="flex items-center justify-between p-4 border-t">
              <button disabled={auditPage <= 1} onClick={() => { setAuditPage(auditPage - 1); loadAudit(auditPage - 1); }} className="btn-secondary disabled:opacity-50 text-sm">Previous</button>
              <span className="text-sm text-gray-500">Page {auditPage} of {Math.ceil(auditTotal / 30)}</span>
              <button disabled={auditPage * 30 >= auditTotal} onClick={() => { setAuditPage(auditPage + 1); loadAudit(auditPage + 1); }} className="btn-secondary disabled:opacity-50 text-sm">Next</button>
            </div>
          )}
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
          <div className="card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{selectedUser.email}</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Name:</span> {selectedUser.full_name || '-'}</p>
              <p><span className="text-gray-500">Status:</span> {selectedUser.status}</p>
              <p><span className="text-gray-500">Admin Role:</span> {roleBadge(selectedUser.admin_role, selectedUser.is_superadmin)}</p>
              {selectedUser.memberships?.length > 0 && (
                <div>
                  <p className="text-gray-500 mb-1">Tenant Memberships:</p>
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

      {/* Promote/Demote Modal */}
      {promotingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setPromotingUser(null)}>
          <div className="card p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-1">Admin Role</h2>
            <p className="text-sm text-gray-500 mb-4">{promotingUser.email}</p>

            <div className="space-y-2 mb-6">
              {[
                { value: 'superadmin', label: 'Superadmin', desc: 'Full access — manage users, pricing, suspend tenants' },
                { value: 'admin', label: 'Admin', desc: 'Manage tenants, view revenue, no pricing access' },
                { value: 'viewer', label: 'Viewer', desc: 'Read-only dashboard access' },
                { value: '', label: 'No Admin Access', desc: 'Remove admin panel access entirely' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    promoteRole === opt.value ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="adminRole"
                    value={opt.value}
                    checked={promoteRole === opt.value}
                    onChange={() => setPromoteRole(opt.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={handlePromote} className="btn-primary flex-1">Save</button>
              <button onClick={() => setPromotingUser(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
