import { useState, useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useAcademy, AcademyFeePayment } from "../../context/AcademyContext";
import { DollarSign, Calendar, Plus, CheckCircle, AlertTriangle, Clock, Pencil, Trash2 } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400",
  due: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400",
  overdue: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  partial: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  paid: <CheckCircle size={12} />,
  due: <Clock size={12} />,
  overdue: <AlertTriangle size={12} />,
  partial: <DollarSign size={12} />,
};

const emptyForm = { studentId: "", amount: 0, dueDate: "", paidDate: "", status: "due", paymentMethod: "" };

export default function AcademyFees() {
  const { feePayments, students, batches, addFeePayment, markFeePaid, updateFeePayment, deleteFeePayment, loading } = useAcademy();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const todayStr = new Date().toISOString().split("T")[0];
  const monthStr = todayStr.slice(0, 7);

  // KPI summaries
  const kpis = useMemo(() => {
    const monthFees = feePayments.filter(f => f.dueDate.startsWith(monthStr));
    const collected = monthFees.filter(f => f.status === "paid").reduce((s, f) => s + f.amount, 0);
    const dueAmount = monthFees.filter(f => f.status === "due" || f.status === "partial").reduce((s, f) => s + f.amount, 0);
    const overdueAll = feePayments.filter(f => f.status === "overdue");
    const overdueAmount = overdueAll.reduce((s, f) => s + f.amount, 0);
    const overdueCount = overdueAll.length;
    return { collected, dueAmount, overdueAmount, overdueCount };
  }, [feePayments, monthStr]);

  const filtered = useMemo(() => {
    return feePayments
      .filter(f => filterStatus === "all" || f.status === filterStatus)
      .sort((a, b) => {
        // Show overdue first, then due, then partial, then paid
        const order: Record<string, number> = { overdue: 0, due: 1, partial: 2, paid: 3 };
        return (order[a.status] ?? 4) - (order[b.status] ?? 4);
      });
  }, [feePayments, filterStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateFeePayment(editingId, {
          studentId: form.studentId,
          amount: form.amount,
          dueDate: form.dueDate,
          paidDate: form.paidDate || undefined,
          status: form.status,
          paymentMethod: form.paymentMethod || undefined,
        });
      } else {
        await addFeePayment({
          studentId: form.studentId,
          amount: form.amount,
          dueDate: form.dueDate,
          paidDate: form.paidDate || undefined,
          status: form.status,
          paymentMethod: form.paymentMethod || undefined,
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

  const startEdit = (f: AcademyFeePayment) => {
    setForm({
      studentId: f.studentId,
      amount: f.amount,
      dueDate: f.dueDate,
      paidDate: f.paidDate || "",
      status: f.status,
      paymentMethod: f.paymentMethod || "",
    });
    setEditingId(f.id);
    setShowForm(true);
  };

  const handleMarkPaid = async (id: string) => {
    await markFeePaid(id, todayStr, "Cash");
  };

  return (
    <>
      <PageMeta title="Fee Payments — Academy" description="Manage student fee payments" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Fee Payments</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and collect student fees</p>
      </div>

      {/* KPI cards — fee collection first */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border-2 border-success-200 dark:border-success-500/30 bg-success-50/50 dark:bg-success-500/5 p-4">
          <p className="text-xs font-semibold text-success-600 dark:text-success-400 uppercase tracking-wider mb-1">Collected (This Month)</p>
          <p className="text-2xl font-black text-success-700 dark:text-success-300">₹{kpis.collected.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border-2 border-warning-200 dark:border-warning-500/30 bg-warning-50/50 dark:bg-warning-500/5 p-4">
          <p className="text-xs font-semibold text-warning-600 dark:text-warning-400 uppercase tracking-wider mb-1">Due (This Month)</p>
          <p className="text-2xl font-black text-warning-700 dark:text-warning-300">₹{kpis.dueAmount.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border-2 border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5 p-4">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Overdue Amount</p>
          <p className="text-2xl font-black text-red-700 dark:text-red-300">₹{kpis.overdueAmount.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border-2 border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5 p-4">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Overdue Count</p>
          <p className="text-2xl font-black text-red-700 dark:text-red-300">{kpis.overdueCount}</p>
          <p className="text-xs text-red-500 mt-0.5">student{kpis.overdueCount !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filters + Add */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex gap-2">
          {["all", "overdue", "due", "partial", "paid"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${filterStatus === s ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"}`}>
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Add Fee Entry
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-5">{editingId ? "Edit Fee Entry" : "Add Fee Entry"}</h3>
            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Student *</label>
                <select required value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">— Select —</option>
                  {students.filter(s => s.isActive).map(s => {
                    const batch = batches.find(b => b.id === s.batchId);
                    return <option key={s.id} value={s.id}>{s.name}{batch ? ` (${batch.name})` : ""}</option>;
                  })}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Amount (₹) *</label>
                  <input required type="number" min={0} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Due Date *</label>
                  <input required type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="due">Due</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Payment Method</label>
                  <input value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} placeholder="Cash, UPI…"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50">{saving ? "Saving…" : editingId ? "Update" : "Add"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading fee payments…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No fee entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-gray-800">
                <tr>
                  {["Student", "Batch", "Amount", "Due Date", "Paid Date", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map(f => {
                  const student = students.find(s => s.id === f.studentId);
                  const batch = batches.find(b => b.id === student?.batchId);
                  const isOverdue = f.status !== "paid" && f.dueDate < todayStr;
                  return (
                    <tr key={f.id} className={`hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors ${isOverdue && f.status !== "overdue" ? "bg-red-50/30 dark:bg-red-500/5" : ""}`}>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-white/90">{student?.name || "Unknown"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{batch?.name || "—"}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-800 dark:text-white/90">₹{f.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar size={12} />{f.dueDate}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{f.paidDate || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[f.status] || ""}`}>
                          {STATUS_ICONS[f.status]} {f.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {f.status !== "paid" && (
                            <button onClick={() => handleMarkPaid(f.id)}
                              className="px-2 py-1 rounded-lg bg-success-50 dark:bg-success-500/10 text-success-600 dark:text-success-400 text-xs font-semibold hover:bg-success-100 transition-colors flex items-center gap-1">
                              <CheckCircle size={11} /> Pay
                            </button>
                          )}
                          <button onClick={() => startEdit(f)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => deleteFeePayment(f.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
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
