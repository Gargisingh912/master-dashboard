import { useMemo } from "react";
import { Link } from "react-router";
import { useVenueBooking } from "../../context/VenueBookingContext";
import { Calendar, DollarSign, Activity, MapPin } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../../components/ui/table";

export default function VenueOverview() {
  const { bookings, payments, venues, loading } = useVenueBooking();

  const todayStr = new Date().toISOString().split("T")[0];
  const monthStr = todayStr.slice(0, 7);

  const kpis = useMemo(() => {
    // Pipeline metrics
    const enquiries = bookings.filter(b => b.status === "Enquiry").length;
    const confirmed = bookings.filter(b => b.status === "Confirmed").length;
    const upcoming = bookings.filter(b => b.status === "Confirmed" && b.bookingDate >= todayStr).length;
    
    // Revenue metrics (Payments this month)
    const monthPayments = payments.filter(p => p.paymentDate.startsWith(monthStr));
    const totalCollected = monthPayments.reduce((sum, p) => sum + p.amount, 0);

    // Outstanding balances (Total amount of confirmed/completed - advance paid)
    const activeBookings = bookings.filter(b => b.status === "Confirmed" || b.status === "Completed");
    const totalExpected = activeBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalAdvances = activeBookings.reduce((sum, b) => sum + b.advancePaid, 0);
    const outstanding = totalExpected - totalAdvances;

    // Upcoming Bookings for Table
    const upcomingBookingsList = bookings
      .filter(b => b.status === "Confirmed" && b.bookingDate >= todayStr)
      .sort((a, b) => a.bookingDate.localeCompare(b.bookingDate))
      .slice(0, 5);

    return {
      enquiries, confirmed, upcoming, totalCollected, outstanding, upcomingBookingsList
    };
  }, [bookings, payments, todayStr, monthStr]);

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading overview…</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-20">

      {/* Row 1: Pipeline Summary */}
      <div className="lg:col-span-12">
        <Link to="/venue-booking/bookings" className="block rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 md:p-6 group hover:border-brand-300 dark:hover:border-brand-500/40 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-brand-50 dark:bg-brand-500/10 text-brand-500 rounded-xl">
                <Activity size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-white/90">Pipeline Overview</h4>
                <p className="text-xs text-gray-400">All Time / Upcoming</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-brand-500 transition-colors"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/5">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">New Enquiries</span>
              <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{kpis.enquiries}</p>
            </div>
            <div className="rounded-xl bg-success-50 p-4 dark:bg-success-500/10">
              <span className="text-xs text-success-600 dark:text-success-400 font-medium uppercase tracking-wider block mb-1">Confirmed Total</span>
              <p className="mt-1 text-2xl font-bold text-success-700 dark:text-success-300">{kpis.confirmed}</p>
            </div>
            <div className="rounded-xl bg-brand-50 p-4 dark:bg-brand-500/10">
              <span className="text-xs text-brand-600 dark:text-brand-400 font-medium uppercase tracking-wider block mb-1">Upcoming Events</span>
              <p className="mt-1 text-2xl font-bold text-brand-700 dark:text-brand-300">{kpis.upcoming}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Left Column (8/12) */}
      <div className="lg:col-span-8 flex flex-col gap-4 md:gap-6">
        
        {/* Upcoming Events Table */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <Calendar size={16} className="text-brand-500" />
            <h3 className="text-sm font-bold text-gray-800 dark:text-white/90">Upcoming Confirmed Events</h3>
          </div>
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Date</TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Event / Client</TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Venue</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {kpis.upcomingBookingsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="px-5 py-6 text-center text-gray-400 text-sm">No upcoming confirmed events.</TableCell>
                </TableRow>
              ) : (
                kpis.upcomingBookingsList.map((b) => {
                  const venue = venues.find(v => v.id === b.venueId);
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                        {b.bookingDate} {b.startTime ? `at ${b.startTime}` : ""}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-800 dark:text-white/90">
                        <div className="font-bold">{b.eventType || "Event"}</div>
                        <div className="text-xs text-gray-500">{b.customerName}</div>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                        {venue ? venue.name : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

      </div>

      {/* Right Column (4/12) */}
      <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6">
        
        {/* Revenue Overview */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-green-50 dark:bg-green-500/10 text-green-500"><DollarSign size={16} /></div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Collected</span>
          </div>
          <p className="text-3xl font-black text-gray-800 dark:text-white/90">₹{kpis.totalCollected.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">payments received this month</p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-warning-50 dark:bg-warning-500/10 text-warning-500"><DollarSign size={16} /></div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outstanding Balance</span>
          </div>
          <p className="text-3xl font-black text-gray-800 dark:text-white/90">₹{kpis.outstanding > 0 ? kpis.outstanding.toLocaleString() : 0}</p>
          <p className="text-xs text-gray-400 mt-1">on active & completed bookings</p>
        </div>
        
        <Link to="/venue-booking/settings" className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 flex items-center justify-between hover:border-brand-300 transition-colors group">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"><MapPin size={16} /></div>
                <span className="text-sm font-bold text-gray-800 dark:text-white/90">Venues & Addons</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-brand-500 transition-colors"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
        </Link>

      </div>

    </div>
  );
}
