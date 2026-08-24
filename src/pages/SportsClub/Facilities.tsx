import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useSportsClub, SportsClubFacility, SportsClubMembershipPlan } from "../../context/SportsClubContext";
import { Plus, X, Tag, Settings, CreditCard } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../../components/ui/table";

const emptyFacility = {
  name: "",
  type: "",
  hourlyRate: 0,
  isActive: true,
};

const emptyPlan = {
  name: "",
  durationMonths: 1,
  price: 0,
  isActive: true,
};

export default function SportsClubFacilities() {
  const { facilities, membershipPlans, addFacility, updateFacility, addMembershipPlan, updateMembershipPlan, loading } = useSportsClub();
  const [activeTab, setActiveTab] = useState<"facilities" | "plans">("facilities");
  
  // Modal states
  const [showFacilityForm, setShowFacilityForm] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  
  const [facilityForm, setFacilityForm] = useState(emptyFacility);
  const [planForm, setPlanForm] = useState(emptyPlan);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFacilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateFacility(editingId, {
          name: facilityForm.name,
          type: facilityForm.type || undefined,
          hourlyRate: facilityForm.hourlyRate,
          isActive: facilityForm.isActive,
        });
      } else {
        await addFacility({
          name: facilityForm.name,
          type: facilityForm.type || undefined,
          hourlyRate: facilityForm.hourlyRate,
          isActive: facilityForm.isActive,
        });
      }
      setShowFacilityForm(false);
      setEditingId(null);
      setFacilityForm(emptyFacility);
    } catch (err: any) {
      setError(err.message || "Failed to save facility");
    } finally {
      setSaving(false);
    }
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateMembershipPlan(editingId, {
          name: planForm.name,
          durationMonths: planForm.durationMonths,
          price: planForm.price,
          isActive: planForm.isActive,
        });
      } else {
        await addMembershipPlan({
          name: planForm.name,
          durationMonths: planForm.durationMonths,
          price: planForm.price,
          isActive: planForm.isActive,
        });
      }
      setShowPlanForm(false);
      setEditingId(null);
      setPlanForm(emptyPlan);
    } catch (err: any) {
      setError(err.message || "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const startEditFacility = (f: SportsClubFacility) => {
    setFacilityForm({
      name: f.name,
      type: f.type || "",
      hourlyRate: f.hourlyRate,
      isActive: f.isActive,
    });
    setEditingId(f.id);
    setShowFacilityForm(true);
  };

  const startEditPlan = (p: SportsClubMembershipPlan) => {
    setPlanForm({
      name: p.name,
      durationMonths: p.durationMonths,
      price: p.price,
      isActive: p.isActive,
    });
    setEditingId(p.id);
    setShowPlanForm(true);
  };

  return (
    <div className="pb-24">
      <PageMeta title="Facilities & Plans | Sports Club" description="Manage facilities and membership plans" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white/90">Facilities & Plans</h1>
          <p className="text-sm text-gray-500">Configure your sports club offerings.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab("facilities")}
          className={`pb-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === "facilities" ? "border-brand-500 text-brand-600 dark:text-brand-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          Facilities
        </button>
        <button
          onClick={() => setActiveTab("plans")}
          className={`pb-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === "plans" ? "border-brand-500 text-brand-600 dark:text-brand-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          Membership Plans
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : activeTab === "facilities" ? (
        <>
          {facilities.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-gray-800">
              <Settings className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No facilities</h3>
              <p className="mt-1 text-sm text-gray-500">Add courts, pools, or gym areas.</p>
              <button
                onClick={() => setShowFacilityForm(true)}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors"
              >
                <Plus size={16} /> Add Facility
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Name</TableCell>
                    <TableCell isHeader>Type</TableCell>
                    <TableCell isHeader>Hourly Rate</TableCell>
                    <TableCell isHeader>Status</TableCell>
                    <TableCell isHeader className="text-right">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facilities.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-bold text-gray-800 dark:text-white/90">{f.name}</TableCell>
                      <TableCell className="text-gray-500 text-sm">{f.type || "—"}</TableCell>
                      <TableCell className="font-bold text-brand-600 dark:text-brand-400">₹{f.hourlyRate}</TableCell>
                      <TableCell>
                        {f.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <button onClick={() => startEditFacility(f)} className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
                          Edit
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {!showFacilityForm && !showPlanForm && (
            <button
              onClick={() => { setFacilityForm(emptyFacility); setEditingId(null); setShowFacilityForm(true); }}
              className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-lg shadow-brand-500/30 flex items-center justify-center transition-transform hover:scale-105 z-40"
            >
              <Plus size={24} />
            </button>
          )}
        </>
      ) : (
        <>
          {membershipPlans.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-gray-800">
              <CreditCard className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No plans</h3>
              <p className="mt-1 text-sm text-gray-500">Create membership plans for your users.</p>
              <button
                onClick={() => setShowPlanForm(true)}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors"
              >
                <Plus size={16} /> Add Plan
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Name</TableCell>
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
                      <TableCell className="text-gray-500 text-sm">{p.durationMonths} month(s)</TableCell>
                      <TableCell className="font-bold text-brand-600 dark:text-brand-400">₹{p.price}</TableCell>
                      <TableCell>
                        {p.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <button onClick={() => startEditPlan(p)} className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
                          Edit
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!showFacilityForm && !showPlanForm && (
            <button
              onClick={() => { setPlanForm(emptyPlan); setEditingId(null); setShowPlanForm(true); }}
              className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-lg shadow-brand-500/30 flex items-center justify-center transition-transform hover:scale-105 z-40"
            >
              <Plus size={24} />
            </button>
          )}
        </>
      )}

      {/* Facility Form Modal */}
      {showFacilityForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">
                {editingId ? "Edit Facility" : "New Facility"}
              </h2>
              <button onClick={() => setShowFacilityForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleFacilitySubmit} className="p-5 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Facility Name *</label>
                <input
                  type="text" required value={facilityForm.name}
                  onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
                  <input
                    type="text" value={facilityForm.type}
                    onChange={(e) => setFacilityForm({ ...facilityForm, type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500"
                    placeholder="e.g. Tennis Court"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Hourly Rate (₹) *</label>
                  <input
                    type="number" required min="0" value={facilityForm.hourlyRate}
                    onChange={(e) => setFacilityForm({ ...facilityForm, hourlyRate: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer">
                <input
                  type="checkbox" checked={facilityForm.isActive}
                  onChange={(e) => setFacilityForm({ ...facilityForm, isActive: e.target.checked })}
                  className="w-5 h-5 text-brand-500 rounded border-gray-300 focus:ring-brand-500"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Active</p>
                </div>
              </label>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowFacilityForm(false)} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-200" disabled={saving}>Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl font-bold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50">
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Form Modal */}
      {showPlanForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">
                {editingId ? "Edit Plan" : "New Plan"}
              </h2>
              <button onClick={() => setShowPlanForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePlanSubmit} className="p-5 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Plan Name *</label>
                <input
                  type="text" required value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Duration (Months) *</label>
                  <input
                    type="number" required min="1" value={planForm.durationMonths}
                    onChange={(e) => setPlanForm({ ...planForm, durationMonths: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Price (₹) *</label>
                  <input
                    type="number" required min="0" value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer">
                <input
                  type="checkbox" checked={planForm.isActive}
                  onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                  className="w-5 h-5 text-brand-500 rounded border-gray-300 focus:ring-brand-500"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Active</p>
                </div>
              </label>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPlanForm(false)} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-200" disabled={saving}>Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl font-bold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50">
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
