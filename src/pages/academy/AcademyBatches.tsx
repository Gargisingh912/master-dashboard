import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useAcademy, AcademyBatch } from "../../context/AcademyContext";
import { Users, Clock, Calendar, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, DollarSign } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const emptyForm = {
  name: "",
  sportOrSubject: "",
  coachId: "",
  capacity: 20,
  scheduleDays: [] as string[],
  startTime: "06:00",
  endTime: "07:00",
  feeAmount: 0,
  feeCycle: "monthly",
  isActive: true,
};

export default function AcademyBatches() {
  const { batches, coaches, students, addBatch, updateBatch, deleteBatch, loading } = useAcademy();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const studentsInBatch = (batchId: string) =>
    students.filter(s => s.batchId === batchId && s.isActive).length;

  const toggleDay = (day: string) => {
    setForm(f => ({
      ...f,
      scheduleDays: f.scheduleDays.includes(day)
        ? f.scheduleDays.filter(d => d !== day)
        : [...f.scheduleDays, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data = {
        name: form.name,
        sportOrSubject: form.sportOrSubject || undefined,
        coachId: form.coachId || undefined,
        capacity: form.capacity,
        scheduleDays: form.scheduleDays,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        feeAmount: form.feeAmount,
        feeCycle: form.feeCycle,
        isActive: form.isActive,
      };
      if (editingId) {
        await updateBatch(editingId, data);
      } else {
        await addBatch(data);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err: any) {
      setError(err.message || "Failed to save batch");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (b: AcademyBatch) => {
    setForm({
      name: b.name,
      sportOrSubject: b.sportOrSubject || "",
      coachId: b.coachId || "",
      capacity: b.capacity,
      scheduleDays: b.scheduleDays,
      startTime: b.startTime || "06:00",
      endTime: b.endTime || "07:00",
      feeAmount: b.feeAmount,
      feeCycle: b.feeCycle,
      isActive: b.isActive,
    });
    setEditingId(b.id);
    setShowForm(true);
  };

  return (
    <>
      <PageMeta title="Batches — Academy" description="Manage academy batches" />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Batches</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{batches.length} batches · {batches.filter(b => b.isActive).length} active</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Add Batch
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-5">{editingId ? "Edit Batch" : "New Batch"}</h3>
            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Batch Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Sport / Subject</label>
                  <input value={form.sportOrSubject} onChange={e => setForm(f => ({ ...f, sportOrSubject: e.target.value }))} placeholder="Cricket, Dance…"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Coach</label>
                  <select value={form.coachId} onChange={e => setForm(f => ({ ...f, coachId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">— Select —</option>
                    {coaches.filter(c => c.isActive).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Capacity *</label>
                  <input required type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fee Amount (₹) *</label>
                  <input required type="number" min={0} value={form.feeAmount} onChange={e => setForm(f => ({ ...f, feeAmount: +e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fee Cycle</label>
                  <select value={form.feeCycle} onChange={e => setForm(f => ({ ...f, feeCycle: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Start Time</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">End Time</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>

              {/* Schedule days */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Schedule Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button key={day} type="button" onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        form.scheduleDays.includes(day)
                          ? "bg-brand-500 text-white"
                          : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                      }`}>
                      {day}
                    </button>
                  ))}
                </div>
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

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading batches…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map(b => {
            const count = studentsInBatch(b.id);
            const coach = coaches.find(c => c.id === b.coachId);
            const fillPercent = b.capacity > 0 ? Math.round((count / b.capacity) * 100) : 0;
            return (
              <div key={b.id} className={`rounded-2xl border-2 p-5 bg-white dark:bg-white/[0.03] transition-all ${b.isActive ? "border-gray-200 dark:border-gray-800" : "border-dashed border-gray-200 dark:border-gray-800 opacity-60"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-white/90 text-base">{b.name}</h4>
                    {b.sportOrSubject && <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mt-1">{b.sportOrSubject}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(b)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => updateBatch(b.id, { isActive: !b.isActive })} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors">
                      {b.isActive ? <ToggleRight size={16} className="text-brand-500" /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => deleteBatch(b.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>

                {coach && <p className="text-xs text-gray-500 mb-2">Coach: <span className="font-semibold text-gray-700 dark:text-gray-200">{coach.name}</span></p>}

                {/* Capacity bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500 flex items-center gap-1"><Users size={11} />{count} / {b.capacity}</span>
                    <span className={`font-bold ${fillPercent >= 90 ? "text-red-500" : fillPercent >= 70 ? "text-warning-500" : "text-brand-500"}`}>{fillPercent}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${fillPercent >= 90 ? "bg-red-500" : fillPercent >= 70 ? "bg-warning-500" : "bg-brand-500"}`}
                      style={{ width: `${Math.min(fillPercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Schedule */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {DAYS.map(d => (
                    <span key={d} className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${b.scheduleDays.includes(d) ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400" : "bg-gray-50 dark:bg-white/5 text-gray-300 dark:text-gray-600"}`}>{d}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1"><Clock size={11} />{b.startTime || "—"} — {b.endTime || "—"}</div>
                  <div className="flex items-center gap-1 font-bold text-brand-600 dark:text-brand-400"><DollarSign size={11} />₹{b.feeAmount.toLocaleString()}/{b.feeCycle.slice(0, 3)}</div>
                </div>
              </div>
            );
          })}
          {batches.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">No batches yet. Create your first batch!</div>
          )}
        </div>
      )}
    </>
  );
}
