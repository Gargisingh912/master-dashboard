import { useState, useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useAcademy, AcademyFeePayment } from "../../context/AcademyContext";
import {
  DollarSign, Calendar, Plus, CheckCircle, AlertTriangle, Clock,
  Pencil, Trash2, Bell, TrendingUp, RefreshCw,
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  paid:    "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400",
  due:     "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400",
  overdue: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  partial: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  paid:    <CheckCircle size={12} />,
  due:     <Clock size={12} />,
  overdue: <AlertTriangle size={12} />,
  partial: <DollarSign size={12} />,
};

const CYCLE_LABELS: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
};

const emptyForm = { studentId: "", amount: 0, dueDate: "", paidDate: "", status: "due", paymentMethod: "", billingCycle: "monthly" };

export default function AcademyFees() {
  const { feePayments, students, batches, addFeePayment, markFeePaid, updateFeePayment, deleteFeePayment, loading } = useAcademy();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const monthStr = todayStr.slice(0, 7);

  // KPIs
  const kpis = useMemo(() => {
    const monthFees    = feePayments.filter(f => f.dueDate.startsWith(monthStr));
    const collected    = monthFees.filter(f => f.status === "paid").reduce((s, f) => s + f.amount, 0);
    const dueAmount    = monthFees.filter(f => f.status === "due" || f.status === "partial").reduce((s, f) => s + f.amount, 0);
    const overdueAll   = feePayments.filter(f => f.status === "overdue");
    const overdueAmount = overdueAll.reduce((s, f) => s + f.amount, 0);
    const overdueCount = overdueAll.length;
    const partialAll   = feePayments.filter(f => f.status === "partial");
    const partialAmount = partialAll.reduce((s, f) => s + f.amount, 0);
    const collectionRate = (collected + partialAmount) > 0 && (collected + dueAmount + overdueAmount + partialAmount) > 0
      ? Math.round(((collected + partialAmount) / (collected + dueAmount + overdueAmount + partialAmount)) * 100)
      : 0;
    // Due in next 7 days
    const sevenDays = new Date();
    sevenDays.setDate(sevenDays.getDate() + 7);
    const soonStr = sevenDays.toISOString().split("T")[0];
    const dueSoon = feePayments.filter(f => f.status !== "paid" && f.dueDate >= todayStr && f.dueDate <= soonStr).length;
    return { collected, dueAmount, overdueAmount, overdueCount, partialAmount, collectionRate, dueSoon };
  }, [feePayments, monthStr, todayStr]);

  // Batch billing schedule (recurring)
  const batchBillingRows = useMemo(() => {
    return batches
      .filter(b => b.isActive)
      .map(b => {
        const enrolled = students.filter(s => s.batchId === b.id && s.isActive).length;
        const monthlyRev = enrolled * (b.feeCycle === "monthly" ? b.feeAmount : b.feeCycle === "quarterly" ? b.feeAmount / 3 : b.feeAmount / 12);
        return { batch: b, enrolled, monthlyRev };
      });
  }, [batches, students]);

  const filtered = useMemo(() => {
    return feePayments
      .filter(f => {
        if (filterStatus !== "all" && f.status !== filterStatus) return false;
        if (search) {
          const student = students.find(s => s.id === f.studentId);
          if (!student?.name.toLowerCase().includes(search.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const order: Record<string, number> = { overdue: 0, due: 1, partial: 2, paid: 3 };
        return (order[a.status] ?? 4) - (order[b.status] ?? 4);
      });
  }, [feePayments, filterStatus, search, students]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let finalPaidDate = form.paidDate || undefined;
      if (!finalPaidDate && (form.status === "paid" || form.status === "partial")) {
        finalPaidDate = todayStr;
      }
      
      if (editingId) {
        await updateFeePayment(editingId, {
          studentId: form.studentId,
          amount: form.amount,
          dueDate: form.dueDate,
          paidDate: finalPaidDate,
          status: form.status,
          paymentMethod: form.paymentMethod || undefined,
        });
      } else {
        await addFeePayment({
          studentId: form.studentId,
          amount: form.amount,
          dueDate: form.dueDate,
          paidDate: finalPaidDate,
          status: form.status,
          paymentMethod: form.paymentMethod || undefined,
        });
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setStudentSearch("");
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (f: AcademyFeePayment) => {
    const st = students.find(s => s.id === f.studentId);
    setStudentSearch(st?.name || "");
    setForm({
      studentId: f.studentId,
      amount: f.amount,
      dueDate: f.dueDate,
      paidDate: f.paidDate || "",
      status: f.status,
      paymentMethod: f.paymentMethod || "",
      billingCycle: "monthly",
    });
    setEditingId(f.id);
    setShowForm(true);
  };

  const handleMarkPaid = async (id: string) => {
    await markFeePaid(id, todayStr, "Cash");
  };

  // Days until due
  const daysUntilDue = (dueDate: string) => {
    const diff = Math.ceil((new Date(dueDate).getTime() - new Date(todayStr).getTime()) / 86400000);
    return diff;
  };

  return (
    <>
      <PageMeta title="Fee Management — Academy" description="Recurring billing, due reminders and partial payment tracking" />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Fee Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Recurring billing · Due reminders · Partial payments
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); setStudentSearch(""); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Add Fee Entry
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Collected */}
        <div className="rounded-2xl border-2 border-success-200 dark:border-success-500/30 bg-success-50/50 dark:bg-success-500/5 p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={13} className="text-success-500" />
            <p className="text-xs font-semibold text-success-600 dark:text-success-400 uppercase tracking-wider">Collected (This Month)</p>
          </div>
          <p className="text-2xl font-black text-success-700 dark:text-success-300">₹{kpis.collected.toLocaleString()}</p>
          <div className="mt-2 h-1.5 bg-success-100 dark:bg-success-500/20 rounded-full overflow-hidden">
            <div className="h-full bg-success-500 rounded-full transition-all duration-700" style={{ width: `${kpis.collectionRate}%` }} />
          </div>
          <p className="text-xs text-success-600/70 mt-1">{kpis.collectionRate}% collection rate</p>
        </div>

        {/* Due */}
        <div className="rounded-2xl border-2 border-warning-200 dark:border-warning-500/30 bg-warning-50/50 dark:bg-warning-500/5 p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={13} className="text-warning-500" />
            <p className="text-xs font-semibold text-warning-600 dark:text-warning-400 uppercase tracking-wider">Due (This Month)</p>
          </div>
          <p className="text-2xl font-black text-warning-700 dark:text-warning-300">₹{kpis.dueAmount.toLocaleString()}</p>
          {kpis.dueSoon > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Bell size={10} className="text-warning-500" />
              <p className="text-xs text-warning-600">{kpis.dueSoon} due within 7 days</p>
            </div>
          )}
        </div>

        {/* Partial */}
        <div className="rounded-2xl border-2 border-purple-200 dark:border-purple-500/30 bg-purple-50/50 dark:bg-purple-500/5 p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign size={13} className="text-purple-500" />
            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Partial Payments</p>
          </div>
          <p className="text-2xl font-black text-purple-700 dark:text-purple-300">₹{kpis.partialAmount.toLocaleString()}</p>
          <p className="text-xs text-purple-500 mt-0.5">{feePayments.filter(f => f.status === "partial").length} entries</p>
        </div>

        {/* Overdue */}
        <div className={`rounded-2xl border-2 p-4 ${kpis.overdueCount > 0 ? "border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03]"}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={13} className={kpis.overdueCount > 0 ? "text-red-500" : "text-gray-400"} />
            <p className={`text-xs font-semibold uppercase tracking-wider ${kpis.overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400"}`}>Overdue</p>
          </div>
          <p className={`text-2xl font-black ${kpis.overdueCount > 0 ? "text-red-700 dark:text-red-300" : "text-gray-600 dark:text-gray-400"}`}>₹{kpis.overdueAmount.toLocaleString()}</p>
          <p className={`text-xs mt-0.5 ${kpis.overdueCount > 0 ? "text-red-500" : "text-gray-400"}`}>{kpis.overdueCount} student{kpis.overdueCount !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Recurring Billing Schedule */}
      {batchBillingRows.length > 0 && (
        <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <RefreshCw size={14} className="text-brand-500" />
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Recurring Billing Schedule</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr>
                  {["Batch", "Billing Cycle", "Fee / Student", "Enrolled", "Est. Monthly Revenue"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {batchBillingRows.map(({ batch, enrolled, monthlyRev }) => (
                  <tr key={batch.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{batch.name}</p>
                      {batch.sportOrSubject && <p className="text-xs text-gray-400">{batch.sportOrSubject}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold">
                        <RefreshCw size={9} /> {CYCLE_LABELS[batch.feeCycle] || batch.feeCycle}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-800 dark:text-white/90">₹{batch.feeAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{enrolled} / {batch.capacity}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-black text-success-600 dark:text-success-400">₹{Math.round(monthlyRev).toLocaleString()}</span>
                      <span className="text-xs text-gray-400 ml-1">/mo</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search student…"
          className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 w-48"
        />
        <div className="flex gap-2">
          {["all", "overdue", "due", "partial", "paid"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${filterStatus === s ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-1">{editingId ? "Edit Fee Entry" : "Add Fee Entry"}</h3>
            <p className="text-xs text-gray-400 mb-5">Record recurring/monthly/quarterly billing or mark partial payment</p>
            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Student *</label>
                <input
                  type="text"
                  required={!form.studentId}
                  value={studentSearch}
                  onChange={e => {
                    setStudentSearch(e.target.value);
                    setShowStudentDropdown(true);
                    if (e.target.value === "") setForm(f => ({ ...f, studentId: "" }));
                  }}
                  onFocus={() => setShowStudentDropdown(true)}
                  onBlur={() => setTimeout(() => setShowStudentDropdown(false), 200)}
                  placeholder="Type to search student…"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {showStudentDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {students.filter(s => s.isActive && (studentSearch === "" || s.name.toLowerCase().includes(studentSearch.toLowerCase()))).length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-400">No students found</div>
                    ) : (
                      students.filter(s => s.isActive && (studentSearch === "" || s.name.toLowerCase().includes(studentSearch.toLowerCase()))).map(s => {
                        const batch = batches.find(b => b.id === s.batchId);
                        return (
                          <div
                            key={s.id}
                            className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-750 cursor-pointer text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800 last:border-0"
                            onClick={() => {
                              const sid = s.id;
                              setStudentSearch(s.name);
                              setForm(f => ({ ...f, studentId: sid }));
                              setShowStudentDropdown(false);
                              if (sid && !editingId) {
                                const student = students.find(st => st.id === sid);
                                const b = batches.find(bt => bt.id === student?.batchId);
                                
                                let newAmount = form.amount;
                                if (b && form.amount === 0) {
                                  newAmount = b.feeAmount;
                                }
                                
                                if (student && student.enrolledAt) {
                                  const parts = student.enrolledAt.split("-");
                                  if (parts.length === 3) {
                                    const day = parseInt(parts[2], 10);
                                    const today = new Date();
                                    const d = new Date(today.getFullYear(), today.getMonth(), day);
                                    
                                    if (today.getDate() - day > 15) {
                                      d.setMonth(d.getMonth() + 1);
                                    }
                                    
                                    const y = d.getFullYear();
                                    const m = String(d.getMonth() + 1).padStart(2, "0");
                                    const dy = String(d.getDate()).padStart(2, "0");
                                    
                                    setForm(f => ({ ...f, dueDate: `${y}-${m}-${dy}`, amount: newAmount, studentId: sid }));
                                  } else {
                                    setForm(f => ({ ...f, amount: newAmount, studentId: sid }));
                                  }
                                } else {
                                  setForm(f => ({ ...f, amount: newAmount, studentId: sid }));
                                }
                              }
                            }}
                          >
                            <span className="font-semibold">{s.name}</span>
                            {batch && <span className="text-gray-400 text-xs ml-1">· {batch.name}</span>}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
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
                  <input value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} placeholder="Cash, UPI, Cheque…"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                {(form.status === "paid" || form.status === "partial") && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Paid Date</label>
                    <input type="date" value={form.paidDate} onChange={e => setForm(f => ({ ...f, paidDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                )}
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
                  {["Student", "Batch", "Amount", "Due Date", "Paid Date", "Method", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map(f => {
                  const student  = students.find(s => s.id === f.studentId);
                  const batch    = batches.find(b => b.id === student?.batchId);
                  const days     = daysUntilDue(f.dueDate);
                  const isSoon   = f.status !== "paid" && days >= 0 && days <= 7;
                  const isHighlight = f.status === "overdue" || isSoon;
                  return (
                    <tr key={f.id} className={`hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors ${isHighlight ? "bg-red-50/30 dark:bg-red-500/5" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{student?.name || "Unknown"}</p>
                        {student?.contact && <p className="text-xs text-gray-400">{student.contact}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{batch?.name || "—"}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-800 dark:text-white/90">₹{f.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar size={12} />{f.dueDate}
                        </div>
                        {isSoon && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Bell size={10} className="text-warning-500" />
                            <span className="text-[10px] text-warning-600 font-semibold">Due in {days}d</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{f.paidDate || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{f.paymentMethod || "—"}</td>
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
