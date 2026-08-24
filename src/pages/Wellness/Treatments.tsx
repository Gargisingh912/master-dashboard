import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useWellness } from "../../context/WellnessContext";
import { Plus, X, Heart, Settings, User, Grid } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../../components/ui/table";

const emptyTreatment = { name: "", category: "", durationMinutes: 60, price: 0, isActive: true, products: [] };
const emptyPackage = { name: "", totalSessions: 1, validityDays: 30, price: 0, isActive: true };
const emptyTherapist = { name: "", specialty: "", phone: "", isActive: true };
const emptyRoom = { name: "", type: "", isActive: true };

export default function WellnessTreatments() {
  const { 
    treatments, packages, therapists, rooms, 
    addTreatment, updateTreatment, 
    addPackage, updatePackage, 
    addTherapist, updateTherapist, 
    addRoom, updateRoom, 
    loading 
  } = useWellness();
  
  const [activeTab, setActiveTab] = useState<"treatments" | "packages" | "therapists" | "rooms">("treatments");
  
  const [showForm, setShowForm] = useState(false);
  
  const [treatmentForm, setTreatmentForm] = useState(emptyTreatment);
  const [packageForm, setPackageForm] = useState(emptyPackage);
  const [therapistForm, setTherapistForm] = useState(emptyTherapist);
  const [roomForm, setRoomForm] = useState(emptyRoom);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (activeTab === "treatments") {
        if (editingId) await updateTreatment(editingId, treatmentForm);
        else await addTreatment(treatmentForm);
      } else if (activeTab === "packages") {
        if (editingId) await updatePackage(editingId, packageForm);
        else await addPackage(packageForm);
      } else if (activeTab === "therapists") {
        if (editingId) await updateTherapist(editingId, therapistForm);
        else await addTherapist(therapistForm);
      } else if (activeTab === "rooms") {
        if (editingId) await updateRoom(editingId, roomForm);
        else await addRoom(roomForm);
      }
      setShowForm(false);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: any, type: string) => {
    setEditingId(item.id);
    if (type === "treatment") {
      setTreatmentForm({
        name: item.name, category: item.category || "", durationMinutes: item.durationMinutes,
        price: item.price, isActive: item.isActive, products: item.products || []
      });
    } else if (type === "package") {
      setPackageForm({
        name: item.name, totalSessions: item.totalSessions || 0, validityDays: item.validityDays || 0,
        price: item.price, isActive: item.isActive
      });
    } else if (type === "therapist") {
      setTherapistForm({
        name: item.name, specialty: item.specialty || "", phone: item.phone || "", isActive: item.isActive
      });
    } else if (type === "room") {
      setRoomForm({
        name: item.name, type: item.type || "", isActive: item.isActive
      });
    }
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    if (activeTab === "treatments") setTreatmentForm(emptyTreatment);
    else if (activeTab === "packages") setPackageForm(emptyPackage);
    else if (activeTab === "therapists") setTherapistForm(emptyTherapist);
    else if (activeTab === "rooms") setRoomForm(emptyRoom);
    setShowForm(true);
  };

  const TabButton = ({ tab, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`pb-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === tab ? "border-brand-500 text-brand-600 dark:text-brand-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="pb-24">
      <PageMeta title="Treatments & Settings | Wellness" description="Manage treatments, packages, therapists, and rooms" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white/90">Treatments & Settings</h1>
          <p className="text-sm text-gray-500">Configure your wellness center offerings.</p>
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto whitespace-nowrap">
        <TabButton tab="treatments" label="Treatments" icon={Heart} />
        <TabButton tab="packages" label="Packages" icon={Grid} />
        <TabButton tab="therapists" label="Therapists" icon={User} />
        <TabButton tab="rooms" label="Rooms" icon={Settings} />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          
          {/* TREATMENTS */}
          {activeTab === "treatments" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Name / Category</TableCell>
                  <TableCell isHeader>Duration</TableCell>
                  <TableCell isHeader>Price</TableCell>
                  <TableCell isHeader>Status</TableCell>
                  <TableCell isHeader className="text-right">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treatments.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-bold text-gray-800 dark:text-white/90">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.category || "—"}</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{t.durationMinutes} min</TableCell>
                    <TableCell className="font-bold text-brand-600 dark:text-brand-400">₹{t.price}</TableCell>
                    <TableCell>
                      {t.isActive ? <span className="text-xs font-medium bg-success-50 text-success-700 px-2 py-0.5 rounded">Active</span> : <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Inactive</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => startEdit(t, "treatment")} className="text-sm text-brand-600 hover:underline">Edit</button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* PACKAGES */}
          {activeTab === "packages" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Name</TableCell>
                  <TableCell isHeader>Sessions / Validity</TableCell>
                  <TableCell isHeader>Price</TableCell>
                  <TableCell isHeader>Status</TableCell>
                  <TableCell isHeader className="text-right">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold text-gray-800 dark:text-white/90">{p.name}</TableCell>
                    <TableCell className="text-sm text-gray-500">{p.totalSessions} sessions, {p.validityDays} days</TableCell>
                    <TableCell className="font-bold text-brand-600 dark:text-brand-400">₹{p.price}</TableCell>
                    <TableCell>
                      {p.isActive ? <span className="text-xs font-medium bg-success-50 text-success-700 px-2 py-0.5 rounded">Active</span> : <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Inactive</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => startEdit(p, "package")} className="text-sm text-brand-600 hover:underline">Edit</button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* THERAPISTS */}
          {activeTab === "therapists" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Name</TableCell>
                  <TableCell isHeader>Specialty</TableCell>
                  <TableCell isHeader>Phone</TableCell>
                  <TableCell isHeader>Status</TableCell>
                  <TableCell isHeader className="text-right">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {therapists.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-bold text-gray-800 dark:text-white/90">{t.name}</TableCell>
                    <TableCell className="text-sm text-gray-500">{t.specialty || "—"}</TableCell>
                    <TableCell className="text-sm text-gray-500">{t.phone || "—"}</TableCell>
                    <TableCell>
                      {t.isActive ? <span className="text-xs font-medium bg-success-50 text-success-700 px-2 py-0.5 rounded">Active</span> : <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Inactive</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => startEdit(t, "therapist")} className="text-sm text-brand-600 hover:underline">Edit</button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* ROOMS */}
          {activeTab === "rooms" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Name</TableCell>
                  <TableCell isHeader>Type</TableCell>
                  <TableCell isHeader>Status</TableCell>
                  <TableCell isHeader className="text-right">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-bold text-gray-800 dark:text-white/90">{r.name}</TableCell>
                    <TableCell className="text-sm text-gray-500">{r.type || "—"}</TableCell>
                    <TableCell>
                      {r.isActive ? <span className="text-xs font-medium bg-success-50 text-success-700 px-2 py-0.5 rounded">Active</span> : <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Inactive</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => startEdit(r, "room")} className="text-sm text-brand-600 hover:underline">Edit</button>
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

      {/* Unified Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">
                {editingId ? "Edit" : "New"} {activeTab === "treatments" ? "Treatment" : activeTab === "packages" ? "Package" : activeTab === "therapists" ? "Therapist" : "Room"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

              {activeTab === "treatments" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Treatment Name *</label>
                    <input type="text" required value={treatmentForm.name} onChange={e => setTreatmentForm({ ...treatmentForm, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Category</label>
                      <input type="text" value={treatmentForm.category} onChange={e => setTreatmentForm({ ...treatmentForm, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Price (₹) *</label>
                      <input type="number" required min="0" value={treatmentForm.price} onChange={e => setTreatmentForm({ ...treatmentForm, price: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Duration (mins) *</label>
                    <input type="number" required min="1" value={treatmentForm.durationMinutes} onChange={e => setTreatmentForm({ ...treatmentForm, durationMinutes: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                  </div>
                  <label className="flex items-center gap-3 mt-4">
                    <input type="checkbox" checked={treatmentForm.isActive} onChange={e => setTreatmentForm({ ...treatmentForm, isActive: e.target.checked })} className="w-5 h-5 text-brand-500 rounded border-gray-300 focus:ring-brand-500" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">Active</span>
                  </label>
                </>
              )}

              {activeTab === "packages" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Package Name *</label>
                    <input type="text" required value={packageForm.name} onChange={e => setPackageForm({ ...packageForm, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Total Sessions</label>
                      <input type="number" value={packageForm.totalSessions} onChange={e => setPackageForm({ ...packageForm, totalSessions: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Validity (Days)</label>
                      <input type="number" value={packageForm.validityDays} onChange={e => setPackageForm({ ...packageForm, validityDays: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Price (₹) *</label>
                    <input type="number" required min="0" value={packageForm.price} onChange={e => setPackageForm({ ...packageForm, price: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                  </div>
                  <label className="flex items-center gap-3 mt-4">
                    <input type="checkbox" checked={packageForm.isActive} onChange={e => setPackageForm({ ...packageForm, isActive: e.target.checked })} className="w-5 h-5 text-brand-500 rounded border-gray-300 focus:ring-brand-500" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">Active</span>
                  </label>
                </>
              )}

              {activeTab === "therapists" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Name *</label>
                    <input type="text" required value={therapistForm.name} onChange={e => setTherapistForm({ ...therapistForm, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Specialty</label>
                      <input type="text" value={therapistForm.specialty} onChange={e => setTherapistForm({ ...therapistForm, specialty: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Phone</label>
                      <input type="text" value={therapistForm.phone} onChange={e => setTherapistForm({ ...therapistForm, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 mt-4">
                    <input type="checkbox" checked={therapistForm.isActive} onChange={e => setTherapistForm({ ...therapistForm, isActive: e.target.checked })} className="w-5 h-5 text-brand-500 rounded border-gray-300 focus:ring-brand-500" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">Active</span>
                  </label>
                </>
              )}

              {activeTab === "rooms" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Room Name *</label>
                    <input type="text" required value={roomForm.name} onChange={e => setRoomForm({ ...roomForm, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Type</label>
                    <input type="text" value={roomForm.type} onChange={e => setRoomForm({ ...roomForm, type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500" />
                  </div>
                  <label className="flex items-center gap-3 mt-4">
                    <input type="checkbox" checked={roomForm.isActive} onChange={e => setRoomForm({ ...roomForm, isActive: e.target.checked })} className="w-5 h-5 text-brand-500 rounded border-gray-300 focus:ring-brand-500" />
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
