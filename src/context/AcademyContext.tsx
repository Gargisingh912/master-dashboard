import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../config/supabase";
import { useAuth } from "../hooks/useAuth";

export interface AcademyCoach {
  id: string;
  name: string;
  phone?: string;
  specialization?: string;
  photoUrl?: string;
  isActive: boolean;
}

export interface AcademyBatch {
  id: string;
  name: string;
  sportOrSubject?: string;
  coachId?: string;
  capacity: number;
  scheduleDays: string[]; // e.g. ["Mon","Wed","Fri"]
  startTime?: string;
  endTime?: string;
  feeAmount: number;
  feeCycle: string; // monthly | quarterly | annual
  isActive: boolean;
}

export interface AcademyStudent {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  dob?: string;
  guardianName?: string;
  guardianContact?: string;
  batchId?: string;
  enrolledAt: string;
  isActive: boolean;
  performanceRating?: number;
  performanceNotes?: string;
  photoUrl?: string;
}

export interface AcademyAttendanceRecord {
  id: string;
  batchId: string;
  studentId: string;
  sessionDate: string; // YYYY-MM-DD
  status: string; // present | absent | late
}

export interface AcademyFeePayment {
  id: string;
  studentId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: string; // paid | due | overdue | partial
  paymentMethod?: string;
}

interface AcademyContextType {
  coaches: AcademyCoach[];
  batches: AcademyBatch[];
  students: AcademyStudent[];
  attendance: AcademyAttendanceRecord[];
  feePayments: AcademyFeePayment[];
  loading: boolean;
  error: string | null;

  addCoach: (c: Omit<AcademyCoach, "id">) => Promise<void>;
  updateCoach: (id: string, updates: Partial<Omit<AcademyCoach, "id">>) => Promise<void>;
  deleteCoach: (id: string) => Promise<void>;

  addBatch: (b: Omit<AcademyBatch, "id">) => Promise<void>;
  updateBatch: (id: string, updates: Partial<Omit<AcademyBatch, "id">>) => Promise<void>;
  deleteBatch: (id: string) => Promise<void>;

