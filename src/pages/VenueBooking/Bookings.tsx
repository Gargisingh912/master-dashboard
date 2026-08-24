import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useVenueBooking, VenueBooking, VenueBookingAddon } from "../../context/VenueBookingContext";
import { Calendar, Plus, X, Phone, Users } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../../components/ui/table";

const STATUS_STYLES: Record<string, string> = {
  Enquiry: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  Confirmed: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
  Completed: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400",
  Cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const emptyBooking = {
  venueId: "",
  customerName: "",
  customerContact: "",
  eventType: "",
  bookingDate: new Date().toISOString().split("T")[0],
  startTime: "",
  endTime: "",
  guestCount: 0,
  status: "Enquiry",
  totalAmount: 0,
  advancePaid: 0,
  addons: [] as VenueBookingAddon[],
};

export default function VenueBookings() {
  const { bookings, venues, addonServices, addBooking, updateBooking, deleteBooking, addPayment, loading } = useVenueBooking();
  const [showForm, setShowForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentBookingId, setPaymentBookingId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  
  const [form, setForm] = useState(emptyBooking);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateBooking(editingId, {
          venueId: form.venueId || undefined,
          customerName: form.customerName,
          customerContact: form.customerContact || undefined,
          eventType: form.eventType || undefined,
          bookingDate: form.bookingDate,
          startTime: form.startTime || undefined,
          endTime: form.endTime || undefined,
          guestCount: form.guestCount || undefined,
          status: form.status,
          totalAmount: form.totalAmount,
          advancePaid: form.advancePaid,
          addons: form.addons,
        });
      } else {
        await addBooking({
          venueId: form.venueId || undefined,
          customerName: form.customerName,
          customerContact: form.customerContact || undefined,
          eventType: form.eventType || undefined,
          bookingDate: form.bookingDate,
          startTime: form.startTime || undefined,
          endTime: form.endTime || undefined,
          guestCount: form.guestCount || undefined,
          status: form.status,
          totalAmount: form.totalAmount,
          advancePaid: form.advancePaid,
          addons: form.addons,
        });
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyBooking);
    } catch (err: any) {
      setError(err.message || "Failed to save booking");
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentBookingId || paymentAmount <= 0) return;
    setSaving(true);
    setError(null);
    try {
        await addPayment({
            bookingId: paymentBookingId,
            amount: paymentAmount,
            paymentType: "Balance",
            paymentMethod: "Cash" // Defaulting for simplicity
        });
        setShowPaymentForm(false);
        setPaymentBookingId(null);
        setPaymentAmount(0);
    } catch(err: any) {
        setError(err.message || "Failed to record payment");
    } finally {
        setSaving(false);
    }
  };

  const startEdit = (b: VenueBooking) => {
    setForm({
      venueId: b.venueId || "",
      customerName: b.customerName,
      customerContact: b.customerContact || "",
      eventType: b.eventType || "",
      bookingDate: b.bookingDate,
      startTime: b.startTime || "",
      endTime: b.endTime || "",
      guestCount: b.guestCount || 0,
      status: b.status,
      totalAmount: b.totalAmount,
      advancePaid: b.advancePaid,
      addons: b.addons || [],
    });
    setEditingId(b.id);
    setShowForm(true);
  };

  const handleAddonToggle = (addonId: string, price: number) => {
    setForm(prev => {
        const existing = prev.addons.find(a => a.addonServiceId === addonId);
        if (existing) {
            return { ...prev, addons: prev.addons.filter(a => a.addonServiceId !== addonId) };
        } else {
            return { ...prev, addons: [...prev.addons, { addonServiceId: addonId, quantity: 1, priceAtBooking: price }] };
        }
    });
  };

  return (
    <div className="pb-24">
      <PageMeta title="Bookings Pipeline | Venue Booking" description="Manage venue booking pipeline" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white/90">Bookings Pipeline</h1>
          <p className="text-sm text-gray-500">Track events from enquiry to completion.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading bookings…</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-gray-800">
          <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No bookings yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first venue enquiry or booking.</p>
          <button
            onClick={() => { setForm(emptyBooking); setEditingId(null); setShowForm(true); }}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors"
          >
            <Plus size={16} /> New Booking
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Event Details</TableCell>
                <TableCell isHeader>Client</TableCell>
                <TableCell isHeader>Venue</TableCell>
                <TableCell isHeader>Financials</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader className="text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => {
                const venue = venues.find(v => v.id === b.venueId);
                const balance = b.totalAmount - b.advancePaid;
                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="font-bold text-gray-800 dark:text-white/90">{b.eventType || "Event"}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Calendar size={10} /> {b.bookingDate} {b.startTime && b.endTime ? `(${b.startTime} - ${b.endTime})` : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-800 dark:text-white/90">{b.customerName}</div>
                      {b.customerContact && (
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone size={10} /> {b.customerContact}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-800 dark:text-white/90 font-medium">{venue ? venue.name : "—"}</div>
                      {b.guestCount ? <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Users size={10} /> {b.guestCount} guests</div> : null}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-bold text-gray-800 dark:text-white/90">₹{b.totalAmount}</div>
                      <div className={`text-xs mt-0.5 ${balance > 0 ? "text-red-500" : "text-success-600"}`}>
                        {balance > 0 ? `Bal: ₹${balance}` : "Paid"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[b.status] || STATUS_STYLES.Enquiry}`}>
                        {b.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col gap-1 items-end">
                          <button onClick={() => startEdit(b)} className="text-sm text-brand-600 hover:underline">Edit</button>
                          {balance > 0 && b.status !== 'Enquiry' && (
                              <button onClick={() => { setPaymentBookingId(b.id); setPaymentAmount(balance); setShowPaymentForm(true); }} className="text-[10px] uppercase font-bold text-success-600 hover:underline">Receive Pay</button>
                          )}
                          <button onClick={() => deleteBooking(b.id)} className="text-[10px] text-red-500 hover:underline">Delete</button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!showForm && !showPaymentForm && (
        <button
          onClick={() => { setForm(emptyBooking); setEditingId(null); setShowForm(true); }}
          className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-lg shadow-brand-500/30 flex items-center justify-center transition-transform hover:scale-105 z-40"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">Receive Payment</h2>
              <button onClick={() => setShowPaymentForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Amount (₹)</label>
                  <input
                    type="number" required min="1"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowPaymentForm(false)} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-200" disabled={saving}>Cancel</button>
                  <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl font-bold bg-success-600 text-white hover:bg-success-700 disabled:opacity-50">
                    {saving ? "Saving..." : "Confirm"}
                  </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">{editingId ? "Edit Booking" : "New Booking / Enquiry"}</h2>
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

              <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status *</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  >
                    <option value="Enquiry">Enquiry</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Event Type</label>
                  <input
                    type="text"
                    value={form.eventType}
                    onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                    placeholder="e.g. Wedding, Birthday"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Guest Count</label>
                  <input
                    type="number"
                    value={form.guestCount}
                    onChange={(e) => setForm({ ...form, guestCount: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Venue</label>
                  <select
                    value={form.venueId}
                    onChange={(e) => {
                        const vId = e.target.value;
                        const venue = venues.find(v => v.id === vId);
                        const vPrice = venue ? venue.basePrice : 0;
                        setForm({ ...form, venueId: vId, totalAmount: vPrice }); // Reset total amount logic
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  >
                    <option value="">Select venue...</option>
                    {venues.filter(v => v.isActive).map(v => (
                      <option key={v.id} value={v.id}>{v.name} (₹{v.basePrice})</option>
                    ))}
                  </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date *</label>
                  <input
                    type="date" required
                    value={form.bookingDate}
                    onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  />
                </div>
              </div>

              {addonServices.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-2">Addons</label>
                  <div className="space-y-2">
                      {addonServices.filter(a => a.isActive).map(a => (
                          <label key={a.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <input 
                                  type="checkbox" 
                                  checked={form.addons.some(fa => fa.addonServiceId === a.id)}
                                  onChange={() => handleAddonToggle(a.id, a.price)}
                                  className="rounded text-brand-500 focus:ring-brand-500"
                              />
                              {a.name} (+₹{a.price})
                          </label>
                      ))}
                  </div>
                </div>
              )}

              {!editingId && form.status !== "Enquiry" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Advance Payment (₹)</label>
                  <input
                    type="number" min="0"
                    value={form.advancePaid}
                    onChange={(e) => setForm({ ...form, advancePaid: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500"
                  />
                </div>
              )}

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
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
