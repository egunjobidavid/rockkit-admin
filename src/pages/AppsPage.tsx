import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../api/client';
import { Smartphone, Monitor, Shield, Clock, Plus, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/Badge';
import { useAdminQuery } from '../hooks/useAdminQuery';
import { useAdminMutation } from '../hooks/useAdminMutation';
import { DataTable } from '../components/DataTable';

interface MaintenanceStatus {
  id: string | null;
  enabled: boolean;
  message: string;
  affectedPlatforms: string[];
  scheduledStart: string | null;
  scheduledEnd: string | null;
  updatedAt: string;
}

interface AppVersion {
  id: string;
  platform: string;
  version: string;
  min_version: string;
  force_update: boolean;
  changelog: string;
  download_url: string;
  released_at: string | null;
  created_at: string;
}

export default function AppsPage() {
  const { token, user } = useAuthStore();
  const isSuperadmin = user?.adminRole === 'superadmin';
  const [tab, setTab] = useState<'maintenance' | 'versions'>('maintenance');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">App Management</h1>

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        <button
          onClick={() => setTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'maintenance' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Shield className="w-4 h-4" /> Maintenance Mode
        </button>
        <button
          onClick={() => setTab('versions')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'versions' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4" /> Version Control
        </button>
      </div>

      {tab === 'maintenance' && <MaintenanceTab isSuperadmin={isSuperadmin} />}
      {tab === 'versions' && <VersionsTab isSuperadmin={isSuperadmin} />}
    </div>
  );
}

// ─── Maintenance Tab ──────────────────────────────────────────────────────────

function MaintenanceTab({ isSuperadmin }: { isSuperadmin: boolean }) {
  const { token } = useAuthStore();
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    enabled: false,
    message: 'System is under maintenance. Please try again later.',
    affectedPlatforms: ['desktop', 'mobile'] as string[],
    scheduledStart: '',
    scheduledEnd: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/maintenance', token!);
      const s = data as unknown as MaintenanceStatus;
      setStatus(s);
      setForm({
        enabled: s?.enabled ?? false,
        message: s?.message ?? 'System is under maintenance. Please try again later.',
        affectedPlatforms: s?.affectedPlatforms ?? ['desktop', 'mobile'],
        scheduledStart: s?.scheduledStart ? new Date(s.scheduledStart).toISOString().slice(0, 16) : '',
        scheduledEnd: s?.scheduledEnd ? new Date(s.scheduledEnd).toISOString().slice(0, 16) : '',
      });
    } catch (err: any) {
      console.error('Failed to load maintenance status:', err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [token]);

  const handleSave = async () => {
    try {
      await api.patch('/admin/maintenance', {
        enabled: form.enabled,
        message: form.message,
        affectedPlatforms: form.affectedPlatforms,
        scheduledStart: form.scheduledStart || null,
        scheduledEnd: form.scheduledEnd || null,
      }, token!);
      setEditing(false);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to update maintenance mode');
    }
  };

  const togglePlatform = (p: string) => {
    setForm(f => ({
      ...f,
      affectedPlatforms: f.affectedPlatforms.includes(p)
        ? f.affectedPlatforms.filter(x => x !== p)
        : [...f.affectedPlatforms, p],
    }));
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Current Status</h2>
            <p className="text-sm text-gray-500 mt-1">Controls whether users can access Desktop and/or Mobile apps</p>
          </div>
          {isSuperadmin && (
            <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-2 text-sm">
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
            <div className={`p-2 rounded-lg ${status?.enabled ? 'bg-red-100' : 'bg-green-100'}`}>
              <Shield className={`w-5 h-5 ${status?.enabled ? 'text-red-600' : 'text-green-600'}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className={`font-medium ${status?.enabled ? 'text-red-600' : 'text-green-600'}`}>
                {status?.enabled ? 'Active' : 'Off'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
            <div className="p-2 rounded-lg bg-blue-100">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Platforms</p>
              <div className="flex gap-1 mt-1">
                {status?.affectedPlatforms?.includes('desktop') && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Desktop</span>
                )}
                {status?.affectedPlatforms?.includes('mobile') && (
                  <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Mobile</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
            <div className="p-2 rounded-lg bg-amber-100">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Schedule</p>
              <p className="font-medium text-sm">
                {status?.scheduledStart
                  ? `From ${new Date(status.scheduledStart).toLocaleString()}`
                  : 'No schedule'}
              </p>
            </div>
          </div>
        </div>

        {status?.enabled && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">Maintenance Message:</p>
            <p className="text-sm text-red-700 mt-1">{status.message}</p>
          </div>
        )}
      </div>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit Maintenance Mode"
        footer={
          <>
            <button onClick={handleSave} className="btn-primary">Save Changes</button>
            <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`relative w-11 h-6 rounded-full transition-colors ${form.enabled ? 'bg-red-600' : 'bg-gray-300'}`}
                onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.enabled ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm font-medium">{form.enabled ? 'Maintenance ON' : 'Maintenance OFF'}</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message shown to users</label>
            <textarea
              className="input min-h-[80px]"
              value={form.message}
              onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Affected Platforms</label>
            <div className="flex gap-3">
              {['desktop', 'mobile'].map(p => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.affectedPlatforms.includes(p)}
                    onChange={() => togglePlatform(p)}
                    className="rounded"
                  />
                  <span className="text-sm capitalize">{p}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Start (optional)</label>
              <input
                type="datetime-local"
                className="input"
                value={form.scheduledStart}
                onChange={(e) => setForm(f => ({ ...f, scheduledStart: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled End (optional)</label>
              <input
                type="datetime-local"
                className="input"
                value={form.scheduledEnd}
                onChange={(e) => setForm(f => ({ ...f, scheduledEnd: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Versions Tab ─────────────────────────────────────────────────────────────

function VersionsTab({ isSuperadmin }: { isSuperadmin: boolean }) {
  const { token } = useAuthStore();
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [platformFilter, setPlatformFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingVersion, setEditingVersion] = useState<AppVersion | null>(null);
  const [form, setForm] = useState({
    platform: 'desktop',
    version: '',
    minVersion: '',
    forceUpdate: false,
    changelog: '',
    downloadUrl: '',
    releasedAt: '',
  });

  const LIMIT = 20;

  const load = async (p = page, platform = platformFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (platform) params.set('platform', platform);
      const data = await api.get(`/admin/versions?${params}`, token!);
      setVersions((data as any)?.data ?? []);
      setTotal((data as any)?.total ?? 0);
    } catch (err: any) {
      console.error('Failed to load versions:', err);
    }
    setLoading(false);
  };

  useEffect(() => { load(1, ''); }, [token]);

  const handleCreate = async () => {
    try {
      await api.post('/admin/versions', {
        ...form,
        releasedAt: form.releasedAt || undefined,
      }, token!);
      setShowCreate(false);
      resetForm();
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to create version');
    }
  };

  const handleUpdate = async () => {
    if (!editingVersion) return;
    try {
      await api.patch(`/admin/versions/${editingVersion.id}`, {
        minVersion: form.minVersion,
        forceUpdate: form.forceUpdate,
        changelog: form.changelog,
        downloadUrl: form.downloadUrl,
        releasedAt: form.releasedAt || null,
      }, token!);
      setEditingVersion(null);
      resetForm();
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to update version');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this version?')) return;
    try {
      await api.delete(`/admin/versions/${id}`, token!);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to delete version');
    }
  };

  const resetForm = () => setForm({
    platform: 'desktop',
    version: '',
    minVersion: '',
    forceUpdate: false,
    changelog: '',
    downloadUrl: '',
    releasedAt: '',
  });

  const openEdit = (v: AppVersion) => {
    setEditingVersion(v);
    setForm({
      platform: v.platform,
      version: v.version,
      minVersion: v.min_version,
      forceUpdate: v.force_update,
      changelog: v.changelog || '',
      downloadUrl: v.download_url || '',
      releasedAt: v.released_at ? new Date(v.released_at).toISOString().slice(0, 16) : '',
    });
  };

  const columns = [
    {
      key: 'platform',
      header: 'Platform',
      render: (v: AppVersion) => (
        <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
          v.platform === 'desktop' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
        }`}>
          {v.platform === 'desktop' ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
          {v.platform}
        </span>
      ),
    },
    {
      key: 'version',
      header: 'Version',
      render: (v: AppVersion) => <span className="font-medium">{v.version}</span>,
    },
    {
      key: 'min_version',
      header: 'Min Version',
      render: (v: AppVersion) => <span>{v.min_version}</span>,
    },
    {
      key: 'force_update',
      header: 'Force Update',
      render: (v: AppVersion) => v.force_update
        ? <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-700">Required</span>
        : <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">Optional</span>,
    },
    {
      key: 'released_at',
      header: 'Released',
      render: (v: AppVersion) => <span className="text-gray-500 text-sm">{v.released_at ? new Date(v.released_at).toLocaleDateString() : '-'}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (v: AppVersion) => isSuperadmin ? (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEdit(v)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(v.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : null,
    },
  ];

  const formModalTitle = editingVersion ? `Edit Version ${editingVersion.version}` : 'Register New Version';
  const formModalSave = editingVersion ? handleUpdate : handleCreate;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['', 'desktop', 'mobile'].map(p => (
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
        {isSuperadmin && (
          <button onClick={() => { resetForm(); setShowCreate(true); }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Register Version
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={versions}
        loading={loading}
        page={page}
        total={total}
        totalPages={Math.ceil(total / LIMIT)}
        onPageChange={(p) => { setPage(p); load(p); }}
        emptyMessage="No versions registered"
        rowKey={(v) => v.id}
      />

      <Modal
        open={showCreate || !!editingVersion}
        onClose={() => { setShowCreate(false); setEditingVersion(null); }}
        title={formModalTitle}
        footer={
          <>
            <button onClick={formModalSave} className="btn-primary">
              {editingVersion ? 'Save Changes' : 'Register'}
            </button>
            <button onClick={() => { setShowCreate(false); setEditingVersion(null); }} className="btn-secondary">Cancel</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <select
              className="input"
              value={form.platform}
              onChange={(e) => setForm(f => ({ ...f, platform: e.target.value }))}
              disabled={!!editingVersion}
            >
              <option value="desktop">Desktop (Electron)</option>
              <option value="mobile">Mobile (Flutter)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
              <input
                className="input"
                placeholder="1.2.0"
                value={form.version}
                onChange={(e) => setForm(f => ({ ...f, version: e.target.value }))}
                disabled={!!editingVersion}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Required Version</label>
              <input
                className="input"
                placeholder="1.0.0"
                value={form.minVersion}
                onChange={(e) => setForm(f => ({ ...f, minVersion: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`relative w-11 h-6 rounded-full transition-colors ${form.forceUpdate ? 'bg-red-600' : 'bg-gray-300'}`}
                onClick={() => setForm(f => ({ ...f, forceUpdate: !f.forceUpdate }))}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.forceUpdate ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm font-medium">Force Update (blocking dialog)</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Changelog</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="What's new in this version..."
              value={form.changelog}
              onChange={(e) => setForm(f => ({ ...f, changelog: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Download URL</label>
            <input
              className="input"
              placeholder="https://..."
              value={form.downloadUrl}
              onChange={(e) => setForm(f => ({ ...f, downloadUrl: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Release Date (optional)</label>
            <input
              type="datetime-local"
              className="input"
              value={form.releasedAt}
              onChange={(e) => setForm(f => ({ ...f, releasedAt: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
