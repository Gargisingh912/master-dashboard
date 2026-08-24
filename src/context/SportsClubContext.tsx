import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../config/supabase";
import { useAuth } from "../hooks/useAuth";

export interface SportsClubMembershipPlan {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
  isActive: boolean;
}

export interface SportsClubMember {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  dob?: string;
  membershipPlanId?: string;
  membershipStart?: string;
  membershipEnd?: string;
  isActive: boolean;
}

export interface SportsClubFacility {
  id: string;
  name: string;
  type?: string;
  hourlyRate: number;
  isActive: boolean;
}

export interface SportsClubFacilityBooking {
  id: string;
  facilityId: string;
  memberId?: string;
  guestName?: string;
  guestContact?: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: string; // Booked | Completed | Cancelled
  isQrBooking: boolean;
  createdAt: string;
}

export interface SportsClubCheckin {
  id: string;
  memberId: string;
  checkinTime: string; // TIMESTAMPTZ
}

export interface SportsClubDue {
  id: string;
  memberId: string;
  amount: number;
  description: string;
  dueDate: string; // YYYY-MM-DD
  isPaid: boolean;
  paidDate?: string;
}

interface SportsClubContextType {
  membershipPlans: SportsClubMembershipPlan[];
  members: SportsClubMember[];
  facilities: SportsClubFacility[];
  bookings: SportsClubFacilityBooking[];
  checkins: SportsClubCheckin[];
  dues: SportsClubDue[];
  loading: boolean;
  error: string | null;

  addMembershipPlan: (p: Omit<SportsClubMembershipPlan, "id">) => Promise<void>;
  updateMembershipPlan: (id: string, updates: Partial<Omit<SportsClubMembershipPlan, "id">>) => Promise<void>;
  deleteMembershipPlan: (id: string) => Promise<void>;

  addMember: (m: Omit<SportsClubMember, "id">) => Promise<void>;
  updateMember: (id: string, updates: Partial<Omit<SportsClubMember, "id">>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;

  addFacility: (f: Omit<SportsClubFacility, "id">) => Promise<void>;
  updateFacility: (id: string, updates: Partial<Omit<SportsClubFacility, "id">>) => Promise<void>;
  deleteFacility: (id: string) => Promise<void>;

  addBooking: (b: Omit<SportsClubFacilityBooking, "id" | "createdAt" | "isQrBooking">) => Promise<void>;
  updateBookingStatus: (id: string, status: string) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;

  addCheckin: (c: Omit<SportsClubCheckin, "id" | "checkinTime">) => Promise<void>;

  addDue: (d: Omit<SportsClubDue, "id" | "isPaid" | "paidDate">) => Promise<void>;
  markDuePaid: (id: string) => Promise<void>;
  deleteDue: (id: string) => Promise<void>;
}

const SportsClubContext = createContext<SportsClubContextType | undefined>(undefined);

export function SportsClubProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  
  const [membershipPlans, setMembershipPlans] = useState<SportsClubMembershipPlan[]>([]);
  const [members, setMembers] = useState<SportsClubMember[]>([]);
  const [facilities, setFacilities] = useState<SportsClubFacility[]>([]);
  const [bookings, setBookings] = useState<SportsClubFacilityBooking[]>([]);
  const [checkins, setCheckins] = useState<SportsClubCheckin[]>([]);
  const [dues, setDues] = useState<SportsClubDue[]>([]);
  
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

        // Resolve Organization ID
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", session.user.id)
          .single();
        if (profileErr) throw profileErr;
        const orgId = profileData.organization_id;
        if (!orgId) throw new Error("No organization found for user");

