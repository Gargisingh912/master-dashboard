import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../config/supabase";
import { useAuth } from "../hooks/useAuth";

export interface WellnessTherapist {
  id: string;
  name: string;
  specialty?: string;
  phone?: string;
  isActive: boolean;
}

export interface WellnessRoom {
  id: string;
  name: string;
  type?: string;
  isActive: boolean;
}

export interface WellnessTreatmentProduct {
  inventoryItemId: string;
  quantity: number;
  unit?: string;
}

export interface WellnessTreatment {
  id: string;
  name: string;
  category?: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
  products: WellnessTreatmentProduct[];
}

export interface WellnessAppointment {
  id: string;
  customerName: string;
  customerContact?: string;
  therapistId?: string;
  roomId?: string;
  treatmentId?: string;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime?: string;
  status: string; // Booked | InProgress | Completed | NoShow | Cancelled
  notes?: string;
  isQrBooking: boolean;
  createdAt: string;
}

export interface WellnessPackage {
  id: string;
  name: string;
  totalSessions?: number;
  validityDays?: number;
  price: number;
  isActive: boolean;
}

export interface WellnessPackageRedemption {
  id: string;
  packageId: string;
  customerContact?: string;
  appointmentId?: string;
  redeemedAt: string;
}

export interface WellnessClientNote {
  id: string;
  customerContact: string;
  noteText: string;
  createdBy?: string;
  createdAt: string;
}

interface WellnessContextType {
  therapists: WellnessTherapist[];
  rooms: WellnessRoom[];
  treatments: WellnessTreatment[];
  appointments: WellnessAppointment[];
  packages: WellnessPackage[];
  redemptions: WellnessPackageRedemption[];
  clientNotes: WellnessClientNote[];
  loading: boolean;
  error: string | null;

  addTherapist: (t: Omit<WellnessTherapist, "id">) => Promise<void>;
  updateTherapist: (id: string, updates: Partial<Omit<WellnessTherapist, "id">>) => Promise<void>;
  deleteTherapist: (id: string) => Promise<void>;

