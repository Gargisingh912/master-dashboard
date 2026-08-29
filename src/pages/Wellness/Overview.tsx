import { useMemo } from "react";
import { Link } from "react-router";
import { useWellness } from "../../context/WellnessContext";
import { Calendar, TrendingUp, Star, Activity } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../../components/ui/table";
import QrKpiWidget from "../../components/ecommerce/QrKpiWidget";
export default function WellnessOverview() {
  const { appointments, therapists, rooms, packages, redemptions, loading } = useWellness();

  const todayStr = new Date().toISOString().split("T")[0];
  const monthStr = todayStr.slice(0, 7);

  const kpis = useMemo(() => {
    // 1. Today's Appointments
    const todayAppts = appointments.filter(a => a.appointmentDate === todayStr);
    const booked = todayAppts.filter(a => a.status === "Booked").length;
    const inProgress = todayAppts.filter(a => a.status === "InProgress").length;
    const completed = todayAppts.filter(a => a.status === "Completed").length;
    const noShow = todayAppts.filter(a => a.status === "NoShow").length;

    // 2. Therapist Utilization
    const activeTherapists = therapists.filter(t => t.isActive).length;
    const busyTherapists = new Set(todayAppts.filter(a => (a.status === "Booked" || a.status === "InProgress") && a.therapistId).map(a => a.therapistId)).size;
    const therapistUtilization = activeTherapists > 0 ? Math.round((busyTherapists / activeTherapists) * 100) : 0;

    // 3. Room Utilization
    const activeRooms = rooms.filter(r => r.isActive).length;
    const busyRooms = new Set(todayAppts.filter(a => (a.status === "Booked" || a.status === "InProgress") && a.roomId).map(a => a.roomId)).size;
    const roomUtilization = activeRooms > 0 ? Math.round((busyRooms / activeRooms) * 100) : 0;

    // 4. Repeat Client Rate
    const contactCounts: Record<string, number> = {};
    appointments.forEach(a => {
      if (a.customerContact) contactCounts[a.customerContact] = (contactCounts[a.customerContact] || 0) + 1;
    });
    const repeatCount = Object.values(contactCounts).filter(c => c > 1).length;
    const totalUnique = Object.keys(contactCounts).length;
    const repeatRate = totalUnique > 0 ? Math.round((repeatCount / totalUnique) * 100) : 0;

    // 5. Packages
    const activePackagesCount = packages.filter(p => p.isActive).length;
    const totalRedemptions = redemptions.length;

    return {
      booked, inProgress, completed, noShow,
      therapistUtilization, roomUtilization,
      repeatRate, activePackagesCount, totalRedemptions
    };
  }, [appointments, therapists, rooms, packages, redemptions, todayStr, monthStr]);

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading overview…</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-20">

      {/* Row 1: Today's Appointments */}
      <div className="lg:col-span-12">
        <Link to="/wellness/appointments" className="block rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 md:p-6 group hover:border-brand-300 dark:hover:border-brand-500/40 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-brand-50 dark:bg-brand-500/10 text-brand-500 rounded-xl">
                <Calendar size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-white/90">Today's Appointments</h4>
                <p className="text-xs text-gray-400">{todayStr}</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-brand-500 transition-colors"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/5">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">Booked</span>
              <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{kpis.booked}</p>
            </div>
            <div className="rounded-xl bg-warning-50 p-4 dark:bg-warning-500/10">
              <span className="text-xs text-warning-600 dark:text-warning-400 font-medium uppercase tracking-wider block mb-1">In Progress</span>
              <p className="mt-1 text-2xl font-bold text-warning-700 dark:text-warning-300">{kpis.inProgress}</p>
            </div>
            <div className="rounded-xl bg-success-50 p-4 dark:bg-success-500/10">
              <span className="text-xs text-success-600 dark:text-success-400 font-medium uppercase tracking-wider block mb-1">Completed</span>
              <p className="mt-1 text-2xl font-bold text-success-700 dark:text-success-300">{kpis.completed}</p>
            </div>
            <div className="rounded-xl bg-red-50 p-4 dark:bg-red-500/10">
              <span className="text-xs text-red-600 dark:text-red-400 font-medium uppercase tracking-wider block mb-1">No-Show</span>
              <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-300">{kpis.noShow}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Left Column (8/12) */}
      <div className="lg:col-span-8 flex flex-col gap-4 md:gap-6">
        
        {/* Utilization */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-xl">
              <Activity size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800 dark:text-white/90">Utilization Today</h4>
              <p className="text-xs text-gray-400">Therapists and Rooms</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Therapists</span>
                <span className="text-2xl font-black text-gray-800 dark:text-white/90">{kpis.therapistUtilization}%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${kpis.therapistUtilization > 80 ? "bg-success-500" : kpis.therapistUtilization > 50 ? "bg-warning-500" : "bg-indigo-500"}`}
                  style={{ width: `${kpis.therapistUtilization}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Rooms</span>
                <span className="text-2xl font-black text-gray-800 dark:text-white/90">{kpis.roomUtilization}%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${kpis.roomUtilization > 80 ? "bg-success-500" : kpis.roomUtilization > 50 ? "bg-warning-500" : "bg-indigo-500"}`}
                  style={{ width: `${kpis.roomUtilization}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-brand-500" />
              <h3 className="text-sm font-bold text-gray-800 dark:text-white/90">Upcoming Today</h3>
            </div>
            <Link to="/wellness/appointments" className="text-xs text-brand-500 hover:underline">View All</Link>
          </div>
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Time</TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Client</TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Status</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {appointments.filter(a => a.appointmentDate === todayStr && a.status === "Booked").slice(0, 5).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="px-5 py-6 text-center text-gray-400 text-sm">No upcoming appointments today.</TableCell>
                </TableRow>
              ) : (
                appointments.filter(a => a.appointmentDate === todayStr && a.status === "Booked").slice(0, 5).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                      {a.startTime} {a.endTime ? `- ${a.endTime}` : ''}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-white/90">{a.customerName}</TableCell>
                    <TableCell className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                        Booked
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

      </div>

      {/* Right Column (4/12) */}
      <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6">
        <QrKpiWidget />
        {/* Repeat Client Rate */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-500"><Star size={16} /></div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Repeat Clients</span>
          </div>
          <p className="text-3xl font-black text-gray-800 dark:text-white/90">{kpis.repeatRate}%</p>
          <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-purple-500 transition-all duration-500" style={{ width: `${kpis.repeatRate}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">of clients visit more than once</p>
        </div>

        {/* Packages Stats */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-green-50 dark:bg-green-500/10 text-green-500"><TrendingUp size={16} /></div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Packages</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-black text-gray-800 dark:text-white/90">{kpis.activePackagesCount}</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Active</p>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800 dark:text-white/90">{kpis.totalRedemptions}</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Redemptions</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
