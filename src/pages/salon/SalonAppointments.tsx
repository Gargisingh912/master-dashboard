import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useSalon, SalonAppointment } from "../../context/SalonContext";
import { Calendar, Clock, User, Phone } from "lucide-react";

const STATUS_OPTIONS = ["Booked", "InProgress", "Completed", "NoShow", "Cancelled"];

const STATUS_STYLES: Record<string, string> = {
  Booked: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
  InProgress: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400",
  Completed: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400",
  NoShow: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  Cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const emptyForm = {
  customerName: "",
  customerContact: "",
  staffId: "",
  serviceId: "",
  appointmentDate: new Date().toISOString().split("T")[0],
  startTime: "10:00",
  endTime: "",
  notes: "",
};

export default function SalonAppointments() {
  const { appointments, staff, services, addAppointment, updateAppointmentStatus, updateAppointment, deleteAppointment, loading } = useSalon();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = appointments.filter((a) => {
    const dateMatch = filterDate ? a.appointmentDate === filterDate : true;
    const statusMatch = filterStatus === "all" || a.status === filterStatus;
    return dateMatch && statusMatch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateAppointment(editingId, {
          customerName: form.customerName,
          customerContact: form.customerContact || undefined,
          staffId: form.staffId || undefined,
          serviceId: form.serviceId || undefined,
          appointmentDate: form.appointmentDate,
          startTime: form.startTime,
          endTime: form.endTime || undefined,
          notes: form.notes || undefined,
        });
      } else {
        await addAppointment({
          customerName: form.customerName,
          customerContact: form.customerContact || undefined,
          staffId: form.staffId || undefined,
          serviceId: form.serviceId || undefined,
          appointmentDate: form.appointmentDate,
          startTime: form.startTime,
          endTime: form.endTime || undefined,
          notes: form.notes || undefined,
        });
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err: any) {
      setError(err.message || "Failed to save appointment");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (a: SalonAppointment) => {
    setForm({
      customerName: a.customerName,
      customerContact: a.customerContact || "",
      staffId: a.staffId || "",
      serviceId: a.serviceId || "",
      appointmentDate: a.appointmentDate,
      startTime: a.startTime,
      endTime: a.endTime || "",
      notes: a.notes || "",
    });
    setEditingId(a.id);
    setShowForm(true);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter(a => a.appointmentDate === todayStr);
  const bookedCount = todayAppts.filter(a => a.status === "Booked").length;
  const inProgressCount = todayAppts.filter(a => a.status === "InProgress").length;
  const completedCount = todayAppts.filter(a => a.status === "Completed").length;
  const noShowCount = todayAppts.filter(a => a.status === "NoShow").length;

  return (
    <>
      <PageMeta title="Appointments — Salon" description="Manage salon appointments" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Appointments</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Walk-ins and booked appointments</p>
      </div>

      {/* Today's status bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Booked", count: bookedCount, color: "border-brand-300 bg-brand-50 dark:bg-brand-500/10" },
          { label: "In Progress", count: inProgressCount, color: "border-warning-300 bg-warning-50 dark:bg-warning-500/10" },
          { label: "Completed", count: completedCount, color: "border-success-300 bg-success-50 dark:bg-success-500/10" },
          { label: "No-Show", count: noShowCount, color: "border-red-300 bg-red-50 dark:bg-red-500/10" },
        ].map(({ label, count, color }) => (
          <div key={label} className={`rounded-2xl border-2 ${color} p-4 text-center`}>
            <p className="text-2xl font-black text-gray-800 dark:text-white/90">{count}</p>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Add button */}
      <div className="flex flex-wrap gap-3 items-center justify-between mb-5">
        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-5">
              {editingId ? "Edit Appointment" : "New Appointment"}
            </h3>
            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Customer Name *</label>
                  <input required value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Contact</label>
                  <input value={form.customerContact} onChange={e => setForm(f => ({ ...f, customerContact: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Date *</label>
                  <input required type="date" value={form.appointmentDate} onChange={e => setForm(f => ({ ...f, appointmentDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Start Time *</label>
                  <input required type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">End Time</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Staff</label>
                  <select value={form.staffId} onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">— Walk-in —</option>
                    {staff.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Service</label>
                  <select value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">— Select Service —</option>
                    {services.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name} (₹{s.price})</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                  {saving ? "Saving…" : editingId ? "Update" : "Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointments list */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Loading appointments…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">No appointments for this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-gray-800">
                <tr>
                  {["Customer", "Service", "Staff", "Date & Time", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map(a => {
                  const svc = services.find(s => s.id === a.serviceId);
                  const stf = staff.find(s => s.id === a.staffId);
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-500">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{a.customerName}</p>
                            {a.customerContact && (
                              <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} />{a.customerContact}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{svc?.name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{stf?.name || <span className="text-gray-400 italic">Walk-in</span>}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                          <Calendar size={12} className="text-gray-400" />
                          {a.appointmentDate}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Clock size={10} />
                          {a.startTime}{a.endTime ? ` – ${a.endTime}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={a.status}
                          onChange={e => updateAppointmentStatus(a.id, e.target.value)}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold border-0 focus:ring-2 focus:ring-brand-500 cursor-pointer ${STATUS_STYLES[a.status] || ""}`}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <button onClick={() => deleteAppointment(a.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                          </button>
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

      <button
        onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-brand-600 hover:shadow-xl transition-all"
      >
        <span className="text-lg leading-none">+</span> Appointment
      </button>
    </>
  );
}
