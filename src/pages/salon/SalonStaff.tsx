import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useSalon, SalonStaff as SalonStaffType } from "../../context/SalonContext";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../config/supabase";
import { Phone, Pencil, Trash2, ToggleLeft, ToggleRight, Plus, Users, CalendarCheck } from "lucide-react";

const emptyForm = { name: "", role: "", phone: "", isActive: true };

type AttendanceStatus = "Present" | "Absent" | "Late";

interface AttendanceRecord {
  id: string;
  staffId: string;
  sessionDate: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

const ATTENDANCE_STATUSES: AttendanceStatus[] = ["Present", "Absent", "Late"];

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  Present: "bg-success-500 text-white",
  Late: "bg-warning-500 text-white",
  Absent: "bg-red-500 text-white",
};

const STATUS_STYLES_INACTIVE: Record<AttendanceStatus, string> = {
  Present: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400",
  Late: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400",
  Absent: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
};

export default function SalonStaff() {
  const { staff, addStaff, updateStaff, deleteStaff, appointments, loading } = useSalon();
  const { org } = useAuth();

  const [activeTab, setActiveTab] = useState<"directory" | "attendance">("directory");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // ── Attendance state ──────────────────────────────────────────────────────
  const [attendanceDate, setAttendanceDate] = useState<string>(todayStr);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [markingStaffId, setMarkingStaffId] = useState<string | null>(null);

  const fetchAttendance = async (date: string) => {
    if (!org?.id) return;
    setAttendanceLoading(true);
    setAttendanceError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("salon_staff_attendance")
        .select("id, staff_id, session_date, status")
        .eq("organization_id", org.id)
        .eq("session_date", date);

      if (fetchError) throw fetchError;

      setAttendanceRecords(
        (data || []).map((r: any) => ({
          id: r.id,
          staffId: r.staff_id,
          sessionDate: r.session_date,
          status: r.status,
        }))
      );
    } catch (err: any) {
      console.error("Attendance fetch error:", err);
      setAttendanceError(err.message || "Failed to load attendance");
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "attendance") return;
    fetchAttendance(attendanceDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, attendanceDate, org?.id]);

  const attendanceForStaff = (staffId: string): AttendanceStatus | null =>
    attendanceRecords.find((r) => r.staffId === staffId)?.status ?? null;

  // Upsert on the (staff_id, session_date) unique constraint — marking the
  // same staff member on the same day again overwrites the prior status
  // instead of creating a duplicate row.
  const markAttendance = async (staffId: string, status: AttendanceStatus) => {
    if (!org?.id) return;
    setMarkingStaffId(staffId);
    setAttendanceError(null);
    try {
      const { data, error: upsertError } = await supabase
        .from("salon_staff_attendance")
        .upsert(
          {
            organization_id: org.id,
            staff_id: staffId,
            session_date: attendanceDate,
            status,
          },
          { onConflict: "staff_id,session_date" }
        )
        .select("id, staff_id, session_date, status")
        .single();

      if (upsertError) throw upsertError;

      setAttendanceRecords((prev) => {
        const existing = prev.find((r) => r.staffId === staffId);
        const updated: AttendanceRecord = {
          id: data.id,
          staffId: data.staff_id,
          sessionDate: data.session_date,
          status: data.status,
        };
        if (existing) {
          return prev.map((r) => (r.staffId === staffId ? updated : r));
        }
        return [...prev, updated];
      });
    } catch (err: any) {
      console.error("Attendance upsert error:", err);
      setAttendanceError(err.message || "Failed to mark attendance");
    } finally {
      setMarkingStaffId(null);
    }
  };

  const activeStaff = staff.filter((s) => s.isActive);
  const markedCount = attendanceRecords.length;

  // ── Directory logic (unchanged) ──────────────────────────────────────────
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
        {activeTab === "directory" && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus size={16} /> Add Staff
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setActiveTab("directory")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "directory"
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Users size={15} /> Directory
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "attendance"
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <CalendarCheck size={15} /> Attendance
        </button>
      </div>

      {/* Form Modal — only relevant to Directory, but kept mountable from either tab in case editingId flow is triggered elsewhere */}
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

      {/* ── Directory tab ── */}
      {activeTab === "directory" && (
        loading ? (
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
        )
      )}

      {/* ── Attendance tab ── */}
      {activeTab === "attendance" && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-white/90">Mark Attendance</h3>
              <p className="text-xs text-gray-400 mt-0.5">{markedCount} of {activeStaff.length} active staff marked</p>
            </div>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {attendanceError && (
            <p className="px-5 pt-4 text-sm text-red-500">{attendanceError}</p>
          )}

          {attendanceLoading ? (
            <div className="text-center py-16 text-gray-400">Loading attendance…</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {activeStaff.map((s, idx) => {
                const currentStatus = attendanceForStaff(s.id);
                const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                const isMarking = markingStaffId === s.id;
                return (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex items-center justify-center w-10 h-10 shrink-0 rounded-xl ${avatarColor} text-white font-bold text-sm`}>
                        {initials(s.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-white/90 truncate">{s.name}</p>
                        {s.role && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.role}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ATTENDANCE_STATUSES.map((status) => {
                        const isSelected = currentStatus === status;
                        return (
                          <button
                            key={status}
                            disabled={isMarking}
                            onClick={() => markAttendance(s.id, status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                              isSelected ? STATUS_STYLES[status] : STATUS_STYLES_INACTIVE[status]
                            }`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {activeStaff.length === 0 && (
                <div className="text-center py-16 text-gray-400">No active staff to mark attendance for.</div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}