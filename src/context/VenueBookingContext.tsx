import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../config/supabase";
import { useAuth } from "../hooks/useAuth";

export interface Venue {
  id: string;
  name: string;
  capacity?: number;
  basePrice: number;
  isActive: boolean;
}

export interface VenueAddonService {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

export interface VenueBookingAddon {
  addonServiceId: string;
  quantity: number;
  priceAtBooking: number;
}

export interface VenueBooking {
  id: string;
  venueId?: string;
  customerName: string;
  customerContact?: string;
  eventType?: string;
  bookingDate: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  guestCount?: number;
  status: string; // Enquiry | Confirmed | Completed | Cancelled
  totalAmount: number;
  advancePaid: number;
  isQrBooking: boolean;
  createdAt: string;
  addons: VenueBookingAddon[];
}

export interface VenuePayment {
  id: string;
  bookingId: string;
  amount: number;
  paymentType: string; // Advance | Balance | Refund
  paymentMethod?: string;
  paymentDate: string;
}

export interface VenueMembershipPlan {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
  isActive: boolean;
}

export interface VenueMember {
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

export interface VenueCheckin {
  id: string;
  memberId: string;
  checkinTime: string; // TIMESTAMPTZ
}

interface VenueBookingContextType {
  venues: Venue[];
  addonServices: VenueAddonService[];
  bookings: VenueBooking[];
  payments: VenuePayment[];
  membershipPlans: VenueMembershipPlan[];
  members: VenueMember[];
  checkins: VenueCheckin[];
  loading: boolean;
  error: string | null;

  addVenue: (v: Omit<Venue, "id">) => Promise<void>;
  updateVenue: (id: string, updates: Partial<Omit<Venue, "id">>) => Promise<void>;
  deleteVenue: (id: string) => Promise<void>;

  addAddonService: (a: Omit<VenueAddonService, "id">) => Promise<void>;
  updateAddonService: (id: string, updates: Partial<Omit<VenueAddonService, "id">>) => Promise<void>;
  deleteAddonService: (id: string) => Promise<void>;

  addBooking: (b: Omit<VenueBooking, "id" | "createdAt" | "isQrBooking">) => Promise<void>;
  updateBooking: (id: string, updates: Partial<Omit<VenueBooking, "id" | "createdAt" | "isQrBooking">>) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;

  addPayment: (p: Omit<VenuePayment, "id" | "paymentDate">) => Promise<void>;

  addMembershipPlan: (p: Omit<VenueMembershipPlan, "id">) => Promise<void>;
  updateMembershipPlan: (id: string, updates: Partial<Omit<VenueMembershipPlan, "id">>) => Promise<void>;
  deleteMembershipPlan: (id: string) => Promise<void>;

