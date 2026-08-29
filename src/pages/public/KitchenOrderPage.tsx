import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { supabasePublic } from "../../config/supabasePublic";
import { base62ToUuid, generateOrderNumber } from "../../utils/helpers";

// ── Types ────────────────────────────────────────────────────────────────────

interface MenuAddon {
  id: string;
  name: string;
  price: number;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  subcategory?: string;
  image_url?: string;
  image_urls?: string[];
  quantity_info?: string;
  spice_level?: number;
  diet_type?: "veg" | "nonveg" | "vegan";
  addons: MenuAddon[];
}

interface CartLine {
  key: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  addons: MenuAddon[];
  unitPrice: number;
  quantity: number;
}

// ── Cart key helpers ──────────────────────────────────────────────────────────

const makeCartKey = (itemId: string, addonIds: string[]): string =>
  addonIds.length === 0 ? itemId : `${itemId}::${[...addonIds].sort().join(",")}`;

const parseCartKey = (key: string): { menuItemId: string; addonIds: string[] } => {
  const [menuItemId, addonPart] = key.split("::");
  return { menuItemId, addonIds: addonPart ? addonPart.split(",") : [] };
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function KitchenOrderPage({ organizationId: propOrgId }: { organizationId?: string }) {
  const { organizationId: paramOrgId } = useParams<{ organizationId: string }>();
  const organizationId = propOrgId || paramOrgId;

  // Org
  const [orgName, setOrgName] = useState("");
  const [orgLogo, setOrgLogo] = useState("");
  const [isLive, setIsLive] = useState(true);

  // Menu
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categoryOrder, setCategoryOrder] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Accordion
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  // Customer
  const [contact, setContact] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [tableNumber, setTableNumber] = useState("");

  // Cart
  const [cart, setCart] = useState<Record<string, number>>({});

  // Add-on picker
  const [addonPickerItemId, setAddonPickerItemId] = useState<string | null>(null);
  const [pendingAddonIds, setPendingAddonIds] = useState<Set<string>>(new Set());

  // Coupon
  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponDiscountAmount, setCouponDiscountAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponId, setCouponId] = useState<string | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponMinOrder, setCouponMinOrder] = useState(0);

  // Image zoom
  const [zoomImages, setZoomImages] = useState<string[]>([]);
  const [zoomIndex, setZoomIndex] = useState(0);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedOrder, setSubmittedOrder] = useState<{
    id: string;
    orderCode: string;
    total: number;
    created_at: string;
    status: string;
  } | null>(null);

  const [authReady, setAuthReady] = useState(false);

  // ── Anonymous session ──────────────────────────────────────────────────────
  useEffect(() => {
    const ensureAnon = async () => {
      const { data } = await supabasePublic.auth.getSession();
      if (!data.session) {
        await supabasePublic.auth.signInAnonymously();
      }
      setAuthReady(true);
    };
    ensureAnon();
  }, []);

  // ── Realtime order status ──────────────────────────────────────────────────
  useEffect(() => {
    if (!submittedOrder) return;

    const channel = supabasePublic
      .channel(`kitchen-order-${submittedOrder.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${submittedOrder.id}` },
        (payload) => {
          const updated = payload.new as { status: string };
          setSubmittedOrder((prev) => (prev ? { ...prev, status: updated.status } : null));
        }
      )
      .subscribe();

    return () => { supabasePublic.removeChannel(channel); };
  }, [submittedOrder]);

  // ── Fetch menu + org ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!organizationId) return;
    const actualOrgId = base62ToUuid(organizationId);

    const fetchAll = async () => {
      // Org info
      const { data: orgData, error: orgErr } = await supabasePublic
        .from("organizations")
        .select("name, is_live, logo_url")
        .eq("id", actualOrgId)
        .maybeSingle();

      if (orgErr) console.error("Failed to load org:", orgErr);
      setOrgName(orgData?.name || "");
      if (orgData?.logo_url) setOrgLogo(orgData.logo_url);
      if (orgData?.is_live !== undefined) setIsLive(orgData.is_live);

      // Category ordering
      const { data: catData } = await supabasePublic
        .from("menu_categories")
        .select("name, rank")
        .eq("organization_id", actualOrgId)
        .order("rank", { ascending: true });

      const catMap: Record<string, number> = {};
      (catData || []).forEach((c: any) => { catMap[c.name] = c.rank; });
      setCategoryOrder(catMap);

      // Menu items + addons
      const { data: items, error: itemsErr } = await supabasePublic
        .from("menu_items")
        .select("id, name, price, category, subcategory, image_url, image_urls, quantity_info, spice_level, diet_type, menu_addons(id, name, price)")
        .eq("organization_id", actualOrgId)
        .eq("is_available", true);

      if (itemsErr) console.error("Failed to load menu:", itemsErr);

      setMenuItems((items || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category ?? undefined,
        subcategory: item.subcategory ?? undefined,
        image_url: item.image_url ?? undefined,
        image_urls: item.image_urls || [],
        quantity_info: item.quantity_info ?? undefined,
        spice_level: item.spice_level ?? 0,
        diet_type: item.diet_type ?? undefined,
        addons: (item.menu_addons || []).map((a: any) => ({ id: a.id, name: a.name, price: a.price })),
      })));

      setLoading(false);
    };

    fetchAll();
  }, [organizationId]);

  // Open first category on load
  useEffect(() => {
    if (menuItems.length === 0) return;
    setOpenCategories((prev) => {
      if (prev.size > 0) return prev;
      const cats = Array.from(new Set(menuItems.map((m) => m.category || "Other")))
        .sort((a, b) => (categoryOrder[a] ?? 9999) - (categoryOrder[b] ?? 9999));
      return cats[0] ? new Set([cats[0]]) : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuItems]);

  // ── Cart helpers ──────────────────────────────────────────────────────────

  const cartLines: CartLine[] = Object.entries(cart)
    .map(([key, qty]) => {
      const { menuItemId, addonIds } = parseCartKey(key);
      const item = menuItems.find((m) => m.id === menuItemId);
      if (!item) return null;
      const selectedAddons = addonIds
        .map((id) => item.addons.find((a) => a.id === id))
        .filter(Boolean) as MenuAddon[];
      const addonTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
      return { key, menuItemId, name: item.name, basePrice: item.price, addons: selectedAddons, unitPrice: item.price + addonTotal, quantity: qty };
    })
    .filter((l): l is CartLine => l !== null);

  const subtotal = cartLines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const total = subtotal - (couponApplied ? (subtotal * couponDiscount) / 100 : 0);

  // Recompute discount amount whenever subtotal changes
  useEffect(() => {
    if (couponApplied) {
      setCouponDiscountAmount((subtotal * couponDiscount) / 100);
    } else {
      setCouponDiscountAmount(0);
    }
  }, [subtotal, couponApplied, couponDiscount]);

  // Auto-remove coupon if cart falls below min order
  useEffect(() => {
    if (couponApplied && couponMinOrder > 0 && subtotal < couponMinOrder) {
      handleRemoveCoupon();
      setCouponError(`Coupon removed — order fell below ₹${couponMinOrder} minimum.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const totalQtyForItem = (menuItemId: string) =>
    Object.entries(cart)
      .filter(([key]) => parseCartKey(key).menuItemId === menuItemId)
      .reduce((s, [, q]) => s + q, 0);

  const addToCart = (key: string) => setCart((p) => ({ ...p, [key]: (p[key] || 0) + 1 }));
  const removeFromCart = (key: string) =>
    setCart((p) => {
      if (!p[key]) return p;
      if (p[key] <= 1) { const n = { ...p }; delete n[key]; return n; }
      return { ...p, [key]: p[key] - 1 };
    });
  const removeLineCompletely = (key: string) =>
    setCart((p) => { const n = { ...p }; delete n[key]; return n; });

  const handleAddClick = (item: MenuItem) => {
    if (item.addons.length === 0) { addToCart(makeCartKey(item.id, [])); return; }
    setAddonPickerItemId(item.id);
    setPendingAddonIds(new Set());
  };
  const toggleAddon = (id: string) => setPendingAddonIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const confirmAddon = () => {
    if (!addonPickerItemId) return;
    addToCart(makeCartKey(addonPickerItemId, Array.from(pendingAddonIds)));
    setAddonPickerItemId(null);
    setPendingAddonIds(new Set());
  };
  const cancelAddon = () => { setAddonPickerItemId(null); setPendingAddonIds(new Set()); };

  // ── Coupon ────────────────────────────────────────────────────────────────

  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || !organizationId) return;
    setCouponError("");
    const actualOrgId = base62ToUuid(organizationId);

    const { data, error: couponErr } = await supabasePublic
      .from("discount_coupons")
      .select("id, code, discount_percent, max_uses, used_count, min_order_value, valid_from, valid_to, is_active")
      .eq("organization_id", actualOrgId)
      .eq("code", couponInput.trim().toUpperCase())
      .maybeSingle();

    if (couponErr || !data) { setCouponError("Invalid coupon code."); return; }
    if (!data.is_active) { setCouponError("This coupon is no longer active."); return; }
    if (data.max_uses !== null && data.used_count >= data.max_uses) { setCouponError("Coupon usage limit reached."); return; }
    const now = new Date();
    if (data.valid_from && new Date(data.valid_from) > now) { setCouponError("This coupon is not yet active."); return; }
    if (data.valid_to && new Date(data.valid_to) < now) { setCouponError("This coupon has expired."); return; }
    if (data.min_order_value && subtotal < data.min_order_value) {
      setCouponError(`Add ₹${(data.min_order_value - subtotal).toFixed(2)} more to use this coupon (min. ₹${data.min_order_value}).`);
      return;
    }
    setCouponCode(data.code);
    setCouponDiscount(data.discount_percent);
    setCouponApplied(true);
    setCouponId(data.id);
    setCouponMinOrder(data.min_order_value || 0);
  };

  const handleRemoveCoupon = () => {
    setCouponCode(""); setCouponInput(""); setCouponDiscount(0);
    setCouponApplied(false); setCouponId(null); setCouponError(""); setCouponMinOrder(0);
  };

  // ── Contact lookup ────────────────────────────────────────────────────────

  const handleContactLookup = async () => {
    if (!contact.trim() || !organizationId) return;
    const actualOrgId = base62ToUuid(organizationId);
    const { data } = await supabasePublic
      .from("customers")
      .select("name, email")
      .eq("organization_id", actualOrgId)
      .eq("contact_number", contact.trim())
      .maybeSingle();
    if (data) { setName(data.name || ""); setEmail(data.email || ""); }
  };

  // ── Submit order ──────────────────────────────────────────────────────────

  const handlePlaceOrder = async () => {
    setError("");
    if (!authReady) { setError("Still setting up session, please try again."); return; }
    if (!name.trim() || !contact.trim()) { setError("Please enter your name and contact number."); return; }
    if (contact.trim().length !== 10) { setError("Please enter a valid 10-digit phone number."); return; }
    if (cartLines.length === 0) { setError("Please add at least one item."); return; }

    setSubmitting(true);
    try {
      const actualOrgId = base62ToUuid(organizationId || "");

      // Upsert customer
      await supabasePublic.from("customers").upsert(
        { organization_id: actualOrgId, contact_number: contact.trim(), name: name.trim(), email: email.trim() || null },
        { onConflict: "organization_id,contact_number" }
      );

      const couponDiscAmt = couponApplied ? (subtotal * couponDiscount) / 100 : 0;
      const finalTotal = subtotal - couponDiscAmt;

      const { data: order, error: orderErr } = await supabasePublic
        .from("orders")
        .insert([{
          organization_id: actualOrgId,
          order_id: generateOrderNumber(),
          customer_name: name.trim(),
          customer_contact: contact.trim(),
          customer_email: email.trim() || null,
          notes: notes.trim() || null,
          table_number: tableNumber.trim() || null,
          discount: 0,
          coupon_code: couponApplied ? couponCode : null,
          coupon_discount: couponDiscAmt,
          total: finalTotal,
          status: "Placed",
          is_qr_order: true,
        }])
        .select("id, order_id, created_at")
        .single();

      if (orderErr) throw orderErr;

      const itemsPayload = cartLines.map((line) => ({
        order_id: order.id,
        menu_item_id: line.menuItemId,
        quantity: line.quantity,
        selected_addons: line.addons.map((a) => ({ addon_id: a.id, name: a.name, price: a.price })),
      }));

      const { error: itemsErr } = await supabasePublic.from("order_items").insert(itemsPayload);
      if (itemsErr) throw itemsErr;

      // Increment coupon
      if (couponApplied && couponId) {
        try {
          await supabasePublic.rpc("increment_coupon_usage", { coupon_id: couponId });
        } catch {
          // Non-critical — ignore if RPC doesn't exist yet
        }
      }

      setSubmittedOrder({ id: order.id, orderCode: order.order_id, total: finalTotal, created_at: order.created_at, status: "Placed" });
    } catch (err: any) {
      console.error("Order failed:", err);
      setError(err.message || "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Category helpers ──────────────────────────────────────────────────────

  const allCategories = Array.from(new Set(menuItems.map((m) => m.category || "Other")))
    .sort((a, b) => (categoryOrder[a] ?? 9999) - (categoryOrder[b] ?? 9999));

  const grouped: Record<string, MenuItem[]> = {};
  menuItems.forEach((m) => {
    const cat = m.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(m);
  });

  const toggleCategory = (cat: string) =>
    setOpenCategories((prev) => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });

  // ── Diet badge ────────────────────────────────────────────────────────────

  const DietBadge = ({ type }: { type?: string }) => {
    if (!type) return null;
    const isVeg = type === "veg" || type === "vegan";
    return (
      <span className={`inline-flex items-center justify-center w-4 h-4 border-2 rounded-sm shrink-0 ${isVeg ? "border-green-600" : "border-red-600"}`}>
        <span className={`w-2 h-2 rounded-full ${isVeg ? "bg-green-600" : "bg-red-600"}`} />
      </span>
    );
  };

  // ── Spice dots ────────────────────────────────────────────────────────────
  const SpiceDots = ({ level }: { level?: number }) => {
    if (!level) return null;
    return (
      <span className="flex gap-0.5 items-center" title={`Spice level ${level}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < level ? "bg-orange-400" : "bg-gray-200"}`} />
        ))}
      </span>
    );
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading menu…</p>
        </div>
      </div>
    );
  }

  // ── Post-submission ────────────────────────────────────────────────────────

  if (submittedOrder) {
    // ── Status pipeline (maps DB values → display) ───────────────────────────
    const PIPELINE = [
      {
        db: "Placed",
        label: "Order Placed",
        sub: "Waiting for kitchen to confirm…",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: "bg-amber-400",
        textColor: "text-amber-600",
        ring: "ring-amber-200",
      },
      {
        db: "Preparing",
        label: "Accepted",
        sub: "Your order is being prepared!",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        ),
        color: "bg-orange-400",
        textColor: "text-orange-600",
        ring: "ring-orange-200",
      },
      {
        db: "Ready",
        label: "Prepared",
        sub: "Your food is ready! 🍽️",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        ),
        color: "bg-blue-400",
        textColor: "text-blue-600",
        ring: "ring-blue-200",
      },
      {
        db: "Delivered",
        label: "Delivered",
        sub: "Enjoy your meal! Thank you 🙏",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ),
        color: "bg-green-500",
        textColor: "text-green-600",
        ring: "ring-green-200",
      },
    ];

    const currentIdx = PIPELINE.findIndex((s) => s.db === submittedOrder.status);
    const currentStep = PIPELINE[currentIdx] ?? PIPELINE[0];
    const isCancelled = submittedOrder.status === "Cancelled" || submittedOrder.status === "Declined" || submittedOrder.status === "Missed";
    const isDelivered = submittedOrder.status === "Delivered";

    return (
      <div className="max-w-md mx-auto min-h-screen bg-gray-50">
        {/* Header */}
        <div className={`relative overflow-hidden px-6 pt-10 pb-8 text-white ${
          isCancelled ? "bg-red-500" : isDelivered ? "bg-green-500" : "bg-gray-800"
        }`}>
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-8 w-32 h-32 rounded-full bg-white/10" />

          {orgLogo && (
            <img src={orgLogo} alt="Logo" className="w-10 h-10 rounded-full object-cover mb-4 ring-2 ring-white/30" />
          )}

          {isCancelled ? (
            <>
              <div className="text-4xl mb-2">❌</div>
              <h1 className="text-2xl font-extrabold">Order {submittedOrder.status}</h1>
              <p className="text-white/70 text-sm mt-1">We're sorry — please contact the kitchen.</p>
            </>
          ) : isDelivered ? (
            <>
              <div className="text-4xl mb-2">🎉</div>
              <h1 className="text-2xl font-extrabold">Delivered!</h1>
              <p className="text-white/80 text-sm mt-1">Enjoy your meal. Thank you for ordering!</p>
            </>
          ) : (
            <>
              <p className="text-white/60 text-xs uppercase tracking-widest font-bold mb-1">Live Status</p>
              <h1 className="text-2xl font-extrabold">{currentStep.label}</h1>
              <p className="text-white/70 text-sm mt-1">{currentStep.sub}</p>
            </>
          )}

          <p className="text-white/50 text-xs mt-3">Order #{submittedOrder.orderCode}</p>
        </div>

        <div className="px-4 py-5 flex flex-col gap-4">
          {/* Progress stepper */}
          {!isCancelled && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Order Progress</p>
              <div className="flex items-start justify-between">
                {PIPELINE.map((step, idx) => {
                  const isDone = idx <= currentIdx;
                  const isCur = idx === currentIdx;
                  return (
                    <div key={step.db} className="flex flex-col items-center flex-1">
                      {/* Dot + line */}
                      <div className="relative flex items-center w-full">
                        {/* Left connector */}
                        <div className={`flex-1 h-0.5 ${
                          idx === 0 ? "invisible" : idx <= currentIdx ? step.color.replace("bg-","bg-") : "bg-gray-200"
                        }`} />
                        {/* Dot */}
                        <div className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-500 ${
                          isCur
                            ? `${step.color} border-transparent text-white ring-4 ${step.ring} scale-110`
                            : isDone
                            ? `${step.color} border-transparent text-white`
                            : "bg-gray-100 border-gray-200 text-gray-300"
                        }`}>
                          {isDone && !isCur ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-sm [&>svg]:w-4 [&>svg]:h-4">{step.icon}</span>
                          )}
                          {/* Pulse for current */}
                          {isCur && (
                            <span className={`absolute inset-0 rounded-full ${step.color} opacity-30 animate-ping`} />
                          )}
                        </div>
                        {/* Right connector */}
                        <div className={`flex-1 h-0.5 ${
                          idx === PIPELINE.length - 1 ? "invisible" :
                          idx < currentIdx ? PIPELINE[idx + 1].color : "bg-gray-200"
                        }`} />
                      </div>
                      {/* Label */}
                      <p className={`text-[10px] font-semibold mt-2 text-center leading-tight ${
                        isDone ? step.textColor : "text-gray-300"
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order summary */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Your Order</p>
            {cartLines.map((line) => (
              <div key={line.key} className="flex justify-between items-start text-sm text-gray-700 py-2 border-b border-gray-50 last:border-0">
                <span>
                  <span className="font-medium">{line.name}</span>
                  <span className="text-gray-400"> × {line.quantity}</span>
                  {line.addons.length > 0 && (
                    <span className="block text-xs text-gray-400 mt-0.5">+ {line.addons.map((a) => a.name).join(", ")}</span>
                  )}
                </span>
                <span className="font-medium text-gray-800 shrink-0 ml-3">₹{(line.unitPrice * line.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-gray-900 pt-3 mt-1">
              <span>Total</span>
              <span className="text-brand-500">₹{submittedOrder.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Time + order ID */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between text-xs text-gray-400">
            <span>Placed at {new Date(submittedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span>#{submittedOrder.orderCode}</span>
          </div>

          <button
            onClick={() => { setSubmittedOrder(null); setCart({}); setName(""); setContact(""); setEmail(""); setNotes(""); setTableNumber(""); handleRemoveCoupon(); }}
            className="w-full py-3.5 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-900 transition-colors text-sm"
          >
            Place Another Order
          </button>
        </div>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">

      {/* Image zoom modal */}
      {zoomImages.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setZoomImages([])}>
          <div className="relative w-full max-w-3xl aspect-square sm:aspect-video flex items-center justify-center">
            {zoomImages.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); setZoomIndex((p) => (p > 0 ? p - 1 : zoomImages.length - 1)); }} className="absolute left-2 z-10 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
            )}
            <img src={zoomImages[zoomIndex]} alt="Zoomed" className="max-w-[90vw] max-h-[85vh] rounded-xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
            {zoomImages.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); setZoomIndex((p) => (p < zoomImages.length - 1 ? p + 1 : 0)); }} className="absolute right-2 z-10 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            )}
            <button className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full" onClick={() => setZoomImages([])}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            {zoomImages.length > 1 && (
              <div className="absolute bottom-4 flex gap-2">
                {zoomImages.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i === zoomIndex ? "bg-white" : "bg-white/30"}`} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 pt-5 pb-3">
        <div className="flex flex-row items-center justify-center gap-3 mb-1">
          {orgLogo && <img src={orgLogo} alt="Logo" className="w-12 h-12 rounded-full object-cover shadow-sm" />}
          {orgName && <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">{orgName}</h2>}
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">Order Online</h1>
        {!isLive && (
          <div className="mt-2 bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm font-semibold flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            Kitchen is currently closed
          </div>
        )}
      </div>

      <div className="px-4 pt-4 pb-36">
        {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

        {/* Customer details */}
        {isLive && (
          <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-3">Your Details</p>
            <div className="flex gap-3 mb-3">
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Phone number *"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none"
              />
              <button onClick={handleContactLookup} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg transition-colors">
                Find Me
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name *" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none" />
              <input value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="Table number (optional)" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none" />
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special requests, allergies, etc." rows={2} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none" />
            </div>
          </div>
        )}

        {/* Menu accordion */}
        {menuItems.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-8 text-center">No items available.</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {allCategories.map((cat) => {
              const items = (grouped[cat] || []).sort((a, b) => a.price - b.price);
              const isOpen = openCategories.has(cat);
              return (
                <div key={cat}>
                  {/* Category header */}
                  <button onClick={() => toggleCategory(cat)} className="w-full flex items-center justify-between py-3.5 px-4 text-left">
                    <span className="font-bold text-gray-800">{cat}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-400">{items.length}</span>
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${isOpen ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {isOpen ? "−" : "+"}
                      </span>
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 flex flex-col gap-3">
                      {items.map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          totalQty={totalQtyForItem(item.id)}
                          isPickerOpen={addonPickerItemId === item.id}
                          pendingAddonIds={pendingAddonIds}
                          onAddClick={() => handleAddClick(item)}
                          onIncrement={() => addToCart(makeCartKey(item.id, []))}
                          onDecrement={() => removeFromCart(makeCartKey(item.id, []))}
                          onToggleAddon={toggleAddon}
                          onConfirmAddon={confirmAddon}
                          onCancelAddon={cancelAddon}
                          onZoom={(urls) => { if (urls.length > 0) { setZoomImages(urls); setZoomIndex(0); } }}
                          isLive={isLive}
                          DietBadge={DietBadge}
                          SpiceDots={SpiceDots}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky cart bar */}
      {isLive && cartLines.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50">
          <div className="max-w-md mx-auto p-4">
            {/* Cart lines */}
            <div className="mb-3 max-h-32 overflow-y-auto flex flex-col gap-1">
              {cartLines.map((line) => (
                <div key={line.key} className="flex justify-between items-start text-xs text-gray-600">
                  <span className="min-w-0">
                    {line.name} × {line.quantity}
                    {line.addons.length > 0 && (
                      <span className="block text-[11px] text-gray-400 truncate">+ {line.addons.map((a) => a.name).join(", ")}</span>
                    )}
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    ₹{(line.unitPrice * line.quantity).toFixed(2)}
                    <button onClick={() => removeLineCompletely(line.key)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="mb-3">
              {couponApplied ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-xs font-bold text-green-700">✓ Coupon: {couponCode}</span>
                    <span className="ml-2 text-xs text-green-600">({couponDiscount}% off — saved ₹{couponDiscountAmount.toFixed(2)})</span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-xs text-red-500 hover:text-red-700 font-semibold ml-2">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Coupon code?" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none uppercase" />
                  <button onClick={handleApplyCoupon} className="px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors">Apply</button>
                </div>
              )}
              {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
            </div>

            <div className="flex justify-between mb-1 text-sm text-gray-600">
              <span>Subtotal ({cartLines.reduce((s, l) => s + l.quantity, 0)} items)</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {couponApplied && couponDiscountAmount > 0 && (
              <div className="flex justify-between mb-1 text-sm text-green-600 font-medium">
                <span>Discount ({couponDiscount}% off)</span>
                <span>−₹{couponDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between mb-3 font-bold text-gray-800">
              <span>Total</span>
              <span className="text-brand-500">₹{total.toFixed(2)}</span>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="w-full rounded-xl bg-brand-500 py-3.5 text-base font-bold text-white shadow-md hover:bg-brand-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? "Placing Order…" : "Place Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MenuItemCard ──────────────────────────────────────────────────────────────

function MenuItemCard({
  item, totalQty, isPickerOpen, pendingAddonIds,
  onAddClick, onIncrement, onDecrement,
  onToggleAddon, onConfirmAddon, onCancelAddon,
  onZoom, isLive, DietBadge, SpiceDots,
}: {
  item: MenuItem;
  totalQty: number;
  isPickerOpen: boolean;
  pendingAddonIds: Set<string>;
  onAddClick: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onToggleAddon: (id: string) => void;
  onConfirmAddon: () => void;
  onCancelAddon: () => void;
  onZoom: (urls: string[]) => void;
  isLive?: boolean;
  DietBadge: React.FC<{ type?: string }>;
  SpiceDots: React.FC<{ level?: number }>;
}) {
  const hasAddons = item.addons.length > 0;
  const images = item.image_urls && item.image_urls.length > 0 ? item.image_urls : (item.image_url ? [item.image_url] : []);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-transform hover:scale-[1.01]">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {images.length > 0 && (
            <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100 cursor-zoom-in relative group" onClick={() => onZoom(images)}>
              <img src={images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
              </div>
              {images.length > 1 && <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded-sm">1/{images.length}</div>}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <DietBadge type={item.diet_type} />
              <p className="font-semibold text-gray-800">{item.name}</p>
            </div>
            {item.quantity_info && <p className="text-xs text-gray-400 mb-0.5">{item.quantity_info}</p>}
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-brand-500">₹{item.price.toFixed(2)}</p>
              <SpiceDots level={item.spice_level} />
            </div>
            {hasAddons && <p className="text-xs text-gray-400 mt-0.5">{item.addons.length} add-on{item.addons.length !== 1 ? "s" : ""} available</p>}
          </div>
        </div>

        {isLive && (
          <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1 border border-gray-100 shrink-0">
            {!hasAddons && totalQty > 0 ? (
              <>
                <button onClick={onDecrement} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">−</button>
                <span className="w-6 text-center font-semibold text-gray-800">{totalQty}</span>
                <button onClick={onIncrement} className="w-8 h-8 flex items-center justify-center rounded-full bg-brand-500 text-white shadow-sm hover:bg-brand-600 transition-colors">+</button>
              </>
            ) : (
              <button onClick={onAddClick} className="px-4 py-1.5 rounded-full bg-brand-50 text-brand-600 font-medium text-sm hover:bg-brand-100 transition-colors">
                {totalQty > 0 ? `+ (${totalQty})` : "Add"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add-on picker */}
      {isPickerOpen && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-700 mb-2">Choose add-ons</p>
          <div className="flex flex-col gap-2">
            {item.addons.map((addon) => (
              <label key={addon.id} className="flex justify-between items-center text-sm cursor-pointer">
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={pendingAddonIds.has(addon.id)} onChange={() => onToggleAddon(addon.id)} />
                  {addon.name}
                </span>
                <span className="text-gray-500">+₹{addon.price}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={onCancelAddon} className="flex-1 rounded-lg bg-gray-100 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Cancel</button>
            <button onClick={onConfirmAddon} className="flex-1 rounded-lg bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600">Add to Order</button>
          </div>
        </div>
      )}
    </div>
  );
}