  addStudent: (s: Omit<AcademyStudent, "id">) => Promise<void>;
  updateStudent: (id: string, updates: Partial<Omit<AcademyStudent, "id">>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  markAttendance: (batchId: string, studentId: string, sessionDate: string, status: string) => Promise<void>;

  addFeePayment: (f: Omit<AcademyFeePayment, "id">) => Promise<void>;
  markFeePaid: (id: string, paidDate: string, paymentMethod?: string) => Promise<void>;
  updateFeePayment: (id: string, updates: Partial<Omit<AcademyFeePayment, "id">>) => Promise<void>;
  deleteFeePayment: (id: string) => Promise<void>;
}

const AcademyContext = createContext<AcademyContextType | undefined>(undefined);

export const AcademyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [coaches, setCoaches] = useState<AcademyCoach[]>([]);
  const [batches, setBatches] = useState<AcademyBatch[]>([]);
  const [students, setStudents] = useState<AcademyStudent[]>([]);
  const [attendance, setAttendance] = useState<AcademyAttendanceRecord[]>([]);
  const [feePayments, setFeePayments] = useState<AcademyFeePayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  const resolveOrgId = async (userId: string): Promise<string | null> => {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile/organization_id:", profileError);
      return null;
    }
    if (!profile?.organization_id) {
      console.warn("Logged-in user has no organization_id set on their profile.");
      return null;
    }
    return profile.organization_id;
  };

  const fetchInitialData = async (userId: string, silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const currentOrgId = orgId ?? (await resolveOrgId(userId));
      if (!currentOrgId) {
        setError("Could not determine your organization. Please log in again.");
        setCoaches([]); setBatches([]); setStudents([]); setAttendance([]); setFeePayments([]);
        return;
      }
      if (currentOrgId !== orgId) setOrgId(currentOrgId);

      const { data: coachData, error: coachError } = await supabase
        .from("academy_coaches")
        .select("*")
        .eq("organization_id", currentOrgId);
      if (coachError) console.error("Coaches fetch error:", coachError);
      setCoaches((coachData || []).map((c: any) => ({
        id: c.id, name: c.name, phone: c.phone ?? undefined, specialization: c.specialization ?? undefined, photoUrl: c.photo_url ?? undefined, isActive: c.is_active,
      })));

      const { data: batchData, error: batchError } = await supabase
        .from("academy_batches")
        .select("*")
        .eq("organization_id", currentOrgId);
      if (batchError) console.error("Batches fetch error:", batchError);
      setBatches((batchData || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        sportOrSubject: b.sport_or_subject ?? undefined,
        coachId: b.coach_id ?? undefined,
        capacity: b.capacity,
        scheduleDays: b.schedule_days || [],
        startTime: b.start_time ?? undefined,
        endTime: b.end_time ?? undefined,
        feeAmount: b.fee_amount,
        feeCycle: b.fee_cycle,
        isActive: b.is_active,
      })));

      const { data: studentData, error: studentError } = await supabase
        .from("academy_students")
        .select("*")
        .eq("organization_id", currentOrgId);
      if (studentError) console.error("Students fetch error:", studentError);
      setStudents((studentData || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        contact: s.contact ?? undefined,
        email: s.email ?? undefined,
        dob: s.dob ?? undefined,
        guardianName: s.guardian_name ?? undefined,
        guardianContact: s.guardian_contact ?? undefined,
        batchId: s.batch_id ?? undefined,
        enrolledAt: s.enrolled_at,
        isActive: s.is_active,
        performanceRating: s.performance_rating ?? undefined,
        performanceNotes: s.performance_notes ?? undefined,
        photoUrl: s.photo_url ?? undefined,
      })));

      // Attendance has no organization_id column — scope via batch ids we just fetched
      const batchIds = (batchData || []).map((b: any) => b.id);
      if (batchIds.length > 0) {
        const { data: attData, error: attError } = await supabase
          .from("academy_attendance")
          .select("*")
          .in("batch_id", batchIds);
        if (attError) console.error("Attendance fetch error:", attError);
        setAttendance((attData || []).map((a: any) => ({
          id: a.id, batchId: a.batch_id, studentId: a.student_id, sessionDate: a.session_date, status: a.status,
        })));
      } else {
        setAttendance([]);
      }

      const { data: feeData, error: feeError } = await supabase
        .from("academy_fee_payments")
        .select("*")
        .eq("organization_id", currentOrgId)
        .order("due_date", { ascending: true });
      if (feeError) console.error("Fee payments fetch error:", feeError);
      setFeePayments((feeData || []).map((f: any) => ({
        id: f.id, studentId: f.student_id, amount: f.amount, dueDate: f.due_date,
        paidDate: f.paid_date ?? undefined, status: f.status, paymentMethod: f.payment_method ?? undefined,
      })));
    } catch (err: any) {
      setError(err.message || "Failed to fetch academy data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    fetchInitialData(user.id);
  }, [authLoading, user]);

  useEffect(() => {
    if (!orgId || !user) return;

    const coachChannel = supabase
      .channel(`rt-academy-coaches-${orgId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "academy_coaches", filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          setCoaches(prev => prev.find(c => c.id === r.id) ? prev : [...prev, { id: r.id, name: r.name, phone: r.phone ?? undefined, specialization: r.specialization ?? undefined, photoUrl: r.photo_url ?? undefined, isActive: r.is_active }]);
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "academy_coaches", filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          setCoaches(prev => prev.map(c => c.id === r.id ? { id: r.id, name: r.name, phone: r.phone ?? undefined, specialization: r.specialization ?? undefined, photoUrl: r.photo_url ?? undefined, isActive: r.is_active } : c));
        })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "academy_coaches" },
        (payload) => setCoaches(prev => prev.filter(c => c.id !== (payload.old as any).id)))
      .subscribe();

    const batchChannel = supabase
      .channel(`rt-academy-batches-${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "academy_batches", filter: `organization_id=eq.${orgId}` },
        () => fetchInitialData(user.id, true))
      .subscribe();

    const studentChannel = supabase
      .channel(`rt-academy-students-${orgId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "academy_students", filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          const newStudent: AcademyStudent = {
            id: r.id, name: r.name, contact: r.contact ?? undefined, email: r.email ?? undefined, dob: r.dob ?? undefined,
            guardianName: r.guardian_name ?? undefined, guardianContact: r.guardian_contact ?? undefined,
            batchId: r.batch_id ?? undefined, enrolledAt: r.enrolled_at, isActive: r.is_active,
            performanceRating: r.performance_rating ?? undefined, performanceNotes: r.performance_notes ?? undefined,
            photoUrl: r.photo_url ?? undefined,
          };
          setStudents(prev => prev.find(s => s.id === r.id) ? prev : [...prev, newStudent]);
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "academy_students", filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          setStudents(prev => prev.map(s => s.id === r.id ? {
            ...s, name: r.name, contact: r.contact ?? undefined, email: r.email ?? undefined, dob: r.dob ?? undefined,
            guardianName: r.guardian_name ?? undefined, guardianContact: r.guardian_contact ?? undefined,
            batchId: r.batch_id ?? undefined, isActive: r.is_active,
            performanceRating: r.performance_rating ?? undefined, performanceNotes: r.performance_notes ?? undefined,
            photoUrl: r.photo_url ?? undefined,
          } : s));
        })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "academy_students" },
        (payload) => setStudents(prev => prev.filter(s => s.id !== (payload.old as any).id)))
      .subscribe();

    // Attendance has no organization_id at the channel level; refetch
    // silently and let the client-side batchIds scoping in
    // fetchInitialData keep the result correct.
    const attendanceChannel = supabase
      .channel(`rt-academy-attendance-${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "academy_attendance" },
        () => fetchInitialData(user.id, true))
      .subscribe();

    const feeChannel = supabase
      .channel(`rt-academy-fees-${orgId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "academy_fee_payments", filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          const newFee: AcademyFeePayment = {
            id: r.id, studentId: r.student_id, amount: r.amount, dueDate: r.due_date,
            paidDate: r.paid_date ?? undefined, status: r.status, paymentMethod: r.payment_method ?? undefined,
          };
          setFeePayments(prev => prev.find(f => f.id === r.id) ? prev : [...prev, newFee]);
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "academy_fee_payments", filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          setFeePayments(prev => prev.map(f => f.id === r.id ? {
            ...f, amount: r.amount, dueDate: r.due_date, paidDate: r.paid_date ?? undefined, status: r.status, paymentMethod: r.payment_method ?? undefined,
          } : f));
        })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "academy_fee_payments" },
        (payload) => setFeePayments(prev => prev.filter(f => f.id !== (payload.old as any).id)))
      .subscribe();

    return () => {
      supabase.removeChannel(coachChannel);
      supabase.removeChannel(batchChannel);
      supabase.removeChannel(studentChannel);
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(feeChannel);
    };
  }, [orgId, user]);

  // ── Coaches ──────────────────────────────────────────────────────────────────
  const addCoach = async (c: Omit<AcademyCoach, "id">) => {
    if (!orgId) { setError("No organization context — please log in again."); return; }
    const { data, error } = await supabase.from("academy_coaches").insert({
      organization_id: orgId, name: c.name, phone: c.phone || null, specialization: c.specialization || null, photo_url: c.photoUrl || null, is_active: c.isActive,
    }).select().single();
    if (error) { console.error(error); setError(error.message); return; }
    setCoaches(prev => [...prev, { ...c, id: data.id }]);
  };

  const updateCoach = async (id: string, updates: Partial<Omit<AcademyCoach, "id">>) => {
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.phone !== undefined) payload.phone = updates.phone || null;
    if (updates.specialization !== undefined) payload.specialization = updates.specialization || null;
    if (updates.photoUrl !== undefined) payload.photo_url = updates.photoUrl || null;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;
    const { error } = await supabase.from("academy_coaches").update(payload).eq("id", id);
    if (error) { console.error(error); setError(error.message); return; }
    setCoaches(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCoach = async (id: string) => {
    const { error } = await supabase.from("academy_coaches").delete().eq("id", id);
    if (error) { console.error(error); setError(error.message); return; }
    setCoaches(prev => prev.filter(c => c.id !== id));
  };

  // ── Batches ──────────────────────────────────────────────────────────────────
  const addBatch = async (b: Omit<AcademyBatch, "id">) => {
    if (!orgId) { setError("No organization context — please log in again."); return; }
    const { data, error } = await supabase.from("academy_batches").insert({
      organization_id: orgId, name: b.name, sport_or_subject: b.sportOrSubject || null, coach_id: b.coachId || null,
      capacity: b.capacity, schedule_days: b.scheduleDays, start_time: b.startTime || null, end_time: b.endTime || null,
      fee_amount: b.feeAmount, fee_cycle: b.feeCycle, is_active: b.isActive,
    }).select().single();
    if (error) { console.error(error); setError(error.message); return; }
    setBatches(prev => [...prev, { ...b, id: data.id }]);
  };

  const updateBatch = async (id: string, updates: Partial<Omit<AcademyBatch, "id">>) => {
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.sportOrSubject !== undefined) payload.sport_or_subject = updates.sportOrSubject || null;
    if (updates.coachId !== undefined) payload.coach_id = updates.coachId || null;
    if (updates.capacity !== undefined) payload.capacity = updates.capacity;
    if (updates.scheduleDays !== undefined) payload.schedule_days = updates.scheduleDays;
    if (updates.startTime !== undefined) payload.start_time = updates.startTime || null;
    if (updates.endTime !== undefined) payload.end_time = updates.endTime || null;
    if (updates.feeAmount !== undefined) payload.fee_amount = updates.feeAmount;
    if (updates.feeCycle !== undefined) payload.fee_cycle = updates.feeCycle;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;
    const { error } = await supabase.from("academy_batches").update(payload).eq("id", id);
    if (error) { console.error(error); setError(error.message); return; }
    setBatches(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBatch = async (id: string) => {
    const { error } = await supabase.from("academy_batches").delete().eq("id", id);
    if (error) { console.error(error); setError(error.message); return; }
    setBatches(prev => prev.filter(b => b.id !== id));
  };

  // ── Students ─────────────────────────────────────────────────────────────────
  const addStudent = async (s: Omit<AcademyStudent, "id">) => {
    if (!orgId) { setError("No organization context — please log in again."); return; }
    const { data, error } = await supabase.from("academy_students").insert({
      organization_id: orgId, name: s.name, contact: s.contact || null, email: s.email || null, dob: s.dob || null,
      guardian_name: s.guardianName || null, guardian_contact: s.guardianContact || null, batch_id: s.batchId || null,
      enrolled_at: s.enrolledAt, is_active: s.isActive,
      performance_rating: s.performanceRating || null, performance_notes: s.performanceNotes || null, photo_url: s.photoUrl || null,
    }).select().single();
    if (error) { console.error(error); setError(error.message); return; }
    setStudents(prev => [...prev, { ...s, id: data.id }]);
  };

  const updateStudent = async (id: string, updates: Partial<Omit<AcademyStudent, "id">>) => {
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.contact !== undefined) payload.contact = updates.contact || null;
    if (updates.email !== undefined) payload.email = updates.email || null;
    if (updates.dob !== undefined) payload.dob = updates.dob || null;
    if (updates.guardianName !== undefined) payload.guardian_name = updates.guardianName || null;
    if (updates.guardianContact !== undefined) payload.guardian_contact = updates.guardianContact || null;
    if (updates.batchId !== undefined) payload.batch_id = updates.batchId || null;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;
    if (updates.performanceRating !== undefined) payload.performance_rating = updates.performanceRating || null;
    if (updates.performanceNotes !== undefined) payload.performance_notes = updates.performanceNotes || null;
    if (updates.photoUrl !== undefined) payload.photo_url = updates.photoUrl || null;
    const { error } = await supabase.from("academy_students").update(payload).eq("id", id);
    if (error) { console.error(error); setError(error.message); return; }
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteStudent = async (id: string) => {
    const { error } = await supabase.from("academy_students").delete().eq("id", id);
    if (error) { console.error(error); setError(error.message); return; }
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  // ── Attendance — upsert on (student_id, session_date) unique constraint ────
  const markAttendance = async (batchId: string, studentId: string, sessionDate: string, status: string) => {
    const { data, error } = await supabase
      .from("academy_attendance")
      .upsert(
        { batch_id: batchId, student_id: studentId, session_date: sessionDate, status },
        { onConflict: "student_id,session_date" }
      )
      .select()
      .single();
    if (error) { console.error(error); setError(error.message); return; }
    setAttendance(prev => {
      const existingIdx = prev.findIndex(a => a.studentId === studentId && a.sessionDate === sessionDate);
      const record: AcademyAttendanceRecord = { id: data.id, batchId, studentId, sessionDate, status };
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = record;
        return copy;
      }
      return [...prev, record];
    });
  };

  // ── Fee payments ─────────────────────────────────────────────────────────────
  const addFeePayment = async (f: Omit<AcademyFeePayment, "id">) => {
    if (!orgId) { setError("No organization context — please log in again."); return; }
    const { data, error } = await supabase.from("academy_fee_payments").insert({
      organization_id: orgId, student_id: f.studentId, amount: f.amount, due_date: f.dueDate,
      paid_date: f.paidDate || null, status: f.status, payment_method: f.paymentMethod || null,
    }).select().single();
    if (error) { console.error(error); setError(error.message); return; }
    setFeePayments(prev => [...prev, { ...f, id: data.id }]);
  };

  const markFeePaid = async (id: string, paidDate: string, paymentMethod?: string) => {
    const { error } = await supabase.from("academy_fee_payments").update({
      status: "paid", paid_date: paidDate, payment_method: paymentMethod || null,
    }).eq("id", id);
    if (error) { console.error(error); setError(error.message); return; }
    setFeePayments(prev => prev.map(f => f.id === id ? { ...f, status: "paid", paidDate, paymentMethod } : f));
  };

  const updateFeePayment = async (id: string, updates: Partial<Omit<AcademyFeePayment, "id">>) => {
    const payload: Record<string, any> = {};
    if (updates.amount !== undefined) payload.amount = updates.amount;
    if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
    if (updates.paidDate !== undefined) payload.paid_date = updates.paidDate || null;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.paymentMethod !== undefined) payload.payment_method = updates.paymentMethod || null;
    const { error } = await supabase.from("academy_fee_payments").update(payload).eq("id", id);
    if (error) { console.error(error); setError(error.message); return; }
    setFeePayments(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteFeePayment = async (id: string) => {
    const { error } = await supabase.from("academy_fee_payments").delete().eq("id", id);
    if (error) { console.error(error); setError(error.message); return; }
    setFeePayments(prev => prev.filter(f => f.id !== id));
  };

  return (
    <AcademyContext.Provider
      value={{
        coaches, batches, students, attendance, feePayments, loading, error,
        addCoach, updateCoach, deleteCoach,
        addBatch, updateBatch, deleteBatch,
        addStudent, updateStudent, deleteStudent,
        markAttendance,
        addFeePayment, markFeePaid, updateFeePayment, deleteFeePayment,
      }}
    >
      {children}
    </AcademyContext.Provider>
  );
};

export const useAcademy = () => {
  const context = useContext(AcademyContext);
  if (context === undefined) {
    throw new Error("useAcademy must be used within an AcademyProvider");
  }
  return context;
};