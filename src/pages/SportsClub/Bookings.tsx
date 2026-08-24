import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useSportsClub, SportsClubFacilityBooking, SportsClubDue } from "../../context/SportsClubContext";
import { Calendar, DollarSign, Plus, X, Phone, Clock } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../../components/ui/table";

const STATUS_STYLES: Record<string, string> = {
  Booked: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
  Completed: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400",
  Cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const emptyBooking = {
  facilityId: "",
  memberId: "",
  guestName: "",
  guestContact: "",
  bookingDate: new Date().toISOString().split("T")[0],
  startTime: "10:00",
  endTime: "11:00",
  status: "Booked",
};

const emptyDue = {
  memberId: "",
  amount: 0,
  description: "",
  dueDate: new Date().toISOString().split("T")[0],
};

export default function SportsClubBookings() {
  const { bookings, dues, facilities, members, addBooking, updateBookingStatus, deleteBooking, addDue, markDuePaid, deleteDue, loading } = useSportsClub();
  const [activeTab, setActiveTab] = useState<"bookings" | "dues">("bookings");
  
  // Modal states
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showDueForm, setShowDueForm] = useState(false);
  
  const [bookingForm, setBookingForm] = useState(emptyBooking);
  const [dueForm, setDueForm] = useState(emptyDue);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const filteredBookings = bookings.filter(b => !filterDate || b.bookingDate === filterDate);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await addBooking({
        facilityId: bookingForm.facilityId,
        memberId: bookingForm.memberId || undefined,
        guestName: bookingForm.guestName || undefined,
        guestContact: bookingForm.guestContact || undefined,
        bookingDate: bookingForm.bookingDate,
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime,
        status: bookingForm.status,
      });
      setShowBookingForm(false);
      setBookingForm(emptyBooking);
    } catch (err: any) {
      setError(err.message || "Failed to save booking");
    } finally {
      setSaving(false);
    }
  };

  const handleDueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await addDue({
        memberId: dueForm.memberId,
        amount: dueForm.amount,
        description: dueForm.description,
        dueDate: dueForm.dueDate,
      });
      setShowDueForm(false);
      setDueForm(emptyDue);
    } catch (err: any) {
      setError(err.message || "Failed to save due");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24">
      <PageMeta title="Bookings & Dues | Sports Club" description="Manage facility bookings and member dues" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white/90">Bookings & Dues</h1>
          <p className="text-sm text-gray-500">Facility reservations and fee tracking.</p>
        </div>
        {activeTab === "bookings" && (
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
            />
        )}
      </div>

      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab("bookings")}
          className={`pb-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === "bookings" ? "border-brand-500 text-brand-600 dark:text-brand-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          <Calendar size={16} /> Bookings
        </button>
        <button
          onClick={() => setActiveTab("dues")}
          className={`pb-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === "dues" ? "border-brand-500 text-brand-600 dark:text-brand-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          <DollarSign size={16} /> Dues
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : activeTab === "bookings" ? (
        <>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-gray-800">
              <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No bookings found</h3>
              <p className="mt-1 text-sm text-gray-500">There are no facility reservations for {filterDate}.</p>
              <button
                onClick={() => setShowBookingForm(true)}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors"
              >
                <Plus size={16} /> Add Booking
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Time</TableCell>
                    <TableCell isHeader>Facility</TableCell>
                    <TableCell isHeader>Booked By</TableCell>
                    <TableCell isHeader>Status</TableCell>
                    <TableCell isHeader className="text-right">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((b) => {
                    const facility = facilities.find(f => f.id === b.facilityId);
                    const member = members.find(m => m.id === b.memberId);
                    return (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm font-bold text-gray-800 dark:text-white/90">
                            <Clock size={14} className="text-gray-400" />
                            {b.startTime} - {b.endTime}
                          </div>
                          {b.isQrBooking && <div className="text-[10px] uppercase font-bold text-brand-500 mt-1">QR Booking</div>}
                        </TableCell>
                        <TableCell className="font-medium text-gray-800 dark:text-white/90">
                          {facility ? facility.name : "Unknown"}
                        </TableCell>
                        <TableCell>
                          {member ? (
                              <div className="text-sm font-medium text-gray-800 dark:text-white/90">{member.name} (Member)</div>
                          ) : (
                              <div>
                                  <div className="text-sm font-medium text-gray-800 dark:text-white/90">{b.guestName || "Guest"}</div>
                                  {b.guestContact && <div className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} /> {b.guestContact}</div>}
                              </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <select
                            value={b.status}
                            onChange={(e) => updateBookingStatus(b.id, e.target.value)}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold appearance-none cursor-pointer outline-none ${STATUS_STYLES[b.status] || STATUS_STYLES.Booked}`}
                          >
                            <option value="Booked">Booked</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-right">
                          <button onClick={() => deleteBooking(b.id)} className="text-sm text-red-600 dark:text-red-400 hover:underline">
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
          
          {!showBookingForm && !showDueForm && (
            <button
              onClick={() => { setBookingForm({ ...emptyBooking, bookingDate: filterDate }); setShowBookingForm(true); }}
              className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-lg shadow-brand-500/30 flex items-center justify-center transition-transform hover:scale-105 z-40"
            >
              <Plus size={24} />
            </button>
          )}
        </>
      ) : (
        <>
          {dues.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-gray-800">
              <DollarSign className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No dues found</h3>
              <p className="mt-1 text-sm text-gray-500">Track membership fees and facility charges here.</p>
              <button
                onClick={() => setShowDueForm(true)}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors"
              >
                <Plus size={16} /> Add Due
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Member</TableCell>
                    <TableCell isHeader>Description</TableCell>
                    <TableCell isHeader>Amount</TableCell>
                    <TableCell isHeader>Status / Due Date</TableCell>
                    <TableCell isHeader className="text-right">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dues.map((d) => {
                    const member = members.find(m => m.id === d.memberId);
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="font-bold text-gray-800 dark:text-white/90">
                          {member ? member.name : "Unknown"}
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">{d.description}</TableCell>
                        <TableCell className="font-bold text-brand-600 dark:text-brand-400">₹{d.amount}</TableCell>
                        <TableCell>
                          {d.isPaid ? (
                            <div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400">
                                Paid
                                </span>
                                <div className="text-[10px] text-gray-400 mt-0.5">on {d.paidDate}</div>
                            </div>
                          ) : (
                            <div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
                                Due
                                </span>
                                <div className="text-[10px] text-gray-500 mt-0.5">by {d.dueDate}</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!d.isPaid && (
                            <button onClick={() => markDuePaid(d.id)} className="text-sm text-brand-600 dark:text-brand-400 hover:underline mr-4 font-semibold">
                              Mark Paid
                            </button>
                          )}
                          <button onClick={() => deleteDue(d.id)} className="text-sm text-red-600 dark:text-red-400 hover:underline">
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

          {!showBookingForm && !showDueForm && (
            <button
              onClick={() => { setDueForm(emptyDue); setShowDueForm(true); }}
              className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-lg shadow-brand-500/30 flex items-center justify-center transition-transform hover:scale-105 z-40"
            >
              <Plus size={24} />
            </button>
          )}
        </>
      )}

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">New Booking</h2>
              <button onClick={() => setShowBookingForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleBookingSubmit} className="p-5 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Facility *</label>
                <select
                  required
                  value={bookingForm.facilityId}
                  onChange={(e) => setBookingForm({ ...bookingForm, facilityId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                >
                  <option value="">Select facility</option>
                  {facilities.filter(f => f.isActive).map(f => (
                    <option key={f.id} value={f.id}>{f.name} (₹{f.hourlyRate}/hr)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Member (Optional)</label>
                <select
                  value={bookingForm.memberId}
                  onChange={(e) => setBookingForm({ ...bookingForm, memberId: e.target.value, guestName: "", guestContact: "" })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                >
                  <option value="">Guest Booking</option>
                  {members.filter(m => m.isActive).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {!bookingForm.memberId && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Guest Name *</label>
                    <input
                      type="text" required
                      value={bookingForm.guestName}
                      onChange={(e) => setBookingForm({ ...bookingForm, guestName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Guest Contact</label>
                    <input
                      type="text"
                      value={bookingForm.guestContact}
                      onChange={(e) => setBookingForm({ ...bookingForm, guestContact: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
                  <input
                    type="date" required
                    value={bookingForm.bookingDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Start Time</label>
                  <input
                    type="time" required
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">End Time</label>
                  <input
                    type="time" required
                    value={bookingForm.endTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setShowBookingForm(false)} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-200" disabled={saving}>Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl font-bold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50">
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Due Form Modal */}
      {showDueForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">Add Member Due</h2>
              <button onClick={() => setShowDueForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleDueSubmit} className="p-5 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Member *</label>
                <select
                  required
                  value={dueForm.memberId}
                  onChange={(e) => setDueForm({ ...dueForm, memberId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                >
                  <option value="">Select member</option>
                  {members.filter(m => m.isActive).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description *</label>
                <input
                  type="text" required
                  value={dueForm.description}
                  onChange={(e) => setDueForm({ ...dueForm, description: e.target.value })}
                  placeholder="e.g. Monthly Fee, Locker Rent"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Amount (₹) *</label>
                  <input
                    type="number" required min="1"
                    value={dueForm.amount}
                    onChange={(e) => setDueForm({ ...dueForm, amount: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Due Date *</label>
                  <input
                    type="date" required
                    value={dueForm.dueDate}
                    onChange={(e) => setDueForm({ ...dueForm, dueDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setShowDueForm(false)} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-200" disabled={saving}>Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl font-bold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50">
                  {saving ? "Saving..." : "Save Due"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
