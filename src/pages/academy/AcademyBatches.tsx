import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useAcademy, AcademyBatch } from "../../context/AcademyContext";
import { Users, Clock, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Calendar, AlertCircle } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CYCLE_LABELS: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
};

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

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// Detect time conflicts between two batches
function hasConflict(a: AcademyBatch, b: AcademyBatch): boolean {
  const sharedDays = a.scheduleDays.filter(d => b.scheduleDays.includes(d));
  if (sharedDays.length === 0 || !a.startTime || !a.endTime || !b.startTime || !b.endTime) return false;
  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);
  return aStart < bEnd && bStart < aEnd;
}

export default function AcademyBatches() {
  const { batches, coaches, students, addBatch, updateBatch, deleteBatch, loading } = useAcademy();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"cards" | "schedule">("cards");

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

  // KPIs
  const activeBatches = batches.filter(b => b.isActive);
  const totalCapacity = activeBatches.reduce((s, b) => s + b.capacity, 0);
  const totalEnrolled = activeBatches.reduce((s, b) => s + studentsInBatch(b.id), 0);
  const avgFill = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
  const fullBatches = activeBatches.filter(b => studentsInBatch(b.id) >= b.capacity).length;

  // Conflict detection
  const conflictingPairs: [string, string][] = [];
  for (let i = 0; i < batches.length; i++) {
    for (let j = i + 1; j < batches.length; j++) {
      const a = batches[i], b = batches[j];
      if (a.coachId && b.coachId && a.coachId === b.coachId && hasConflict(a, b)) {
        conflictingPairs.push([a.id, b.id]);
      }
    }
  }
  const conflictingIds = new Set(conflictingPairs.flat());

  return (
    <>
      <PageMeta title="Batch Scheduling — Academy" description="Manage academy batch schedules, time slots, coach assignments and capacity" />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Batch Scheduling</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Time slots · Coach assignment · Capacity caps
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setView("cards")}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${view === "cards" ? "bg-brand-500 text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
            >
              Cards
            </button>
            <button
              onClick={() => setView("schedule")}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${view === "schedule" ? "bg-brand-500 text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
            >
              Week Grid
            </button>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus size={16} /> New Batch
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Active Batches</p>
          <p className="text-2xl font-black text-gray-800 dark:text-white/90">{activeBatches.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">{batches.length} total</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Capacity</p>
          <p className="text-2xl font-black text-gray-800 dark:text-white/90">{totalCapacity}</p>
          <p className="text-xs text-gray-400 mt-0.5">{totalEnrolled} enrolled</p>
        </div>
        <div className={`rounded-2xl border p-4 ${avgFill >= 90 ? "border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5" : avgFill >= 70 ? "border-warning-200 dark:border-warning-500/30 bg-warning-50/50 dark:bg-warning-500/5" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03]"}`}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Avg Fill Rate</p>
          <p className={`text-2xl font-black ${avgFill >= 90 ? "text-red-600 dark:text-red-400" : avgFill >= 70 ? "text-warning-600 dark:text-warning-400" : "text-brand-600 dark:text-brand-400"}`}>{avgFill}%</p>
          <div className="mt-1.5 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${avgFill >= 90 ? "bg-red-500" : avgFill >= 70 ? "bg-warning-500" : "bg-brand-500"}`} style={{ width: `${avgFill}%` }} />
          </div>
        </div>
        <div className={`rounded-2xl border p-4 ${conflictingPairs.length > 0 ? "border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03]"}`}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Coach Conflicts</p>
          <p className={`text-2xl font-black ${conflictingPairs.length > 0 ? "text-red-600 dark:text-red-400" : "text-success-600 dark:text-success-400"}`}>{conflictingPairs.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">{fullBatches} full batch{fullBatches !== 1 ? "es" : ""}</p>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-1">{editingId ? "Edit Batch" : "New Batch"}</h3>
            <p className="text-xs text-gray-400 mb-5">Set time slots, assign a coach and configure capacity cap</p>
            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Batch Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Morning Cricket U-14"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Sport / Subject</label>
                  <input value={form.sportOrSubject} onChange={e => setForm(f => ({ ...f, sportOrSubject: e.target.value }))} placeholder="Cricket, Dance…"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Capacity Cap *</label>
                  <input required type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>

              {/* Coach assignment */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Assign Coach</label>
                <select value={form.coachId} onChange={e => setForm(f => ({ ...f, coachId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">— Unassigned —</option>
                  {coaches.filter(c => c.isActive).map(c => <option key={c.id} value={c.id}>{c.name}{c.specialization ? ` · ${c.specialization}` : ""}</option>)}
                </select>
              </div>

              {/* Time slot */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-3">
                <p className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Clock size={12} /> Time Slot</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Start Time</label>
                    <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">End Time</label>
                    <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                </div>
                {/* Schedule days */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Repeat on Days</label>
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
              </div>

              {/* Fee */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fee Amount (₹) *</label>
                  <input required type="number" min={0} value={form.feeAmount} onChange={e => setForm(f => ({ ...f, feeAmount: +e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Billing Cycle</label>
                  <select value={form.feeCycle} onChange={e => setForm(f => ({ ...f, feeCycle: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
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
      ) : view === "cards" ? (
        /* ── Card View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map(b => {
            const count = studentsInBatch(b.id);
            const coach = coaches.find(c => c.id === b.coachId);
            const fillPercent = b.capacity > 0 ? Math.round((count / b.capacity) * 100) : 0;
            const isFull = count >= b.capacity;
            const isConflict = conflictingIds.has(b.id);
            return (
              <div key={b.id} className={`rounded-2xl border-2 p-5 bg-white dark:bg-white/[0.03] transition-all ${
                isConflict ? "border-red-300 dark:border-red-500/40" :
                b.isActive ? "border-gray-200 dark:border-gray-800" : "border-dashed border-gray-200 dark:border-gray-800 opacity-60"
              }`}>
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-800 dark:text-white/90 text-base">{b.name}</h4>
                      {isConflict && <div title="Coach schedule conflict"><AlertCircle size={14} className="text-red-500 flex-shrink-0" /></div>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {b.sportOrSubject && (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">{b.sportOrSubject}</span>
                      )}
                      {isFull && <span className="inline-block px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 text-xs font-semibold">Full</span>}
                      {!b.isActive && <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs font-semibold">Inactive</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(b)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => updateBatch(b.id, { isActive: !b.isActive })} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors">
                      {b.isActive ? <ToggleRight size={16} className="text-brand-500" /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => deleteBatch(b.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>

                {/* Coach */}
                {coach ? (
                  <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-white/[0.03]">
                    <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-bold">
                      {coach.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{coach.name}</p>
                      {coach.specialization && <p className="text-[10px] text-gray-400">{coach.specialization}</p>}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic mb-3">No coach assigned</p>
                )}

                {/* Time slot */}
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                  <Clock size={11} />
                  <span className="font-semibold">
                    {b.startTime ? formatTime(b.startTime) : "—"} – {b.endTime ? formatTime(b.endTime) : "—"}
                  </span>
                </div>

                {/* Days */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {DAYS.map(d => (
                    <span key={d} className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${b.scheduleDays.includes(d) ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400" : "bg-gray-50 dark:bg-white/5 text-gray-300 dark:text-gray-600"}`}>{d}</span>
                  ))}
                </div>

                {/* Capacity bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500 flex items-center gap-1"><Users size={11} />{count} / {b.capacity} seats</span>
                    <span className={`font-bold ${fillPercent >= 90 ? "text-red-500" : fillPercent >= 70 ? "text-warning-500" : "text-brand-500"}`}>{fillPercent}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${fillPercent >= 90 ? "bg-red-500" : fillPercent >= 70 ? "bg-warning-500" : "bg-brand-500"}`}
                      style={{ width: `${Math.min(fillPercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Fee + Billing */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Billing cycle</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">₹{b.feeAmount.toLocaleString()} / {CYCLE_LABELS[b.feeCycle] || b.feeCycle}</span>
                </div>
              </div>
            );
          })}
          {batches.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No batches scheduled yet</p>
              <p className="text-sm mt-1">Create your first batch to get started</p>
            </div>
          )}
        </div>
      ) : (
        /* ── Week Grid View ── */
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
          <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-800">
            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Batch</div>
            {DAYS.map(d => (
              <div key={d} className="px-2 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider border-l border-gray-100 dark:border-gray-800">{d}</div>
            ))}
          </div>
          {batches.length === 0 ? (
            <div className="p-10 text-center text-gray-400">No batches to display.</div>
          ) : (
            batches.map(b => {
              const coach = coaches.find(c => c.id === b.coachId);
              const isConflict = conflictingIds.has(b.id);
              return (
                <div key={b.id} className={`grid grid-cols-8 border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${!b.isActive ? "opacity-50" : ""}`}>
                  <div className="px-4 py-3 flex flex-col justify-center gap-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">{b.name}</span>
                      {isConflict && <AlertCircle size={12} className="text-red-500 flex-shrink-0" />}
                    </div>
                    {coach && <span className="text-[10px] text-gray-400 truncate">{coach.name}</span>}
                    <span className="text-[10px] text-brand-500 font-semibold">
                      {b.startTime ? formatTime(b.startTime) : "—"} – {b.endTime ? formatTime(b.endTime) : "—"}
                    </span>
                  </div>
                  {DAYS.map(d => (
                    <div key={d} className="border-l border-gray-100 dark:border-gray-800 flex items-center justify-center py-3">
                      {b.scheduleDays.includes(d) ? (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${isConflict ? "bg-red-500" : "bg-brand-500"}`}>✓</div>
                      ) : (
                        <div className="w-3 h-px bg-gray-200 dark:bg-gray-700 rounded" />
                      )}
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </>
  );
}