  addRoom: (r: Omit<WellnessRoom, "id">) => Promise<void>;
  updateRoom: (id: string, updates: Partial<Omit<WellnessRoom, "id">>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;

  addTreatment: (t: Omit<WellnessTreatment, "id">) => Promise<void>;
  updateTreatment: (id: string, updates: Partial<Omit<WellnessTreatment, "id">>) => Promise<void>;
  deleteTreatment: (id: string) => Promise<void>;

  addAppointment: (a: Omit<WellnessAppointment, "id" | "createdAt" | "isQrBooking">) => Promise<void>;
  updateAppointmentStatus: (id: string, status: string) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;

  addPackage: (p: Omit<WellnessPackage, "id">) => Promise<void>;
  updatePackage: (id: string, updates: Partial<Omit<WellnessPackage, "id">>) => Promise<void>;
  deletePackage: (id: string) => Promise<void>;

  redeemPackage: (r: Omit<WellnessPackageRedemption, "id" | "redeemedAt">) => Promise<void>;

  addClientNote: (n: Omit<WellnessClientNote, "id" | "createdBy" | "createdAt">) => Promise<void>;
}

const WellnessContext = createContext<WellnessContextType | undefined>(undefined);

export function WellnessProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  
  const [therapists, setTherapists] = useState<WellnessTherapist[]>([]);
  const [rooms, setRooms] = useState<WellnessRoom[]>([]);
  const [treatments, setTreatments] = useState<WellnessTreatment[]>([]);
  const [appointments, setAppointments] = useState<WellnessAppointment[]>([]);
  const [packages, setPackages] = useState<WellnessPackage[]>([]);
  const [redemptions, setRedemptions] = useState<WellnessPackageRedemption[]>([]);
  const [clientNotes, setClientNotes] = useState<WellnessClientNote[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!session?.user) {
        if (active) setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        const { data: profileData, error: profileErr } = await supabase
          .from("profiles").select("organization_id").eq("id", session.user.id).single();
        if (profileErr) throw profileErr;
        const orgId = profileData.organization_id;
        if (!orgId) throw new Error("No organization found");

        const [
          { data: therapistsData, error: therapistsErr },
          { data: roomsData, error: roomsErr },
          { data: treatmentsData, error: treatmentsErr },
          { data: treatmentProductsData, error: tpErr },
          { data: appointmentsData, error: appointmentsErr },
          { data: packagesData, error: packagesErr },
          { data: redemptionsData, error: redemptionsErr },
          { data: notesData, error: notesErr }
        ] = await Promise.all([
          supabase.from("wellness_therapists").select("*").eq("organization_id", orgId),
          supabase.from("wellness_rooms").select("*").eq("organization_id", orgId),
          supabase.from("wellness_treatments").select("*").eq("organization_id", orgId),
          supabase.from("wellness_treatment_products").select("id, treatment_id, inventory_item_id, quantity, unit")
            .in("treatment_id", (await supabase.from("wellness_treatments").select("id").eq("organization_id", orgId)).data?.map(t => t.id) || []),
          supabase.from("wellness_appointments").select("*").eq("organization_id", orgId).order("appointment_date", { ascending: false }),
          supabase.from("wellness_packages").select("*").eq("organization_id", orgId),
          supabase.from("wellness_package_redemptions").select("id, package_id, customer_contact, appointment_id, redeemed_at")
            .in("package_id", (await supabase.from("wellness_packages").select("id").eq("organization_id", orgId)).data?.map(p => p.id) || []),
          supabase.from("wellness_client_notes").select("*").eq("organization_id", orgId).order("created_at", { ascending: false })
        ]);

        if (therapistsErr) throw therapistsErr;
        if (roomsErr) throw roomsErr;
        if (treatmentsErr) throw treatmentsErr;
        if (tpErr) throw tpErr;
        if (appointmentsErr) throw appointmentsErr;
        if (packagesErr) throw packagesErr;
        if (redemptionsErr) throw redemptionsErr;
        if (notesErr) throw notesErr;

        if (active) {
          setTherapists(therapistsData.map(t => ({
            id: t.id, name: t.name, specialty: t.specialty || undefined, phone: t.phone || undefined, isActive: t.is_active
          })));
          setRooms(roomsData.map(r => ({
            id: r.id, name: r.name, type: r.type || undefined, isActive: r.is_active
          })));
          
          const treatmentProductsMap = (treatmentProductsData || []).reduce((acc: any, tp: any) => {
            if (!acc[tp.treatment_id]) acc[tp.treatment_id] = [];
            acc[tp.treatment_id].push({
              inventoryItemId: tp.inventory_item_id,
              quantity: tp.quantity,
              unit: tp.unit || undefined
            });
            return acc;
          }, {});

          setTreatments(treatmentsData.map(t => ({
            id: t.id, name: t.name, category: t.category || undefined, durationMinutes: t.duration_minutes,
            price: t.price, isActive: t.is_active, products: treatmentProductsMap[t.id] || []
          })));

          setAppointments(appointmentsData.map(a => ({
            id: a.id, customerName: a.customer_name, customerContact: a.customer_contact || undefined,
            therapistId: a.therapist_id || undefined, roomId: a.room_id || undefined, treatmentId: a.treatment_id || undefined,
            appointmentDate: a.appointment_date, startTime: a.start_time, endTime: a.end_time || undefined,
            status: a.status, notes: a.notes || undefined, isQrBooking: a.is_qr_booking, createdAt: a.created_at
          })));

          setPackages(packagesData.map(p => ({
            id: p.id, name: p.name, totalSessions: p.total_sessions || undefined,
            validityDays: p.validity_days || undefined, price: p.price, isActive: p.is_active
          })));

          setRedemptions(redemptionsData.map(r => ({
            id: r.id, packageId: r.package_id, customerContact: r.customer_contact || undefined,
            appointmentId: r.appointment_id || undefined, redeemedAt: r.redeemed_at
          })));

          setClientNotes(notesData.map(n => ({
            id: n.id, customerContact: n.customer_contact, noteText: n.note_text,
            createdBy: n.created_by || undefined, createdAt: n.created_at
          })));
        }
      } catch (err: any) {
        console.error("Error loading wellness data:", err);
        if (active) setError(err.message || "Failed to load wellness data");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    const channels = [
      supabase.channel('public:wellness_therapists').on('postgres_changes', { event: '*', schema: 'public', table: 'wellness_therapists' }, loadData),
      supabase.channel('public:wellness_rooms').on('postgres_changes', { event: '*', schema: 'public', table: 'wellness_rooms' }, loadData),
      supabase.channel('public:wellness_treatments').on('postgres_changes', { event: '*', schema: 'public', table: 'wellness_treatments' }, loadData),
      supabase.channel('public:wellness_treatment_products').on('postgres_changes', { event: '*', schema: 'public', table: 'wellness_treatment_products' }, loadData),
      supabase.channel('public:wellness_appointments').on('postgres_changes', { event: '*', schema: 'public', table: 'wellness_appointments' }, loadData),
      supabase.channel('public:wellness_packages').on('postgres_changes', { event: '*', schema: 'public', table: 'wellness_packages' }, loadData),
      supabase.channel('public:wellness_package_redemptions').on('postgres_changes', { event: '*', schema: 'public', table: 'wellness_package_redemptions' }, loadData),
      supabase.channel('public:wellness_client_notes').on('postgres_changes', { event: '*', schema: 'public', table: 'wellness_client_notes' }, loadData)
    ];

    channels.forEach(ch => ch.subscribe());
    return () => { active = false; channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [session]);

  const resolveOrgId = async () => {
    if (!session?.user) throw new Error("Not logged in");
    const { data } = await supabase.from("profiles").select("organization_id").eq("id", session.user.id).single();
    if (!data?.organization_id) throw new Error("No organization found");
    return data.organization_id;
  };

  const addTherapist = async (t: Omit<WellnessTherapist, "id">) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("wellness_therapists").insert([{
      organization_id: orgId, name: t.name, specialty: t.specialty || null, phone: t.phone || null, is_active: t.isActive
    }]);
    if (error) throw error;
  };

