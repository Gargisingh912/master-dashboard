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

interface VenueBookingContextType {
  venues: Venue[];
  addonServices: VenueAddonService[];
  bookings: VenueBooking[];
  payments: VenuePayment[];
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
}

const VenueBookingContext = createContext<VenueBookingContextType | undefined>(undefined);

export function VenueBookingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [venues, setVenues] = useState<Venue[]>([]);
  const [addonServices, setAddonServices] = useState<VenueAddonService[]>([]);
  const [bookings, setBookings] = useState<VenueBooking[]>([]);
  const [payments, setPayments] = useState<VenuePayment[]>([]);
  
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
          { data: paymentsData, error: paymentsErr }
        ] = await Promise.all([
          supabase.from("venue_venues").select("*").eq("organization_id", orgId),
          supabase.from("venue_addon_services").select("*").eq("organization_id", orgId),
          supabase.from("venue_bookings").select("*").eq("organization_id", orgId).order("booking_date", { ascending: false }),
          supabase.from("venue_booking_addons").select("id, booking_id, addon_service_id, quantity, price_at_booking")
            .in("booking_id", (await supabase.from("venue_bookings").select("id").eq("organization_id", orgId)).data?.map(b => b.id) || []),
          supabase.from("venue_payments").select("*").eq("organization_id", orgId).order("payment_date", { ascending: false })
        ]);

        if (venuesErr) throw venuesErr;
        if (addonsErr) throw addonsErr;
        if (bookingsErr) throw bookingsErr;
        if (bookingAddonsErr) throw bookingAddonsErr;
        if (paymentsErr) throw paymentsErr;

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
      supabase.channel('public:venue_payments').on('postgres_changes', { event: '*', schema: 'public', table: 'venue_payments' }, loadData)
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

  return (
    <VenueBookingContext.Provider value={{
      venues, addonServices, bookings, payments, loading, error,
      addVenue, updateVenue, deleteVenue,
      addAddonService, updateAddonService, deleteAddonService,
      addBooking, updateBooking, deleteBooking,
      addPayment
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
