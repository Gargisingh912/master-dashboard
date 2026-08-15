import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router";
import { supabasePublic } from "../../config/supabasePublic";
import { base62ToUuid, generateOrderNumber } from "../../utils/helpers";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useClickOutside } from "../../hooks/useClickOutside";

interface ServiceAddon {
  id: string;
  name: string;
  price: number;
}

interface SalonService {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes?: number;
  category?: string;
  subcategory?: string;
  image_url?: string;
  image_urls?: string[];
  addons: ServiceAddon[];
}

interface CartLine {
  key: string; // serviceId, or serviceId::addonId1,addonId2 for a specific add-on combo
  service_id: string;
  name: string;
  basePrice: number;
  durationMinutes?: number;
  addons: ServiceAddon[];
  unitPrice: number;
  quantity: number;
}

// A service with no add-ons has cart key === its own id. A service with a
// specific add-on combo gets a compound key so different combos of the same
// service exist as separate cart lines (e.g. "Haircut + Beard Trim" vs
// "Haircut + Head Massage").
const makeCartKey = (serviceId: string, addonIds: string[]): string =>
  addonIds.length === 0 ? serviceId : `${serviceId}::${[...addonIds].sort().join(",")}`;

const parseCartKey = (key: string): { serviceId: string; addonIds: string[] } => {
  const [serviceId, addonPart] = key.split("::");
  return { serviceId, addonIds: addonPart ? addonPart.split(",") : [] };
};

