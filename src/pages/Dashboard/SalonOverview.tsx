import { useMemo } from "react";
import { Link } from "react-router";
import { useSalon } from "../../context/SalonContext";
import { Calendar, TrendingUp, Users, Star, AlertTriangle } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../../components/ui/table";
import IncomingQrAppointments from "../../components/salon/IncomingQrAppointments";

export default function SalonOverview() {
  const { appointments, staff, services, bills, loading } = useSalon();

  const todayStr = new Date().toISOString().split("T")[0];
  const monthStr = todayStr.slice(0, 7);

  const kpis = useMemo(() => {
    const todayAppts = appointments.filter(a => a.appointmentDate === todayStr);
    const booked = todayAppts.filter(a => a.status === "Booked").length;
    const inProgress = todayAppts.filter(a => a.status === "InProgress").length;
    const completed = todayAppts.filter(a => a.status === "Completed").length;
    const noShow = todayAppts.filter(a => a.status === "NoShow").length;

    // Revenue
    const todayBills = bills.filter(b => b.createdAt.startsWith(todayStr));
    const monthBills = bills.filter(b => b.createdAt.startsWith(monthStr));
    const revenueToday = todayBills.reduce((s, b) => s + b.total, 0);
    const revenueMonth = monthBills.reduce((s, b) => s + b.total, 0);

    // Service vs product split (from bill items)
    let serviceRevenue = 0, productRevenue = 0;
    monthBills.forEach(b => {
      b.items.forEach(item => {
        if (item.itemType === "service") serviceRevenue += item.lineTotal;
        else productRevenue += item.lineTotal;
      });
    });

    // Avg ticket size
    const avgTicket = monthBills.length > 0 ? revenueMonth / monthBills.length : 0;

    // Repeat customer rate (contact seen more than once)
    const contactCounts: Record<string, number> = {};
    appointments.forEach(a => {
      if (a.customerContact) contactCounts[a.customerContact] = (contactCounts[a.customerContact] || 0) + 1;
    });
    const repeatCount = Object.values(contactCounts).filter(c => c > 1).length;
    const totalUnique = Object.keys(contactCounts).length;
    const repeatRate = totalUnique > 0 ? Math.round((repeatCount / totalUnique) * 100) : 0;

    // No-show rate (today)
    const totalToday = booked + inProgress + completed + noShow;
    const noShowRate = totalToday > 0 ? Math.round((noShow / totalToday) * 100) : 0;

    // Staff utilization — booked/in-progress today as fraction of active staff
    const activeStaff = staff.filter(s => s.isActive).length;
    const busyStaff = new Set(todayAppts.filter(a => a.status === "Booked" || a.status === "InProgress").map(a => a.staffId).filter(Boolean)).size;
    const utilization = activeStaff > 0 ? Math.round((busyStaff / activeStaff) * 100) : 0;

    // Top services by revenue (month)
    const svcRevMap: Record<string, number> = {};
    monthBills.forEach(b => {
      b.items.filter(i => i.itemType === "service" && i.serviceId).forEach(i => {
        svcRevMap[i.serviceId!] = (svcRevMap[i.serviceId!] || 0) + i.lineTotal;
      });
    });
    const topServices = Object.entries(svcRevMap)
      .map(([id, rev]) => ({ id, rev, name: services.find(s => s.id === id)?.name || "Unknown" }))
      .sort((a, b) => b.rev - a.rev)
      .slice(0, 5);

    return {
      booked, inProgress, completed, noShow,
      revenueToday, revenueMonth, serviceRevenue, productRevenue,
      avgTicket, repeatRate, noShowRate, utilization,
      topServices,
    };
  }, [appointments, bills, staff, services, todayStr, monthStr]);

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading overview…</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-20">

      {/* Incoming QR appointments — mounted at the top of the Salon dashboard
          tab, mirroring KitchenAlertBell/IncomingQrOrders on the kitchen
          side. This is what triggers the continuous alarm while QR-booked
          appointments are waiting on staff accept/decline. */}
      <div className="lg:col-span-12">
        <IncomingQrAppointments />
      </div>

      {/* 1. Today's Appointments — top, full width */}
      <div className="lg:col-span-12">
        <Link to="/salon/appointments" className="block rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 md:p-6 group hover:border-brand-300 dark:hover:border-brand-500/40 hover:shadow-lg transition-all">
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

      {/* Left column — revenue + top services */}
      <div className="lg:col-span-8 flex flex-col gap-4 md:gap-6">

        {/* Revenue */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 text-white rounded-xl shadow-lg shadow-green-500/30">
              <TrendingUp size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800 dark:text-white/90">Revenue</h4>
              <p className="text-xs text-gray-400">Today & this month</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-4">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Today</p>
              <p className="text-2xl font-black text-gray-800 dark:text-white/90">₹{kpis.revenueToday.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-4">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">This Month</p>
              <p className="text-2xl font-black text-gray-800 dark:text-white/90">₹{kpis.revenueMonth.toLocaleString()}</p>
            </div>
          </div>
          {/* Service vs product split */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1 rounded-xl bg-brand-50 dark:bg-brand-500/10 p-3">
              <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold">Services</p>
              <p className="text-sm font-bold text-brand-700 dark:text-brand-300">₹{kpis.serviceRevenue.toLocaleString()}</p>
            </div>
            <div className="flex-1 rounded-xl bg-purple-50 dark:bg-purple-500/10 p-3">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Products</p>
              <p className="text-sm font-bold text-purple-700 dark:text-purple-300">₹{kpis.productRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Top services by revenue */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <Star size={16} className="text-brand-500" />
            <h3 className="text-sm font-bold text-gray-800 dark:text-white/90">Top Services by Revenue (This Month)</h3>
          </div>
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Service</TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Revenue</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {kpis.topServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="px-5 py-6 text-center text-gray-400 text-sm">No revenue data yet.</TableCell>
                </TableRow>
              ) : (
                kpis.topServices.map((s, i) => (
                  <TableRow key={s.id}>
                    <TableCell className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-500 text-[10px] font-bold">{i + 1}</span>
                        {s.name}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-sm font-bold text-brand-600 dark:text-brand-400">₹{s.rev.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right column — stats */}
      <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6">

        {/* Avg ticket */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-green-50 dark:bg-green-500/10 text-green-500"><TrendingUp size={16} /></div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Ticket Size</span>
          </div>
          <p className="text-3xl font-black text-gray-800 dark:text-white/90">₹{Math.round(kpis.avgTicket).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">per bill this month</p>
        </div>

        {/* Staff utilization */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500"><Users size={16} /></div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff Utilization</span>
          </div>
          <p className="text-3xl font-black text-gray-800 dark:text-white/90">{kpis.utilization}%</p>
          <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${kpis.utilization > 80 ? "bg-success-500" : kpis.utilization > 50 ? "bg-warning-500" : "bg-brand-500"}`}
              style={{ width: `${kpis.utilization}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">of active staff busy today</p>
        </div>

        {/* Repeat customer rate */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-500"><Star size={16} /></div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Repeat Customers</span>
          </div>
          <p className="text-3xl font-black text-gray-800 dark:text-white/90">{kpis.repeatRate}%</p>
          <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-purple-500 transition-all duration-500" style={{ width: `${kpis.repeatRate}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">of customers have visited more than once</p>
        </div>

        {/* No-show rate */}
        <div className={`rounded-2xl border-2 p-5 ${kpis.noShowRate > 20 ? "border-red-300 dark:border-red-500/40 bg-red-50/50 dark:bg-red-500/5" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03]"}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 flex items-center justify-center rounded-xl ${kpis.noShowRate > 20 ? "bg-red-100 text-red-500" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
              <AlertTriangle size={16} />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">No-Show Rate</span>
            {kpis.noShowRate > 20 && <span className="ml-auto text-xs text-red-500 font-semibold">⚠ High</span>}
          </div>
          <p className={`text-3xl font-black ${kpis.noShowRate > 20 ? "text-red-600 dark:text-red-400" : "text-gray-800 dark:text-white/90"}`}>{kpis.noShowRate}%</p>
          <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${kpis.noShowRate > 20 ? "bg-red-500" : "bg-gray-400"}`} style={{ width: `${kpis.noShowRate}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">of today's appointments</p>
        </div>
      </div>
    </div>
  );
}