        // Fetch data
        const [
          { data: plansData, error: plansErr },
          { data: membersData, error: membersErr },
          { data: facilitiesData, error: facilitiesErr },
          { data: bookingsData, error: bookingsErr },
          { data: checkinsData, error: checkinsErr },
          { data: duesData, error: duesErr }
        ] = await Promise.all([
          supabase.from("sportsclub_membership_plans").select("*").eq("organization_id", orgId),
          supabase.from("sportsclub_members").select("*").eq("organization_id", orgId),
          supabase.from("sportsclub_facilities").select("*").eq("organization_id", orgId),
          supabase.from("sportsclub_facility_bookings").select("*").eq("organization_id", orgId).order("booking_date", { ascending: false }),
          supabase.from("sportsclub_checkins").select("*").eq("organization_id", orgId).order("checkin_time", { ascending: false }),
          supabase.from("sportsclub_dues").select("*").eq("organization_id", orgId).order("due_date", { ascending: false })
        ]);

        if (plansErr) throw plansErr;
        if (membersErr) throw membersErr;
        if (facilitiesErr) throw facilitiesErr;
        if (bookingsErr) throw bookingsErr;
        if (checkinsErr) throw checkinsErr;
        if (duesErr) throw duesErr;

        if (active) {
          setMembershipPlans(plansData.map(p => ({
            id: p.id, name: p.name, durationMonths: p.duration_months, price: p.price, isActive: p.is_active
          })));
          setMembers(membersData.map(m => ({
            id: m.id, name: m.name, contact: m.contact || undefined, email: m.email || undefined, dob: m.dob || undefined,
            membershipPlanId: m.membership_plan_id || undefined, membershipStart: m.membership_start || undefined,
            membershipEnd: m.membership_end || undefined, isActive: m.is_active
          })));
          setFacilities(facilitiesData.map(f => ({
            id: f.id, name: f.name, type: f.type || undefined, hourlyRate: f.hourly_rate, isActive: f.is_active
          })));
          setBookings(bookingsData.map(b => ({
            id: b.id, facilityId: b.facility_id, memberId: b.member_id || undefined, guestName: b.guest_name || undefined,
            guestContact: b.guest_contact || undefined, bookingDate: b.booking_date, startTime: b.start_time, endTime: b.end_time,
            status: b.status, isQrBooking: b.is_qr_booking, createdAt: b.created_at
          })));
          setCheckins(checkinsData.map(c => ({
            id: c.id, memberId: c.member_id, checkinTime: c.checkin_time
          })));
          setDues(duesData.map(d => ({
            id: d.id, memberId: d.member_id, amount: d.amount, description: d.description, dueDate: d.due_date,
            isPaid: d.is_paid, paidDate: d.paid_date || undefined
          })));
        }
      } catch (err: any) {
        console.error("Error loading sports club data:", err);
        if (active) setError(err.message || "Failed to load sports club data");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    // Setup realtime subscriptions for the tables
    const channels = [
      supabase.channel('public:sportsclub_membership_plans')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sportsclub_membership_plans' }, loadData),
      supabase.channel('public:sportsclub_members')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sportsclub_members' }, loadData),
      supabase.channel('public:sportsclub_facilities')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sportsclub_facilities' }, loadData),
      supabase.channel('public:sportsclub_facility_bookings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sportsclub_facility_bookings' }, loadData),
      supabase.channel('public:sportsclub_checkins')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sportsclub_checkins' }, loadData),
      supabase.channel('public:sportsclub_dues')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sportsclub_dues' }, loadData)
    ];

    channels.forEach(ch => ch.subscribe());

    return () => {
      active = false;
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [session]);

  const resolveOrgId = async () => {
    if (!session?.user) throw new Error("Not logged in");
    const { data } = await supabase.from("profiles").select("organization_id").eq("id", session.user.id).single();
    if (!data?.organization_id) throw new Error("No organization found");
    return data.organization_id;
  };

  const addMembershipPlan = async (p: Omit<SportsClubMembershipPlan, "id">) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("sportsclub_membership_plans").insert([{
      organization_id: orgId,
      name: p.name,
      duration_months: p.durationMonths,
      price: p.price,
      is_active: p.isActive
    }]);
    if (error) throw error;
  };

  const updateMembershipPlan = async (id: string, updates: Partial<Omit<SportsClubMembershipPlan, "id">>) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("sportsclub_membership_plans").update({
      name: updates.name,
      duration_months: updates.durationMonths,
      price: updates.price,
      is_active: updates.isActive
    }).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const deleteMembershipPlan = async (id: string) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("sportsclub_membership_plans").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const addMember = async (m: Omit<SportsClubMember, "id">) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("sportsclub_members").insert([{
      organization_id: orgId,
      name: m.name,
      contact: m.contact || null,
      email: m.email || null,
      dob: m.dob || null,
      membership_plan_id: m.membershipPlanId || null,
      membership_start: m.membershipStart || null,
      membership_end: m.membershipEnd || null,
      is_active: m.isActive
    }]);
    if (error) throw error;
  };

  const updateMember = async (id: string, updates: Partial<Omit<SportsClubMember, "id">>) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("sportsclub_members").update({
      name: updates.name,
      contact: updates.contact || null,
      email: updates.email || null,
      dob: updates.dob || null,
      membership_plan_id: updates.membershipPlanId || null,
      membership_start: updates.membershipStart || null,
      membership_end: updates.membershipEnd || null,
      is_active: updates.isActive
    }).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const deleteMember = async (id: string) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("sportsclub_members").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const addFacility = async (f: Omit<SportsClubFacility, "id">) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("sportsclub_facilities").insert([{
      organization_id: orgId,
      name: f.name,
      type: f.type || null,
      hourly_rate: f.hourlyRate,
      is_active: f.isActive
    }]);
    if (error) throw error;
  };

  const updateFacility = async (id: string, updates: Partial<Omit<SportsClubFacility, "id">>) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("sportsclub_facilities").update({
      name: updates.name,
      type: updates.type || null,
      hourly_rate: updates.hourlyRate,
      is_active: updates.isActive
    }).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const deleteFacility = async (id: string) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("sportsclub_facilities").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const addBooking = async (b: Omit<SportsClubFacilityBooking, "id" | "createdAt" | "isQrBooking">) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("sportsclub_facility_bookings").insert([{
      organization_id: orgId,
      facility_id: b.facilityId,
      member_id: b.memberId || null,
      guest_name: b.guestName || null,
      guest_contact: b.guestContact || null,
      booking_date: b.bookingDate,
      start_time: b.startTime,
      end_time: b.endTime,
      status: b.status
    }]);
    if (error) throw error;
  };

  const updateBookingStatus = async (id: string, status: string) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("sportsclub_facility_bookings").update({ status }).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const deleteBooking = async (id: string) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("sportsclub_facility_bookings").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const addCheckin = async (c: Omit<SportsClubCheckin, "id" | "checkinTime">) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("sportsclub_checkins").insert([{
      organization_id: orgId,
      member_id: c.memberId
    }]);
    if (error) throw error;
  };

  const addDue = async (d: Omit<SportsClubDue, "id" | "isPaid" | "paidDate">) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("sportsclub_dues").insert([{
      organization_id: orgId,
      member_id: d.memberId,
      amount: d.amount,
      description: d.description,
      due_date: d.dueDate
    }]);
    if (error) throw error;
  };

  const markDuePaid = async (id: string) => {
    const orgId = await resolveOrgId();
    const todayStr = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("sportsclub_dues").update({
      is_paid: true,
      paid_date: todayStr
    }).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const deleteDue = async (id: string) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("sportsclub_dues").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  return (
    <SportsClubContext.Provider value={{
      membershipPlans, members, facilities, bookings, checkins, dues, loading, error,
      addMembershipPlan, updateMembershipPlan, deleteMembershipPlan,
      addMember, updateMember, deleteMember,
      addFacility, updateFacility, deleteFacility,
      addBooking, updateBookingStatus, deleteBooking,
      addCheckin, addDue, markDuePaid, deleteDue
    }}>
      {children}
    </SportsClubContext.Provider>
  );
}

export function useSportsClub() {
  const context = useContext(SportsClubContext);
  if (context === undefined) {
    throw new Error("useSportsClub must be used within a SportsClubProvider");
  }
  return context;
}
