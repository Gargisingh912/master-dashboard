import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useAcademy, AcademyCoach } from "../../context/AcademyContext";
import { User, Phone, Award, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

const emptyForm = { name: "", phone: "", specialization: "", isActive: true };

export default function AcademyCoaches() {
  const { coaches, batches, addCoach, updateCoach, deleteCoach, loading } = useAcademy();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const batchesForCoach = (coachId: string) =>
    batches.filter(b => b.coachId === coachId && b.isActive);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateCoach(editingId, {
          name: form.name,
          phone: form.phone || undefined,
          specialization: form.specialization || undefined,
          isActive: form.isActive,
        });
      } else {
        await addCoach({
          name: form.name,
          phone: form.phone || undefined,
          specialization: form.specialization || undefined,
          isActive: form.isActive,
        });
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c: AcademyCoach) => {
    setForm({ name: c.name, phone: c.phone || "", specialization: c.specialization || "", isActive: c.isActive });
    setEditingId(c.id);
    setShowForm(true);
  };

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const AVATAR_COLORS = ["bg-emerald-500", "bg-blue-500", "bg-orange-500", "bg-purple-500", "bg-cyan-500", "bg-pink-500"];

  return (
    <>
      <PageMeta title="Coaches — Academy" description="Manage academy coaches" />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Coaches</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{coaches.length} coaches · {coaches.filter(c => c.isActive).length} active</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Add Coach
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-5">{editingId ? "Edit Coach" : "Add Coach"}</h3>
            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Specialization</label>
                <input value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} placeholder="Cricket, Football…"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
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
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50">{saving ? "Saving…" : editingId ? "Update" : "Add"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading coaches…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {coaches.map((c, idx) => {
            const assignedBatches = batchesForCoach(c.id);
            const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            return (
              <div key={c.id} className={`rounded-2xl border-2 p-5 bg-white dark:bg-white/[0.03] transition-all ${c.isActive ? "border-gray-200 dark:border-gray-800" : "border-dashed border-gray-200 dark:border-gray-800 opacity-60"}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${avatarColor} text-white font-bold text-lg`}>
                    {initials(c.name)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => updateCoach(c.id, { isActive: !c.isActive })} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors">
                      {c.isActive ? <ToggleRight size={16} className="text-brand-500" /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => deleteCoach(c.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
                <h4 className="font-bold text-gray-800 dark:text-white/90">{c.name}</h4>
                {c.specialization && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5"><Award size={11} />{c.specialization}</div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1"><Phone size={11} />{c.phone}</div>
                )}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-xs text-gray-500">Batches assigned</span>
                  {assignedBatches.length === 0 ? (
                    <p className="text-xs text-gray-400 italic mt-1">None</p>
                  ) : (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {assignedBatches.map(b => (
                        <span key={b.id} className="px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px] font-semibold">{b.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {coaches.length === 0 && (
            <div className="col-span-4 text-center py-16 text-gray-400">No coaches yet. Add your first coach!</div>
          )}
        </div>
      )}
    </>
  );
}