  const updateTherapist = async (id: string, updates: Partial<Omit<WellnessTherapist, "id">>) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("wellness_therapists").update({
      name: updates.name, specialty: updates.specialty || null, phone: updates.phone || null, is_active: updates.isActive
    }).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const deleteTherapist = async (id: string) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("wellness_therapists").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const addRoom = async (r: Omit<WellnessRoom, "id">) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("wellness_rooms").insert([{
      organization_id: orgId, name: r.name, type: r.type || null, is_active: r.isActive
    }]);
    if (error) throw error;
  };

  const updateRoom = async (id: string, updates: Partial<Omit<WellnessRoom, "id">>) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("wellness_rooms").update({
      name: updates.name, type: updates.type || null, is_active: updates.isActive
    }).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const deleteRoom = async (id: string) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("wellness_rooms").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const addTreatment = async (t: Omit<WellnessTreatment, "id">) => {
    const orgId = await resolveOrgId();
    const { data: treatmentData, error: tErr } = await supabase.from("wellness_treatments").insert([{
      organization_id: orgId, name: t.name, category: t.category || null,
      duration_minutes: t.durationMinutes, price: t.price, is_active: t.isActive
    }]).select("id").single();
    if (tErr) throw tErr;

    if (t.products && t.products.length > 0) {
      const productInserts = t.products.map(p => ({
        treatment_id: treatmentData.id, inventory_item_id: p.inventoryItemId,
        quantity: p.quantity, unit: p.unit || null
      }));
      const { error: pErr } = await supabase.from("wellness_treatment_products").insert(productInserts);
      if (pErr) throw pErr;
    }
  };

  const updateTreatment = async (id: string, updates: Partial<Omit<WellnessTreatment, "id">>) => {
    const orgId = await resolveOrgId();
    const { error: tErr } = await supabase.from("wellness_treatments").update({
      name: updates.name, category: updates.category || null,
      duration_minutes: updates.durationMinutes, price: updates.price, is_active: updates.isActive
    }).eq("id", id).eq("organization_id", orgId);
    if (tErr) throw tErr;

    if (updates.products !== undefined) {
      const { error: delErr } = await supabase.from("wellness_treatment_products").delete().eq("treatment_id", id);
      if (delErr) throw delErr;

      if (updates.products.length > 0) {
        const productInserts = updates.products.map(p => ({
          treatment_id: id, inventory_item_id: p.inventoryItemId,
          quantity: p.quantity, unit: p.unit || null
        }));
        const { error: insErr } = await supabase.from("wellness_treatment_products").insert(productInserts);
        if (insErr) throw insErr;
      }
    }
  };

  const deleteTreatment = async (id: string) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("wellness_treatments").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const addAppointment = async (a: Omit<WellnessAppointment, "id" | "createdAt" | "isQrBooking">) => {
    const orgId = await resolveOrgId();

    // Dual-resource conflict check (therapist OR room)
    // Only check if therapist or room is selected and the appointment has an end time
    if ((a.therapistId || a.roomId) && a.endTime) {
      const { data: conflicts, error: checkErr } = await supabase
        .from("wellness_appointments")
        .select("id, start_time, end_time, therapist_id, room_id")
        .eq("organization_id", orgId)
        .eq("appointment_date", a.appointmentDate)
        .neq("status", "Cancelled")
        .neq("status", "NoShow");
      
      if (checkErr) throw checkErr;

      const hasConflict = conflicts?.some(existing => {
        if (!existing.end_time) return false;
        const overlaps = a.startTime < existing.end_time && a.endTime! > existing.start_time;
        if (!overlaps) return false;

        const sameTherapist = a.therapistId && a.therapistId === existing.therapist_id;
        const sameRoom = a.roomId && a.roomId === existing.room_id;
        return sameTherapist || sameRoom;
      });

      if (hasConflict) {
        throw new Error("Conflict: The selected therapist or room is already booked for this time slot.");
      }
    }

    const { error } = await supabase.from("wellness_appointments").insert([{
      organization_id: orgId,
      customer_name: a.customerName,
      customer_contact: a.customerContact || null,
      therapist_id: a.therapistId || null,
      room_id: a.roomId || null,
      treatment_id: a.treatmentId || null,
      appointment_date: a.appointmentDate,
      start_time: a.startTime,
      end_time: a.endTime || null,
      status: a.status,
      notes: a.notes || null,
      is_qr_booking: false
    }]);
    if (error) throw error;
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("wellness_appointments").update({ status }).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const deleteAppointment = async (id: string) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("wellness_appointments").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const addPackage = async (p: Omit<WellnessPackage, "id">) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("wellness_packages").insert([{
      organization_id: orgId, name: p.name, total_sessions: p.totalSessions || null,
      validity_days: p.validityDays || null, price: p.price, is_active: p.isActive
    }]);
    if (error) throw error;
  };

  const updatePackage = async (id: string, updates: Partial<Omit<WellnessPackage, "id">>) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("wellness_packages").update({
      name: updates.name, total_sessions: updates.totalSessions || null,
      validity_days: updates.validityDays || null, price: updates.price, is_active: updates.isActive
    }).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const deletePackage = async (id: string) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("wellness_packages").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const redeemPackage = async (r: Omit<WellnessPackageRedemption, "id" | "redeemedAt">) => {
    const { error } = await supabase.from("wellness_package_redemptions").insert([{
      package_id: r.packageId, customer_contact: r.customerContact || null, appointment_id: r.appointmentId || null
    }]);
    if (error) throw error;
  };

  const addClientNote = async (n: Omit<WellnessClientNote, "id" | "createdBy" | "createdAt">) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("wellness_client_notes").insert([{
      organization_id: orgId, customer_contact: n.customerContact, note_text: n.noteText, created_by: session?.user?.id
    }]);
    if (error) throw error;
  };

  return (
    <WellnessContext.Provider value={{
      therapists, rooms, treatments, appointments, packages, redemptions, clientNotes, loading, error,
      addTherapist, updateTherapist, deleteTherapist,
      addRoom, updateRoom, deleteRoom,
      addTreatment, updateTreatment, deleteTreatment,
      addAppointment, updateAppointmentStatus, deleteAppointment,
      addPackage, updatePackage, deletePackage,
      redeemPackage, addClientNote
    }}>
      {children}
    </WellnessContext.Provider>
  );
}

export function useWellness() {
  const context = useContext(WellnessContext);
  if (context === undefined) {
    throw new Error("useWellness must be used within a WellnessProvider");
  }
  return context;
}
