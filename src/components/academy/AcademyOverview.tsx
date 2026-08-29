import { useMemo } from "react";
import { Link } from "react-router";
import { useAcademy } from "../../context/AcademyContext";
import { DollarSign, Users, CheckCircle, AlertTriangle, TrendingUp, UserPlus, UserMinus } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../ui/table";
import QrKpiWidget from "../ecommerce/QrKpiWidget";

export default function AcademyOverview() {
  const { students, batches, coaches, attendance, feePayments, loading } = useAcademy();

  const todayStr = new Date().toISOString().split("T")[0];
  const monthStr = todayStr.slice(0, 7);

  const kpis = useMemo(() => {
    // ── Fee collection (TOP PRIORITY) ──
    const monthFees = feePayments.filter(f => f.dueDate.startsWith(monthStr));
    const collected = monthFees.filter(f => f.status === "paid").reduce((s, f) => s + f.amount, 0);
    const dueAmount = monthFees.filter(f => f.status === "due" || f.status === "partial").reduce((s, f) => s + f.amount, 0);
    const overdueAll = feePayments.filter(f => f.status === "overdue");
    const overdueAmount = overdueAll.reduce((s, f) => s + f.amount, 0);
    const overdueCount = overdueAll.length;

    // ── Students / enrollment ──
    const activeStudents = students.filter(s => s.isActive).length;
    const totalCapacity = batches.filter(b => b.isActive).reduce((s, b) => s + b.capacity, 0);

    // New enrollments this month (enrolled_at starts with month)
    const newEnrollments = students.filter(s => s.enrolledAt.startsWith(monthStr) && s.isActive).length;
    // Dropouts this month (inactive students — approximate, since we don't track dropout date)
    const dropouts = students.filter(s => !s.isActive).length;

    // ── Attendance ──
    // Overall attendance rate
    const totalRecords = attendance.length;
    const presentRecords = attendance.filter(a => a.status === "present" || a.status === "late").length;
    const overallAttendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

    // Per-batch attendance rate (flag < 75%)
    const batchAttendance = batches.filter(b => b.isActive).map(b => {
      const records = attendance.filter(a => a.batchId === b.id);
      if (records.length === 0) return { id: b.id, name: b.name, pct: null, studentCount: students.filter(s => s.batchId === b.id && s.isActive).length };
      const present = records.filter(a => a.status === "present" || a.status === "late").length;
      return {
        id: b.id,
        name: b.name,
        pct: Math.round((present / records.length) * 100),
        studentCount: students.filter(s => s.batchId === b.id && s.isActive).length,
      };
    });
    const lowAttendanceBatches = batchAttendance.filter(b => b.pct !== null && b.pct < 75);

    // ── Revenue by batch (from fee payments) ──
    const batchRevenue = batches.filter(b => b.isActive).map(b => {
      const batchStudentIds = students.filter(s => s.batchId === b.id).map(s => s.id);
      const rev = feePayments
        .filter(f => batchStudentIds.includes(f.studentId) && f.status === "paid")
        .reduce((s, f) => s + f.amount, 0);
      return { id: b.id, name: b.name, rev, coach: coaches.find(c => c.id === b.coachId)?.name || "—" };
    }).sort((a, b) => b.rev - a.rev);

    return {
      collected, dueAmount, overdueAmount, overdueCount,
      activeStudents, totalCapacity, newEnrollments, dropouts,
      overallAttendanceRate, batchAttendance, lowAttendanceBatches,
      batchRevenue,
    };
  }, [students, batches, coaches, attendance, feePayments, monthStr]);

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading overview…</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-20">

      {/* 1. Fee Collection KPI — TOP — full width */}
      <div className="lg:col-span-12">
        <Link to="/academy/fees" className="block rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 md:p-6 group hover:border-brand-300 dark:hover:border-brand-500/40 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-xl shadow-lg shadow-green-500/30">
                <DollarSign size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-white/90">Fee Collection — This Month</h4>
                <p className="text-xs text-gray-400">Track payments, dues, and overdue fees</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-brand-500 transition-colors"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-success-50/80 dark:bg-success-500/10 border border-success-100 dark:border-success-500/20 p-4 text-center">
              <span className="text-[10px] sm:text-xs text-success-600 dark:text-success-400 font-semibold uppercase tracking-wider block mb-1">Collected</span>
              <p className="text-xl sm:text-2xl font-black text-success-700 dark:text-success-300">₹{kpis.collected.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl bg-warning-50/80 dark:bg-warning-500/10 border border-warning-100 dark:border-warning-500/20 p-4 text-center">
              <span className="text-[10px] sm:text-xs text-warning-600 dark:text-warning-400 font-semibold uppercase tracking-wider block mb-1">Due</span>
              <p className="text-xl sm:text-2xl font-black text-warning-700 dark:text-warning-300">₹{kpis.dueAmount.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl bg-red-50/80 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 text-center">
              <span className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-semibold uppercase tracking-wider block mb-1">Overdue</span>
              <p className="text-xl sm:text-2xl font-black text-red-700 dark:text-red-300">₹{kpis.overdueAmount.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl bg-red-50/80 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 text-center">
              <span className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-semibold uppercase tracking-wider block mb-1">Overdue Students</span>
              <p className="text-xl sm:text-2xl font-black text-red-700 dark:text-red-300">{kpis.overdueCount}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Left column */}
      <div className="lg:col-span-8 flex flex-col gap-4 md:gap-6">

        {/* Attendance rate + batch warnings */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-10 h-10 bg-brand-50 dark:bg-brand-500/10 text-brand-500 rounded-xl">
              <CheckCircle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800 dark:text-white/90">Attendance</h4>
              <p className="text-xs text-gray-400">Overall & per-batch breakdown</p>
            </div>
          </div>

          <div className="flex items-center gap-6 mb-5">
            <div>
              <p className="text-4xl font-black text-gray-800 dark:text-white/90">{kpis.overallAttendanceRate}%</p>
              <p className="text-xs text-gray-400 mt-1">Overall attendance rate</p>
            </div>
            <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${kpis.overallAttendanceRate >= 75 ? "bg-success-500" : kpis.overallAttendanceRate >= 50 ? "bg-warning-500" : "bg-red-500"}`}
                style={{ width: `${kpis.overallAttendanceRate}%` }}
              />
            </div>
          </div>

          {/* Batch-level breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {kpis.batchAttendance.map(b => (
              <div key={b.id} className={`rounded-xl p-3 ${b.pct !== null && b.pct < 75 ? "bg-red-50/60 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20" : "bg-gray-50 dark:bg-white/5"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{b.name}</span>
                  {b.pct !== null && b.pct < 75 && <AlertTriangle size={11} className="text-red-400 shrink-0" />}
                </div>
                {b.pct === null ? (
                  <p className="text-xs text-gray-400 italic">No data</p>
                ) : (
                  <>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-1">
                      <div className={`h-full rounded-full ${b.pct >= 75 ? "bg-success-500" : b.pct >= 50 ? "bg-warning-500" : "bg-red-500"}`} style={{ width: `${b.pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className={`font-bold ${b.pct >= 75 ? "text-success-600" : b.pct >= 50 ? "text-warning-600" : "text-red-600"}`}>{b.pct}%</span>
                      <span className="text-gray-400">{b.studentCount} students</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {kpis.lowAttendanceBatches.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 flex items-start gap-2">
              <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400">
                <span className="font-bold">{kpis.lowAttendanceBatches.length} batch{kpis.lowAttendanceBatches.length !== 1 ? "es" : ""}</span> below 75% attendance threshold:
                {" "}{kpis.lowAttendanceBatches.map(b => b.name).join(", ")}
              </p>
            </div>
          )}
        </div>

        {/* Revenue by batch */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <TrendingUp size={16} className="text-brand-500" />
            <h3 className="text-sm font-bold text-gray-800 dark:text-white/90">Revenue by Batch (All-Time Paid)</h3>
          </div>
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Batch</TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Coach</TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Revenue</TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Bar</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {kpis.batchRevenue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-5 py-6 text-center text-gray-400 text-sm">No revenue data yet.</TableCell>
                </TableRow>
              ) : (
                kpis.batchRevenue.map((b, i) => {
                  const maxRev = kpis.batchRevenue[0]?.rev || 1;
                  const barWidth = Math.max(5, Math.round((b.rev / maxRev) * 100));
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-500 text-[10px] font-bold">{i + 1}</span>
                          {b.name}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500">{b.coach}</TableCell>
                      <TableCell className="px-5 py-3 text-sm font-bold text-brand-600 dark:text-brand-400">₹{b.rev.toLocaleString()}</TableCell>
                      <TableCell className="px-5 py-3 w-40">
                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${barWidth}%` }} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right column — stats */}
      <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6">
        <QrKpiWidget />

        {/* Active students & capacity */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500"><Users size={16} /></div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Students</span>
          </div>
          <p className="text-3xl font-black text-gray-800 dark:text-white/90">{kpis.activeStudents}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <span>of {kpis.totalCapacity} total capacity</span>
            <span className="font-bold text-brand-500">{kpis.totalCapacity > 0 ? Math.round((kpis.activeStudents / kpis.totalCapacity) * 100) : 0}%</span>
          </div>
          <div className="mt-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-brand-500 transition-all duration-500"
              style={{ width: `${kpis.totalCapacity > 0 ? Math.min(100, Math.round((kpis.activeStudents / kpis.totalCapacity) * 100)) : 0}%` }} />
          </div>
        </div>

        {/* New enrollments vs dropouts */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border-2 border-success-200 dark:border-success-500/30 bg-success-50/50 dark:bg-success-500/5 p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <UserPlus size={20} className="text-success-500" />
            </div>
            <p className="text-2xl font-black text-success-700 dark:text-success-300">{kpis.newEnrollments}</p>
            <p className="text-[10px] font-semibold text-success-600 dark:text-success-400 uppercase tracking-wider mt-0.5">New This Month</p>
          </div>
          <div className="rounded-2xl border-2 border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5 p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <UserMinus size={20} className="text-red-500" />
            </div>
            <p className="text-2xl font-black text-red-700 dark:text-red-300">{kpis.dropouts}</p>
            <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mt-0.5">Inactive</p>
          </div>
        </div>

        {/* Batches count & coaches */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-black text-gray-800 dark:text-white/90">{batches.filter(b => b.isActive).length}</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Active Batches</p>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800 dark:text-white/90">{coaches.filter(c => c.isActive).length}</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Active Coaches</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
