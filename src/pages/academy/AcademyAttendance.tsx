import { useState, useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useAcademy } from "../../context/AcademyContext";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

export default function AcademyAttendance() {
  const { batches, students, attendance, markAttendance, loading } = useAcademy();
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState<string | null>(null);

  // Auto-select first batch
  const activeBatches = batches.filter(b => b.isActive);
  const effectiveBatchId = selectedBatchId || activeBatches[0]?.id || "";

  // Students in this batch
  const batchStudents = useMemo(() =>
    students.filter(s => s.batchId === effectiveBatchId && s.isActive),
    [students, effectiveBatchId]
  );

  // Attendance for this date + batch
  const dateAttendance = useMemo(() => {
    const map: Record<string, string> = {};
    attendance
      .filter(a => a.batchId === effectiveBatchId && a.sessionDate === sessionDate)
      .forEach(a => { map[a.studentId] = a.status; });
    return map;
  }, [attendance, effectiveBatchId, sessionDate]);

  const presentCount = Object.values(dateAttendance).filter(s => s === "present").length;
  const absentCount = Object.values(dateAttendance).filter(s => s === "absent").length;
  const lateCount = Object.values(dateAttendance).filter(s => s === "late").length;
  const unmarkedCount = batchStudents.length - Object.keys(dateAttendance).length;

  const handleMark = async (studentId: string, status: string) => {
    setSaving(studentId);
    await markAttendance(effectiveBatchId, studentId, sessionDate, status);
    setSaving(null);
  };

  // Mark all present shortcut
  const markAllPresent = async () => {
    for (const s of batchStudents) {
      if (!dateAttendance[s.id]) {
        await markAttendance(effectiveBatchId, s.id, sessionDate, "present");
      }
    }
  };

  // Per-batch attendance summary (all time)
  const batchAttendanceSummary = useMemo(() => {
    return activeBatches.map(b => {
      const records = attendance.filter(a => a.batchId === b.id);
      if (records.length === 0) return { batchId: b.id, name: b.name, pct: null };
      const present = records.filter(a => a.status === "present" || a.status === "late").length;
      return { batchId: b.id, name: b.name, pct: Math.round((present / records.length) * 100) };
    });
  }, [activeBatches, attendance]);

  const selectedBatch = batches.find(b => b.id === effectiveBatchId);

  return (
    <>
      <PageMeta title="Attendance — Academy" description="Mark and track attendance" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Attendance</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mark attendance per session per batch</p>
      </div>

      {/* Batch attendance overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {batchAttendanceSummary.map(b => (
          <button key={b.batchId} onClick={() => setSelectedBatchId(b.batchId)}
            className={`rounded-2xl border-2 p-4 text-left transition-all ${b.batchId === effectiveBatchId ? "border-brand-400 bg-brand-50/50 dark:border-brand-500/50 dark:bg-brand-500/5" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] hover:border-gray-300"}`}>
            <p className="text-sm font-bold text-gray-800 dark:text-white/90 truncate">{b.name}</p>
            {b.pct === null ? (
              <p className="text-xs text-gray-400 mt-1 italic">No data</p>
            ) : (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-bold ${b.pct >= 75 ? "text-success-600" : b.pct >= 50 ? "text-warning-600" : "text-red-600"}`}>{b.pct}%</span>
                  {b.pct < 75 && <AlertTriangle size={12} className="text-red-400" />}
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${b.pct >= 75 ? "bg-success-500" : b.pct >= 50 ? "bg-warning-500" : "bg-red-500"}`} style={{ width: `${b.pct}%` }} />
                </div>
              </div>
            )}
          </button>
        ))}
        {activeBatches.length === 0 && (
          <div className="col-span-4 text-center py-8 text-gray-400 text-sm">No active batches. Create a batch first.</div>
        )}
      </div>

      {effectiveBatchId && (
        <>
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              {selectedBatch && (
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{selectedBatch.name}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unmarkedCount > 0 && (
                <button onClick={markAllPresent}
                  className="px-3 py-2 rounded-xl bg-success-500 hover:bg-success-600 text-white text-xs font-semibold transition-colors">
                  Mark all present ({unmarkedCount})
                </button>
              )}
            </div>
          </div>

          {/* Session stats */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            <div className="rounded-xl bg-success-50 dark:bg-success-500/10 p-3 text-center">
              <p className="text-lg font-black text-success-700 dark:text-success-300">{presentCount}</p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-success-600 dark:text-success-400">Present</p>
            </div>
            <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 text-center">
              <p className="text-lg font-black text-red-700 dark:text-red-300">{absentCount}</p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-red-600 dark:text-red-400">Absent</p>
            </div>
            <div className="rounded-xl bg-warning-50 dark:bg-warning-500/10 p-3 text-center">
              <p className="text-lg font-black text-warning-700 dark:text-warning-300">{lateCount}</p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-warning-600 dark:text-warning-400">Late</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-3 text-center">
              <p className="text-lg font-black text-gray-700 dark:text-gray-300">{unmarkedCount}</p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Unmarked</p>
            </div>
          </div>

          {/* Student list with mark buttons */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-gray-400">Loading…</div>
            ) : batchStudents.length === 0 ? (
              <div className="p-10 text-center text-gray-400">No students in this batch.</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {batchStudents.map(s => {
                  const status = dateAttendance[s.id] || null;
                  const isSaving = saving === s.id;
                  return (
                    <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center text-xs font-bold">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{s.name}</p>
                          {s.contact && <p className="text-xs text-gray-400">{s.contact}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSaving ? (
                          <span className="text-xs text-gray-400 animate-pulse">Saving…</span>
                        ) : (
                          <>
                            <button onClick={() => handleMark(s.id, "present")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${status === "present"
                                  ? "bg-success-500 text-white"
                                  : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400 hover:bg-success-50 hover:text-success-600"
                                }`}>
                              <CheckCircle size={12} /> Present
                            </button>
                            <button onClick={() => handleMark(s.id, "absent")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${status === "absent"
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400 hover:bg-red-50 hover:text-red-600"
                                }`}>
                              <XCircle size={12} /> Absent
                            </button>
                            <button onClick={() => handleMark(s.id, "late")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${status === "late"
                                  ? "bg-warning-500 text-white"
                                  : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400 hover:bg-warning-50 hover:text-warning-600"
                                }`}>
                              <Clock size={12} /> Late
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
