import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../config/supabase";
import { useAuth } from "../hooks/useAuth";

export interface SalonStaff {
  id: string;
  name: string;
  role?: string;
  phone?: string;
  isActive: boolean;
}

export interface SalonServiceProduct {
  inventoryItemId: string;
  quantity: number;
  unit?: string;
}

export interface SalonService {
  id: string;
  name: string;
  category?: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
  products: SalonServiceProduct[];
}

export interface SalonAppointment {
  id: string;
  customerName: string;
  customerContact?: string;
  staffId?: string;
  serviceId?: string;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime?: string;
  status: string; // Booked | InProgress | Completed | NoShow | Cancelled
  notes?: string;
  createdAt: string;
  isQrBooked: boolean;
}

export interface SalonPackage {
  id: string;
  name: string;
  totalSessions?: number;
  validityDays?: number;
  price: number;
  isActive: boolean;
}

export interface SalonPackageRedemption {
  id: string;
  packageId: string;
  customerContact?: string;
  appointmentId?: string;
  redeemedAt: string;
}

export interface SalonBillItem {
  itemType: "service" | "product";
  serviceId?: string;
  inventoryItemId?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SalonBill {
  id: string;
  appointmentId?: string;
  customerName?: string;
  customerContact?: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod?: string;
  createdAt: string;
  items: SalonBillItem[];
}

interface SalonContextType {
  staff: SalonStaff[];
  services: SalonService[];
  appointments: SalonAppointment[];
  packages: SalonPackage[];
  redemptions: SalonPackageRedemption[];
  bills: SalonBill[];
  loading: boolean;
  error: string | null;

  addStaff: (s: Omit<SalonStaff, "id">) => Promise<void>;
  updateStaff: (id: string, updates: Partial<Omit<SalonStaff, "id">>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;

  addService: (s: Omit<SalonService, "id">) => Promise<void>;
  updateService: (id: string, updates: Omit<SalonService, "id">) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  setServiceAvailability: (id: string, isActive: boolean) => Promise<void>;

  addAppointment: (a: Omit<SalonAppointment, "id" | "status" | "createdAt" | "isQrBooked">) => Promise<void>;
  updateAppointmentStatus: (id: string, status: string) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Omit<SalonAppointment, "id" | "createdAt">>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;

  addPackage: (p: Omit<SalonPackage, "id">) => Promise<void>;
  updatePackage: (id: string, updates: Partial<Omit<SalonPackage, "id">>) => Promise<void>;
  deletePackage: (id: string) => Promise<void>;
  redeemPackage: (packageId: string, customerContact: string | undefined, appointmentId?: string) => Promise<void>;

  createBill: (bill: Omit<SalonBill, "id" | "createdAt">) => Promise<void>;
}

const SalonContext = createContext<SalonContextType | undefined>(undefined);

export const SalonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [staff, setStaff] = useState<SalonStaff[]>([]);
  const [services, setServices] = useState<SalonService[]>([]);
  const [appointments, setAppointments] = useState<SalonAppointment[]>([]);
  const [packages, setPackages] = useState<SalonPackage[]>([]);
  const [redemptions, setRedemptions] = useState<SalonPackageRedemption[]>([]);
  const [bills, setBills] = useState<SalonBill[]>([]);
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
        setStaff([]); setServices([]); setAppointments([]); setPackages([]); setRedemptions([]); setBills([]);
        return;
      }
      if (currentOrgId !== orgId) setOrgId(currentOrgId);

      const { data: staffData, error: staffError } = await supabase
        .from("salon_staff")
        .select("*")
        .eq("organization_id", currentOrgId);
      if (staffError) console.error("Staff fetch error:", staffError);
      setStaff((staffData || []).map((s: any) => ({
        id: s.id, name: s.name, role: s.role ?? undefined, phone: s.phone ?? undefined, isActive: s.is_active,
      })));

