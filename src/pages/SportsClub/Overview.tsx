import { useMemo } from "react";
import { Link } from "react-router";
import { useSportsClub } from "../../context/SportsClubContext";
import { Users, AlertTriangle, Calendar, Activity, DollarSign } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../../components/ui/table";

export default function SportsClubOverview() {
  const { members, facilities, checkins, bookings, dues, loading } = useSportsClub();

  const todayStr = new Date().toISOString().split("T")[0];
  const monthStr = todayStr.slice(0, 7);

  const kpis = useMemo(() => {
    // 1. Members
    const activeMembers = members.filter(m => m.isActive).length;
    const expiringThisMonth = members.filter(m => m.isActive && m.membershipEnd && m.membershipEnd.startsWith(monthStr)).length;
    const newMembersThisMonth = members.filter(m => m.membershipStart && m.membershipStart.startsWith(monthStr)).length;
    
    // 2. Facility Utilization (Check-ins & Bookings)
    const todayCheckins = checkins.filter(c => c.checkinTime.startsWith(todayStr)).length;
    const todayBookings = bookings.filter(b => b.bookingDate === todayStr).length;

    // Revenue from dues
    const monthDues = dues.filter(d => d.dueDate.startsWith(monthStr));
    const collectedDues = monthDues.filter(d => d.isPaid).reduce((sum, d) => sum + d.amount, 0);
    const pendingDues = monthDues.filter(d => !d.isPaid).reduce((sum, d) => sum + d.amount, 0);

    // Facility Utilization Breakdowns
    const facilityBookingsMap = bookings.filter(b => b.bookingDate.startsWith(monthStr)).reduce((acc, b) => {
        acc[b.facilityId] = (acc[b.facilityId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topFacilities = facilities.map(f => ({
        id: f.id,
        name: f.name,
        bookingCount: facilityBookingsMap[f.id] || 0
    })).sort((a, b) => b.bookingCount - a.bookingCount).slice(0, 5);

    return {
      activeMembers, expiringThisMonth, newMembersThisMonth,
      todayCheckins, todayBookings,
      collectedDues, pendingDues, topFacilities
    };
  }, [members, facilities, checkins, bookings, dues, todayStr, monthStr]);

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading overview…</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-20">

      {/* Row 1: Active vs Expiring */}
      <div className="lg:col-span-12">
        <Link to="/sports-club/members" className="block rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 md:p-6 group hover:border-brand-300 dark:hover:border-brand-500/40 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-brand-50 dark:bg-brand-500/10 text-brand-500 rounded-xl">
                <Users size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-white/90">Membership Overview</h4>
                <p className="text-xs text-gray-400">This Month</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-brand-500 transition-colors"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/5">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">Active Members</span>
              <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{kpis.activeMembers}</p>
            </div>
            <div className="rounded-xl bg-success-50 p-4 dark:bg-success-500/10">
              <span className="text-xs text-success-600 dark:text-success-400 font-medium uppercase tracking-wider block mb-1">New Sign-ups</span>
              <p className="mt-1 text-2xl font-bold text-success-700 dark:text-success-300">{kpis.newMembersThisMonth}</p>
            </div>
            <div className="rounded-xl bg-warning-50 p-4 dark:bg-warning-500/10">
              <span className="text-xs text-warning-600 dark:text-warning-400 font-medium uppercase tracking-wider block mb-1">Expiring This Month</span>
              <p className="mt-1 text-2xl font-bold text-warning-700 dark:text-warning-300">{kpis.expiringThisMonth}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Left column (8/12) */}
      <div className="lg:col-span-8 flex flex-col gap-4 md:gap-6">
        
        {/* Facility Utilization & Check-ins */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-50 dark:bg-purple-500/10 text-purple-500 rounded-xl">
              <Activity size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800 dark:text-white/90">Activity Today</h4>
              <p className="text-xs text-gray-400">Check-ins & Bookings</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-4">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Today's Check-ins</p>
              <p className="text-2xl font-black text-gray-800 dark:text-white/90">{kpis.todayCheckins}</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-4">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Today's Bookings</p>
              <p className="text-2xl font-black text-gray-800 dark:text-white/90">{kpis.todayBookings}</p>
            </div>
          </div>
        </div>

        {/* Top Facilities Table */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <Calendar size={16} className="text-brand-500" />
            <h3 className="text-sm font-bold text-gray-800 dark:text-white/90">Top Facilities (This Month)</h3>
          </div>
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Facility</TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase text-right">Bookings</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {kpis.topFacilities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="px-5 py-6 text-center text-gray-400 text-sm">No booking data yet.</TableCell>
                </TableRow>
              ) : (
                kpis.topFacilities.map((f, i) => (
                  <TableRow key={f.id}>
                    <TableCell className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-500 text-[10px] font-bold">{i + 1}</span>
                        {f.name}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-sm font-bold text-gray-600 dark:text-gray-400 text-right">{f.bookingCount}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

      </div>

      {/* Right column (4/12) */}
      <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6">
        
        {/* Dues Overview */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-green-50 dark:bg-green-500/10 text-green-500"><DollarSign size={16} /></div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Collected Dues</span>
          </div>
          <p className="text-3xl font-black text-gray-800 dark:text-white/90">₹{kpis.collectedDues.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">this month</p>
        </div>

        <div className={`rounded-2xl border-2 p-5 ${kpis.pendingDues > 0 ? "border-red-300 dark:border-red-500/40 bg-red-50/50 dark:bg-red-500/5" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03]"}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 flex items-center justify-center rounded-xl ${kpis.pendingDues > 0 ? "bg-red-100 text-red-500" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
              <AlertTriangle size={16} />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Dues</span>
            {kpis.pendingDues > 0 && <span className="ml-auto text-xs text-red-500 font-semibold">⚠ Action Req</span>}
          </div>
          <p className={`text-3xl font-black ${kpis.pendingDues > 0 ? "text-red-600 dark:text-red-400" : "text-gray-800 dark:text-white/90"}`}>₹{kpis.pendingDues.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">unpaid this month</p>
        </div>

      </div>

    </div>
  );
}
