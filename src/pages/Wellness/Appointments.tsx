import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useWellness } from "../../context/WellnessContext";
import { Calendar, Clock, Plus, X, Phone, User, Stethoscope } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../../components/ui/table";

const STATUS_STYLES: Record<string, string> = {
  Booked: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
  InProgress: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400",
  Completed: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400",
  NoShow: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  Cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const emptyAppointment = {
  customerName: "",
  customerContact: "",
  therapistId: "",
  roomId: "",
  treatmentId: "",
  appointmentDate: new Date().toISOString().split("T")[0],
  startTime: "10:00",
  endTime: "11:00",
  status: "Booked",
  notes: "",
};

export default function WellnessAppointments() {
  const { appointments, therapists, rooms, treatments, addAppointment, updateAppointmentStatus, deleteAppointment, loading } = useWellness();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyAppointment);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const filteredAppointments = appointments.filter(a => !filterDate || a.appointmentDate === filterDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await addAppointment({
        customerName: form.customerName,
        customerContact: form.customerContact || undefined,
        therapistId: form.therapistId || undefined,
        roomId: form.roomId || undefined,
        treatmentId: form.treatmentId || undefined,
        appointmentDate: form.appointmentDate,
        startTime: form.startTime,
        endTime: form.endTime || undefined,
        status: form.status,
        notes: form.notes || undefined,
      });
      setShowForm(false);
      setForm(emptyAppointment);
    } catch (err: any) {
      setError(err.message || "Failed to save appointment");
    } finally {
      setSaving(false);
    }
  };

  const calculateEndTime = (treatmentId: string, startTime: string) => {
    const treatment = treatments.find(t => t.id === treatmentId);
    if (!treatment || !startTime) return startTime;
    const [h, m] = startTime.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setMinutes(date.getMinutes() + treatment.durationMinutes);
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div className="pb-24">
      <PageMeta title="Appointments | Wellness Center" description="Manage wellness center appointments" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white/90">Appointments</h1>
          <p className="text-sm text-gray-500">Manage client sessions and room bookings.</p>
        </div>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading appointments…</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-gray-800">
          <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No appointments found</h3>
          <p className="mt-1 text-sm text-gray-500">There are no appointments scheduled for {filterDate}.</p>
          <button
            onClick={() => { setForm({ ...emptyAppointment, appointmentDate: filterDate }); setShowForm(true); }}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors"
          >
            <Plus size={16} /> New Appointment
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Time</TableCell>
                <TableCell isHeader>Client</TableCell>
                <TableCell isHeader>Treatment & Staff</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader className="text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.map((a) => {
                const treatment = treatments.find(t => t.id === a.treatmentId);
                const therapist = therapists.find(t => t.id === a.therapistId);
                const room = rooms.find(r => r.id === a.roomId);
                
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm font-bold text-gray-800 dark:text-white/90">
                        <Clock size={14} className="text-gray-400" />
                        {a.startTime} {a.endTime ? `- ${a.endTime}` : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-gray-800 dark:text-white/90">{a.customerName}</div>
                      {a.customerContact && (
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone size={10} /> {a.customerContact}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-800 dark:text-white/90">{treatment ? treatment.name : "Consultation"}</div>
                      <div className="text-xs text-gray-500 flex flex-col gap-0.5 mt-1">
                        {therapist && <span className="flex items-center gap-1"><User size={10} /> {therapist.name}</span>}
                        {room && <span className="flex items-center gap-1"><Stethoscope size={10} /> Room: {room.name}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <select
                        value={a.status}
                        onChange={(e) => updateAppointmentStatus(a.id, e.target.value)}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold appearance-none cursor-pointer outline-none ${STATUS_STYLES[a.status] || STATUS_STYLES.Booked}`}
                      >
                        <option value="Booked">Booked</option>
                        <option value="InProgress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="NoShow">No-Show</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => deleteAppointment(a.id)} className="text-sm text-red-600 dark:text-red-400 hover:underline">
                        Delete
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => { setForm({ ...emptyAppointment, appointmentDate: filterDate }); setShowForm(true); }}
          className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-lg shadow-brand-500/30 flex items-center justify-center transition-transform hover:scale-105 z-40"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Appointment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">New Appointment</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 dark:bg-red-500/10 dark:border-red-500/20">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Client Name *</label>
                  <input
                    type="text" required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Contact</label>
                  <input
                    type="text"
                    value={form.customerContact}
                    onChange={(e) => setForm({ ...form, customerContact: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Treatment</label>
                <select
                  value={form.treatmentId}
                  onChange={(e) => {
                    const tid = e.target.value;
                    const newEndTime = calculateEndTime(tid, form.startTime);
                    setForm({ ...form, treatmentId: tid, endTime: newEndTime });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                >
                  <option value="">Select treatment</option>
                  {treatments.filter(t => t.isActive).map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.durationMinutes}m - ₹{t.price})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Therapist</label>
                  <select
                    value={form.therapistId}
                    onChange={(e) => setForm({ ...form, therapistId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  >
                    <option value="">Any Therapist</option>
                    {therapists.filter(t => t.isActive).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Room</label>
                  <select
                    value={form.roomId}
                    onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  >
                    <option value="">Any Room</option>
                    {rooms.filter(r => r.isActive).map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
                  <input
                    type="date" required
                    value={form.appointmentDate}
                    onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Start</label>
                  <input
                    type="time" required
                    value={form.startTime}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const newEndTime = calculateEndTime(form.treatmentId, newStart);
                      setForm({ ...form, startTime: newStart, endTime: newEndTime });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">End</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Notes (Internal)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500 min-h-[80px]"
                />
              </div>
            </form>
            
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-bold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save Appointment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
