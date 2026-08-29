import { useEffect, useMemo, useRef } from "react";
import { useKitchen } from "../../context/KitchenContext";
import { startContinuousAlarm, stopContinuousAlarm } from "../../utils/helpers";

/**
 * KPI widget: orders placed via the customer-facing QR menu that are
 * still awaiting kitchen accept/decline.
 *
 * QR vs walk-in distinction: walk-in/manual orders (added from
 * KitchenContext.addOrder) never set `order_id`, so it's NULL in the DB.
 * QR orders (OrderPage.tsx) always generate one via generateOrderNumber().
 * We use presence of `orderCode` as the QR/walk-in signal everywhere.
 *
 * FIFO: sorted oldest-first so staff always work the queue in the order
 * customers placed it, regardless of how many come in at once.
 */
export default function IncomingQrOrders() {
  const { orders, menu, updateOrderStatus } = useKitchen();

  const pendingQrOrders = useMemo(() => {
    return orders
      .filter((o) => o.status === "Placed" && !!o.orderCode)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [orders]);

  // Only ring when a NEW order arrives (length increases).
  // When an order is accepted/declined the count drops — we must NOT restart
  // the alarm, or it would immediately undo the staff's accept action.
  const prevLengthRef = useRef(0);
  useEffect(() => {
    const prev = prevLengthRef.current;
    const curr = pendingQrOrders.length;
    prevLengthRef.current = curr;

    if (curr === 0) {
      // All orders handled — silence everything.
      stopContinuousAlarm();
    } else if (curr > prev) {
      // Count went up → at least one new order arrived.
      startContinuousAlarm();
    }
    // curr > 0 && curr <= prev  →  order accepted/declined but more remain;
    // alarm was already stopped by handleAccept — do NOT restart it here.

    return () => stopContinuousAlarm();
  }, [pendingQrOrders.length]);

  if (pendingQrOrders.length === 0) return null;

  const getItemName = (menuItemId: string) =>
    menu.find((m) => m.id === menuItemId)?.name || "Item";

  const handleAccept = (id: string) => {
    // Stop the alarm immediately on click — don't wait for the realtime
    // round-trip to update pendingQrOrders and re-run the useEffect.
    stopContinuousAlarm();
    updateOrderStatus(id, "Preparing");
  };

  const handleDecline = (id: string) => {
    updateOrderStatus(id, "Declined");
  };

  return (
    <div className="bento-glass p-5 border-brand-300 dark:border-brand-500/40">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
          Incoming QR Orders
        </h3>
        <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white">
          {pendingQrOrders.length} waiting
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {pendingQrOrders.map((order, idx) => (
          <div
            key={order.id}
            className="rounded-xl border border-gray-200/50 bg-white/40 p-4 dark:border-white/10 dark:bg-black/20 min-w-0"
          >
            <div className="flex justify-between items-start mb-2 gap-2">
              <div className="min-w-0">
                <span className="text-xs font-bold text-brand-500">#{idx + 1} in queue</span>
                <h4 className="text-base font-semibold text-gray-800 dark:text-white/90 truncate">
                  Order {order.orderCode}
                </h4>
              </div>
              <span className="font-bold text-gray-800 dark:text-white/90 shrink-0">
                ₹{order.total.toFixed(2)}
              </span>
            </div>

            <ul className="mb-2 space-y-0.5">
              {order.items.map((item, i) => (
                <li
                  key={i}
                  className="text-sm text-gray-600 dark:text-gray-300 flex justify-between gap-2"
                >
                  <span className="truncate">{getItemName(item.menuItemId)}</span>
                  <span className="shrink-0">x{item.quantity}</span>
                </li>
              ))}
            </ul>

            {order.notes && (
              <p className="mb-3 text-xs italic text-gray-500 dark:text-gray-400">
                Note: {order.notes}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleAccept(order.id)}
                className="flex-1 rounded-lg bg-success-500 py-2 text-sm font-semibold text-white hover:bg-success-600"
              >
                Accept
              </button>
              <button
                onClick={() => handleDecline(order.id)}
                className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-semibold text-white hover:bg-red-600"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}