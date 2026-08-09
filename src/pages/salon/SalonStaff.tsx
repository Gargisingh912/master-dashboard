import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useSalon, SalonStaff as SalonStaffType } from "../../context/SalonContext";
import { Phone, Pencil, Trash2, ToggleLeft, ToggleRight, Plus } from "lucide-react";

const emptyForm = { name: "", role: "", phone: "", isActive: true };

export default function SalonStaff() {
  const { staff, addStaff, updateStaff, deleteStaff, appointments, loading } = useSalon();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // Per-staff today's appointment count
  const todayAppointmentsByStaff = (staffId: string) =>
    appointments.filter(a => a.staffId === staffId && a.appointmentDate === todayStr && a.status !== "Cancelled" && a.status !== "NoShow").length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateStaff(editingId, { name: form.name, role: form.role || undefined, phone: form.phone || undefined, isActive: form.isActive });
      } else {
        await addStaff({ name: form.name, role: form.role || undefined, phone: form.phone || undefined, isActive: form.isActive });
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

  const startEdit = (s: SalonStaffType) => {
    setForm({ name: s.name, role: s.role || "", phone: s.phone || "", isActive: s.isActive });
    setEditingId(s.id);
    setShowForm(true);
  };

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const AVATAR_COLORS = [
    "bg-brand-500", "bg-purple-500", "bg-pink-500", "bg-green-500", "bg-orange-500", "bg-cyan-500",
  ];

  return (
    <>
      <PageMeta title="Staff — Salon" description="Manage salon staff" />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Staff</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{staff.length} team members · {staff.filter(s => s.isActive).length} active</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Add Staff
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-5">{editingId ? "Edit Staff" : "Add Staff Member"}</h3>
            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
                <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Stylist, Therapist…"
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
        <div className="text-center py-16 text-gray-400">Loading staff…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {staff.map((s, idx) => {
            const apptCount = todayAppointmentsByStaff(s.id);
            const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            return (
              <div key={s.id} className={`rounded-2xl border-2 p-5 bg-white dark:bg-white/[0.03] transition-all ${s.isActive ? "border-gray-200 dark:border-gray-800" : "border-dashed border-gray-200 dark:border-gray-800 opacity-60"}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${avatarColor} text-white font-bold text-lg`}>
                    {initials(s.name)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => updateStaff(s.id, { isActive: !s.isActive })} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors">
                      {s.isActive ? <ToggleRight size={16} className="text-brand-500" /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => deleteStaff(s.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
                <h4 className="font-bold text-gray-800 dark:text-white/90">{s.name}</h4>
                {s.role && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.role}</p>}
                {s.phone && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1"><Phone size={11} />{s.phone}</div>
                )}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Today's appointments</span>
                  <span className="text-sm font-bold text-brand-500">{apptCount}</span>
                </div>
              </div>
            );
          })}
          {staff.length === 0 && (
            <div className="col-span-4 text-center py-16 text-gray-400">No staff yet. Add your first team member!</div>
          )}
        </div>
      )}
    </>
  );
}
