import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useSportsClub, SportsClubMember } from "../../context/SportsClubContext";
import { User, Phone, Mail, Calendar, Activity, X, Plus } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../../components/ui/table";

const emptyForm = {
  name: "",
  contact: "",
  email: "",
  dob: "",
  membershipPlanId: "",
  membershipStart: new Date().toISOString().split("T")[0],
  membershipEnd: "",
  isActive: true,
};

export default function SportsClubMembers() {
  const { members, membershipPlans, addMember, updateMember, deleteMember, loading } = useSportsClub();
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateMember(editingId, {
          name: form.name,
          contact: form.contact || undefined,
          email: form.email || undefined,
          dob: form.dob || undefined,
          membershipPlanId: form.membershipPlanId || undefined,
          membershipStart: form.membershipStart || undefined,
          membershipEnd: form.membershipEnd || undefined,
          isActive: form.isActive,
        });
      } else {
        await addMember({
          name: form.name,
          contact: form.contact || undefined,
          email: form.email || undefined,
          dob: form.dob || undefined,
          membershipPlanId: form.membershipPlanId || undefined,
          membershipStart: form.membershipStart || undefined,
          membershipEnd: form.membershipEnd || undefined,
          isActive: form.isActive,
        });
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err: any) {
      setError(err.message || "Failed to save member");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (m: SportsClubMember) => {
    setForm({
      name: m.name,
      contact: m.contact || "",
      email: m.email || "",
      dob: m.dob || "",
      membershipPlanId: m.membershipPlanId || "",
      membershipStart: m.membershipStart || "",
      membershipEnd: m.membershipEnd || "",
      isActive: m.isActive,
    });
    setEditingId(m.id);
    setShowForm(true);
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="pb-24">
      <PageMeta title="Members | Sports Club" description="Manage sports club members" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white/90">Members</h1>
          <p className="text-sm text-gray-500">View and manage member directory.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading members…</div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-gray-800">
          <User className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No members</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first member.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors"
          >
            <Plus size={16} /> Add Member
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Name</TableCell>
                <TableCell isHeader>Contact</TableCell>
                <TableCell isHeader>Plan & Dates</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader className="text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => {
                const plan = membershipPlans.find(p => p.id === m.membershipPlanId);
                const isExpired = m.membershipEnd && m.membershipEnd < todayStr;
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-bold text-gray-800 dark:text-white/90">{m.name}</div>
                      {m.email && <div className="text-xs text-gray-500">{m.email}</div>}
                    </TableCell>
                    <TableCell>
                      {m.contact && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                          <Phone size={14} /> {m.contact}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {plan ? plan.name : "No Plan"}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Calendar size={12} />
                        {m.membershipStart || "?"} → {m.membershipEnd || "?"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {m.isActive ? (
                        isExpired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400">
                            Active
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => startEdit(m)}
                        className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        Edit
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Floating Add Button */}
      {!showForm && (
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(true);
          }}
          className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-lg shadow-brand-500/30 flex items-center justify-center transition-transform hover:scale-105 z-40"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">
                {editingId ? "Edit Member" : "New Member"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 dark:bg-red-500/10 dark:border-red-500/20">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Contact Number</label>
                    <input
                      type="text"
                      value={form.contact}
                      onChange={(e) => setForm({ ...form, contact: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
                      placeholder="+91..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">DOB</label>
                    <input
                      type="date"
                      value={form.dob}
                      onChange={(e) => setForm({ ...form, dob: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Membership Plan</label>
                    <select
                      value={form.membershipPlanId}
                      onChange={(e) => {
                          const planId = e.target.value;
                          setForm({ ...form, membershipPlanId: planId });
                          // Auto-calculate end date if start date exists
                          if (planId && form.membershipStart) {
                              const plan = membershipPlans.find(p => p.id === planId);
                              if (plan) {
                                  const start = new Date(form.membershipStart);
                                  start.setMonth(start.getMonth() + plan.durationMonths);
                                  setForm(prev => ({ ...prev, membershipPlanId: planId, membershipEnd: start.toISOString().split("T")[0] }));
                              }
                          }
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
                    >
                      <option value="">None</option>
                      {membershipPlans.filter(p => p.isActive).map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.durationMonths}m)</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={form.membershipStart}
                      onChange={(e) => {
                          const start = e.target.value;
                          setForm({ ...form, membershipStart: start });
                          if (form.membershipPlanId && start) {
                              const plan = membershipPlans.find(p => p.id === form.membershipPlanId);
                              if (plan) {
                                  const d = new Date(start);
                                  d.setMonth(d.getMonth() + plan.durationMonths);
                                  setForm(prev => ({ ...prev, membershipStart: start, membershipEnd: d.toISOString().split("T")[0] }));
                              }
                          }
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">End Date</label>
                    <input
                      type="date"
                      value={form.membershipEnd}
                      onChange={(e) => setForm({ ...form, membershipEnd: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-5 h-5 text-brand-500 rounded border-gray-300 focus:ring-brand-500 bg-white dark:bg-gray-800 dark:border-gray-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Active Member</p>
                    <p className="text-xs text-gray-500">Uncheck to mark as inactive.</p>
                  </div>
                </label>
              </div>

            </form>
            
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-bold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
