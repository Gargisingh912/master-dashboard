import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// --- Core Auth-Linked Tables (assumed pre-existing) ---

export interface OrganizationRow {
  id: string;
  name: string;
  organization_type: string;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  full_name: string | null;
  organization_id: string | null;
  role: string | null;
  created_at: string;
}

// --- Database Row Interfaces (Matching schema.sql) ---

export interface InventoryItemRow {
  id: string;
  organization_id: string;
  name: string;
  quantity: number;
  unit: string;
  alert_at: number;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuItemRow {
  id: string;
  organization_id: string;
  name: string;
  price: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuIngredientRow {
  id: string;
  menu_item_id: string;
  inventory_item_id: string;
  quantity: number;
  created_at: string;
}

export interface OrderRow {
  id: string;
  organization_id: string;
  customer_name: string;
  customer_contact: string | null;
  customer_email: string | null;
  customer_dob: string | null;
  discount: number;
  total: number;
  status: string;
  created_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  created_at: string;
}

export interface ExpenseRow {
  id: string;
  organization_id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  created_at: string;
}

export interface AcademyCoachRow {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface AcademyStudentRow {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
  created_at: string;
}

export interface AcademyClassRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  coach_id: string | null;
  schedule: string | null; // JSON or text representation of schedule
  created_at: string;
}

export interface AcademyEnrollmentRow {
  id: string;
  student_id: string;
  class_id: string;
  enrollment_date: string;
  created_at: string;
}   