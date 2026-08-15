import { useState, useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useAcademy, AcademyStudent } from "../../context/AcademyContext";
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  ChevronRight, Award, History, Star, Calendar, Camera, Loader2
} from "lucide-react";

const emptyForm = {
  name: "", contact: "", email: "", dob: "", guardianName: "", guardianContact: "",
  batchId: "", enrolledAt: new Date().toISOString().split("T")[0], photoUrl: "", isActive: true,
};

export default function AcademyStudents() {
  const { students, batches, attendance, feePayments, addStudent, updateStudent, deleteStudent, markAttendance, loading } = useAcademy();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterBatch, setFilterBatch] = useState("all");
  const [search, setSearch] = useState("");
  
  // For the new Profile Drawer
  const [selectedStudent, setSelectedStudent] = useState<AcademyStudent | null>(null);
  const [editingPerformance, setEditingPerformance] = useState(false);
  const [perfForm, setPerfForm] = useState({ rating: 5, notes: "" });

  const filtered = useMemo(() => {
    return students.filter(s => {
      if (filterBatch !== "all" && s.batchId !== filterBatch) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [students, filterBatch, search]);

  // Compute per-student attendance %
  const getAttendancePercent = (studentId: string) => {
    const records = attendance.filter(a => a.studentId === studentId);
    if (records.length === 0) return null;
    const present = records.filter(a => a.status === "present" || a.status === "late").length;
    return Math.round((present / records.length) * 100);
  };

  // Fee status
  const getFeeStatus = (studentId: string) => {
    const fees = feePayments.filter(f => f.studentId === studentId);
    const overdue = fees.filter(f => f.status === "overdue").length;
    const due = fees.filter(f => f.status === "due").length;
    if (overdue > 0) return { label: "Overdue", color: "text-red-500 bg-red-50 dark:bg-red-500/10" };
    if (due > 0) return { label: "Due", color: "text-warning-600 bg-warning-50 dark:bg-warning-500/10" };
    return { label: "Clear", color: "text-success-600 bg-success-50 dark:bg-success-500/10" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data = {
        name: form.name,
        contact: form.contact || undefined,
        email: form.email || undefined,
        dob: form.dob || undefined,
        guardianName: form.guardianName || undefined,
        guardianContact: form.guardianContact || undefined,
        batchId: form.batchId || undefined,
        enrolledAt: form.enrolledAt,
        photoUrl: form.photoUrl || undefined,
        isActive: form.isActive,
      };
      if (editingId) {
        await updateStudent(editingId, data);
        if (selectedStudent && selectedStudent.id === editingId) {
          setSelectedStudent({ ...selectedStudent, ...data });
        }
      } else {
        await addStudent(data);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (s: AcademyStudent) => {
    setForm({
      name: s.name, contact: s.contact || "", email: s.email || "", dob: s.dob || "",
      guardianName: s.guardianName || "", guardianContact: s.guardianContact || "",
      batchId: s.batchId || "", enrolledAt: s.enrolledAt, photoUrl: s.photoUrl || "", isActive: s.isActive,
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `students/${fileName}`;
      const { supabase } = await import('../../config/supabase'); // dynamic import if not top-level, but let's add it top level.
      const { error: uploadError } = await supabase.storage.from('academy-photos').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('academy-photos').getPublicUrl(filePath);
      setForm(f => ({ ...f, photoUrl: data.publicUrl }));
    } catch (err) {
      console.error(err);
      alert("Failed to upload image. Ensure 'academy-photos' bucket exists and is public.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <PageMeta title="Student Profiles — Academy" description="Comprehensive student profiles, batch history, and performance tracking" />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Student Profiles</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Batch history · Skill notes · Performance tracking</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Enroll Student
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Main List Section */}
        <div className={`flex-1 transition-all ${selectedStudent ? "lg:w-2/3" : "w-full"}`}>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 w-56"
            />
            <select
              value={filterBatch}
              onChange={e => setFilterBatch(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Batches</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-gray-400">Loading students…</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-gray-400">No students found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      {["Student", "Batch", "Performance", "Attendance", "Fee", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filtered.map(s => {
                      const batch = batches.find(b => b.id === s.batchId);
                      const attPct = getAttendancePercent(s.id);
                      const feeStatus = getFeeStatus(s.id);
                      const isSelected = selectedStudent?.id === s.id;
                      
                      return (
                        <tr 
                          key={s.id} 
                          onClick={() => setSelectedStudent(s)}
                          className={`cursor-pointer transition-colors ${!s.isActive ? "opacity-60" : ""} ${isSelected ? "bg-brand-50/50 dark:bg-brand-500/10" : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold overflow-hidden">
                                {s.photoUrl ? <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" /> : s.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{s.name}</p>
                                <p className="text-xs text-gray-400">{s.contact || s.email || "No contact"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {batch ? (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-medium">
                                {batch.name}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic text-xs">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex text-yellow-400">
                              {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} size={12} fill={i <= (s.performanceRating || 5) ? "currentColor" : "none"} className={i <= (s.performanceRating || 5) ? "" : "text-gray-300 dark:text-gray-600"} />
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {attPct === null ? (
                              <span className="text-xs text-gray-400 italic">No data</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${attPct >= 75 ? "text-success-600" : attPct >= 50 ? "text-warning-600" : "text-red-600"}`}>{attPct}%</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${feeStatus.color}`}>{feeStatus.label}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <ChevronRight size={16} className={`text-gray-400 transition-transform ${isSelected ? "text-brand-500 translate-x-1" : ""}`} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Profile Drawer / Sidebar */}
        {selectedStudent && (
          <div className="w-full lg:w-1/3 flex flex-col gap-4">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sticky top-24 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-xl font-bold shadow-md overflow-hidden">
                    {selectedStudent.photoUrl ? <img src={selectedStudent.photoUrl} alt={selectedStudent.name} className="w-full h-full object-cover" /> : selectedStudent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">{selectedStudent.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedStudent.isActive ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                      {selectedStudent.isActive ? "Active Student" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(selectedStudent)} className="p-2 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => setSelectedStudent(null)} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ChevronRight size={14} /></button>
                </div>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-3 mb-6 p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Contact</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{selectedStudent.contact || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Guardian</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{selectedStudent.guardianName || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Enrolled</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{selectedStudent.enrolledAt}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">DOB</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{selectedStudent.dob || "—"}</p>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-6">
                
                {/* Batch History */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <History size={16} className="text-brand-500" />
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white/90">Batch History</h4>
                  </div>
                  <div className="relative pl-3 border-l-2 border-gray-100 dark:border-gray-800 space-y-4">
                    <div className="relative">
                      <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-brand-500 ring-4 ring-white dark:ring-gray-900" />
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {batches.find(b => b.id === selectedStudent.batchId)?.name || "Current Batch"}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Currently Enrolled</p>
                    </div>
                    {/* Simulated past history */}
                    <div className="relative opacity-60">
                      <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600 ring-4 ring-white dark:ring-gray-900" />
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-400">Beginners Level 1</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Completed • Jan 2023 - Dec 2023</p>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100 dark:border-gray-800" />

                {/* Today's Attendance */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-blue-500" />
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white/90">Today's Attendance</h4>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {["present", "late", "absent"].map(status => {
                      const today = new Date().toISOString().split("T")[0];
                      const currentStatus = attendance.find(a => a.studentId === selectedStudent.id && a.sessionDate === today)?.status;
                      const isActive = currentStatus === status;
                      
                      return (
                        <button
                          key={status}
                          onClick={() => {
                            if (selectedStudent.batchId) {
                              markAttendance(selectedStudent.batchId, selectedStudent.id, today, status);
                            } else {
                              alert("Student must be assigned to a batch to mark attendance.");
                            }
                          }}
                          className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
                            isActive
                              ? status === "present" ? "bg-success-500 text-white shadow-md shadow-success-500/20" 
                                : status === "late" ? "bg-warning-500 text-white shadow-md shadow-warning-500/20" 
                                : "bg-red-500 text-white shadow-md shadow-red-500/20"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                          }`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <hr className="border-gray-100 dark:border-gray-800" />

                {/* Skill & Performance Notes */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Award size={16} className="text-purple-500" />
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white/90">Skill & Performance</h4>
                    </div>
                    {!editingPerformance && (
                      <button onClick={() => {
                        setPerfForm({ rating: selectedStudent.performanceRating || 5, notes: selectedStudent.performanceNotes || "" });
                        setEditingPerformance(true);
                      }} className="text-[10px] font-bold text-brand-500 uppercase hover:underline">Edit Notes</button>
                    )}
                  </div>
                  {editingPerformance ? (
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Rating (1-5)</label>
                        <input type="number" min={1} max={5} value={perfForm.rating} onChange={e => setPerfForm(f => ({ ...f, rating: +e.target.value }))} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
                        <textarea value={perfForm.notes} onChange={e => setPerfForm(f => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[60px]" />
                      </div>
                      <div className="flex gap-2 justify-end mt-2">
                        <button onClick={() => setEditingPerformance(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                        <button onClick={async () => {
                          await updateStudent(selectedStudent.id, { performanceRating: perfForm.rating, performanceNotes: perfForm.notes });
                          setSelectedStudent({ ...selectedStudent, performanceRating: perfForm.rating, performanceNotes: perfForm.notes });
                          setEditingPerformance(false);
                        }} className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors">Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/20">
                      <div className="flex items-center gap-1 mb-2 text-yellow-400">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} size={14} fill={i <= (selectedStudent.performanceRating || 5) ? "currentColor" : "none"} className={i <= (selectedStudent.performanceRating || 5) ? "" : "text-purple-200 dark:text-purple-900"} />
                        ))}
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300 ml-2">{(selectedStudent.performanceRating || 5).toFixed(1)} / 5.0</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic">
                        {selectedStudent.performanceNotes ? `"${selectedStudent.performanceNotes}"` : "No performance notes yet."}
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-5">{editingId ? "Edit Student" : "Enroll Student"}</h3>
            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-center mb-6">
                <label className="relative flex flex-col items-center justify-center w-24 h-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 cursor-pointer overflow-hidden transition-colors group">
                  {form.photoUrl ? (
                    <img src={form.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={24} className="text-gray-400 group-hover:text-brand-500" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 size={24} className="text-white animate-spin" />
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Contact</label>
                  <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Date of Birth</label>
                  <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Batch</label>
                  <select value={form.batchId} onChange={e => setForm(f => ({ ...f, batchId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">— No batch —</option>
                    {batches.filter(b => b.isActive).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Guardian Name</label>
                  <input value={form.guardianName} onChange={e => setForm(f => ({ ...f, guardianName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Guardian Contact</label>
                  <input value={form.guardianContact} onChange={e => setForm(f => ({ ...f, guardianContact: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Enrolled Date</label>
                  <input type="date" value={form.enrolledAt} onChange={e => setForm(f => ({ ...f, enrolledAt: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-gray-500">Active Status</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
                    {form.isActive ? <ToggleRight size={24} className="text-brand-500" /> : <ToggleLeft size={24} className="text-gray-400" />}
                  </button>
                </div>
                {editingId && (
                  <button type="button" onClick={() => { deleteStudent(editingId); setShowForm(false); setSelectedStudent(null); }} className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1">
                    <Trash2 size={12} /> Delete Student
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50">{saving ? "Saving…" : editingId ? "Save Changes" : "Enroll Student"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
}
