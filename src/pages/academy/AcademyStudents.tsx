import { useState, useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useAcademy, AcademyStudent } from "../../context/AcademyContext";
import { User, Mail, Phone, Calendar, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

const emptyForm = {
  name: "", contact: "", email: "", dob: "", guardianName: "", guardianContact: "",
  batchId: "", enrolledAt: new Date().toISOString().split("T")[0], isActive: true,
};

export default function AcademyStudents() {
  const { students, batches, attendance, feePayments, addStudent, updateStudent, deleteStudent, loading } = useAcademy();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterBatch, setFilterBatch] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return students.filter(s => {
      if (filterBatch !== "all" && s.batchId !== filterBatch) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [students, filterBatch, search]);

  // Compute per-student attendance %
  const getAttendancePercent = (studentId: string) => {
    const records = attendance.filter(a => a.studentId === studentId);
    if (records.length === 0) return null;
    const present = records.filter(a => a.status === "present" || a.status === "late").length;
    return Math.round((present / records.length) * 100);
  };

  // Fee status
  const getFeeStatus = (studentId: string) => {
    const fees = feePayments.filter(f => f.studentId === studentId);
    const overdue = fees.filter(f => f.status === "overdue").length;
    const due = fees.filter(f => f.status === "due").length;
    if (overdue > 0) return { label: "Overdue", color: "text-red-500 bg-red-50 dark:bg-red-500/10" };
    if (due > 0) return { label: "Due", color: "text-warning-600 bg-warning-50 dark:bg-warning-500/10" };
    return { label: "Clear", color: "text-success-600 bg-success-50 dark:bg-success-500/10" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data = {
        name: form.name,
        contact: form.contact || undefined,
        email: form.email || undefined,
        dob: form.dob || undefined,
        guardianName: form.guardianName || undefined,
        guardianContact: form.guardianContact || undefined,
        batchId: form.batchId || undefined,
        enrolledAt: form.enrolledAt,
        isActive: form.isActive,
      };
      if (editingId) {
        await updateStudent(editingId, data);
      } else {
        await addStudent(data);
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

  const startEdit = (s: AcademyStudent) => {
    setForm({
      name: s.name, contact: s.contact || "", email: s.email || "", dob: s.dob || "",
      guardianName: s.guardianName || "", guardianContact: s.guardianContact || "",
      batchId: s.batchId || "", enrolledAt: s.enrolledAt, isActive: s.isActive,
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  return (
    <>
      <PageMeta title="Students — Academy" description="Manage academy students" />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Students</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{students.length} enrolled · {students.filter(s => s.isActive).length} active</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 w-56"
        />
        <select
          value={filterBatch}
          onChange={e => setFilterBatch(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">All Batches</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-5">{editingId ? "Edit Student" : "Enroll Student"}</h3>
            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Contact</label>
                  <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Date of Birth</label>
                  <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Batch</label>
                  <select value={form.batchId} onChange={e => setForm(f => ({ ...f, batchId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">— No batch —</option>
                    {batches.filter(b => b.isActive).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Guardian Name</label>
                  <input value={form.guardianName} onChange={e => setForm(f => ({ ...f, guardianName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Guardian Contact</label>
                  <input value={form.guardianContact} onChange={e => setForm(f => ({ ...f, guardianContact: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Enrolled Date</label>
                  <input type="date" value={form.enrolledAt} onChange={e => setForm(f => ({ ...f, enrolledAt: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
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
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50">{saving ? "Saving…" : editingId ? "Update" : "Enroll"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading students…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No students found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-gray-800">
                <tr>
                  {["Student", "Batch", "Guardian", "Attendance", "Fee Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map(s => {
                  const batch = batches.find(b => b.id === s.batchId);
                  const attPct = getAttendancePercent(s.id);
                  const feeStatus = getFeeStatus(s.id);
                  return (
                    <tr key={s.id} className={`hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors ${!s.isActive ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center"><User size={14} /></div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{s.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              {s.contact && <span className="flex items-center gap-0.5"><Phone size={9} />{s.contact}</span>}
                              {s.email && <span className="flex items-center gap-0.5"><Mail size={9} />{s.email}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{batch?.name || <span className="text-gray-400 italic">Unassigned</span>}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {s.guardianName || "—"}
                        {s.guardianContact && <span className="block text-xs text-gray-400">{s.guardianContact}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {attPct === null ? (
                          <span className="text-xs text-gray-400 italic">No data</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${attPct >= 75 ? "bg-success-500" : attPct >= 50 ? "bg-warning-500" : "bg-red-500"}`}
                                style={{ width: `${attPct}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${attPct >= 75 ? "text-success-600" : attPct >= 50 ? "text-warning-600" : "text-red-600"}`}>{attPct}%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${feeStatus.color}`}>{feeStatus.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => updateStudent(s.id, { isActive: !s.isActive })} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors">
                            {s.isActive ? <ToggleRight size={14} className="text-brand-500" /> : <ToggleLeft size={14} />}
                          </button>
                          <button onClick={() => deleteStudent(s.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
