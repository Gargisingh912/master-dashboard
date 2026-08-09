import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useSalon, SalonPackage } from "../../context/SalonContext";
import { Gift, Calendar, Hash, Tag, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

const emptyForm = { name: "", totalSessions: "" as string | number, validityDays: "" as string | number, price: 0, isActive: true };

export default function SalonPackages() {
  const { packages, redemptions, addPackage, updatePackage, deletePackage, redeemPackage, loading } = useSalon();
  const [showForm, setShowForm] = useState(false);
  const [showRedeemId, setShowRedeemId] = useState<string | null>(null);
  const [redeemContact, setRedeemContact] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRedemptionCount = (packageId: string) =>
    redemptions.filter(r => r.packageId === packageId).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data: Omit<SalonPackage, "id"> = {
        name: form.name,
        totalSessions: form.totalSessions !== "" ? Number(form.totalSessions) : undefined,
        validityDays: form.validityDays !== "" ? Number(form.validityDays) : undefined,
        price: form.price,
        isActive: form.isActive,
      };
      if (editingId) {
        await updatePackage(editingId, data);
      } else {
        await addPackage(data);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err: any) {
      setError(err.message || "Failed to save package");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p: SalonPackage) => {
    setForm({ name: p.name, totalSessions: p.totalSessions ?? "", validityDays: p.validityDays ?? "", price: p.price, isActive: p.isActive });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleRedeem = async () => {
    if (!showRedeemId) return;
    setSaving(true);
    try {
      await redeemPackage(showRedeemId, redeemContact || undefined);
      setShowRedeemId(null);
      setRedeemContact("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta title="Packages — Salon" description="Manage salon packages and memberships" />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Packages & Memberships</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{packages.length} packages · {redemptions.length} total redemptions</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Add Package
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-5">{editingId ? "Edit Package" : "New Package"}</h3>
            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Package Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Total Sessions</label>
                  <input type="number" min={1} value={form.totalSessions} onChange={e => setForm(f => ({ ...f, totalSessions: e.target.value }))} placeholder="Unlimited"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Validity (days)</label>
                  <input type="number" min={1} value={form.validityDays} onChange={e => setForm(f => ({ ...f, validityDays: e.target.value }))} placeholder="No expiry"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Price (₹) *</label>
                <input required type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-500">Active</label>
                <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
                  {form.isActive ? <ToggleRight size={24} className="text-brand-500" /> : <ToggleLeft size={24} className="text-gray-400" />}
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50">{saving ? "Saving…" : editingId ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redeem Modal */}
      {showRedeemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowRedeemId(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4">Redeem Package</h3>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Customer Contact (optional)</label>
            <input value={redeemContact} onChange={e => setRedeemContact(e.target.value)} placeholder="+91 XXXXXXXXXX"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowRedeemId(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
              <button onClick={handleRedeem} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50">{saving ? "…" : "Redeem"}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading packages…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map(p => {
            const redeemedCount = getRedemptionCount(p.id);
            return (
              <div key={p.id} className={`rounded-2xl border-2 p-5 bg-white dark:bg-white/[0.03] transition-all ${p.isActive ? "border-gray-200 dark:border-gray-800" : "border-dashed border-gray-200 dark:border-gray-800 opacity-60"}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-50 dark:bg-purple-500/10 text-purple-500 rounded-xl">
                    <Gift size={18} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => updatePackage(p.id, { isActive: !p.isActive })} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors">
                      {p.isActive ? <ToggleRight size={16} className="text-brand-500" /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => deletePackage(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
                <h4 className="font-bold text-gray-800 dark:text-white/90 text-base mb-3">{p.name}</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-gray-500"><Hash size={13} />Sessions</div>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{p.totalSessions ?? "Unlimited"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-gray-500"><Calendar size={13} />Validity</div>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{p.validityDays ? `${p.validityDays} days` : "No expiry"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-gray-500"><Tag size={13} />Price</div>
                    <span className="font-bold text-brand-600 dark:text-brand-400">₹{p.price.toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{redeemedCount} redeemed</span>
                  {p.isActive && (
                    <button onClick={() => setShowRedeemId(p.id)} className="px-3 py-1 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold hover:bg-brand-100 transition-colors">
                      Redeem
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {packages.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">No packages yet.</div>
          )}
        </div>
      )}
    </>
  );
}
