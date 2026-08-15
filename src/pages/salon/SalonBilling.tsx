import { useState, useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useSalon, SalonBillItem } from "../../context/SalonContext";
import { useKitchen } from "../../context/KitchenContext";
import { Receipt, Plus, Trash2, CreditCard, Wallet, Banknote } from "lucide-react";

const PAYMENT_METHODS = ["Cash", "Card", "UPI", "Other"];

const emptyBillItem = (): SalonBillItem => ({
  itemType: "service",
  serviceId: undefined,
  inventoryItemId: undefined,
  quantity: 1,
  unitPrice: 0,
  lineTotal: 0,
});

export default function SalonBilling() {
  const { bills, services, appointments, createBill, loading } = useSalon();
  const { inventory } = useKitchen();
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState<SalonBillItem[]>([emptyBillItem()]);
  const [appointmentId, setAppointmentId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const total = Math.max(0, subtotal - discount);

  const updateItem = (index: number, field: keyof SalonBillItem, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };
      // Auto-fill unit price when service selected
      if (field === "serviceId" && value) {
        const svc = services.find(s => s.id === value);
        if (svc) { item.unitPrice = svc.price; }
      }
      if (field === "inventoryItemId" && value) {
        // inventory items don't have price, keep manual entry
      }
      item.lineTotal = item.quantity * item.unitPrice;
      copy[index] = item;
      return copy;
    });
  };

  const addItem = () => setItems(prev => [...prev, emptyBillItem()]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createBill({
        appointmentId: appointmentId || undefined,
        customerName: customerName || undefined,
        customerContact: customerContact || undefined,
        subtotal,
        discount,
        total,
        paymentMethod,
        items: items.filter(i => i.lineTotal > 0),
      });
      setShowForm(false);
      setItems([emptyBillItem()]);
      setAppointmentId(""); setCustomerName(""); setCustomerContact(""); setDiscount(0); setPaymentMethod("Cash");
    } catch (err: any) {
      setError(err.message || "Failed to create bill");
    } finally {
      setSaving(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayRevenue = useMemo(() => bills.filter(b => b.createdAt.startsWith(todayStr)).reduce((s, b) => s + b.total, 0), [bills, todayStr]);
  const monthRevenue = useMemo(() => {
    const m = todayStr.slice(0, 7);
    return bills.filter(b => b.createdAt.startsWith(m)).reduce((s, b) => s + b.total, 0);
  }, [bills, todayStr]);

  const PM_ICON: Record<string, React.ReactNode> = {
    Cash: <Banknote size={16} />,
    Card: <CreditCard size={16} />,
    UPI: <Wallet size={16} />,
  };

  return (
    <>
      <PageMeta title="Billing — Salon" description="Salon bills and payments" />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Billing</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{bills.length} bills generated</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> New Bill
        </button>
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Today's Revenue</p>
          <p className="text-2xl font-black text-success-600 dark:text-success-400">₹{todayRevenue.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">This Month</p>
          <p className="text-2xl font-black text-brand-600 dark:text-brand-400">₹{monthRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* New Bill Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-5">New Bill</h3>
            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Customer details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Customer Name</label>
                  <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Contact</label>
                  <input value={customerContact} onChange={e => setCustomerContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Link to Appointment (optional)</label>
                  <select value={appointmentId} onChange={e => {
                    setAppointmentId(e.target.value);
                    const appt = appointments.find(a => a.id === e.target.value);
                    if (appt) { setCustomerName(appt.customerName); setCustomerContact(appt.customerContact || ""); }
                  }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">— None —</option>
                    {appointments.filter(a => a.status === "Completed" || a.status === "InProgress").map(a => (
                      <option key={a.id} value={a.id}>{a.customerName} — {a.appointmentDate} {a.startTime}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bill items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Line Items</label>
                  <button type="button" onClick={addItem} className="text-xs text-brand-500 hover:text-brand-600 font-semibold flex items-center gap-1"><Plus size={12} /> Add Line</button>
                </div>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex flex-wrap gap-2 items-center p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                      <select value={item.itemType} onChange={e => updateItem(i, "itemType", e.target.value as "service" | "product")}
                        className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500">
                        <option value="service">Service</option>
                        <option value="product">Product</option>
                      </select>
                      {item.itemType === "service" ? (
                        <select value={item.serviceId || ""} onChange={e => updateItem(i, "serviceId", e.target.value)}
                          className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500">
                          <option value="">— Select Service —</option>
                          {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      ) : (
                        <select value={item.inventoryItemId || ""} onChange={e => updateItem(i, "inventoryItemId", e.target.value)}
                          className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500">
                          <option value="">— Select Product —</option>
                          {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
                        </select>
                      )}
                      <input type="number" min={1} value={item.quantity} onChange={e => updateItem(i, "quantity", +e.target.value)} placeholder="Qty"
                        className="w-14 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500" />
                      <input type="number" min={0} value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", +e.target.value)} placeholder="₹ Price"
                        className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-200 w-16 text-right">₹{item.lineTotal.toLocaleString()}</span>
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-semibold">₹{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">Discount (₹)</span>
                  <input type="number" min={0} value={discount} onChange={e => setDiscount(+e.target.value)}
                    className="w-24 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-right focus:outline-none focus:ring-1 focus:ring-brand-500" />
                </div>
                <div className="flex justify-between text-base font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span>Total</span><span className="text-brand-600 dark:text-brand-400">₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Payment Method</label>
                <div className="flex gap-2">
                  {PAYMENT_METHODS.map(pm => (
                    <button key={pm} type="button" onClick={() => setPaymentMethod(pm)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${paymentMethod === pm ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"}`}>
                      {PM_ICON[pm] || null}{pm}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50">{saving ? "Saving…" : "Create Bill"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bills list */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading bills…</div>
        ) : bills.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No bills yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-gray-800">
                <tr>
                  {["Customer", "Date", "Items", "Subtotal", "Discount", "Total", "Payment"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {bills.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{b.customerName || "—"}</p>
                      {b.customerContact && <p className="text-xs text-gray-400">{b.customerContact}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{b.createdAt.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{b.items.length}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">₹{b.subtotal.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-orange-500">-₹{b.discount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-bold text-success-600 dark:text-success-400">₹{b.total.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {PM_ICON[b.paymentMethod || ""] || <Receipt size={12} />} {b.paymentMethod || "—"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