  addMember: (m: Omit<VenueMember, "id">) => Promise<void>;
  updateMember: (id: string, updates: Partial<Omit<VenueMember, "id">>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;

  addCheckin: (c: Omit<VenueCheckin, "id" | "checkinTime">) => Promise<void>;
}

const VenueBookingContext = createContext<VenueBookingContextType | undefined>(undefined);

export function VenueBookingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [venues, setVenues] = useState<Venue[]>([]);
  const [addonServices, setAddonServices] = useState<VenueAddonService[]>([]);
  const [bookings, setBookings] = useState<VenueBooking[]>([]);
  const [payments, setPayments] = useState<VenuePayment[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<VenueMembershipPlan[]>([]);
  const [members, setMembers] = useState<VenueMember[]>([]);
  const [checkins, setCheckins] = useState<VenueCheckin[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!user) {
        if (active) setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        const { data: profileData, error: profileErr } = await supabase
          .from("profiles").select("organization_id").eq("id", user.id).single();
        if (profileErr) throw profileErr;
        const orgId = profileData.organization_id;
        if (!orgId) throw new Error("No organization found");

        const [
          { data: venuesData, error: venuesErr },
          { data: addonsData, error: addonsErr },
          { data: bookingsData, error: bookingsErr },
          { data: bookingAddonsData, error: bookingAddonsErr },
          { data: paymentsData, error: paymentsErr },
          { data: plansData, error: plansErr },
          { data: membersData, error: membersErr },
          { data: checkinsData, error: checkinsErr }
        ] = await Promise.all([
          supabase.from("venue_venues").select("*").eq("organization_id", orgId),
          supabase.from("venue_addon_services").select("*").eq("organization_id", orgId),
          supabase.from("venue_bookings").select("*").eq("organization_id", orgId).order("booking_date", { ascending: false }),
          supabase.from("venue_booking_addons").select("id, booking_id, addon_service_id, quantity, price_at_booking")
            .in("booking_id", (await supabase.from("venue_bookings").select("id").eq("organization_id", orgId)).data?.map(b => b.id) || []),
          supabase.from("venue_payments").select("*").eq("organization_id", orgId).order("payment_date", { ascending: false }),
          supabase.from("venue_membership_plans").select("*").eq("organization_id", orgId),
          supabase.from("venue_members").select("*").eq("organization_id", orgId),
          supabase.from("venue_checkins").select("*").eq("organization_id", orgId).order("checkin_time", { ascending: false })
        ]);

        if (venuesErr) throw venuesErr;
        if (addonsErr) throw addonsErr;
        if (bookingsErr) throw bookingsErr;
        if (bookingAddonsErr) throw bookingAddonsErr;
        if (paymentsErr) throw paymentsErr;
        if (plansErr) throw plansErr;
        if (membersErr) throw membersErr;
        if (checkinsErr) throw checkinsErr;

        if (active) {
          setVenues(venuesData.map(v => ({
            id: v.id, name: v.name, capacity: v.capacity || undefined, basePrice: v.base_price, isActive: v.is_active
          })));
          setAddonServices(addonsData.map(a => ({
            id: a.id, name: a.name, price: a.price, isActive: a.is_active
          })));
          
          const bookingAddonsMap = (bookingAddonsData || []).reduce((acc: any, ba: any) => {
            if (!acc[ba.booking_id]) acc[ba.booking_id] = [];
            acc[ba.booking_id].push({
              addonServiceId: ba.addon_service_id,
              quantity: ba.quantity,
              priceAtBooking: ba.price_at_booking
            });
            return acc;
          }, {});

          setBookings(bookingsData.map(b => ({
            id: b.id, venueId: b.venue_id || undefined, customerName: b.customer_name,
            customerContact: b.customer_contact || undefined, eventType: b.event_type || undefined,
            bookingDate: b.booking_date, startTime: b.start_time || undefined, endTime: b.end_time || undefined,
            guestCount: b.guest_count || undefined, status: b.status, totalAmount: b.total_amount,
            advancePaid: b.advance_paid, isQrBooking: b.is_qr_booking, createdAt: b.created_at,
            addons: bookingAddonsMap[b.id] || []
          })));

          setPayments(paymentsData.map(p => ({
            id: p.id, bookingId: p.booking_id, amount: p.amount, paymentType: p.payment_type,
            paymentMethod: p.payment_method || undefined, paymentDate: p.payment_date
          })));

          setMembershipPlans(plansData.map(p => ({
            id: p.id, name: p.name, durationMonths: p.duration_months, price: p.price, isActive: p.is_active
          })));
          setMembers(membersData.map(m => ({
            id: m.id, name: m.name, contact: m.contact || undefined, email: m.email || undefined, dob: m.dob || undefined,
            membershipPlanId: m.membership_plan_id || undefined, membershipStart: m.membership_start || undefined,
            membershipEnd: m.membership_end || undefined, isActive: m.is_active
          })));
          setCheckins(checkinsData.map(c => ({
            id: c.id, memberId: c.member_id, checkinTime: c.checkin_time
          })));
        }
      } catch (err: any) {
        console.error("Error loading venue data:", err);
        if (active) setError(err.message || "Failed to load venue data");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    const channels = [
      supabase.channel('public:venue_venues').on('postgres_changes', { event: '*', schema: 'public', table: 'venue_venues' }, loadData),
      supabase.channel('public:venue_addon_services').on('postgres_changes', { event: '*', schema: 'public', table: 'venue_addon_services' }, loadData),
      supabase.channel('public:venue_bookings').on('postgres_changes', { event: '*', schema: 'public', table: 'venue_bookings' }, loadData),
      supabase.channel('public:venue_booking_addons').on('postgres_changes', { event: '*', schema: 'public', table: 'venue_booking_addons' }, loadData),
      supabase.channel('public:venue_payments').on('postgres_changes', { event: '*', schema: 'public', table: 'venue_payments' }, loadData),
      supabase.channel('public:venue_membership_plans').on('postgres_changes', { event: '*', schema: 'public', table: 'venue_membership_plans' }, loadData),
      supabase.channel('public:venue_members').on('postgres_changes', { event: '*', schema: 'public', table: 'venue_members' }, loadData),
      supabase.channel('public:venue_checkins').on('postgres_changes', { event: '*', schema: 'public', table: 'venue_checkins' }, loadData)
    ];

    channels.forEach(ch => ch.subscribe());
    return () => { active = false; channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [user]);

  const resolveOrgId = async () => {
    if (!user) throw new Error("Not logged in");
    const { data } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
    if (!data?.organization_id) throw new Error("No organization found");
    return data.organization_id;
  };

  const addVenue = async (v: Omit<Venue, "id">) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("venue_venues").insert([{
      organization_id: orgId, name: v.name, capacity: v.capacity || null, base_price: v.basePrice, is_active: v.isActive
    }]);
    if (error) throw error;
  };

  const updateVenue = async (id: string, updates: Partial<Omit<Venue, "id">>) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("venue_venues").update({
      name: updates.name, capacity: updates.capacity || null, base_price: updates.basePrice, is_active: updates.isActive
    }).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const deleteVenue = async (id: string) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("venue_venues").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const addAddonService = async (a: Omit<VenueAddonService, "id">) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("venue_addon_services").insert([{
      organization_id: orgId, name: a.name, price: a.price, is_active: a.isActive
    }]);
    if (error) throw error;
  };

