import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../config/supabase";
import { useAuth } from "../hooks/useAuth";
import { startContinuousAlarm } from "../utils/helpers";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  alertAt?: number;
}
export interface MenuIngredient {
  inventoryId: string;
  quantity: number;
  unit?: string;
}

export interface MenuAddon {
  id: string;
  name: string;
  price: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  rank: number;
}

// Single source of truth — was previously declared twice in this file,
// which is a TypeScript duplicate-identifier error. Merged into one.
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  subcategory?: string;
  image_url?: string; // Legacy fallback, but keep it for backwards compatibility if needed
  image_urls?: string[]; // Array of image URLs
  quantity_info?: string; // e.g. 'Serves 2 people, 200g'
  spice_level?: number; // e.g. 0-3
  diet_type?: 'veg' | 'nonveg' | 'vegan';
  ingredients: MenuIngredient[];
  addons: MenuAddon[];
  isAvailable: boolean;
}

// An add-on selected on a specific order line. Mirrors the shape stored in
// order_items.selected_addons (jsonb) — see SQL migration.
export interface SelectedAddon {
  addon_id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  selectedAddons?: SelectedAddon[];
}

export interface Order {
  id: string;
  // Human-readable order code (DB column: orders.order_id). Only ever set
  // for QR/self-serve orders — the walk-in/manual order flow (addOrder
  // below) never populates this column, so it stays NULL in the DB and
  // undefined here. Use this to distinguish QR orders from live/walk-in
  // orders anywhere in the UI (e.g. the Incoming QR Orders KPI).
  orderCode?: string;
  customer: {
    name: string;
    contact?: string;
    email?: string;
    dob?: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  date: string;
  notes?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface DiscountCoupon {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number | null;
  used_count: number;
  min_order_value: number;
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
  created_at: string;
}

interface KitchenContextType {
  inventory: InventoryItem[];
  menu: MenuItem[];
  categories: MenuCategory[];
  orders: Order[];
  expenses: Expense[];
  coupons: DiscountCoupon[];
  addInventoryItem: (item: Omit<InventoryItem, "id">) => Promise<string | undefined>;
  updateInventoryQuantity: (id: string, quantity: number) => Promise<void>;
  updateInventoryItem: (id: string, updates: { name?: string; unit?: string; category?: string; quantity?: number }) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, "id" | "isAvailable">) => Promise<void>;
  addOrder: (customerName: string, items: OrderItem[], discount: number, contact?: string, email?: string, dob?: string, notes?: string, couponCode?: string, couponDiscount?: number) => Promise<void>;
  updateOrder: (id: string, updates: { customer_name?: string; total?: number; discount?: number; items?: OrderItem[] }) => Promise<void>;
  addExpense: (expense: Omit<Expense, "id" | "date">) => Promise<void>;
  updateExpense: (id: string, updates: Omit<Expense, "id" | "date">) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  monthlyGoal: number;
  updateMenuItem: (id: string, updates: { name: string; price: number; category?: string; subcategory?: string; image_url?: string; image_urls?: string[]; quantity_info?: string; spice_level?: number; diet_type?: 'veg' | 'nonveg' | 'vegan'; ingredients: MenuIngredient[]; addons: MenuAddon[] }) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  setMenuItemAvailability: (id: string, isAvailable: boolean) => Promise<void>;
  updateCategoryRanks: (orderedCategories: string[]) => Promise<void>;
  setMonthlyGoal: (goal: number) => void;
  updateOrderStatus: (id: string, status: string) => Promise<void>;
  addCoupon: (coupon: Omit<DiscountCoupon, "id" | "used_count" | "created_at">) => Promise<void>;
  updateCoupon: (id: string, updates: Partial<Omit<DiscountCoupon, "id" | "created_at">>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const KitchenContext = createContext<KitchenContextType | undefined>(undefined);

export const KitchenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const { user, loading: authLoading } = useAuth();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [monthlyGoal, setMonthlyGoal] = useState<number>(20000);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  const resolveOrgId = async (userId: string): Promise<string | null> => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
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
        setInventory([]);
        setMenu([]);
        setCategories([]);
        setOrders([]);
        setExpenses([]);
        return;
      }

      if (currentOrgId !== orgId) setOrgId(currentOrgId);

      const { data: invData, error: invError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('organization_id', currentOrgId);
      if (invError) console.error("Inventory fetch error:", invError);
      const fetchedInventory: InventoryItem[] = (invData || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        alertAt: item.alert_at,
        category: item.category,
      }));
      setInventory(fetchedInventory);

      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('*, menu_ingredients(*), menu_addons(*)')
        .eq('organization_id', currentOrgId);
      if (menuError) console.error("Menu fetch error:", menuError);
      const fetchedMenu: MenuItem[] = (menuData || []).map((item: any) => ({
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
        isAvailable: item.is_available,
        ingredients: (item.menu_ingredients || []).map((ing: any) => ({
          inventoryId: ing.inventory_item_id,
          quantity: ing.quantity,
          unit: ing.unit ?? undefined,
        })),
        addons: (item.menu_addons || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          price: a.price,
        })),
      }));
      setMenu(fetchedMenu);

      const { data: catData, error: catError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('organization_id', currentOrgId)
        .order('rank', { ascending: true });
      if (catError) console.error("Category fetch error:", catError);
      setCategories((catData || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        rank: c.rank
      })));

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('organization_id', currentOrgId)
        .order('created_at', { ascending: false });
      if (ordersError) console.error("Orders fetch error:", ordersError);
      const fetchedOrders: Order[] = (ordersData || []).map((o: any) => ({
        id: o.id,
        orderCode: o.order_id ?? undefined,
        customer: {
          name: o.customer_name,
          contact: o.customer_contact,
          email: o.customer_email,
          dob: o.customer_dob,
        },
        items: (o.order_items || []).map((oi: any) => ({
          menuItemId: oi.menu_item_id,
          quantity: oi.quantity,
          selectedAddons: (oi.selected_addons || []) as SelectedAddon[],
        })),
        subtotal: o.total,
        discount: o.discount,
        total: o.total,
        status: o.status,
        date: o.created_at,
        notes: o.notes
      }));
      setOrders(fetchedOrders);

      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('organization_id', currentOrgId)
        .order('date', { ascending: false });
      if (expensesError) console.error("Expenses fetch error:", expensesError);
      const fetchedExpenses: Expense[] = (expensesData || []).map((e: any) => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
        category: e.category,
        date: e.date || e.created_at,
      }));
      setExpenses(fetchedExpenses);

      const { data: couponsData, error: couponsError } = await supabase
        .from('discount_coupons')
        .select('*')
        .eq('organization_id', currentOrgId)
        .order('created_at', { ascending: false });
      if (couponsError) console.error("Coupons fetch error:", couponsError);
      const fetchedCoupons: DiscountCoupon[] = (couponsData || []).map((c: any) => ({
        id: c.id,
        code: c.code,
        discount_percent: c.discount_percent,
        max_uses: c.max_uses,
        used_count: c.used_count,
        min_order_value: c.min_order_value ?? 0,
        valid_from: c.valid_from,
        valid_to: c.valid_to,
        is_active: c.is_active,
        created_at: c.created_at,
      }));
      setCoupons(fetchedCoupons);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    fetchInitialData(user.id);
  }, [authLoading, user]);

  useEffect(() => {
    if (!orgId) return;

    const inventoryChannel = supabase
      .channel(`rt-inventory-${orgId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inventory_items', filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          setInventory(prev => {
            if (prev.find(i => i.id === r.id)) return prev;
            return [...prev, { id: r.id, name: r.name, quantity: r.quantity, unit: r.unit, category: r.category, alertAt: r.alert_at }];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'inventory_items', filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          setInventory(prev => prev.map(i => i.id === r.id ? { ...i, name: r.name, quantity: r.quantity, unit: r.unit, category: r.category, alertAt: r.alert_at } : i));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'inventory_items' },
        (payload) => {
          const r = payload.old as any;
          setInventory(prev => prev.filter(i => i.id !== r.id));
        }
      )
      .subscribe();

    const menuChannel = supabase
      .channel(`rt-menu-${orgId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'menu_items', filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          setMenu(prev => {
            if (prev.find(m => m.id === r.id)) return prev;
            return [...prev, { id: r.id, name: r.name, price: r.price, category: r.category ?? undefined, subcategory: r.subcategory ?? undefined, image_url: r.image_url ?? undefined, image_urls: r.image_urls || [], quantity_info: r.quantity_info ?? undefined, spice_level: r.spice_level ?? 0, diet_type: r.diet_type ?? undefined, isAvailable: r.is_available, ingredients: [], addons: [] }];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'menu_items', filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          setMenu(prev => prev.map(m => m.id === r.id ? { ...m, name: r.name, price: r.price, category: r.category ?? undefined, subcategory: r.subcategory ?? undefined, image_url: r.image_url ?? undefined, image_urls: r.image_urls || [], quantity_info: r.quantity_info ?? undefined, spice_level: r.spice_level ?? 0, diet_type: r.diet_type ?? undefined, isAvailable: r.is_available } : m));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'menu_items' },
        (payload) => {
          const r = payload.old as any;
          setMenu(prev => prev.filter(m => m.id !== r.id));
        }
      )
      .subscribe();

    const ordersChannel = supabase
      .channel(`rt-orders-${orgId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `organization_id=eq.${orgId}` },
        async (payload) => {
          const r = payload.new as any;
          const { data: oi } = await supabase
            .from('order_items')
            .select('menu_item_id, quantity, selected_addons')
            .eq('order_id', r.id);
          const newOrder: Order = {
            id: r.id,
            orderCode: r.order_id ?? undefined,
            customer: { name: r.customer_name, contact: r.customer_contact, email: r.customer_email, dob: r.customer_dob },
            items: (oi || []).map((o: any) => ({ menuItemId: o.menu_item_id, quantity: o.quantity, selectedAddons: (o.selected_addons || []) as SelectedAddon[] })),
            subtotal: r.total,
            discount: r.discount ?? 0,
            total: r.total,
            status: r.status,
            date: r.created_at,
            notes: r.notes ?? undefined,
          };
          setOrders(prev => {
            if (prev.find(o => o.id === r.id)) return prev;
            return [newOrder, ...prev];
          });

          // 🔔 Sound alert: ring the kitchen alarm the moment a QR order
          // arrives. IncomingQrOrders component owns the stop logic.
          if (newOrder.orderCode && newOrder.status === "Placed") {
            startContinuousAlarm();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          setOrders(prev => prev.map(o => o.id === r.id ? {
            ...o,
            status: r.status,
            total: r.total,
            discount: r.discount ?? o.discount,
            notes: r.notes ?? o.notes,
            customer: { ...o.customer, name: r.customer_name ?? o.customer.name },
          } : o));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
          const r = payload.old as any;
          setOrders(prev => prev.filter(o => o.id !== r.id));
        }
      )
      .subscribe();

    const expensesChannel = supabase
      .channel(`rt-expenses-${orgId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses', filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          const newExpense: Expense = { id: r.id, description: r.description, amount: r.amount, category: r.category, date: r.date || r.created_at };
          setExpenses(prev => {
            if (prev.find(e => e.id === r.id)) return prev;
            return [newExpense, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'expenses', filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          setExpenses(prev => prev.map(e => e.id === r.id ? { ...e, description: r.description, amount: r.amount, category: r.category, date: r.date || r.created_at } : e));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'expenses' },
        (payload) => {
          const r = payload.old as any;
          setExpenses(prev => prev.filter(e => e.id !== r.id));
        }
      )
      .subscribe();

    const couponsChannel = supabase
      .channel(`rt-coupons-${orgId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'discount_coupons', filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          const newCoupon: DiscountCoupon = { id: r.id, code: r.code, discount_percent: r.discount_percent, max_uses: r.max_uses, used_count: r.used_count, min_order_value: r.min_order_value ?? 0, valid_from: r.valid_from, valid_to: r.valid_to, is_active: r.is_active, created_at: r.created_at };
          setCoupons(prev => {
            if (prev.find(c => c.id === r.id)) return prev;
            return [newCoupon, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'discount_coupons', filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          setCoupons(prev => prev.map(c => c.id === r.id ? { ...c, code: r.code, discount_percent: r.discount_percent, max_uses: r.max_uses, used_count: r.used_count, min_order_value: r.min_order_value ?? 0, valid_from: r.valid_from, valid_to: r.valid_to, is_active: r.is_active } : c));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'discount_coupons' },
        (payload) => {
          const r = payload.old as any;
          setCoupons(prev => prev.filter(c => c.id !== r.id));
        }
      )
      .subscribe();

    const categoriesChannel = supabase
      .channel(`rt-categories-${orgId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'menu_categories', filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          setCategories(prev => {
            if (prev.find(c => c.id === r.id)) return prev;
            return [...prev, { id: r.id, name: r.name, rank: r.rank }].sort((a,b) => a.rank - b.rank);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'menu_categories', filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const r = payload.new as any;
          setCategories(prev => prev.map(c => c.id === r.id ? { ...c, name: r.name, rank: r.rank } : c).sort((a,b) => a.rank - b.rank));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'menu_categories' },
        (payload) => {
          const r = payload.old as any;
          setCategories(prev => prev.filter(c => c.id !== r.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inventoryChannel);
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(expensesChannel);
      supabase.removeChannel(couponsChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, [orgId]);

  const convertToInventoryUnit = (qty: number, fromUnit: string, toUnit: string): number => {
    if (!fromUnit || !toUnit || fromUnit === toUnit) return qty;
    const from = fromUnit.toLowerCase();
    const to = toUnit.toLowerCase();

    if (from === 'g' && to === 'kg') return qty / 1000;
    if (from === 'kg' && to === 'g') return qty * 1000;

    if (from === 'ml' && to === 'l') return qty / 1000;
    if (from === 'l' && to === 'ml') return qty * 1000;

    return qty;
  };

  const addInventoryItem = async (item: Omit<InventoryItem, "id">): Promise<string | undefined> => {
    if (!orgId) {
      setError("No organization context — please log in again.");
      return undefined;
    }

    const { data, error } = await supabase.from('inventory_items').insert({
      organization_id: orgId,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
    }).select().single();

    if (error) {
      console.error(error);
      setError(error.message);
      return undefined;
    }

    setInventory(prev => [...prev, { ...item, id: data.id }]);
    return data.id;
  };

  const updateInventoryQuantity = async (id: string, quantity: number) => {
    const { error } = await supabase.rpc('adjust_inventory_quantity', {
      item_id: id,
      delta: quantity,
    });

    if (error) {
      console.error(error);
      setError(error.message);
    }
  };

  const deleteInventoryItem = async (id: string) => {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setInventory(prev => prev.filter(i => i.id !== id));
  };

  const updateInventoryItem = async (id: string, updates: { name?: string; unit?: string; category?: string; quantity?: number }) => {
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.unit !== undefined) payload.unit = updates.unit;
    if (updates.category !== undefined) payload.category = updates.category || null;
    if (updates.quantity !== undefined) payload.quantity = updates.quantity;

    const { error } = await supabase
      .from('inventory_items')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setInventory(prev =>
      prev.map(i => (i.id === id ? { ...i, ...updates } : i))
    );
  };

  const addMenuItem = async (item: Omit<MenuItem, "id" | "isAvailable">) => {
    if (!orgId) {
      setError("No organization context — please log in again.");
      return;
    }

    const { data: menuData, error: menuError } = await supabase.from('menu_items').insert({
      organization_id: orgId,
      name: item.name,
      price: item.price,
      category: item.category || null,
      subcategory: item.subcategory || null,
      image_url: item.image_url || null,
      image_urls: item.image_urls || [],
      quantity_info: item.quantity_info || null,
      spice_level: item.spice_level || 0,
      diet_type: item.diet_type || null,
      is_available: true,
    }).select().single();

    if (menuError) {
      console.error(menuError);
      setError(menuError.message);
      return;
    }

    if (item.ingredients.length > 0) {
      const ingredientsToInsert = item.ingredients.map(ing => {
        const inventoryItem = inventory.find(i => i.id === ing.inventoryId);
        const invUnit = inventoryItem?.unit || '';
        const fromUnit = ing.unit || invUnit;
        return {
          menu_item_id: menuData.id,
          inventory_item_id: ing.inventoryId,
          quantity: convertToInventoryUnit(ing.quantity, fromUnit, invUnit),
        };
      });
      const { error: ingError } = await supabase.from('menu_ingredients').insert(ingredientsToInsert);
      if (ingError) {
        console.error(ingError);
        setError(ingError.message);
      }
    }

    let insertedAddons: MenuAddon[] = [];
    if (item.addons && item.addons.length > 0) {
      const addonsToInsert = item.addons.map(a => ({
        menu_item_id: menuData.id,
        name: a.name,
        price: a.price,
      }));
      const { data: addonData, error: addonError } = await supabase
        .from('menu_addons')
        .insert(addonsToInsert)
        .select();
      if (addonError) {
        console.error(addonError);
        setError(addonError.message);
      } else {
        insertedAddons = (addonData || []).map((a: any) => ({ id: a.id, name: a.name, price: a.price }));
      }
    }

    setMenu(prev => [...prev, { ...item, id: menuData.id, isAvailable: true, category: item.category, subcategory: item.subcategory, image_url: item.image_url, image_urls: item.image_urls || [], quantity_info: item.quantity_info, spice_level: item.spice_level || 0, diet_type: item.diet_type, addons: insertedAddons }]);
  };

  const updateMenuItem = async (
    id: string,
    updates: { name: string; price: number; category?: string; subcategory?: string; image_url?: string; image_urls?: string[]; quantity_info?: string; spice_level?: number; diet_type?: 'veg' | 'nonveg' | 'vegan'; ingredients: MenuIngredient[]; addons: MenuAddon[] }
  ) => {
    const { error: updateError } = await supabase
      .from('menu_items')
      .update({ name: updates.name, price: updates.price, category: updates.category || null, subcategory: updates.subcategory || null, image_url: updates.image_url || null, image_urls: updates.image_urls || [], quantity_info: updates.quantity_info || null, spice_level: updates.spice_level || 0, diet_type: updates.diet_type || null })
      .eq('id', id);

    if (updateError) {
      console.error(updateError);
      setError(updateError.message);
      return;
    }

    const { error: deleteError } = await supabase
      .from('menu_ingredients')
      .delete()
      .eq('menu_item_id', id);

    if (deleteError) {
      console.error(deleteError);
      setError(deleteError.message);
      return;
    }

    if (updates.ingredients.length > 0) {
      const ingredientsToInsert = updates.ingredients.map(ing => {
        const inventoryItem = inventory.find(i => i.id === ing.inventoryId);
        const invUnit = inventoryItem?.unit || '';
        const fromUnit = ing.unit || invUnit;
        return {
          menu_item_id: id,
          inventory_item_id: ing.inventoryId,
          quantity: convertToInventoryUnit(ing.quantity, fromUnit, invUnit),
        };
      });
      const { error: insertError } = await supabase
        .from('menu_ingredients')
        .insert(ingredientsToInsert);

      if (insertError) {
        console.error(insertError);
        setError(insertError.message);
        return;
      }
    }

    const { error: deleteAddonError } = await supabase
      .from('menu_addons')
      .delete()
      .eq('menu_item_id', id);

    if (deleteAddonError) {
      console.error(deleteAddonError);
      setError(deleteAddonError.message);
      return;
    }

    let savedAddons: MenuAddon[] = [];
    if (updates.addons.length > 0) {
      const addonsToInsert = updates.addons.map(a => ({
        menu_item_id: id,
        name: a.name,
        price: a.price,
      }));
      const { data: addonData, error: addonInsertError } = await supabase
        .from('menu_addons')
        .insert(addonsToInsert)
        .select();
      if (addonInsertError) {
        console.error(addonInsertError);
        setError(addonInsertError.message);
        return;
      }
      savedAddons = (addonData || []).map((a: any) => ({ id: a.id, name: a.name, price: a.price }));
    }

    setMenu(prev =>
      prev.map(m =>
        m.id === id
          ? { ...m, name: updates.name, price: updates.price, category: updates.category, subcategory: updates.subcategory, image_urls: updates.image_urls || [], quantity_info: updates.quantity_info, spice_level: updates.spice_level || 0, diet_type: updates.diet_type, ingredients: updates.ingredients, addons: savedAddons }
          : m
      )
    );
  };

  const deleteMenuItem = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error(deleteError);
      setError(deleteError.message);
      return;
    }

    setMenu(prev => prev.filter(m => m.id !== id));
  };

  const setMenuItemAvailability = async (id: string, isAvailable: boolean) => {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: isAvailable })
      .eq('id', id);

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setMenu(prev =>
      prev.map(m => (m.id === id ? { ...m, isAvailable } : m))
    );
  };

  const updateCategoryRanks = async (orderedCategories: string[]) => {
    if (!orgId) return;
    
    // First ensure they all exist in menu_categories table
    for (let i = 0; i < orderedCategories.length; i++) {
      const name = orderedCategories[i];
      await supabase.from('menu_categories').upsert({
        organization_id: orgId,
        name,
        rank: i
      }, { onConflict: 'organization_id,name' });
    }
  };

  // ── addOrder — now factors add-on prices into subtotal/total, and
  // persists each line's selected add-ons into order_items.selected_addons ──
  const addOrder = async (customerName: string, items: OrderItem[], discount: number, contact?: string, email?: string, dob?: string, notes?: string, couponCode?: string, couponDiscount?: number) => {
    if (!orgId) {
      setError("No organization context — please log in again.");
      return;
    }

    let subtotal = 0;
    const inventoryDeductions: Record<string, number> = {};

    items.forEach((orderItem) => {
      const menuItem = menu.find((m) => m.id === orderItem.menuItemId);
      if (menuItem) {
        const addonTotal = (orderItem.selectedAddons || []).reduce((s, a) => s + a.price, 0);
        subtotal += (menuItem.price + addonTotal) * orderItem.quantity;

        menuItem.ingredients.forEach((ing) => {
          const deductionQty = ing.quantity * orderItem.quantity;
          inventoryDeductions[ing.inventoryId] = (inventoryDeductions[ing.inventoryId] || 0) + deductionQty;
        });
      }
    });

    const total = subtotal - (subtotal * discount) / 100;

    const { data: orderData, error: orderError } = await supabase.from('orders').insert({
      organization_id: orgId,
      customer_name: customerName,
      customer_contact: contact && contact.trim() !== "" ? contact.trim() : null,
      customer_email: email && email.trim() !== "" ? email.trim() : null,
      customer_dob: dob && dob.trim() !== "" ? dob : null,
      discount,
      total,
      status: 'Placed',
      notes: notes && notes.trim() !== "" ? notes.trim() : null,
      coupon_code: couponCode || null,
      coupon_discount: couponDiscount || 0,
    }).select().single();

    if (orderError) {
      console.error(orderError);
      setError(orderError.message);
      return;
    }

    const orderItemsToInsert = items.map(i => ({
      order_id: orderData.id,
      menu_item_id: i.menuItemId,
      quantity: i.quantity,
      selected_addons: i.selectedAddons || [],
    }));
    const { error: orderItemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
    if (orderItemsError) {
      console.error(orderItemsError);
      setError(orderItemsError.message);
    }

    setOrders(prev => [
      {
        id: orderData.id,
        orderCode: orderData.order_id ?? undefined,
        customer: { name: customerName, contact, email, dob },
        items,
        subtotal,
        discount,
        total,
        status: "Placed",
        date: orderData.created_at || new Date().toISOString(),
        notes: notes?.trim(),
      },
      ...prev,
    ]);
  };

  const updateOrder = async (id: string, updates: { customer_name?: string; total?: number; discount?: number; items?: OrderItem[] }) => {
    let newTotal = updates.total;
    let newSubtotal = 0;

    if (updates.items) {
      newSubtotal = updates.items.reduce((sum, item) => {
        const menuItem = menu.find(m => m.id === item.menuItemId);
        const addonTotal = (item.selectedAddons || []).reduce((s, a) => s + a.price, 0);
        return sum + (menuItem ? (menuItem.price + addonTotal) * item.quantity : 0);
      }, 0);

      const order = orders.find(o => o.id === id);
      const discount = updates.discount ?? (order?.discount || 0);
      newTotal = newSubtotal - (newSubtotal * discount) / 100;

      await supabase.from('order_items').delete().eq('order_id', id);
      if (updates.items.length > 0) {
        const orderItemsToInsert = updates.items.map(i => ({
          order_id: id,
          menu_item_id: i.menuItemId,
          quantity: i.quantity,
          selected_addons: i.selectedAddons || [],
        }));
        await supabase.from('order_items').insert(orderItemsToInsert);
      }
    }

    const { error } = await supabase.from('orders').update({
      ...(updates.customer_name && { customer_name: updates.customer_name }),
      ...(newTotal !== undefined && { total: newTotal }),
      ...(updates.discount !== undefined && { discount: updates.discount })
    }).eq('id', id);

    if (!error) {
      setOrders(prev => prev.map(o => o.id === id ? {
        ...o,
        customer: { ...o.customer, name: updates.customer_name || o.customer.name },
        ...(updates.items && { items: updates.items, subtotal: newSubtotal }),
        total: newTotal ?? o.total,
        discount: updates.discount ?? o.discount
      } : o));
    } else {
      console.error(error);
      setError(error.message);
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    if (order.status === 'Preparing' && status === 'Delivered') {
      const inventoryDeductions: Record<string, number> = {};
      order.items.forEach((orderItem) => {
        const menuItem = menu.find((m) => m.id === orderItem.menuItemId);
        if (menuItem) {
          menuItem.ingredients.forEach((ing) => {
            const deductionQty = ing.quantity * orderItem.quantity;
            inventoryDeductions[ing.inventoryId] = (inventoryDeductions[ing.inventoryId] || 0) + deductionQty;
          });
        }
      });
      if (Object.keys(inventoryDeductions).length > 0) {
        const deductions = Object.entries(inventoryDeductions).map(([inventory_id, qty]) => ({
          inventory_id,
          qty,
        }));
        const { error: deductError } = await supabase.rpc('deduct_inventory_for_order', {
          deductions,
        });
        if (deductError) {
          console.error(deductError);
          setError(deductError.message);
        }
      }
    }

    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (!error) {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === id ? { ...order, status } : order
        )
      );
    } else {
      console.error(error);
      setError(error.message);
    }
  };

  const addExpense = async (expense: Omit<Expense, "id" | "date">) => {
    if (!orgId) {
      setError("No organization context — please log in again.");
      return;
    }

    const { data, error } = await supabase.from('expenses').insert({
      organization_id: orgId,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: new Date().toISOString(),
    }).select().single();

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setExpenses((prev) => [
      {
        ...expense,
        id: data.id,
        date: data.date || data.created_at,
      },
      ...prev,
    ]);
  };

  const updateExpense = async (id: string, updates: Omit<Expense, "id" | "date">) => {
    const { error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setExpenses(prev =>
      prev.map(e => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addCoupon = async (coupon: Omit<DiscountCoupon, "id" | "used_count" | "created_at">) => {
    if (!orgId) { setError("No organization context."); return; }
    const { data, error } = await supabase.from('discount_coupons').insert({
      organization_id: orgId,
      code: coupon.code.toUpperCase().trim(),
      discount_percent: coupon.discount_percent,
      max_uses: coupon.max_uses ?? null,
      min_order_value: coupon.min_order_value ?? 0,
      valid_from: coupon.valid_from,
      valid_to: coupon.valid_to ?? null,
      is_active: coupon.is_active,
    }).select().single();
    if (error) { console.error(error); setError(error.message); return; }
    setCoupons(prev => [{ ...coupon, id: data.id, used_count: 0, created_at: data.created_at }, ...prev]);
  };

  const updateCoupon = async (id: string, updates: Partial<Omit<DiscountCoupon, "id" | "created_at">>) => {
    const payload: Record<string, any> = {};
    if (updates.code !== undefined) payload.code = updates.code.toUpperCase().trim();
    if (updates.discount_percent !== undefined) payload.discount_percent = updates.discount_percent;
    if (updates.max_uses !== undefined) payload.max_uses = updates.max_uses;
    if (updates.min_order_value !== undefined) payload.min_order_value = updates.min_order_value;
    if (updates.valid_from !== undefined) payload.valid_from = updates.valid_from;
    if (updates.valid_to !== undefined) payload.valid_to = updates.valid_to;
    if (updates.is_active !== undefined) payload.is_active = updates.is_active;
    const { error } = await supabase.from('discount_coupons').update(payload).eq('id', id);
    if (error) { console.error(error); setError(error.message); return; }
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCoupon = async (id: string) => {
    const { error } = await supabase.from('discount_coupons').delete().eq('id', id);
    if (error) { console.error(error); setError(error.message); return; }
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  return (
    <KitchenContext.Provider
      value={{
        inventory,
        menu,
        categories,
        orders,
        expenses,
        coupons,
        addInventoryItem,
        updateInventoryQuantity,
        updateInventoryItem,
        deleteInventoryItem,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        setMenuItemAvailability,
        updateCategoryRanks,
        addOrder,
        updateOrder,
        addExpense,
        updateExpense,
        deleteExpense,
        monthlyGoal,
        setMonthlyGoal,
        updateOrderStatus,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        loading,
        error,
      }}
    >
      {children}
    </KitchenContext.Provider>
  );
};

export const useKitchen = () => {
  const context = useContext(KitchenContext);
  if (context === undefined) {
    throw new Error("useKitchen must be used within a KitchenProvider");
  }
  return context;
};