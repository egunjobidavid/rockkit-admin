import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../api/client';
import { DollarSign, Package, Layers, Coins, Save, RotateCcw, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';

type Tab = 'plans' | 'modules' | 'bundles' | 'currencies';

export default function PricingPage() {
  const { token } = useAuthStore();
  const [tab, setTab] = useState<Tab>('plans');
  const [pricing, setPricing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.get('/admin/pricing', token)
      .then(setPricing)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const updatePricing = (patch: any) => {
    setPricing({ ...pricing, ...patch });
    setDirty(true);
  };

  const save = async () => {
    if (!pricing) return;
    setSaving(true);
    setError('');
    try {
      await Promise.all([
        api.patch('/admin/pricing/plans', pricing.plans, token!),
        api.patch('/admin/pricing/modules', pricing.modules, token!),
        api.patch('/admin/pricing/bundles', pricing.bundles, token!),
        api.patch('/admin/pricing/currencies', pricing.currencies, token!),
      ]);
      setDirty(false);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    }
    setSaving(false);
  };

  const resetDefaults = async () => {
    if (!confirm('Reset all pricing to defaults? This cannot be undone.')) return;
    try {
      await api.post('/admin/pricing/reset', {}, token!);
      const fresh = await api.get('/admin/pricing', token!);
      setPricing(fresh);
      setDirty(false);
    } catch (e: any) {
      setError(e.message || 'Failed to reset');
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading pricing...</div>;
  if (!pricing) return <div className="p-8 text-red-500">{error || 'Failed to load pricing'}</div>;

  const activeCurrencies = (pricing.currencies || []).filter((c: any) => c.active);

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'plans', label: 'Plans', icon: Package },
    { key: 'modules', label: 'Modules', icon: Layers },
    { key: 'bundles', label: 'Bundles', icon: DollarSign },
    { key: 'currencies', label: 'Currencies', icon: Coins },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pricing Configuration</h1>
          <p className="text-sm text-gray-500 mt-1">Manage plans, modules, bundles, and currencies</p>
        </div>
        <div className="flex gap-3">
          <button onClick={resetDefaults} className="btn-secondary flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Reset Defaults
          </button>
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
      {dirty && <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3 mb-4">You have unsaved changes</div>}

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'plans' && (
        <PlansTab pricing={pricing} activeCurrencies={activeCurrencies} updatePricing={updatePricing} />
      )}
      {tab === 'modules' && (
        <ModulesTab pricing={pricing} activeCurrencies={activeCurrencies} updatePricing={updatePricing} />
      )}
      {tab === 'bundles' && (
        <BundlesTab pricing={pricing} activeCurrencies={activeCurrencies} updatePricing={updatePricing} />
      )}
      {tab === 'currencies' && (
        <CurrenciesTab pricing={pricing} updatePricing={updatePricing} />
      )}
    </div>
  );
}

// ─── PLANS TAB ─────────────────────────────────────────────────────────
function PlansTab({ pricing, activeCurrencies, updatePricing }: any) {
  const plans = pricing.plans || {};
  const [editing, setEditing] = useState<string | null>(null);

  const updatePlan = (key: string, field: string, value: any) => {
    updatePricing({ plans: { ...plans, [key]: { ...plans[key], [field]: value } } });
  };

  const updatePlanPricing = (planKey: string, currency: string, cycle: string, value: number) => {
    const plan = plans[planKey];
    const pricing = { ...plan.pricing, [currency]: { ...plan.pricing?.[currency], [cycle]: value } };
    updatePlan(planKey, 'pricing', pricing);
  };

  const addPlanLimit = (planKey: string) => {
    const name = prompt('Limit name (e.g. max_users):');
    if (!name) return;
    updatePlan(planKey, 'limits', { ...plans[planKey].limits, [name]: 0 });
  };

  const updatePlanLimit = (planKey: string, limitKey: string, value: string) => {
    const numVal = parseInt(value, 10);
    updatePlan(planKey, 'limits', { ...plans[planKey].limits, [limitKey]: isNaN(numVal) ? value : numVal });
  };

  const removePlanLimit = (planKey: string, limitKey: string) => {
    const limits = { ...plans[planKey].limits };
    delete limits[limitKey];
    updatePlan(planKey, 'limits', limits);
  };

  const addPlan = () => {
    const key = prompt('Plan key (e.g. starter):');
    if (!key || plans[key]) return;
    const newPlan = {
      name: key.charAt(0).toUpperCase() + key.slice(1),
      description: '',
      visible: true,
      features: [],
      limits: { max_users: 2, max_products: 25, max_transactions: 200, max_locations: 1 },
      pricing: Object.fromEntries(activeCurrencies.map((c: any) => [c.code, { monthly: 0, annual: 0 }])),
    };
    updatePricing({ plans: { ...plans, [key]: newPlan } });
    setEditing(key);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Subscription Plans</h2>
        <button onClick={addPlan} className="btn-secondary text-sm flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add Plan
        </button>
      </div>

      {Object.entries(plans).map(([key, plan]: [string, any]) => (
        <div key={key} className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-gray-500">{key}</span>
              <span className="font-semibold">{plan.name}</span>
              {plan.visible ? (
                <span className="badge-green flex items-center gap-1"><Eye className="w-3 h-3" /> Visible</span>
              ) : (
                <span className="badge-gray flex items-center gap-1"><EyeOff className="w-3 h-3" /> Hidden</span>
              )}
            </div>
            <button
              onClick={() => setEditing(editing === key ? null : key)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {editing === key ? 'Close' : 'Edit'}
            </button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <label className="text-gray-500 text-xs">Name</label>
                <input className="input mt-1" value={plan.name} onChange={(e) => updatePlan(key, 'name', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-gray-500 text-xs">Description</label>
                <input className="input mt-1" value={plan.description} onChange={(e) => updatePlan(key, 'description', e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={plan.visible} onChange={(e) => updatePlan(key, 'visible', e.target.checked)} className="rounded" />
                Visible to customers
              </label>
            </div>

            {editing === key && (
              <>
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Pricing per Currency</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {activeCurrencies.map((c: any) => (
                      <div key={c.code} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-500 mb-2">{c.symbol} {c.code}</p>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs text-gray-400">Monthly</label>
                            <input
                              type="number"
                              className="input text-sm"
                              value={plan.pricing?.[c.code]?.monthly ?? 0}
                              onChange={(e) => updatePlanPricing(key, c.code, 'monthly', Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Annual</label>
                            <input
                              type="number"
                              className="input text-sm"
                              value={plan.pricing?.[c.code]?.annual ?? 0}
                              onChange={(e) => updatePlanPricing(key, c.code, 'annual', Number(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Limits</label>
                    <button onClick={() => addPlanLimit(key)} className="text-xs text-primary-600 hover:text-primary-700">+ Add Limit</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {Object.entries(plan.limits || {}).map(([lk, lv]: [string, any]) => (
                      <div key={lk} className="flex items-center gap-1">
                        <input
                          className="input text-xs flex-1"
                          value={lk}
                          readOnly
                          title="Limit name"
                        />
                        <input
                          type="number"
                          className="input text-xs w-20"
                          value={lv === -1 ? '' : lv}
                          placeholder="-1 = ∞"
                          onChange={(e) => updatePlanLimit(key, lk, e.target.value)}
                        />
                        <button onClick={() => removePlanLimit(key, lk)} className="text-red-400 hover:text-red-600 p-0.5">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Features</label>
                  <textarea
                    className="input text-sm"
                    rows={2}
                    value={(plan.features || []).join(', ')}
                    onChange={(e) => updatePlan(key, 'features', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                    placeholder="Comma-separated feature flags"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MODULES TAB ───────────────────────────────────────────────────────
function ModulesTab({ pricing, activeCurrencies, updatePricing }: any) {
  const modules = pricing.modules || {};
  const [editing, setEditing] = useState<string | null>(null);

  const updateModule = (id: string, field: string, value: any) => {
    updatePricing({ modules: { ...modules, [id]: { ...modules[id], [field]: value } } });
  };

  const updateModulePricing = (moduleId: string, currency: string, cycle: string, value: number) => {
    const mod = modules[moduleId];
    const pricing = { ...mod.pricing, [currency]: { ...mod.pricing?.[currency], [cycle]: value } };
    updateModule(moduleId, 'pricing', pricing);
  };

  const addModule = () => {
    const id = prompt('Module key (e.g. accounting):');
    if (!id || modules[id]) return;
    const newMod = {
      name: id.charAt(0).toUpperCase() + id.slice(1),
      description: '',
      icon: 'Package',
      visible: true,
      features: [],
      pricing: Object.fromEntries(activeCurrencies.map((c: any) => [c.code, { monthly: 0, annual: 0 }])),
    };
    updatePricing({ modules: { ...modules, [id]: newMod } });
    setEditing(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Module Add-ons</h2>
        <button onClick={addModule} className="btn-secondary text-sm flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add Module
        </button>
      </div>

      {Object.entries(modules).map(([id, mod]: [string, any]) => (
        <div key={id} className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-gray-500">{id}</span>
              <span className="font-semibold">{mod.name}</span>
              {mod.visible ? (
                <span className="badge-green flex items-center gap-1"><Eye className="w-3 h-3" /> Visible</span>
              ) : (
                <span className="badge-gray flex items-center gap-1"><EyeOff className="w-3 h-3" /> Hidden</span>
              )}
            </div>
            <button
              onClick={() => setEditing(editing === id ? null : id)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {editing === id ? 'Close' : 'Edit'}
            </button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <label className="text-gray-500 text-xs">Name</label>
                <input className="input mt-1" value={mod.name} onChange={(e) => updateModule(id, 'name', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-gray-500 text-xs">Description</label>
                <input className="input mt-1" value={mod.description} onChange={(e) => updateModule(id, 'description', e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div>
                <label className="text-gray-500 text-xs">Icon</label>
                <input className="input text-sm mt-1 w-32" value={mod.icon} onChange={(e) => updateModule(id, 'icon', e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm mt-4">
                <input type="checkbox" checked={mod.visible} onChange={(e) => updateModule(id, 'visible', e.target.checked)} className="rounded" />
                Visible to customers
              </label>
            </div>

            {editing === id && (
              <>
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Pricing per Currency</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {activeCurrencies.map((c: any) => (
                      <div key={c.code} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-500 mb-2">{c.symbol} {c.code}</p>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs text-gray-400">Monthly</label>
                            <input
                              type="number"
                              className="input text-sm"
                              value={mod.pricing?.[c.code]?.monthly ?? 0}
                              onChange={(e) => updateModulePricing(id, c.code, 'monthly', Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Annual</label>
                            <input
                              type="number"
                              className="input text-sm"
                              value={mod.pricing?.[c.code]?.annual ?? 0}
                              onChange={(e) => updateModulePricing(id, c.code, 'annual', Number(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Features</label>
                  <textarea
                    className="input text-sm"
                    rows={2}
                    value={(mod.features || []).join(', ')}
                    onChange={(e) => updateModule(id, 'features', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                    placeholder="Comma-separated feature flags"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── BUNDLES TAB ───────────────────────────────────────────────────────
function BundlesTab({ pricing, activeCurrencies, updatePricing }: any) {
  const bundles = pricing.bundles || {};
  const modules = pricing.modules || {};
  const [editing, setEditing] = useState<string | null>(null);

  const updateBundle = (id: string, field: string, value: any) => {
    updatePricing({ bundles: { ...bundles, [id]: { ...bundles[id], [field]: value } } });
  };

  const updateBundlePricing = (bundleId: string, currency: string, cycle: string, value: number) => {
    const bundle = bundles[bundleId];
    const pricing = { ...bundle.pricing, [currency]: { ...bundle.pricing?.[currency], [cycle]: value } };
    updateBundle(bundleId, 'pricing', pricing);
  };

  const addBundle = () => {
    const id = prompt('Bundle key (e.g. finance):');
    if (!id || bundles[id]) return;
    const newBundle = {
      name: id.charAt(0).toUpperCase() + id.slice(1),
      description: '',
      moduleIds: [],
      icon: 'Package',
      visible: true,
      pricing: Object.fromEntries(activeCurrencies.map((c: any) => [c.code, { monthly: 0, annual: 0 }])),
    };
    updatePricing({ bundles: { ...bundles, [id]: newBundle } });
    setEditing(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Module Bundles</h2>
        <button onClick={addBundle} className="btn-secondary text-sm flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add Bundle
        </button>
      </div>

      {Object.entries(bundles).map(([id, bundle]: [string, any]) => {
        const individualTotal = (bundle.moduleIds || []).reduce((sum: number, mid: string) => {
          return sum + (modules[mid]?.pricing?.NGN?.monthly || 0);
        }, 0);
        const bundlePrice = bundle.pricing?.NGN?.monthly || 0;
        const savings = individualTotal > 0 ? Math.round(((individualTotal - bundlePrice) / individualTotal) * 100) : 0;

        return (
          <div key={id} className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-gray-500">{id}</span>
                <span className="font-semibold">{bundle.name}</span>
                {savings > 0 && <span className="badge-green">Save {savings}%</span>}
                {bundle.visible ? (
                  <span className="badge-green flex items-center gap-1"><Eye className="w-3 h-3" /></span>
                ) : (
                  <span className="badge-gray flex items-center gap-1"><EyeOff className="w-3 h-3" /></span>
                )}
              </div>
              <button
                onClick={() => setEditing(editing === id ? null : id)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {editing === id ? 'Close' : 'Edit'}
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <label className="text-gray-500 text-xs">Name</label>
                  <input className="input mt-1" value={bundle.name} onChange={(e) => updateBundle(id, 'name', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-gray-500 text-xs">Description</label>
                  <input className="input mt-1" value={bundle.description} onChange={(e) => updateBundle(id, 'description', e.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={bundle.visible} onChange={(e) => updateBundle(id, 'visible', e.target.checked)} className="rounded" />
                  Visible to customers
                </label>
              </div>

              {editing === id && (
                <>
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Modules in Bundle</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(modules).map((mid) => (
                        <label key={mid} className="flex items-center gap-1 text-sm bg-gray-50 px-2 py-1 rounded">
                          <input
                            type="checkbox"
                            checked={(bundle.moduleIds || []).includes(mid)}
                            onChange={(e) => {
                              const ids = e.target.checked
                                ? [...(bundle.moduleIds || []), mid]
                                : (bundle.moduleIds || []).filter((x: string) => x !== mid);
                              updateBundle(id, 'moduleIds', ids);
                            }}
                            className="rounded"
                          />
                          {modules[mid]?.name || mid}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Pricing per Currency</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {activeCurrencies.map((c: any) => (
                        <div key={c.code} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-500 mb-2">{c.symbol} {c.code}</p>
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-gray-400">Monthly</label>
                              <input
                                type="number"
                                className="input text-sm"
                                value={bundle.pricing?.[c.code]?.monthly ?? 0}
                                onChange={(e) => updateBundlePricing(id, c.code, 'monthly', Number(e.target.value))}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400">Annual</label>
                              <input
                                type="number"
                                className="input text-sm"
                                value={bundle.pricing?.[c.code]?.annual ?? 0}
                                onChange={(e) => updateBundlePricing(id, c.code, 'annual', Number(e.target.value))}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── CURRENCIES TAB ────────────────────────────────────────────────────
function CurrenciesTab({ pricing, updatePricing }: any) {
  const currencies = pricing.currencies || [];

  const updateCurrency = (index: number, field: string, value: any) => {
    const updated = [...currencies];
    updated[index] = { ...updated[index], [field]: value };
    updatePricing({ currencies: updated });
  };

  const addCurrency = () => {
    const code = prompt('Currency code (e.g. KES):');
    if (!code || currencies.find((c: any) => c.code === code.toUpperCase())) return;
    const name = prompt('Currency name (e.g. Kenyan Shilling):') || code;
    const symbol = prompt('Symbol (e.g. KSh):') || '';
    updatePricing({
      currencies: [...currencies, { code: code.toUpperCase(), name, symbol, active: true, isDefault: false }],
    });
  };

  const removeCurrency = (index: number) => {
    if (currencies[index].isDefault) {
      alert('Cannot remove the default currency');
      return;
    }
    if (!confirm(`Remove ${currencies[index].code}?`)) return;
    const updated = currencies.filter((_: any, i: number) => i !== index);
    updatePricing({ currencies: updated });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Supported Currencies</h2>
        <button onClick={addCurrency} className="btn-secondary text-sm flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add Currency
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Symbol</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Active</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Default</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currencies.map((c: any, i: number) => (
              <tr key={c.code} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                <td className="px-4 py-3">
                  <input className="input text-sm" value={c.name} onChange={(e) => updateCurrency(i, 'name', e.target.value)} />
                </td>
                <td className="px-4 py-3">
                  <input className="input text-sm w-20" value={c.symbol} onChange={(e) => updateCurrency(i, 'symbol', e.target.value)} />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={c.active}
                    onChange={(e) => updateCurrency(i, 'active', e.target.checked)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="radio"
                    name="defaultCurrency"
                    checked={c.isDefault}
                    onChange={() => {
                      const updated = currencies.map((cur: any, j: number) => ({ ...cur, isDefault: j === i }));
                      updatePricing({ currencies: updated });
                    }}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  {!c.isDefault && (
                    <button onClick={() => removeCurrency(i)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