  const updateAddonService = async (id: string, updates: Partial<Omit<VenueAddonService, "id">>) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("venue_addon_services").update({
      name: updates.name, price: updates.price, is_active: updates.isActive
    }).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const deleteAddonService = async (id: string) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("venue_addon_services").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const addBooking = async (b: Omit<VenueBooking, "id" | "createdAt" | "isQrBooking">) => {
    const orgId = await resolveOrgId();
    
    // Calculate total amount from base price and addons
    let calculatedTotal = b.totalAmount;
    if (b.venueId) {
        const venue = venues.find(v => v.id === b.venueId);
        if (venue) {
            calculatedTotal = venue.basePrice;
            b.addons.forEach(a => {
                calculatedTotal += a.quantity * a.priceAtBooking;
            });
        }
    }

    const { data: bookingData, error: bErr } = await supabase.from("venue_bookings").insert([{
      organization_id: orgId, venue_id: b.venueId || null, customer_name: b.customerName,
      customer_contact: b.customerContact || null, event_type: b.eventType || null,
      booking_date: b.bookingDate, start_time: b.startTime || null, end_time: b.endTime || null,
      guest_count: b.guestCount || null, status: b.status, total_amount: calculatedTotal,
      advance_paid: b.advancePaid, is_qr_booking: false
    }]).select("id").single();
    
    if (bErr) throw bErr;

    if (b.addons && b.addons.length > 0) {
      const addonInserts = b.addons.map(a => ({
        booking_id: bookingData.id, addon_service_id: a.addonServiceId,
        quantity: a.quantity, price_at_booking: a.priceAtBooking
      }));
      const { error: aErr } = await supabase.from("venue_booking_addons").insert(addonInserts);
      if (aErr) throw aErr;
    }
    
    if (b.advancePaid > 0) {
        const { error: pErr } = await supabase.from("venue_payments").insert([{
            organization_id: orgId, booking_id: bookingData.id, amount: b.advancePaid,
            payment_type: "Advance", payment_method: "Cash" // Defaulting to Cash for simplicity
        }]);
        if (pErr) throw pErr;
    }
  };

