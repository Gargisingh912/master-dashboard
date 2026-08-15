import { useEffect, useMemo } from "react";
import { useSalon } from "../../context/SalonContext";
import { startContinuousAlarm, stopContinuousAlarm } from "../../utils/helpers";

/**
 * KPI widget: appointments booked via the customer-facing QR booking page
 * that are still awaiting staff accept/decline.
 *
 * QR vs walk-in distinction: walk-in/staff-created appointments (added via
 * SalonContext.addAppointment) never set `is_qr_booked`, so it defaults to
 * FALSE in the DB. QR appointments (SalonBookingPage.tsx) set
 * `is_qr_booked: true` directly on insert. We use `isQrBooked` as the
 * QR/walk-in signal, mirroring `orderCode` on the kitchen side.
 *
 * Note: unlike kitchen orders, a salon appointment maps to a single
 * serviceId (not a multi-item cart), and there's no `total` on the
 * appointment itself — pricing is resolved via the linked SalonService and
 * finalized later at billing (salon_bills), so this card doesn't show one.
 *
 * FIFO: sorted oldest-first by createdAt, so staff always work the queue in
 * the order customers booked, regardless of how many come in at once.
 */
export default function IncomingQrAppointments() {
  const { appointments, services, staff, updateAppointmentStatus } = useSalon();

  const pendingQrAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.status === "Booked" && a.isQrBooked)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [appointments]);

  // Ring the salon alarm only while a QR appointment is waiting. Respects
  // the header's mute toggle (isSilentMode) internally via startContinuousAlarm.
  useEffect(() => {
    if (pendingQrAppointments.length > 0) {
      startContinuousAlarm();
    } else {
      stopContinuousAlarm();
    }
    return () => stopContinuousAlarm();
  }, [pendingQrAppointments.length]);

  if (pendingQrAppointments.length === 0) return null;

  const getServiceName = (serviceId?: string) =>
    services.find((s) => s.id === serviceId)?.name || "Service";

  const getStaffName = (staffId?: string) =>
    staff.find((s) => s.id === staffId)?.name;

  // Accept moves the appointment into the working pipeline. There is no
  // "Confirmed" status in the SalonAppointment status enum (Booked |
  // InProgress | Completed | NoShow | Cancelled), so Accept -> InProgress.
  const handleAccept = (id: string) => {
    updateAppointmentStatus(id, "InProgress");
  };

  const handleDecline = (id: string) => {
    updateAppointmentStatus(id, "Cancelled");
  };

  return (
    <div className="bento-glass p-5 border-brand-300 dark:border-brand-500/40">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
          Incoming QR Appointments
        </h3>
        <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white">
          {pendingQrAppointments.length} waiting
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {pendingQrAppointments.map((appt, idx) => {
          const staffName = getStaffName(appt.staffId);
          return (
            <div
              key={appt.id}
              className="rounded-xl border border-gray-200/50 bg-white/40 p-4 dark:border-white/10 dark:bg-black/20 min-w-0"
            >
              <div className="flex justify-between items-start mb-2 gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-brand-500">#{idx + 1} in queue</span>
                  <h4 className="text-base font-semibold text-gray-800 dark:text-white/90 truncate">
                    {appt.customerName}
                  </h4>
                </div>
                {appt.customerContact && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                    {appt.customerContact}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mb-0.5">
                {getServiceName(appt.serviceId)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {appt.appointmentDate} at {appt.startTime}
                {staffName ? ` · ${staffName}` : ""}
              </p>

              {appt.notes && (
                <p className="mb-3 text-xs italic text-gray-500 dark:text-gray-400">
                  Note: {appt.notes}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleAccept(appt.id)}
                  className="flex-1 rounded-lg bg-success-500 py-2 text-sm font-semibold text-white hover:bg-success-600"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDecline(appt.id)}
                  className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-semibold text-white hover:bg-red-600"
                >
                  Decline
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}