export default function SalonBookingPage({ organizationId: propOrgId }: { organizationId?: string }) {
  const { organizationId: paramOrgId } = useParams<{ organizationId: string }>();
  const organizationId = propOrgId || paramOrgId;
  const [orgName, setOrgName] = useState("");
  const [orgLogo, setOrgLogo] = useState("");
  const [services, setServices] = useState<SalonService[]>([]);
  const [categoriesOrder, setCategoriesOrder] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<Record<string, number>>({}); // cart key -> quantity
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [isLive, setIsLive] = useState(true);

  // Accordion open/close state — multi-open, so several categories (and
  // several subcategories within them) can be expanded at the same time.
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [openSubcats, setOpenSubcats] = useState<Set<string>>(new Set());

  const accordionRef = useRef<HTMLDivElement>(null);
  useClickOutside(accordionRef, () => {
    setOpenCategories(new Set());
    setOpenSubcats(new Set());
  });

  const [contact, setContact] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [lookupDone, setLookupDone] = useState(true); // Always show fields

  // Preferred date/time for the appointment
  const [preferredDate, setPreferredDate] = useState<Date | null>(null);
  const [preferredTime, setPreferredTime] = useState("");

  // Add-on picker state — which service's picker is open, and the addon ids
  // currently checked before confirming
  const [addonPickerServiceId, setAddonPickerServiceId] = useState<string | null>(null);
  const [pendingAddonIds, setPendingAddonIds] = useState<Set<string>>(new Set());

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponId, setCouponId] = useState<string | null>(null);
  const [couponMinOrder, setCouponMinOrder] = useState(0);

  // Image zoom
  const [zoomImages, setZoomImages] = useState<string[]>([]);
  const [zoomImageIndex, setZoomImageIndex] = useState(0);

  const [submittedAppointment, setSubmittedAppointment] = useState<{
    id: string;
    appointment_id: string;
    total: number;
    created_at: string;
    status: string;
  } | null>(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);

  // ── Anonymous session ────────────────────────────────────────────────────────
  useEffect(() => {
    const ensureAnonSession = async () => {
      const { data: sessionData } = await supabasePublic.auth.getSession();
      if (!sessionData.session) {
        const { error: signInError } = await supabasePublic.auth.signInAnonymously();
        if (signInError) {
          console.error("Anonymous sign-in failed:", signInError);
          setError("Could not start your booking session. Please refresh and try again.");
        }
      }
      setAuthReady(true);
    };
    ensureAnonSession();
  }, []);

  // ── Appointment countdown + realtime ─────────────────────────────────────────
  useEffect(() => {
    if (!submittedAppointment || (submittedAppointment.status !== "Booked" && submittedAppointment.status !== "Waiting")) return;

    const startTime = new Date(submittedAppointment.created_at).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        supabasePublic
          .from("salon_appointments")
          .update({ status: "Cancelled" })
          .eq("id", submittedAppointment.id)
          .then(() => {
            setSubmittedAppointment((prev) => (prev ? { ...prev, status: "Cancelled" } : null));
          });
      }
    }, 1000);

    const channel = supabasePublic
      .channel(`customer-appointment-${submittedAppointment.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "salon_appointments", filter: `id=eq.${submittedAppointment.id}` },
        (payload) => {
          const updated = payload.new as { status: string };
          setSubmittedAppointment((prev) => (prev ? { ...prev, status: updated.status } : null));
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabasePublic.removeChannel(channel);
    };
  }, [submittedAppointment]);

  const handleEditAppointment = async () => {
    if (!submittedAppointment) return;
    await supabasePublic.from("salon_appointments").update({ status: "Cancelled" }).eq("id", submittedAppointment.id);
    setEditingAppointmentId(submittedAppointment.id);
    setSubmittedAppointment(null);
  };

  // ── Fetch services + org name ────────────────────────────────────────────────
  useEffect(() => {
    if (!organizationId) return;
    const actualOrgId = base62ToUuid(organizationId);

    const fetchData = async () => {
      const { data: orgData, error: orgErr } = await supabasePublic
        .from("public_org_info")
        .select("name, is_live, logo_url")
        .eq("id", actualOrgId)
        .maybeSingle();

      if (orgErr) console.error("Failed to load organization:", orgErr);
      setOrgName(orgData?.name || "");
      if (orgData?.logo_url) setOrgLogo(orgData.logo_url);
      if (orgData?.is_live !== undefined) setIsLive(orgData.is_live);

      const { data: catData } = await supabasePublic
        .from("salon_service_categories")
        .select("name, rank")
        .eq("organization_id", actualOrgId);

      const catOrder: Record<string, number> = {};
      (catData || []).forEach((c: any) => {
        catOrder[c.name] = c.rank;
      });
      setCategoriesOrder(catOrder);

      const { data: items, error: servicesErr } = await supabasePublic
        .from("salon_services")
        .select("id, name, price, duration_minutes, category, subcategory, image_url, image_urls, salon_service_addons(id, name, price)")
        .eq("organization_id", actualOrgId)
        .eq("is_available", true);

      if (servicesErr) console.error("Failed to load services:", servicesErr);

      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentAppointments, error: apptErr } = await supabasePublic
        .from("salon_appointments")
        .select("created_at, salon_appointment_services(service_id, quantity)")
        .eq("organization_id", actualOrgId)
        .gte("created_at", cutoff);

      if (apptErr) console.error("Failed to load recent appointments:", apptErr);

      const counts: Record<string, number> = {};
      (recentAppointments || []).forEach((a: any) => {
        (a.salon_appointment_services || []).forEach((asvc: any) => {
          counts[asvc.service_id] = (counts[asvc.service_id] || 0) + (asvc.quantity || 0);
        });
      });

      const top5Ids = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id]) => id);

      setPopularIds(top5Ids);
      setServices((items || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        duration_minutes: item.duration_minutes ?? undefined,
        category: item.category ?? undefined,
        subcategory: item.subcategory ?? undefined,
        image_url: item.image_url ?? undefined,
        image_urls: item.image_urls || [],
        addons: (item.salon_service_addons || []).map((a: any) => ({ id: a.id, name: a.name, price: a.price })),
      })));
      setLoading(false);
    };

    fetchData();
  }, [organizationId]);

  const [popularIds, setPopularIds] = useState<string[]>([]);

  const popularServices = services.filter((s) => popularIds.includes(s.id));
  popularServices.sort((a, b) => popularIds.indexOf(a.id) - popularIds.indexOf(b.id));

  // ── Category ordering ────────────────────────────────────────────────────────
  const getCategoryRank = (category: string): number => {
    return categoriesOrder[category] ?? 9999;
  };

  const userCategories = Array.from(
    new Set(services.map((s) => s.category).filter((c): c is string => !!c))
  ).sort((a, b) => getCategoryRank(a) - getCategoryRank(b));

  const grouped: Record<string, SalonService[]> = {};
  services.forEach((s) => {
    const cat = s.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });

  // Sub-grouping within a category. Only meaningful when a category has more
  // than one distinct subcategory value — a single-subcategory (or
  // subcategory-less) category renders as a flat list instead of a
  // pointless single header.
  const groupBySubcategory = (items: SalonService[]): Record<string, SalonService[]> => {
    const g: Record<string, SalonService[]> = {};
    items.forEach((item) => {
      const sub = item.subcategory || "";
      if (!g[sub]) g[sub] = [];
      g[sub].push(item);
    });
    return g;
  };

  const getCategoryItems = (cat: string): SalonService[] => {
    return [...(grouped[cat] || [])].sort((a, b) => a.price - b.price);
  };

  // ── Accordion open/close handlers (multi-open) ───────────────────────────────
  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleSubcat = (subKey: string) => {
    setOpenSubcats((prev) => {
      const next = new Set(prev);
      if (next.has(subKey)) next.delete(subKey);
      else next.add(subKey);
      return next;
    });
  };

  // Open the first category by default so the menu isn't fully collapsed on
  // first load. Only runs once, when services first arrive.
  useEffect(() => {
    if (services.length === 0) return;
    setOpenCategories((prev) => {
      if (prev.size > 0) return prev;
      const first = popularServices.length > 0 ? "Popular" : userCategories[0];
      return first ? new Set([first]) : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services]);

  // ── Contact lookup ───────────────────────────────────────────────────────────
  const handleContactLookup = async () => {
    if (!contact.trim() || !organizationId) return;
    const actualOrgId = base62ToUuid(organizationId);
    const { data, error } = await supabasePublic
      .from("customers")
      .select("name, email, dob")
      .eq("organization_id", actualOrgId)
      .eq("contact_number", contact.trim())
      .maybeSingle();

    if (error) console.error("Lookup error:", error);

    if (data) {
      setName(data.name || "");
      setEmail(data.email || "");
      if (data.dob) setDob(new Date(data.dob));
      else setDob(null);
    }
    setLookupDone(true);
  };

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || !organizationId) return;
    setCouponError("");
    const actualOrgId = base62ToUuid(organizationId);

    const { data, error } = await supabasePublic
      .from("discount_coupons")
      .select("id, code, discount_percent, max_uses, used_count, min_order_value, valid_from, valid_to, is_active")
      .eq("organization_id", actualOrgId)
      .eq("code", couponInput.trim().toUpperCase())
      .maybeSingle();

    if (error || !data) { setCouponError("Invalid coupon code."); return; }
    if (!data.is_active) { setCouponError("This coupon is no longer active."); return; }
    if (data.max_uses !== null && data.used_count >= data.max_uses) { setCouponError("This coupon has reached its usage limit."); return; }
    const now = new Date();
    if (data.valid_from && new Date(data.valid_from) > now) { setCouponError("This coupon is not yet active."); return; }
    if (data.valid_to && new Date(data.valid_to) < now) { setCouponError("This coupon has expired."); return; }

    if (data.min_order_value && subtotal < data.min_order_value) {
      setCouponError(`Add ₹${(data.min_order_value - subtotal).toFixed(2)} more to use this coupon (min. booking ₹${data.min_order_value}).`);
      return;
    }

    setCouponCode(data.code);
    setCouponDiscount(data.discount_percent);
    setCouponApplied(true);
    setCouponId(data.id);
    setCouponMinOrder(data.min_order_value || 0);
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponInput("");
    setCouponDiscount(0);
    setCouponApplied(false);
    setCouponId(null);
    setCouponError("");
    setCouponMinOrder(0);
  };

  // ── Cart helpers ─────────────────────────────────────────────────────────────
  const addToCart = (key: string) => setCart((p) => ({ ...p, [key]: (p[key] || 0) + 1 }));

  const removeFromCart = (key: string) =>
    setCart((p) => {
      if (!p[key]) return p;
      if (p[key] <= 1) { const n = { ...p }; delete n[key]; return n; }
      return { ...p, [key]: p[key] - 1 };
    });

  const removeLineCompletely = (key: string) =>
    setCart((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });

  // For services with add-ons: opens the picker instead of adding straight to cart
  const handleAddClick = (service: SalonService) => {
    if (service.addons.length === 0) {
      addToCart(makeCartKey(service.id, []));
      return;
    }
    setAddonPickerServiceId(service.id);
    setPendingAddonIds(new Set());
  };

  const toggleAddonSelection = (addonId: string) => {
    setPendingAddonIds((prev) => {
      const next = new Set(prev);
      if (next.has(addonId)) next.delete(addonId);
      else next.add(addonId);
      return next;
    });
  };

  const confirmAddonSelection = () => {
    if (!addonPickerServiceId) return;
    addToCart(makeCartKey(addonPickerServiceId, Array.from(pendingAddonIds)));
    setAddonPickerServiceId(null);
    setPendingAddonIds(new Set());
  };

  const cancelAddonSelection = () => {
    setAddonPickerServiceId(null);
    setPendingAddonIds(new Set());
  };

  const totalQtyForService = (serviceId: string): number =>
    Object.entries(cart)
      .filter(([key]) => parseCartKey(key).serviceId === serviceId)
      .reduce((s, [, qty]) => s + qty, 0);

  const resolveCartLine = (key: string, qty: number): CartLine | null => {
    const { serviceId, addonIds } = parseCartKey(key);
    const service = services.find((s) => s.id === serviceId);
    if (!service) return null;
    const selectedAddons = addonIds
      .map((id) => service.addons.find((a) => a.id === id))
      .filter(Boolean) as ServiceAddon[];
    const addonTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
    return {
      key,
      service_id: serviceId,
      name: service.name,
      basePrice: service.price,
      durationMinutes: service.duration_minutes,
      addons: selectedAddons,
      unitPrice: service.price + addonTotal,
      quantity: qty,
    };
  };

  const cartLines = Object.entries(cart)
    .map(([key, qty]) => resolveCartLine(key, qty))
    .filter((l): l is CartLine => l !== null);

  const subtotal = cartLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const couponDiscountAmount = couponApplied ? (subtotal * couponDiscount) / 100 : 0;
  const total = subtotal - couponDiscountAmount;
  const totalDurationMinutes = cartLines.reduce((sum, line) => sum + (line.durationMinutes || 0) * line.quantity, 0);

  // ── Auto-remove coupon if cart falls below its minimum booking value ─────────
  useEffect(() => {
    if (couponApplied && couponMinOrder > 0 && subtotal < couponMinOrder) {
      handleRemoveCoupon();
      setCouponError(`Coupon removed — booking fell below the ₹${couponMinOrder} minimum.`);
    }
  }, [subtotal]);

  // ── Submit appointment ───────────────────────────────────────────────────────
  const handleSubmitBooking = async () => {
    setError("");

    if (!authReady) { setError("Still setting up your session, please wait a second and try again."); return; }
    if (!name.trim() || !contact.trim()) { setError("Please enter your name and contact number."); return; }
    if (contact.trim().length !== 10) { setError("Please enter a valid 10-digit phone number."); return; }
    if (cartLines.length === 0) { setError("Please select at least one service."); return; }
    if (!preferredDate) { setError("Please choose a preferred date."); return; }
    if (!preferredTime) { setError("Please choose a preferred time."); return; }

    setSubmitting(true);

    try {
      const actualOrgId = base62ToUuid(organizationId || "");

      const { error: customerError } = await supabasePublic
        .from("customers")
        .upsert(
          {
            organization_id: actualOrgId,
            contact_number: contact.trim(),
            name: name.trim(),
            email: email.trim() || null,
            dob: dob ? dob.toISOString().split("T")[0] : null,
          },
          { onConflict: "organization_id,contact_number" }
        );

      if (customerError) throw customerError;

      let appointmentPk = editingAppointmentId;
      let appointmentCode: string;
      let appointmentCreatedAt: string;

      const preferredDateStr = preferredDate.toISOString().split("T")[0];

      if (editingAppointmentId) {
        const { data: appt, error: apptError } = await supabasePublic
          .from("salon_appointments")
          .update({
            total,
            status: "Booked",
            created_at: new Date().toISOString(),
            notes: notes.trim() || null,
            preferred_date: preferredDateStr,
            preferred_time: preferredTime,
          })
          .eq("id", editingAppointmentId)
          .select("id, appointment_id, created_at")
          .single();

        if (apptError) throw apptError;
        appointmentCode = appt.appointment_id;
        appointmentCreatedAt = appt.created_at;

        await supabasePublic.from("salon_appointment_services").delete().eq("appointment_id", editingAppointmentId);
      } else {
        const { data: appt, error: apptError } = await supabasePublic
          .from("salon_appointments")
          .insert([
            {
              organization_id: actualOrgId,
              appointment_id: generateOrderNumber(),
              customer_name: name.trim(),
              customer_contact: contact.trim(),
              customer_email: email.trim() || null,
              customer_dob: dob ? dob.toISOString().split("T")[0] : null,
              notes: notes.trim() || null,
              discount: 0,
              coupon_code: couponApplied ? couponCode : null,
              coupon_discount: couponDiscountAmount,
              total,
              status: "Booked",
              is_qr_booked: true,
              preferred_date: preferredDateStr,
              preferred_time: preferredTime,
              estimated_duration_minutes: totalDurationMinutes || null,
            },
          ])
          .select("id, appointment_id, created_at")
          .single();

        if (apptError) throw apptError;
        appointmentPk = appt.id;
        appointmentCode = appt.appointment_id;
        appointmentCreatedAt = appt.created_at;

        // Increment coupon used_count
        if (couponApplied && couponId) {
          const { error: rpcError } = await supabasePublic.rpc("increment_coupon_usage", { coupon_id: couponId });
          if (rpcError) {
            // Fallback: client-side increment
            const { data: couponData } = await supabasePublic
              .from("discount_coupons")
              .select("used_count")
              .eq("id", couponId)
              .single();
            if (couponData) {
              await supabasePublic
                .from("discount_coupons")
                .update({ used_count: (couponData.used_count || 0) + 1 })
                .eq("id", couponId);
            }
          }
        }
      }

      // NOTE: selected_addons assumes a `salon_appointment_services.selected_addons`
      // jsonb column exists. If it doesn't yet, add it via migration or this
      // insert will fail.
      const itemsPayload = cartLines.map((line) => ({
        appointment_id: appointmentPk,
        service_id: line.service_id,
        quantity: line.quantity,
        selected_addons: line.addons.map((a) => ({ addon_id: a.id, name: a.name, price: a.price })),
      }));

      const { error: itemsError } = await supabasePublic.from("salon_appointment_services").insert(itemsPayload);
      if (itemsError) throw itemsError;

      setSubmittedAppointment({ id: appointmentPk!, appointment_id: appointmentCode, total, created_at: appointmentCreatedAt, status: "Booked" });
      setEditingAppointmentId(null);
    } catch (err: any) {
      console.error("Booking submission failed:", err);
      setError(err.message || "Failed to book appointment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading services…</p>
        </div>
      </div>
    );
  }

  // ── Post-submission screens ───────────────────────────────────────────────────
  if (submittedAppointment) {
    if (submittedAppointment.status === "Cancelled" || submittedAppointment.status === "Missed") {
      return (
        <div className="max-w-md mx-auto p-8 text-center bg-white rounded-xl shadow-theme-sm mt-10 border border-red-200">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Booking Declined</h1>
          <p className="text-gray-600 mb-6">
            We're sorry, but the salon was unable to confirm your booking at this time. They will contact you soon.
          </p>
          <button onClick={() => setSubmittedAppointment(null)} className="px-6 py-2 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200">
            Return to Services
          </button>
        </div>
      );
    }

    if (submittedAppointment.status === "InProgress" || submittedAppointment.status === "Confirmed" || submittedAppointment.status === "Completed") {
      return (
        <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-theme-sm mt-10 border border-gray-200">
          <div className="text-center mb-6 border-b border-gray-200 pb-4">
            <h1 className="text-2xl font-bold text-gray-800 tracking-widest uppercase">BOOKING CONFIRMED</h1>
            <p className="text-gray-500 font-semibold mt-1">Appointment #{submittedAppointment.appointment_id}</p>
            <p className="text-sm text-gray-400 mt-2">{new Date(submittedAppointment.created_at).toLocaleString()}</p>
          </div>
          <div className="mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Customer Details:</p>
            <p className="text-sm text-gray-800 font-medium">{name}</p>
            <p className="text-sm text-gray-600 mt-1">{contact}</p>
            {email && <p className="text-sm text-gray-600 mt-1">{email}</p>}
            {preferredDate && (
              <p className="text-sm text-gray-600 mt-1">
                {preferredDate.toLocaleDateString()} at {preferredTime}
              </p>
            )}
          </div>
          <div className="mb-6">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-2 font-semibold">Service</th>
                  <th className="py-2 font-semibold text-center">Qty</th>
                  <th className="py-2 font-semibold text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {cartLines.map((line) => (
                  <tr key={line.key} className="border-b border-gray-50">
                    <td className="py-2 text-gray-800">
                      {line.name}
                      {line.addons.length > 0 && (
                        <span className="block text-xs text-gray-400">
                          + {line.addons.map((a) => a.name).join(", ")}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-center text-gray-600">{line.quantity}</td>
                    <td className="py-2 text-right text-gray-800">₹{(line.unitPrice * line.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 mb-6">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {couponApplied && couponDiscountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Coupon ({couponCode}) – {couponDiscount}% off:</span>
                <span>−₹{couponDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t border-gray-200">
              <span>Total:</span>
              <span>₹{submittedAppointment.total.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-brand-600 font-medium mb-1">See you soon!</p>
            <p className="text-xs text-gray-400 italic">Please screenshot this as your booking confirmation.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto p-8 text-center bg-white rounded-xl shadow-theme-sm mt-10 border border-brand-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Waiting for Salon…</h1>
        <div className="my-8 relative w-32 h-32 mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-gray-100" strokeWidth="2" />
            <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-brand-500 transition-all duration-1000 ease-linear" strokeWidth="2" strokeDasharray="100" strokeDashoffset={100 - (timeLeft / 60) * 100} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-800">{timeLeft}</span>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Secs</span>
          </div>
        </div>
        <p className="text-gray-600 mb-6 text-sm">
          Your booking <strong className="text-gray-900">#{submittedAppointment.appointment_id}</strong> has been sent to the salon. Please wait while they confirm it.
        </p>
        <button onClick={handleEditAppointment} className="w-full py-3 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition-colors">
          Edit Booking
        </button>
      </div>
    );
  }

  // ── Main booking page ─────────────────────────────────────────────────────────

  // Renders a flat list of ServiceCards — shared by the "no subcategories"
  // branch and the innermost level of the subcategory accordion.
  const renderItemsList = (items: SalonService[]) => {
    if (items.length === 0) {
      return <p className="text-sm text-gray-400 italic py-3 text-center">No services in this category.</p>;
    }
    return (
      <div className="flex flex-col gap-3">
        {items.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            totalQty={totalQtyForService(service.id)}
            isPickerOpen={addonPickerServiceId === service.id}
            pendingAddonIds={pendingAddonIds}
            onAddClick={() => handleAddClick(service)}
            onIncrement={() => addToCart(makeCartKey(service.id, []))}
            onDecrement={() => removeFromCart(makeCartKey(service.id, []))}
            onToggleAddon={toggleAddonSelection}
            onConfirmAddon={confirmAddonSelection}
            onCancelAddon={cancelAddonSelection}
            onZoom={(urls) => {
              if (urls && urls.length > 0) {
                setZoomImages(urls);
                setZoomImageIndex(0);
              }
            }}
            isLive={isLive}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">

      {/* Image zoom modal (multiple images) */}
      {zoomImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200"
          onClick={() => setZoomImages([])}
        >
          <div className="relative w-full max-w-3xl aspect-square sm:aspect-video flex items-center justify-center">
            {zoomImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomImageIndex(prev => prev > 0 ? prev - 1 : zoomImages.length - 1);
                }}
                className="absolute left-2 z-10 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
            )}

            <img
              src={zoomImages[zoomImageIndex]}
              alt="Zoomed service"
              className="max-w-[90vw] max-h-[85vh] rounded-xl object-contain shadow-2xl"
              style={{ touchAction: 'pinch-zoom' }}
              onClick={(e) => e.stopPropagation()}
            />

            {zoomImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomImageIndex(prev => prev < zoomImages.length - 1 ? prev + 1 : 0);
                }}
                className="absolute right-2 z-10 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            )}

            <button
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full transition-colors"
              onClick={() => setZoomImages([])}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            {zoomImages.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {zoomImages.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === zoomImageIndex ? 'bg-white' : 'bg-white/30'}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky header with brand name */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 pt-5 pb-3">
        <div className="flex flex-row items-center justify-center gap-3 mb-1">
          {orgLogo && (
            <img src={orgLogo} alt="Logo" className="w-12 h-12 rounded-full object-cover shadow-sm" />
          )}
          {orgName && (
            <h2 className="text-center text-xl font-extrabold text-gray-900 tracking-tight">
              {orgName}
            </h2>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">Book an Appointment</h1>

        {!isLive && (
          <div className="mt-2 mb-3 bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm font-semibold flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Salon is currently closed
          </div>
        )}
      </div>

      <div className="px-4 pt-4 pb-32">
        {error && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>
        )}

        {/* Contact / customer details - only show if salon is live */}
        {isLive && (
          <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-theme-xs">
            <label className="block text-sm font-semibold text-gray-700">Contact Number</label>
            <div className="flex gap-3 mt-2">
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Your phone number"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden"
              />
              <button
                onClick={handleContactLookup}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg transition-colors"
              >
                Find Me
              </button>
            </div>

            {lookupDone && (
              <div className="mt-4 flex flex-col gap-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name *" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden" />
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Date of Birth
                    <span className="ml-2 text-brand-500 font-normal italic">🎁 for exclusive offers</span>
                    <span className="ml-1 text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative z-10 w-full">
                    <DatePicker
                      selected={dob}
                      onChange={(date: Date | null) => setDob(date)}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Date of Birth (optional)"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden"
                      showMonthDropdown showYearDropdown dropdownMode="select"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Preferred Date *</label>
                    <DatePicker
                      selected={preferredDate}
                      onChange={(date: Date | null) => setPreferredDate(date)}
                      dateFormat="yyyy-MM-dd"
                      minDate={new Date()}
                      placeholderText="Select date"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Preferred Time *</label>
                    <input
                      type="time"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special requests (e.g. preferred stylist, allergy notes...)"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden"
                  rows={2}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Services — nested, multi-open accordion: category → subcategory → items ── */}
        {services.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-8 text-center">No services available.</p>
        ) : (
          <div
            ref={accordionRef}
            className="flex flex-col divide-y divide-gray-100 bg-white border border-gray-200 rounded-xl shadow-theme-xs overflow-hidden"
          >
            {/* Popular — flat, no subcategory nesting so popularity order stays intact */}
            {popularServices.length > 0 && (
              <div>
                <CategoryHeader
                  label="🔥 Popular"
                  count={popularServices.length}
                  isOpen={openCategories.has("Popular")}
                  onClick={() => toggleCategory("Popular")}
                />
                {openCategories.has("Popular") && (
                  <div className="px-4 pb-4">{renderItemsList(popularServices)}</div>
                )}
              </div>
            )}

            {userCategories.map((cat) => {
              const items = getCategoryItems(cat);
              const subGroups = groupBySubcategory(items);
              const subKeys = Object.keys(subGroups);
              const isOpen = openCategories.has(cat);

              return (
                <div key={cat}>
                  <CategoryHeader
                    label={cat}
                    count={items.length}
                    isOpen={isOpen}
                    onClick={() => toggleCategory(cat)}
                  />
                  {isOpen && (
                    <div className="px-4 pb-4">
                      {subKeys.length <= 1 ? (
                        renderItemsList(items)
                      ) : (
                        <div className="flex flex-col divide-y divide-gray-50 border-l-2 border-gray-100 pl-2">
                          {Object.entries(subGroups).map(([sub, subItems]) => {
                            const subKey = `${cat}::${sub || "__none__"}`;
                            const subOpen = openSubcats.has(subKey);
                            return (
                              <div key={subKey}>
                                <SubcategoryHeader
                                  label={sub || "Other"}
                                  count={subItems.length}
                                  isOpen={subOpen}
                                  onClick={() => toggleSubcat(subKey)}
                                />
                                {subOpen && (
                                  <div className="pl-3 pb-3">{renderItemsList(subItems)}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky cart bar - only show if salon is live */}
      {isLive && cartLines.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50">
          <div className="max-w-md mx-auto p-4">
            {/* Itemized cart lines — needed now that add-ons can make the same
                service show up as multiple distinct lines */}
            <div className="mb-3 max-h-32 overflow-y-auto flex flex-col gap-1">
              {cartLines.map((line) => (
                <div key={line.key} className="flex justify-between items-start text-xs text-gray-600">
                  <span className="min-w-0">
                    {line.name} × {line.quantity}
                    {line.addons.length > 0 && (
                      <span className="block text-[11px] text-gray-400 truncate">
                        + {line.addons.map((a) => a.name).join(", ")}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    ₹{(line.unitPrice * line.quantity).toFixed(2)}
                    <button
                      onClick={() => removeLineCompletely(line.key)}
                      className="text-red-500 hover:text-red-700 font-bold"
                    >
                      ✕
                    </button>
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon code input */}
            <div className="mb-3">
              {couponApplied ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-xs font-bold text-green-700">✓ Coupon Applied: {couponCode}</span>
                    <span className="ml-2 text-xs text-green-600">({couponDiscount}% off — saved ₹{couponDiscountAmount.toFixed(2)})</span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-xs text-red-500 hover:text-red-700 font-semibold ml-2">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Have a coupon code?"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none uppercase"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
            </div>

            <div className="flex justify-between mb-1 text-sm text-gray-600">
              <span>Subtotal ({cartLines.reduce((s, l) => s + l.quantity, 0)} services)</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {totalDurationMinutes > 0 && (
              <div className="flex justify-between mb-1 text-xs text-gray-400">
                <span>Estimated duration</span>
                <span>{totalDurationMinutes} min</span>
              </div>
            )}
            {couponApplied && couponDiscountAmount > 0 && (
              <div className="flex justify-between mb-1 text-sm text-green-600 font-medium">
                <span>Discount ({couponDiscount}% off)</span>
                <span>−₹{couponDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between mb-3 font-bold text-gray-800">
              <span>Total Amount</span>
              <span className="text-brand-500">₹{total.toFixed(2)}</span>
            </div>
            <button
              onClick={handleSubmitBooking}
              disabled={submitting}
              className="w-full rounded-xl bg-brand-500 py-3.5 text-base font-bold text-white shadow-theme-md hover:bg-brand-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? "Booking…" : "Book Appointment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Accordion headers ────────────────────────────────────────────────────────
// Top-level category row. Shows the item count and a +/− toggle, matching
// the multi-open behavior of the reference design (several categories, and
// several subcategories within them, can be expanded at once).
const CategoryHeader: React.FC<{
  label: string;
  count: number;
  isOpen: boolean;
  onClick: () => void;
}> = ({ label, count, isOpen, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between py-3.5 px-4 text-left"
  >
    <span className="font-bold text-gray-800">{label}</span>
    <span className="flex items-center gap-3">
      <span className="text-sm font-semibold text-gray-400">{count}</span>
      <span
        className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${
          isOpen ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500"
        }`}
      >
        {isOpen ? "−" : "+"}
      </span>
    </span>
  </button>
);

