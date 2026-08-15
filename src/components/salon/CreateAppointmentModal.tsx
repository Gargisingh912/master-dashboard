import React, { useState, useEffect } from "react";
import { useSalon } from "../../context/SalonContext";

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyForm = {
  customerName: "",
  customerContact: "",
  staffId: "",
  serviceId: "",
  appointmentDate: new Date().toISOString().split("T")[0],
  startTime: "10:00",
  endTime: "",
  notes: "",
};

export default function CreateAppointmentModal({ isOpen, onClose }: CreateAppointmentModalProps) {
  const { staff, services, addAppointment } = useSalon();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(emptyForm);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await addAppointment({
        customerName: form.customerName,
        customerContact: form.customerContact || undefined,
        staffId: form.staffId || undefined,
        serviceId: form.serviceId || undefined,
        appointmentDate: form.appointmentDate,
        startTime: form.startTime,
        endTime: form.endTime || undefined,
        notes: form.notes || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save appointment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-5">
          New Appointment
        </h3>
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Customer Name *</label>
              <input required value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Contact</label>
              <input value={form.customerContact} onChange={e => setForm(f => ({ ...f, customerContact: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Date *</label>
              <input required type="date" value={form.appointmentDate} onChange={e => setForm(f => ({ ...f, appointmentDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Start Time *</label>
              <input required type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">End Time</label>
              <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Staff</label>
              <select value={form.staffId} onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">— Walk-in —</option>
                {staff.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Service</label>
              <select value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">— Select Service —</option>
                {services.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name} (₹{s.price})</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50">
              {saving ? "Saving…" : "Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
