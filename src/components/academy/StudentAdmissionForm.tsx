import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAcademy } from "../../context/AcademyContext";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "../../config/supabase";

export default function StudentAdmissionForm() {
  const { batches, addStudent } = useAcademy();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [guardianName, setGuardianName] = useState("");
  const [guardianContact, setGuardianContact] = useState("");
  const [batchId, setBatchId] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setName("");
    setContact("");
    setEmail("");
    setDob(null);
    setGuardianName("");
    setGuardianContact("");
    setBatchId("");
    setPhotoUrl("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `students/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('academy-photos').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('academy-photos').getPublicUrl(filePath);
      setPhotoUrl(data.publicUrl);
    } catch (err) {
      console.error(err);
      alert("Failed to upload image. Ensure 'academy-photos' bucket exists and is public.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!name.trim() || !contact.trim()) {
      setError("Please enter the student's name and contact number.");
      return;
    }
    if (contact.trim().length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setSubmitting(true);
    await addStudent({
      name: name.trim(),
      contact: contact.trim(),
      email: email.trim() || undefined,
      dob: dob ? dob.toISOString().split("T")[0] : undefined,
      guardianName: guardianName.trim() || undefined,
      guardianContact: guardianContact.trim() || undefined,
      batchId: batchId || undefined,
      photoUrl: photoUrl || undefined,
      enrolledAt: new Date().toISOString().split("T")[0],
      isActive: true,
    });
    setSubmitting(false);
    setSuccess(true);
    resetForm();
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03] max-w-xl w-full">
      <h3 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-4">
        Student Admission
      </h3>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-500 dark:bg-red-900/10 dark:border-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-4 rounded-lg bg-success-50 border border-success-100 px-3 py-2 text-sm text-success-600 dark:bg-success-500/10 dark:border-success-500/20 dark:text-success-400">
          Student admitted successfully.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center mb-6">
          <label className="relative flex flex-col items-center justify-center w-24 h-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 cursor-pointer overflow-hidden transition-colors group">
            {photoUrl ? (
              <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
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

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Student Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contact Number
          </label>
          <input
            type="tel"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="10-digit number"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date of Birth <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <DatePicker
            selected={dob}
            onChange={(date: Date | null) => setDob(date)}
            dateFormat="yyyy-MM-dd"
            placeholderText="Select date of birth"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Guardian Name <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Guardian Contact <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              value={guardianContact}
              onChange={(e) => setGuardianContact(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Batch <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">Unassigned</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {submitting ? "Admitting…" : "Admit Student"}
          </button>
        </div>
      </form>
    </div>
  );
}
