import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useSalon, SalonService } from "../../context/SalonContext";
import { useKitchen } from "../../context/KitchenContext";
import { Scissors, Clock, Tag, Plus, Trash2, Pencil, ToggleLeft, ToggleRight } from "lucide-react";

const emptyForm = {
  name: "",
  category: "",
  durationMinutes: 30,
  price: 0,
  isActive: true,
  products: [] as { inventoryItemId: string; quantity: number; unit: string }[],
};

export default function SalonServices() {
  const { services, addService, updateService, deleteService, setServiceAvailability, loading } = useSalon();
  const { inventory } = useKitchen();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const categories = Array.from(new Set(services.map(s => s.category).filter(Boolean))) as string[];
  const filtered = filterCategory === "all" ? services : services.filter(s => s.category === filterCategory);

  const addProductRow = () => setForm(f => ({ ...f, products: [...f.products, { inventoryItemId: "", quantity: 1, unit: "" }] }));
  const removeProductRow = (i: number) => setForm(f => ({ ...f, products: f.products.filter((_, idx) => idx !== i) }));
  const updateProductRow = (i: number, field: string, value: string | number) => {
    setForm(f => ({ ...f, products: f.products.map((p, idx) => idx === i ? { ...p, [field]: value } : p) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const serviceData = {
        name: form.name,
        category: form.category || undefined,
        durationMinutes: form.durationMinutes,
        price: form.price,
        isActive: form.isActive,
        products: form.products.filter(p => p.inventoryItemId).map(p => ({
          inventoryItemId: p.inventoryItemId,
          quantity: p.quantity,
          unit: p.unit || undefined,
        })),
      };
      if (editingId) {
        await updateService(editingId, serviceData);
      } else {
        await addService(serviceData);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err: any) {
      setError(err.message || "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (s: SalonService) => {
    setForm({
      name: s.name,
      category: s.category || "",
      durationMinutes: s.durationMinutes,
      price: s.price,
      isActive: s.isActive,
      products: s.products.map(p => ({ inventoryItemId: p.inventoryItemId, quantity: p.quantity, unit: p.unit || "" })),
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  return (
    <>
      <PageMeta title="Services — Salon" description="Manage salon service catalog" />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Service Catalog</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{services.length} services · {services.filter(s => s.isActive).length} active</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Add Service
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {["all", ...categories].map(c => (
          <button key={c} onClick={() => setFilterCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${filterCategory === c ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"}`}>
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-5">{editingId ? "Edit Service" : "New Service"}</h3>
            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Service Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
                  <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Hair, Skin…"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Duration (min) *</label>
                  <input required type="number" min={5} step={5} value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: +e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Price (₹) *</label>
                  <input required type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-gray-500">Active</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
                    {form.isActive ? <ToggleRight size={24} className="text-brand-500" /> : <ToggleLeft size={24} className="text-gray-400" />}
                  </button>
                </div>
              </div>

              {/* Product usage rows — mirrors menu_ingredients UI */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Equipment/Cosmetics Used (Deducted on Completion)</label>
                  <button type="button" onClick={addProductRow} className="text-xs text-brand-500 hover:text-brand-600 font-semibold flex items-center gap-1"><Plus size={12} /> Add</button>
                </div>
                {form.products.map((p, i) => (
                  <div key={i} className="flex gap-2 items-center mb-2">
                    <select value={p.inventoryItemId} onChange={e => updateProductRow(i, "inventoryItemId", e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500">
                      <option value="">— Item —</option>
                      {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>)}
                    </select>
                    <input type="number" min={0} step={0.1} value={p.quantity} onChange={e => updateProductRow(i, "quantity", +e.target.value)} placeholder="Qty"
                      className="w-16 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500" />
                    <input value={p.unit} onChange={e => updateProductRow(i, "unit", e.target.value)} placeholder="unit"
                      className="w-14 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500" />
                    <button type="button" onClick={() => removeProductRow(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50">{saving ? "Saving…" : editingId ? "Update" : "Add Service"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Services grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading services…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div key={s.id} className={`rounded-2xl border-2 p-5 bg-white dark:bg-white/[0.03] transition-all ${s.isActive ? "border-gray-200 dark:border-gray-800" : "border-dashed border-gray-200 dark:border-gray-800 opacity-60"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center justify-center w-10 h-10 bg-brand-50 dark:bg-brand-500/10 text-brand-500 rounded-xl">
                  <Scissors size={18} />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => setServiceAvailability(s.id, !s.isActive)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors">
                    {s.isActive ? <ToggleRight size={16} className="text-brand-500" /> : <ToggleLeft size={16} />}
                  </button>
                  <button onClick={() => deleteService(s.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
              <h4 className="font-bold text-gray-800 dark:text-white/90 text-base mb-1">{s.name}</h4>
              {s.category && <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-xs text-gray-500 mb-2">{s.category}</span>}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1 text-sm text-gray-500"><Clock size={14} />{s.durationMinutes} min</div>
                <div className="flex items-center gap-1 font-bold text-brand-600 dark:text-brand-400"><Tag size={14} />₹{s.price.toLocaleString()}</div>
              </div>
              {s.products.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">{s.products.length} product{s.products.length !== 1 ? "s" : ""} used</p>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">No services yet. Add your first service!</div>
          )}
        </div>
      )}
    </>
  );
}