      const { data: serviceData, error: serviceError } = await supabase
        .from("salon_services")
        .select("*, salon_service_products(*)")
        .eq("organization_id", currentOrgId);
      if (serviceError) console.error("Services fetch error:", serviceError);
      setServices((serviceData || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        category: s.category ?? undefined,
        durationMinutes: s.duration_minutes,
        price: s.price,
        isActive: s.is_active,
        products: (s.salon_service_products || []).map((p: any) => ({
          inventoryItemId: p.inventory_item_id, quantity: p.quantity, unit: p.unit ?? undefined,
        })),
      })));

      const { data: apptData, error: apptError } = await supabase
        .from("salon_appointments")
        .select("*")
        .eq("organization_id", currentOrgId)
        .order("appointment_date", { ascending: false });
      if (apptError) console.error("Appointments fetch error:", apptError);
      setAppointments((apptData || []).map((a: any) => ({
        id: a.id,
        customerName: a.customer_name,
        customerContact: a.customer_contact ?? undefined,
        staffId: a.staff_id ?? undefined,
        serviceId: a.service_id ?? undefined,
        appointmentDate: a.appointment_date,
        startTime: a.start_time,
        endTime: a.end_time ?? undefined,
        status: a.status,
        notes: a.notes ?? undefined,
        createdAt: a.created_at,
        isQrBooked: a.is_qr_booked ?? false,
      })));

      const { data: pkgData, error: pkgError } = await supabase
        .from("salon_packages")
        .select("*")
        .eq("organization_id", currentOrgId);
      if (pkgError) console.error("Packages fetch error:", pkgError);
      setPackages((pkgData || []).map((p: any) => ({
        id: p.id, name: p.name, totalSessions: p.total_sessions ?? undefined,
        validityDays: p.validity_days ?? undefined, price: p.price, isActive: p.is_active,
      })));

      // Redemptions scoped via parent package (no organization_id column on this table)
      const pkgIds = (pkgData || []).map((p: any) => p.id);
      if (pkgIds.length > 0) {
        const { data: redData, error: redError } = await supabase
          .from("salon_package_redemptions")
          .select("*")
          .in("package_id", pkgIds);
        if (redError) console.error("Redemptions fetch error:", redError);
        setRedemptions((redData || []).map((r: any) => ({
          id: r.id, packageId: r.package_id, customerContact: r.customer_contact ?? undefined,
          appointmentId: r.appointment_id ?? undefined, redeemedAt: r.redeemed_at,
        })));
      } else {
        setRedemptions([]);
      }

      const { data: billData, error: billError } = await supabase
        .from("salon_bills")
        .select("*, salon_bill_items(*)")
        .eq("organization_id", currentOrgId)
        .order("created_at", { ascending: false });
      if (billError) console.error("Bills fetch error:", billError);
      setBills((billData || []).map((b: any) => ({
        id: b.id,
        appointmentId: b.appointment_id ?? undefined,
        customerName: b.customer_name ?? undefined,
        customerContact: b.customer_contact ?? undefined,
        subtotal: b.subtotal,
        discount: b.discount,
        total: b.total,
        paymentMethod: b.payment_method ?? undefined,
        createdAt: b.created_at,
        items: (b.salon_bill_items || []).map((i: any) => ({
          itemType: i.item_type, serviceId: i.service_id ?? undefined, inventoryItemId: i.inventory_item_id ?? undefined,
          quantity: i.quantity, unitPrice: i.unit_price, lineTotal: i.line_total,
        })),
      })));
    } catch (err: any) {
      setError(err.message || "Failed to fetch salon data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    fetchInitialData(user.id);
  }, [authLoading, user]);

  // ── Realtime — top-level tables only; child rows (service_products,
  // redemptions, bill_items) are refreshed via a silent full refetch since
  // they're low-frequency writes tied to their parent's own mutation flow ──
  useEffect(() => {
    if (!orgId || !user) return;

    const staffChannel = supabase
      .channel(`rt-salon-staff-${orgId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "salon_staff", filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          setStaff(prev => prev.find(s => s.id === r.id) ? prev : [...prev, { id: r.id, name: r.name, role: r.role ?? undefined, phone: r.phone ?? undefined, isActive: r.is_active }]);
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "salon_staff", filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          setStaff(prev => prev.map(s => s.id === r.id ? { id: r.id, name: r.name, role: r.role ?? undefined, phone: r.phone ?? undefined, isActive: r.is_active } : s));
        })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "salon_staff" },
        (payload) => setStaff(prev => prev.filter(s => s.id !== (payload.old as any).id)))
      .subscribe();

    const servicesChannel = supabase
      .channel(`rt-salon-services-${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "salon_services", filter: `organization_id=eq.${orgId}` },
        () => fetchInitialData(user.id, true))
      .on("postgres_changes", { event: "*", schema: "public", table: "salon_service_products" },
        () => fetchInitialData(user.id, true))
      .subscribe();

    const apptChannel = supabase
      .channel(`rt-salon-appointments-${orgId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "salon_appointments", filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          const newAppt: SalonAppointment = {
            id: r.id, customerName: r.customer_name, customerContact: r.customer_contact ?? undefined,
            staffId: r.staff_id ?? undefined, serviceId: r.service_id ?? undefined, appointmentDate: r.appointment_date,
            startTime: r.start_time, endTime: r.end_time ?? undefined, status: r.status, notes: r.notes ?? undefined,
            createdAt: r.created_at, isQrBooked: r.is_qr_booked ?? false,
          };
          setAppointments(prev => prev.find(a => a.id === r.id) ? prev : [newAppt, ...prev]);
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "salon_appointments", filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          setAppointments(prev => prev.map(a => a.id === r.id ? {
            ...a, status: r.status, staffId: r.staff_id ?? undefined, serviceId: r.service_id ?? undefined,
            appointmentDate: r.appointment_date, startTime: r.start_time, endTime: r.end_time ?? undefined,
            notes: r.notes ?? undefined, isQrBooked: r.is_qr_booked ?? a.isQrBooked,
          } : a));
        })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "salon_appointments" },
        (payload) => setAppointments(prev => prev.filter(a => a.id !== (payload.old as any).id)))
      .subscribe();

    const pkgChannel = supabase
      .channel(`rt-salon-packages-${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "salon_packages", filter: `organization_id=eq.${orgId}` },
        () => fetchInitialData(user.id, true))
      .on("postgres_changes", { event: "*", schema: "public", table: "salon_package_redemptions" },
        () => fetchInitialData(user.id, true))
      .subscribe();

    const billsChannel = supabase
      .channel(`rt-salon-bills-${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "salon_bills", filter: `organization_id=eq.${orgId}` },
        () => fetchInitialData(user.id, true))
      .subscribe();

    return () => {
      supabase.removeChannel(staffChannel);
      supabase.removeChannel(servicesChannel);
      supabase.removeChannel(apptChannel);
      supabase.removeChannel(pkgChannel);
      supabase.removeChannel(billsChannel);
    };
  }, [orgId, user]);

  // ── Staff ──────────────────────────────────────────────────────────────────
  const addStaff = async (s: Omit<SalonStaff, "id">) => {
    if (!orgId) { setError("No organization context — please log in again."); return; }
    const { data, error } = await supabase.from("salon_staff").insert({
      organization_id: orgId, name: s.name, role: s.role || null, phone: s.phone || null, is_active: s.isActive,
    }).select().single();
    if (error) { console.error(error); setError(error.message); return; }
    setStaff(prev => [...prev, { ...s, id: data.id }]);
  };

  const updateStaff = async (id: string, updates: Partial<Omit<SalonStaff, "id">>) => {
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.role !== undefined) payload.role = updates.role || null;
    if (updates.phone !== undefined) payload.phone = updates.phone || null;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;
    const { error } = await supabase.from("salon_staff").update(payload).eq("id", id);
    if (error) { console.error(error); setError(error.message); return; }
    setStaff(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteStaff = async (id: string) => {
    const { error } = await supabase.from("salon_staff").delete().eq("id", id);
    if (error) { console.error(error); setError(error.message); return; }
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  // ── Services (+ product usage, mirrors menu_ingredients pattern) ────────────
  const addService = async (s: Omit<SalonService, "id">) => {
    if (!orgId) { setError("No organization context — please log in again."); return; }
    const { data, error } = await supabase.from("salon_services").insert({
      organization_id: orgId, name: s.name, category: s.category || null,
      duration_minutes: s.durationMinutes, price: s.price, is_active: s.isActive,
    }).select().single();
    if (error) { console.error(error); setError(error.message); return; }

    if (s.products.length > 0) {
      const rows = s.products.map(p => ({ service_id: data.id, inventory_item_id: p.inventoryItemId, quantity: p.quantity, unit: p.unit || null }));
      const { error: prodError } = await supabase.from("salon_service_products").insert(rows);
      if (prodError) console.error(prodError);
    }
    setServices(prev => [...prev, { ...s, id: data.id }]);
  };

  const updateService = async (id: string, updates: Omit<SalonService, "id">) => {
    const { error } = await supabase.from("salon_services").update({
      name: updates.name, category: updates.category || null, duration_minutes: updates.durationMinutes,
      price: updates.price, is_active: updates.isActive,
    }).eq("id", id);
    if (error) { console.error(error); setError(error.message); return; }

    await supabase.from("salon_service_products").delete().eq("service_id", id);
    if (updates.products.length > 0) {
      const rows = updates.products.map(p => ({ service_id: id, inventory_item_id: p.inventoryItemId, quantity: p.quantity, unit: p.unit || null }));
      const { error: prodError } = await supabase.from("salon_service_products").insert(rows);
      if (prodError) { console.error(prodError); setError(prodError.message); return; }
    }
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase.from("salon_services").delete().eq("id", id);
    if (error) { console.error(error); setError(error.message); return; }
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const setServiceAvailability = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("salon_services").update({ is_active: isActive }).eq("id", id);
    if (error) { console.error(error); setError(error.message); return; }
    setServices(prev => prev.map(s => s.id === id ? { ...s, isActive } : s));
  };

  // ── Appointments ─────────────────────────────────────────────────────────────
  const addAppointment = async (a: Omit<SalonAppointment, "id" | "status" | "createdAt" | "isQrBooked">) => {
    if (!orgId) { setError("No organization context — please log in again."); return; }
    const { data, error } = await supabase.from("salon_appointments").insert({
      organization_id: orgId,
      customer_name: a.customerName,
      customer_contact: a.customerContact || null,
      staff_id: a.staffId || null,
      service_id: a.serviceId || null,
      appointment_date: a.appointmentDate,
      start_time: a.startTime,
      end_time: a.endTime || null,
      status: "Booked",
      notes: a.notes || null,
      // is_qr_booked intentionally omitted — defaults to FALSE in the DB
      // for staff-created walk-ins, mirroring the kitchen's orderCode pattern.
    }).select().single();
    if (error) { console.error(error); setError(error.message); return; }
    setAppointments(prev => [{ ...a, id: data.id, status: "Booked", createdAt: data.created_at, isQrBooked: false }, ...prev]);
  };

  const updateAppointment = async (id: string, updates: Partial<Omit<SalonAppointment, "id" | "createdAt">>) => {
    const payload: Record<string, any> = {};
    if (updates.customerName !== undefined) payload.customer_name = updates.customerName;
    if (updates.customerContact !== undefined) payload.customer_contact = updates.customerContact || null;
    if (updates.staffId !== undefined) payload.staff_id = updates.staffId || null;
    if (updates.serviceId !== undefined) payload.service_id = updates.serviceId || null;
    if (updates.appointmentDate !== undefined) payload.appointment_date = updates.appointmentDate;
    if (updates.startTime !== undefined) payload.start_time = updates.startTime;
    if (updates.endTime !== undefined) payload.end_time = updates.endTime || null;
    if (updates.notes !== undefined) payload.notes = updates.notes || null;
    if (updates.status !== undefined) payload.status = updates.status;
    const { error } = await supabase.from("salon_appointments").update(payload).eq("id", id);
    if (error) { console.error(error); setError(error.message); return; }
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  // Moving an appointment to Completed deducts product usage for its service,
  // same trigger point as the kitchen's Preparing -> Delivered deduction.
  const updateAppointmentStatus = async (id: string, status: string) => {
    const appt = appointments.find(a => a.id === id);
    if (!appt) return;

    if (status === "Completed" && appt.status !== "Completed" && appt.serviceId) {
      const service = services.find(s => s.id === appt.serviceId);
      if (service) {
        for (const p of service.products) {
          const { error: deductError } = await supabase.rpc("adjust_inventory_quantity", {
            item_id: p.inventoryItemId,
            delta: -p.quantity,
          });
          if (deductError) console.error("Inventory deduction error:", deductError);
        }
      }
    }

    const { error } = await supabase.from("salon_appointments").update({ status }).eq("id", id);
    if (error) { console.error(error); setError(error.message); return; }
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const deleteAppointment = async (id: string) => {
    const { error } = await supabase.from("salon_appointments").delete().eq("id", id);
    if (error) { console.error(error); setError(error.message); return; }
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  // ── Packages ─────────────────────────────────────────────────────────────────
  const addPackage = async (p: Omit<SalonPackage, "id">) => {
    if (!orgId) { setError("No organization context — please log in again."); return; }
    const { data, error } = await supabase.from("salon_packages").insert({
      organization_id: orgId, name: p.name, total_sessions: p.totalSessions ?? null,
      validity_days: p.validityDays ?? null, price: p.price, is_active: p.isActive,
    }).select().single();
    if (error) { console.error(error); setError(error.message); return; }
    setPackages(prev => [...prev, { ...p, id: data.id }]);
  };

  const updatePackage = async (id: string, updates: Partial<Omit<SalonPackage, "id">>) => {
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.totalSessions !== undefined) payload.total_sessions = updates.totalSessions;
    if (updates.validityDays !== undefined) payload.validity_days = updates.validityDays;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;
    const { error } = await supabase.from("salon_packages").update(payload).eq("id", id);
    if (error) { console.error(error); setError(error.message); return; }
    setPackages(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePackage = async (id: string) => {
    const { error } = await supabase.from("salon_packages").delete().eq("id", id);
    if (error) { console.error(error); setError(error.message); return; }
    setPackages(prev => prev.filter(p => p.id !== id));
  };

  const redeemPackage = async (packageId: string, customerContact: string | undefined, appointmentId?: string) => {
    const { data, error } = await supabase.from("salon_package_redemptions").insert({
      package_id: packageId, customer_contact: customerContact || null, appointment_id: appointmentId || null,
    }).select().single();
    if (error) { console.error(error); setError(error.message); return; }
    setRedemptions(prev => [...prev, {
      id: data.id, packageId, customerContact, appointmentId, redeemedAt: data.redeemed_at,
    }]);
  };

  // ── Billing ──────────────────────────────────────────────────────────────────
  const createBill = async (bill: Omit<SalonBill, "id" | "createdAt">) => {
    if (!orgId) { setError("No organization context — please log in again."); return; }
    const { data, error } = await supabase.from("salon_bills").insert({
      organization_id: orgId,
      appointment_id: bill.appointmentId || null,
      customer_name: bill.customerName || null,
      customer_contact: bill.customerContact || null,
      subtotal: bill.subtotal,
      discount: bill.discount,
      total: bill.total,
      payment_method: bill.paymentMethod || null,
    }).select().single();
    if (error) { console.error(error); setError(error.message); return; }

    if (bill.items.length > 0) {
      const rows = bill.items.map(i => ({
        bill_id: data.id, item_type: i.itemType, service_id: i.serviceId || null,
        inventory_item_id: i.inventoryItemId || null, quantity: i.quantity, unit_price: i.unitPrice, line_total: i.lineTotal,
      }));
      const { error: itemsError } = await supabase.from("salon_bill_items").insert(rows);
      if (itemsError) { console.error(itemsError); setError(itemsError.message); return; }
    }

    setBills(prev => [{ ...bill, id: data.id, createdAt: data.created_at }, ...prev]);
  };

  return (
    <SalonContext.Provider
      value={{
        staff, services, appointments, packages, redemptions, bills, loading, error,
        addStaff, updateStaff, deleteStaff,
        addService, updateService, deleteService, setServiceAvailability,
        addAppointment, updateAppointmentStatus, updateAppointment, deleteAppointment,
        addPackage, updatePackage, deletePackage, redeemPackage,
        createBill,
      }}
    >
      {children}
    </SalonContext.Provider>
  );
};

export const useSalon = () => {
  const context = useContext(SalonContext);
  if (context === undefined) {
    throw new Error("useSalon must be used within a SalonProvider");
  }
  return context;
};