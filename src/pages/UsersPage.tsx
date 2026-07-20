import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../api/client';
import { Search, UserX, UserCheck, Eye, Shield, Clock, Download } from 'lucide-react';
import { downloadCsv } from '../utils/export';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ADMIN_ROLE_CONFIG, AUDIT_ACTION_LABELS } from '../constants/admin';
import type { AdminRole } from '../types/admin';

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

  const isSuperadmin = currentUser?.adminRole === 'superadmin';
  const LIMIT = 20;
  const AUDIT_LIMIT = 30;

  const load = async (p = page, q = search) => {
    setLoading(true);
    try {
      const data = await api.get(`/admin/users?page=${p}&limit=${LIMIT}&search=${q}`, token!);
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
      const data = await api.get(`/admin/audit?page=${p}&limit=${AUDIT_LIMIT}`, token!);
      setAuditLogs((data as any)?.data ?? []);
      setAuditTotal((data as any)?.total ?? 0);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    }
    setAuditLoading(false);
  };

  useEffect(() => { load(1, ''); }, [token]);
  useEffect(() => { if (tab === 'audit') loadAudit(1); }, [tab]);

  const handleExportUsers = () => {
    downloadCsv(users.map(u => ({
      email: u.email,
      name: u.full_name || '-',
      admin_role: u.admin_role || (u.is_superadmin ? 'superadmin' : '-'),
      tenant_role: u.memberships?.[0]?.role || '-',
      status: u.status,
      created: new Date(u.created_at).toLocaleDateString(),
    })), 'admin-users');
  };

  const handleExportAudit = () => {
    downloadCsv(auditLogs.map(log => ({
      time: new Date(log.created_at).toLocaleString(),
      user: log.user_email,
      role: log.admin_role,
      action: AUDIT_ACTION_LABELS[log.action] || log.action,
      target: log.target_type ? `${log.target_type}: ${log.target_id}` : '-',
      details: log.details ? JSON.stringify(log.details) : '-',
    })), 'audit-log');
  };

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

  const getRoleBadge = (adminRole: string | null, isSuperadmin: boolean) => {
    const effectiveRole = (adminRole || (isSuperadmin ? 'superadmin' : null)) as AdminRole | null;
    if (!effectiveRole) return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">-</span>;
    const config = ADMIN_ROLE_CONFIG[effectiveRole];
    if (!config) return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">{effectiveRole}</span>;
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>{config.label}</span>;
  };

  const userColumns = [
    {
      key: 'email',
      header: 'Email',
      render: (u: User) => <span className="font-medium text-gray-900">{u.email}</span>,
    },
    {
      key: 'full_name',
      header: 'Name',
      render: (u: User) => <span className="text-gray-600">{u.full_name || '-'}</span>,
    },
    {
      key: 'admin_role',
      header: 'Admin Role',
      render: (u: User) => getRoleBadge(u.admin_role, u.is_superadmin),
    },
    {
      key: 'tenant_role',
      header: 'Tenant Role',
      render: (u: User) => u.memberships?.length > 0 ? (
        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{u.memberships[0].role}</span>
      ) : (
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">-</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u: User) => <StatusBadge status={u.status} map={{ active: { label: 'Active', color: 'badge-green' }, inactive: { label: 'Inactive', color: 'badge-red' } }} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (u: User) => (
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
      ),
    },
  ];

  const auditColumns = [
    {
      key: 'created_at',
      header: 'Time',
      render: (log: AuditLog) => <span className="text-gray-500 text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</span>,
    },
    {
      key: 'user_email',
      header: 'User',
      render: (log: AuditLog) => <span className="font-medium text-gray-900">{log.user_email}</span>,
    },
    {
      key: 'admin_role',
      header: 'Role',
      render: (log: AuditLog) => getRoleBadge(log.admin_role, false),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log: AuditLog) => <span>{AUDIT_ACTION_LABELS[log.action] || log.action}</span>,
    },
    {
      key: 'target',
      header: 'Target',
      render: (log: AuditLog) => log.target_type ? (
        <span className="text-xs text-gray-500">{log.target_type}: {log.target_id?.slice(0, 8)}...</span>
      ) : <span className="text-gray-400">-</span>,
    },
    {
      key: 'details',
      header: 'Details',
      render: (log: AuditLog) => <span className="text-gray-500 text-xs">{log.details && Object.keys(log.details).length > 0 ? JSON.stringify(log.details) : '-'}</span>,
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{tab === 'users' ? `${total} users` : `${auditTotal} events`}</span>
          {((tab === 'users' && users.length > 0) || (tab === 'audit' && auditLogs.length > 0)) && (
            <button onClick={tab === 'users' ? handleExportUsers : handleExportAudit} className="btn-secondary flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
        </div>
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

          <DataTable
            columns={userColumns}
            data={users}
            loading={loading}
            page={page}
            total={total}
            totalPages={Math.ceil(total / LIMIT)}
            onPageChange={(p) => { setPage(p); load(p); }}
            emptyMessage="No users found"
            rowKey={(u) => u.id}
          />
        </>
      )}

      {tab === 'audit' && (
        <DataTable
          columns={auditColumns}
          data={auditLogs}
          loading={auditLoading}
          page={auditPage}
          total={auditTotal}
          totalPages={Math.ceil(auditTotal / AUDIT_LIMIT)}
          onPageChange={(p) => { setAuditPage(p); loadAudit(p); }}
          emptyMessage="No audit events yet"
          rowKey={(log) => log.id}
        />
      )}

      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title={selectedUser?.email || 'User'}>
        <div className="space-y-2 text-sm">
          <p><span className="text-gray-500">Name:</span> {selectedUser?.full_name || '-'}</p>
          <p><span className="text-gray-500">Status:</span> {selectedUser?.status}</p>
          <p><span className="text-gray-500">Admin Role:</span> {getRoleBadge(selectedUser?.admin_role, selectedUser?.is_superadmin)}</p>
          {selectedUser?.memberships?.length > 0 && (
            <div>
              <p className="text-gray-500 mb-1">Tenant Memberships:</p>
              {selectedUser.memberships.map((m: any, i: number) => (
                <p key={i} className="ml-4">{m.tenant_name || m.tenant_id}: {m.role}</p>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={!!promotingUser}
        onClose={() => setPromotingUser(null)}
        title="Admin Role"
        description={promotingUser?.email}
        footer={
          <>
            <button onClick={handlePromote} className="btn-primary">Save</button>
            <button onClick={() => setPromotingUser(null)} className="btn-secondary">Cancel</button>
          </>
        }
      >
        <div className="space-y-2">
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
      </Modal>
    </div>
  );
}
