import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useVenueBooking } from "../../context/VenueBookingContext";
import { Plus, X, MapPin, Package, CreditCard } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../../components/ui/table";

const emptyVenue = {
  name: "",
  capacity: 0,
  basePrice: 0,
  isActive: true,
};

const emptyAddon = {
  name: "",
  price: 0,
  isActive: true,
};

const emptyPlan = {
  name: "",
  durationMonths: 1,
  price: 0,
  isActive: true,
};

export default function VenueSettings() {
  const { venues, addonServices, membershipPlans, addVenue, updateVenue, addAddonService, updateAddonService, addMembershipPlan, updateMembershipPlan, loading } = useVenueBooking();
  const [activeTab, setActiveTab] = useState<"venues" | "addons" | "plans">("venues");
  
  const [showForm, setShowForm] = useState(false);
  
  const [venueForm, setVenueForm] = useState(emptyVenue);
  const [addonForm, setAddonForm] = useState(emptyAddon);
  const [planForm, setPlanForm] = useState(emptyPlan);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (activeTab === "venues") {
        if (editingId) {
          await updateVenue(editingId, {
            name: venueForm.name,
            capacity: venueForm.capacity || undefined,
            basePrice: venueForm.basePrice,
            isActive: venueForm.isActive,
          });
        } else {
          await addVenue({
            name: venueForm.name,
            capacity: venueForm.capacity || undefined,
            basePrice: venueForm.basePrice,
            isActive: venueForm.isActive,
          });
        }
      } else if (activeTab === "addons") {
        if (editingId) {
          await updateAddonService(editingId, addonForm);
        } else {
          await addAddonService(addonForm);
        }
      } else {
        if (editingId) {
          await updateMembershipPlan(editingId, planForm);
        } else {
          await addMembershipPlan(planForm);
        }
      }
      setShowForm(false);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    if (activeTab === "venues") {
      setVenueForm({
        name: item.name,
        capacity: item.capacity || 0,
        basePrice: item.basePrice,
        isActive: item.isActive,
      });
    } else if (activeTab === "addons") {
      setAddonForm({
        name: item.name,
        price: item.price,
        isActive: item.isActive,
      });
    } else {
      setPlanForm({
        name: item.name,
        durationMonths: item.durationMonths,
        price: item.price,
        isActive: item.isActive,
      });
    }
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    if (activeTab === "venues") setVenueForm(emptyVenue);
    else if (activeTab === "addons") setAddonForm(emptyAddon);
    else setPlanForm(emptyPlan);
    setShowForm(true);
  };

  return (
    <div className="pb-24">
      <PageMeta title="Venues & Addons | Venue Booking" description="Manage venues and additional services" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white/90">Venues & Addons</h1>
          <p className="text-sm text-gray-500">Configure spaces and extra services.</p>
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-200 dark:border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab("venues")}
          className={`pb-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === "venues" ? "border-brand-500 text-brand-600 dark:text-brand-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          <MapPin size={16} /> Venues
        </button>
        <button
          onClick={() => setActiveTab("addons")}
          className={`pb-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === "addons" ? "border-brand-500 text-brand-600 dark:text-brand-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          <Package size={16} /> Addons
        </button>
        <button
          onClick={() => setActiveTab("plans")}
          className={`pb-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === "plans" ? "border-brand-500 text-brand-600 dark:text-brand-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          <CreditCard size={16} /> Membership Plans
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          
          {activeTab === "venues" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Name</TableCell>
                  <TableCell isHeader>Capacity</TableCell>
                  <TableCell isHeader>Base Price</TableCell>
                  <TableCell isHeader>Status</TableCell>
                  <TableCell isHeader className="text-right">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {venues.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-bold text-gray-800 dark:text-white/90">{v.name}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{v.capacity || "—"} guests</TableCell>
                    <TableCell className="font-bold text-brand-600 dark:text-brand-400">₹{v.basePrice}</TableCell>
                    <TableCell>
                      {v.isActive ? <span className="text-xs font-medium bg-success-50 text-success-700 px-2 py-0.5 rounded">Active</span> : <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Inactive</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => startEdit(v)} className="text-sm text-brand-600 hover:underline">Edit</button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {activeTab === "addons" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Addon Name</TableCell>
                  <TableCell isHeader>Price</TableCell>
                  <TableCell isHeader>Status</TableCell>
                  <TableCell isHeader className="text-right">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addonServices.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-bold text-gray-800 dark:text-white/90">{a.name}</TableCell>
                    <TableCell className="font-bold text-brand-600 dark:text-brand-400">₹{a.price}</TableCell>
                    <TableCell>
                      {a.isActive ? <span className="text-xs font-medium bg-success-50 text-success-700 px-2 py-0.5 rounded">Active</span> : <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Inactive</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => startEdit(a)} className="text-sm text-brand-600 hover:underline">Edit</button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {activeTab === "plans" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Plan Name</TableCell>
                  <TableCell isHeader>Duration</TableCell>
                  <TableCell isHeader>Price</TableCell>
                  <TableCell isHeader>Status</TableCell>
                  <TableCell isHeader className="text-right">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membershipPlans.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold text-gray-800 dark:text-white/90">{p.name}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{p.durationMonths} Months</TableCell>
                    <TableCell className="font-bold text-brand-600 dark:text-brand-400">₹{p.price}</TableCell>
                    <TableCell>
                      {p.isActive ? <span className="text-xs font-medium bg-success-50 text-success-700 px-2 py-0.5 rounded">Active</span> : <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Inactive</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => startEdit(p)} className="text-sm text-brand-600 hover:underline">Edit</button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

        </div>
      )}

      {!showForm && (
        <button
          onClick={resetForm}
          className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-lg shadow-brand-500/30 flex items-center justify-center transition-transform hover:scale-105 z-40"
        >
          <Plus size={24} />
        </button>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">
                {editingId ? "Edit" : "New"} {activeTab === "venues" ? "Venue" : activeTab === "addons" ? "Addon" : "Plan"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

              {activeTab === "venues" ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Venue Name *</label>
                    <input type="text" required value={venueForm.name} onChange={e => setVenueForm({ ...venueForm, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Capacity</label>
                      <input type="number" value={venueForm.capacity} onChange={e => setVenueForm({ ...venueForm, capacity: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Base Price (₹) *</label>
                      <input type="number" required min="0" value={venueForm.basePrice} onChange={e => setVenueForm({ ...venueForm, basePrice: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 mt-4">
                    <input type="checkbox" checked={venueForm.isActive} onChange={e => setVenueForm({ ...venueForm, isActive: e.target.checked })} className="w-5 h-5 text-brand-500 rounded border-gray-300 focus:ring-brand-500" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">Active</span>
                  </label>
                </>
              ) : activeTab === "addons" ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Addon Name *</label>
                    <input type="text" required value={addonForm.name} onChange={e => setAddonForm({ ...addonForm, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Price (₹) *</label>
                    <input type="number" required min="0" value={addonForm.price} onChange={e => setAddonForm({ ...addonForm, price: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                  </div>
                  <label className="flex items-center gap-3 mt-4">
                    <input type="checkbox" checked={addonForm.isActive} onChange={e => setAddonForm({ ...addonForm, isActive: e.target.checked })} className="w-5 h-5 text-brand-500 rounded border-gray-300 focus:ring-brand-500" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">Active</span>
                  </label>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Plan Name *</label>
                    <input type="text" required value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Duration (Months) *</label>
                      <input type="number" required min="1" value={planForm.durationMonths} onChange={e => setPlanForm({ ...planForm, durationMonths: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Price (₹) *</label>
                      <input type="number" required min="0" value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 mt-4">
                    <input type="checkbox" checked={planForm.isActive} onChange={e => setPlanForm({ ...planForm, isActive: e.target.checked })} className="w-5 h-5 text-brand-500 rounded border-gray-300 focus:ring-brand-500" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">Active</span>
                  </label>
                </>
              )}

            </form>
            
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-200" disabled={saving}>Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="px-5 py-2.5 rounded-xl font-bold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