// Nested subcategory row, indented under its open parent category.
const SubcategoryHeader: React.FC<{
  label: string;
  count: number;
  isOpen: boolean;
  onClick: () => void;
}> = ({ label, count, isOpen, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between py-2.5 pl-3 pr-2 text-left"
  >
    <span className="text-sm font-semibold text-gray-600">{label}</span>
    <span className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-400">{count}</span>
      <span
        className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold transition-colors ${
          isOpen ? "bg-brand-50 text-brand-500" : "bg-gray-50 text-gray-400"
        }`}
      >
        {isOpen ? "−" : "+"}
      </span>
    </span>
  </button>
);

// ── ServiceCard ──────────────────────────────────────────────────────────────
function ServiceCard({
  service,
  totalQty,
  isPickerOpen,
  pendingAddonIds,
  onAddClick,
  onIncrement,
  onDecrement,
  onToggleAddon,
  onConfirmAddon,
  onCancelAddon,
  onZoom,
  isLive,
}: {
  service: SalonService;
  totalQty: number;
  isPickerOpen: boolean;
  pendingAddonIds: Set<string>;
  onAddClick: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onToggleAddon: (addonId: string) => void;
  onConfirmAddon: () => void;
  onCancelAddon: () => void;
  onZoom: (urls: string[]) => void;
  isLive?: boolean;
}) {
  const hasAddons = service.addons.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-theme-xs transition-transform hover:scale-[1.01]">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {service.image_urls && service.image_urls.length > 0 ? (
            <div
              className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100 cursor-zoom-in relative group"
              onClick={() => onZoom(service.image_urls!)}
            >
              <img src={service.image_urls[0]} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </div>
              {service.image_urls.length > 1 && (
                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded-sm">
                  1/{service.image_urls.length}
                </div>
              )}
            </div>
          ) : service.image_url ? (
            <div
              className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100 cursor-zoom-in relative group"
              onClick={() => onZoom([service.image_url!])}
            >
              <img src={service.image_url} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </div>
            </div>
          ) : null}
          <div>
            <p className="font-semibold text-gray-800">{service.name}</p>
            {service.duration_minutes ? (
              <p className="text-xs text-gray-500 mb-0.5">{service.duration_minutes} min</p>
            ) : null}
            <p className="text-sm font-medium text-brand-500 mt-0.5">₹{service.price.toFixed(2)}</p>
            {hasAddons && (
              <p className="text-xs text-gray-400 mt-0.5">
                {service.addons.length} add-on{service.addons.length !== 1 ? "s" : ""} available
              </p>
            )}
          </div>
        </div>

        {/* Only show add/increment controls if salon is live */}
        {isLive && (
          <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1 border border-gray-100 shrink-0">
            {!hasAddons && totalQty > 0 ? (
              <>
                <button onClick={onDecrement} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-600 shadow-xs hover:bg-gray-50 transition-colors">−</button>
                <span className="w-6 text-center font-semibold text-gray-800">{totalQty}</span>
                <button onClick={onIncrement} className="w-8 h-8 flex items-center justify-center rounded-full bg-brand-500 text-white shadow-xs hover:bg-brand-600 transition-colors">+</button>
              </>
            ) : (
              <button onClick={onAddClick} className="px-4 py-1.5 rounded-full bg-brand-50 text-brand-600 font-medium text-sm hover:bg-brand-100 transition-colors">
                {totalQty > 0 ? `+ (${totalQty})` : "Add"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add-on picker — only rendered for the service currently being configured */}
      {isPickerOpen && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-700 mb-2">Choose add-ons</p>
          <div className="flex flex-col gap-2">
            {service.addons.map((addon) => (
              <label key={addon.id} className="flex justify-between items-center text-sm cursor-pointer">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={pendingAddonIds.has(addon.id)}
                    onChange={() => onToggleAddon(addon.id)}
                  />
                  {addon.name}
                </span>
                <span className="text-gray-500">+₹{addon.price}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={onCancelAddon} className="flex-1 rounded-lg bg-gray-100 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">
              Cancel
            </button>
            <button onClick={onConfirmAddon} className="flex-1 rounded-lg bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600">
              Add to Booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}