  const updateBooking = async (id: string, updates: Partial<Omit<VenueBooking, "id" | "createdAt" | "isQrBooking">>) => {
    const orgId = await resolveOrgId();
    const { error: bErr } = await supabase.from("venue_bookings").update({
      venue_id: updates.venueId || null, customer_name: updates.customerName,
      customer_contact: updates.customerContact || null, event_type: updates.eventType || null,
      booking_date: updates.bookingDate, start_time: updates.startTime || null, end_time: updates.endTime || null,
      guest_count: updates.guestCount || null, status: updates.status, total_amount: updates.totalAmount,
      advance_paid: updates.advancePaid
    }).eq("id", id).eq("organization_id", orgId);
    
    if (bErr) throw bErr;

    if (updates.addons !== undefined) {
      const { error: delErr } = await supabase.from("venue_booking_addons").delete().eq("booking_id", id);
      if (delErr) throw delErr;

      if (updates.addons.length > 0) {
        const addonInserts = updates.addons.map(a => ({
          booking_id: id, addon_service_id: a.addonServiceId,
          quantity: a.quantity, price_at_booking: a.priceAtBooking
        }));
        const { error: insErr } = await supabase.from("venue_booking_addons").insert(addonInserts);
        if (insErr) throw insErr;
      }
    }
  };

  const deleteBooking = async (id: string) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("venue_bookings").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const addPayment = async (p: Omit<VenuePayment, "id" | "paymentDate">) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("venue_payments").insert([{
      organization_id: orgId, booking_id: p.bookingId, amount: p.amount,
      payment_type: p.paymentType, payment_method: p.paymentMethod || null
    }]);
    if (error) throw error;
    
    // Update the advance_paid field in bookings if it's an advance or balance payment
    if (p.paymentType === 'Advance' || p.paymentType === 'Balance') {
        const booking = bookings.find(b => b.id === p.bookingId);
        if (booking) {
            const newAdvance = booking.advancePaid + p.amount;
            await supabase.from("venue_bookings").update({ advance_paid: newAdvance }).eq("id", p.bookingId).eq("organization_id", orgId);
        }
    }
  };

  const addMembershipPlan = async (p: Omit<VenueMembershipPlan, "id">) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("venue_membership_plans").insert([{
      organization_id: orgId, name: p.name, duration_months: p.durationMonths, price: p.price, is_active: p.isActive
    }]);
    if (error) throw error;
  };

  const updateMembershipPlan = async (id: string, updates: Partial<Omit<VenueMembershipPlan, "id">>) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("venue_membership_plans").update({
      name: updates.name, duration_months: updates.durationMonths, price: updates.price, is_active: updates.isActive
    }).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const deleteMembershipPlan = async (id: string) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("venue_membership_plans").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const addMember = async (m: Omit<VenueMember, "id">) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("venue_members").insert([{
      organization_id: orgId, name: m.name, contact: m.contact || null, email: m.email || null, dob: m.dob || null,
      membership_plan_id: m.membershipPlanId || null, membership_start: m.membershipStart || null,
      membership_end: m.membershipEnd || null, is_active: m.isActive
    }]);
    if (error) throw error;
  };

  const updateMember = async (id: string, updates: Partial<Omit<VenueMember, "id">>) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("venue_members").update({
      name: updates.name, contact: updates.contact || null, email: updates.email || null, dob: updates.dob || null,
      membership_plan_id: updates.membershipPlanId || null, membership_start: updates.membershipStart || null,
      membership_end: updates.membershipEnd || null, is_active: updates.isActive
    }).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const deleteMember = async (id: string) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("venue_members").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
  };

  const addCheckin = async (c: Omit<VenueCheckin, "id" | "checkinTime">) => {
    const orgId = await resolveOrgId();
    const { error } = await supabase.from("venue_checkins").insert([{
      organization_id: orgId, member_id: c.memberId
    }]);
    if (error) throw error;
  };


  return (
    <VenueBookingContext.Provider value={{
      venues, addonServices, bookings, payments, membershipPlans, members, checkins, loading, error,
      addVenue, updateVenue, deleteVenue,
      addAddonService, updateAddonService, deleteAddonService,
      addBooking, updateBooking, deleteBooking,
      addPayment,
      addMembershipPlan, updateMembershipPlan, deleteMembershipPlan,
      addMember, updateMember, deleteMember,
      addCheckin
    }}>
      {children}
    </VenueBookingContext.Provider>
  );
}

export function useVenueBooking() {
  const context = useContext(VenueBookingContext);
  if (context === undefined) {
    throw new Error("useVenueBooking must be used within a VenueBookingProvider");
  }
  return context;
}
