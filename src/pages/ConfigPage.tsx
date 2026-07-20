import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../api/client';
import { Settings, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';

interface ConfigItem {
  key: string;
  value: any;
  description: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export default function ConfigPage() {
  const { token, user } = useAuthStore();
  const isSuperadmin = user?.adminRole === 'superadmin';
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ConfigItem | null>(null);
  const [form, setForm] = useState({ key: '', description: '', value: '{}', enabled: true });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/config', token!);
      setConfigs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load config:', err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [token]);

  const handleCreate = async () => {
    try {
      const parsed = JSON.parse(form.value);
      await api.post('/admin/config', { key: form.key, value: parsed, description: form.description, enabled: form.enabled }, token!);
      setShowCreate(false);
      setForm({ key: '', description: '', value: '{}', enabled: true });
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to create config');
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      const parsed = JSON.parse(form.value);
      await api.patch(`/admin/config/${editing.key}`, { value: parsed, description: form.description, enabled: form.enabled }, token!);
      setEditing(null);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to update config');
    }
  };

  const handleToggle = async (item: ConfigItem) => {
    try {
      await api.patch(`/admin/config/${item.key}`, { enabled: !item.enabled }, token!);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle config');
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Delete config key "${key}"?`)) return;
    try {
      await api.delete(`/admin/config/${key}`, token!);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to delete config');
    }
  };

  const openEdit = (item: ConfigItem) => {
    setEditing(item);
    setForm({
      key: item.key,
      description: item.description || '',
      value: JSON.stringify(item.value, null, 2),
      enabled: item.enabled,
    });
  };

  const columns = [
    {
      key: 'key',
      header: 'Key',
      render: (c: ConfigItem) => <span className="font-mono text-sm font-medium">{c.key}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (c: ConfigItem) => <span className="text-gray-600 text-sm">{c.description || '-'}</span>,
    },
    {
      key: 'value',
      header: 'Value',
      render: (c: ConfigItem) => (
        <span className="text-xs font-mono text-gray-500 max-w-[200px] truncate block">
          {JSON.stringify(c.value)}
        </span>
      ),
    },
    {
      key: 'enabled',
      header: 'Enabled',
      render: (c: ConfigItem) => (
        <button onClick={() => handleToggle(c)} className="text-gray-400 hover:text-gray-600">
          {c.enabled ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}
        </button>
      ),
    },
    {
      key: 'updated_at',
      header: 'Updated',
      render: (c: ConfigItem) => <span className="text-gray-500 text-sm">{c.updated_at ? new Date(c.updated_at).toLocaleDateString() : '-'}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c: ConfigItem) => isSuperadmin ? (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(c.key)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : null,
    },
  ];

  const modalTitle = editing ? `Edit: ${editing.key}` : 'Create Config';
  const modalSave = editing ? handleUpdate : handleCreate;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Remote Configuration</h1>
        {isSuperadmin && (
          <button onClick={() => { setForm({ key: '', description: '', value: '{}', enabled: true }); setShowCreate(true); }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Config
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={configs}
        loading={loading}
        page={1}
        total={configs.length}
        totalPages={1}
        onPageChange={() => {}}
        emptyMessage="No config entries"
        rowKey={(c) => c.key}
      />

      <Modal
        open={showCreate || !!editing}
        onClose={() => { setShowCreate(false); setEditing(null); }}
        title={modalTitle}
        maxWidth="max-w-2xl"
        footer={
          <>
            <button onClick={modalSave} className="btn-primary">{editing ? 'Save' : 'Create'}</button>
            <button onClick={() => { setShowCreate(false); setEditing(null); }} className="btn-secondary">Cancel</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
            <input className="input font-mono" value={form.key} onChange={(e) => setForm(f => ({ ...f, key: e.target.value }))} disabled={!!editing} placeholder="feature_new_ui" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input className="input" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Enable new UI features" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value (JSON)</label>
            <textarea className="input font-mono min-h-[120px]" value={form.value} onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))} />
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`relative w-11 h-6 rounded-full transition-colors ${form.enabled ? 'bg-green-600' : 'bg-gray-300'}`} onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.enabled ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm font-medium">Enabled</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
