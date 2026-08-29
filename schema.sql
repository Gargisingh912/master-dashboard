-- ============================================================================
-- Master-Dashboard — Complete Supabase Schema (Idempotent)
-- ============================================================================
-- Run this in the Supabase SQL Editor. Every statement is guarded with
-- IF NOT EXISTS / IF EXISTS / CREATE OR REPLACE so it can be re-run safely
-- without throwing errors.
-- ============================================================================

-- 0. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================================
-- 1. ORGANIZATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name          TEXT NOT NULL,
    owner_name    TEXT,
    phone         TEXT,
    email         TEXT,
    city          TEXT,
    address       TEXT,
    type          TEXT NOT NULL DEFAULT 'Kitchen',          -- Kitchen | Sports Academy | Salon
    plan          TEXT NOT NULL DEFAULT 'trial',             -- trial | standard | premium | enterprise
    trial_ends    TIMESTAMP WITH TIME ZONE,
    owner_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add columns that may be missing on older deployments (standalone — no DO block)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS owner_name  TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone       TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email       TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city        TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address     TEXT;
DO $$ BEGIN ALTER TABLE organizations ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'Kitchen'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'trial'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_ends  TIMESTAMP WITH TIME ZONE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS owner_id    UUID;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url    TEXT;


-- ============================================================================
-- 2. PROFILES TABLE  (linked 1:1 with auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name         TEXT,
    email             TEXT,
    role              TEXT NOT NULL DEFAULT 'admin',         -- owner | admin | superadmin
    organization_id   UUID REFERENCES organizations(id) ON DELETE SET NULL,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name         TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email             TEXT;
DO $$ BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id   UUID;


-- ============================================================================
-- 3. INVENTORY ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_items (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    quantity          NUMERIC NOT NULL DEFAULT 0,
    unit              TEXT NOT NULL DEFAULT '',
    category          TEXT,
    alert_at          NUMERIC DEFAULT 0,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$ BEGIN ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS category  TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS alert_at  NUMERIC DEFAULT 0;


-- ============================================================================
-- 4. MENU ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS menu_items (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    price             NUMERIC NOT NULL DEFAULT 0,
    is_available      BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$ BEGIN ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true; EXCEPTION WHEN OTHERS THEN NULL; END $$;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS quantity_info TEXT;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS spice_level INTEGER DEFAULT 0;


-- ============================================================================
-- 5. MENU INGREDIENTS (join table: menu_items ↔ inventory_items)
-- ============================================================================
CREATE TABLE IF NOT EXISTS menu_ingredients (
    id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    menu_item_id        UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    inventory_item_id   UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity            NUMERIC NOT NULL DEFAULT 1,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ============================================================================
-- 6. ORDERS TABLE
-- ============================================================================
-- Create a sequence for human-readable order numbers (per-database, not per-org)
CREATE SEQUENCE IF NOT EXISTS orders_order_number_seq;

CREATE TABLE IF NOT EXISTS orders (
    id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    order_number        INTEGER NOT NULL DEFAULT nextval('orders_order_number_seq'),
    customer_name       TEXT NOT NULL,
    customer_contact    TEXT,
    customer_email      TEXT,
    customer_dob        TEXT,
    discount            NUMERIC NOT NULL DEFAULT 0,
    total               NUMERIC NOT NULL DEFAULT 0,
    status              TEXT NOT NULL DEFAULT 'Placed',     -- Placed | Preparing | Delivered | Completed | Declined | Missed | Cancelled
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number     INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_contact TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email   TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_dob     TEXT;

-- Back-fill order_number for any rows that don't have one
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM orders WHERE order_number IS NULL LIMIT 1) THEN
        UPDATE orders SET order_number = nextval('orders_order_number_seq') WHERE order_number IS NULL;
    END IF;
END $$;

-- Make order_number NOT NULL after back-fill (idempotent via exception handling)
DO $$ BEGIN
    ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Default for order_number
DO $$ BEGIN
    ALTER TABLE orders ALTER COLUMN order_number SET DEFAULT nextval('orders_order_number_seq');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-- ============================================================================
-- 7. ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id    UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity        NUMERIC NOT NULL DEFAULT 1,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ============================================================================
-- 8. EXPENSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS expenses (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    description       TEXT NOT NULL,
    amount            NUMERIC NOT NULL,
    category          TEXT NOT NULL,
    date              TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ============================================================================
-- 9. CUSTOMERS TABLE  (public QR ordering — upserted by contact_number)
-- ============================================================================
CREATE TABLE IF NOT EXISTS customers (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_number    TEXT NOT NULL,
    name              TEXT NOT NULL,
    email             TEXT,
    address           TEXT,
    dob               DATE,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (organization_id, contact_number)
);

ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS dob     DATE;


-- ============================================================================
-- 10. INDEXES  (idempotent — IF NOT EXISTS)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_inventory_items_org      ON inventory_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_org           ON menu_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_org_category  ON menu_items(organization_id, category);
CREATE INDEX IF NOT EXISTS idx_menu_ingredients_menu    ON menu_ingredients(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_ingredients_inv     ON menu_ingredients(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_orders_org               ON orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_orders_status            ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created           ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order        ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu         ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_expenses_org             ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date            ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_customers_org            ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_contact        ON customers(organization_id, contact_number);
CREATE INDEX IF NOT EXISTS idx_profiles_org             ON profiles(organization_id);


-- ============================================================================
-- 11. RPC FUNCTIONS
-- ============================================================================

-- 11a. adjust_inventory_quantity — atomic increment/decrement
CREATE OR REPLACE FUNCTION adjust_inventory_quantity(item_id UUID, delta NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE inventory_items
       SET quantity   = quantity + delta,
           updated_at = now()
     WHERE id = item_id;
END;
$$;

-- 11b. deduct_inventory_for_order — bulk deduction when order is delivered
CREATE OR REPLACE FUNCTION deduct_inventory_for_order(
    deductions JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item JSONB;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(deductions)
    LOOP
        UPDATE inventory_items
           SET quantity   = quantity - (item->>'qty')::NUMERIC,
               updated_at = now()
         WHERE id = (item->>'inventory_id')::UUID;
    END LOOP;
END;
$$;


-- ============================================================================
-- 12. TRIGGER: Auto-create profile on auth.users insert
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        'owner'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Drop and re-create the trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- 13. TRIGGER: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at_inventory ON inventory_items;
CREATE TRIGGER set_updated_at_inventory
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_menu ON menu_items;
CREATE TRIGGER set_updated_at_menu
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_customers ON customers;
CREATE TRIGGER set_updated_at_customers
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================
-- 14. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE organizations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers        ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 15. RLS POLICIES  (idempotent: DROP IF EXISTS + CREATE)
-- ============================================================================

-- ─── Helper: get current user's org_id ───
-- Uses LANGUAGE plpgsql (not sql) so the body is validated at RUNTIME,
-- not at creation time — avoids "column does not exist" if profiles
-- was created by an auth trigger without organization_id initially.
CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (SELECT organization_id FROM profiles WHERE id = auth.uid());
END;
$$;


-- ─────────────────────────────────────────────
-- ORGANIZATIONS
-- ─────────────────────────────────────────────
-- Authenticated users can read their own org
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
CREATE POLICY "Users can view their own organization"
    ON organizations FOR SELECT
    USING (
        id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
    );

-- Org owners can insert (registration flow)
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
CREATE POLICY "Users can create organizations"
    ON organizations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Owners & superadmins can update their org
DROP POLICY IF EXISTS "Owners can update their organization" ON organizations;
CREATE POLICY "Owners can update their organization"
    ON organizations FOR UPDATE
    USING (
        owner_id = auth.uid()
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
    )
    WITH CHECK (
        owner_id = auth.uid()
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
    );


-- ─────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view profiles in their org" ON profiles;
CREATE POLICY "Users can view profiles in their org"
    ON profiles FOR SELECT
    USING (
        organization_id IN (SELECT organization_id FROM profiles p WHERE p.id = auth.uid())
        OR id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    );

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Profiles auto-created on signup" ON profiles;
CREATE POLICY "Profiles auto-created on signup"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);


-- ─────────────────────────────────────────────
-- INVENTORY ITEMS
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their organization's inventory" ON inventory_items;
CREATE POLICY "Users can manage their organization's inventory"
    ON inventory_items FOR ALL
    USING  (organization_id = public.current_user_org_id())
    WITH CHECK (organization_id = public.current_user_org_id());


-- ─────────────────────────────────────────────
-- MENU ITEMS
-- ─────────────────────────────────────────────
-- Authenticated users (org members) — full access
DROP POLICY IF EXISTS "Users can manage their organization's menu items" ON menu_items;
CREATE POLICY "Users can manage their organization's menu items"
    ON menu_items FOR ALL
    USING  (organization_id = public.current_user_org_id())
    WITH CHECK (organization_id = public.current_user_org_id());

-- Anonymous users (QR order page) — read-only for available items
DROP POLICY IF EXISTS "Public can view available menu items" ON menu_items;
CREATE POLICY "Public can view available menu items"
    ON menu_items FOR SELECT
    USING (is_available = true);


-- ─────────────────────────────────────────────
-- MENU INGREDIENTS
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their organization's menu ingredients" ON menu_ingredients;
CREATE POLICY "Users can manage their organization's menu ingredients"
    ON menu_ingredients FOR ALL
    USING (
        menu_item_id IN (
            SELECT id FROM menu_items
             WHERE organization_id = public.current_user_org_id()
        )
    )
    WITH CHECK (
        menu_item_id IN (
            SELECT id FROM menu_items
             WHERE organization_id = public.current_user_org_id()
        )
    );


-- ─────────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────────
-- Org members — full access to their orders
DROP POLICY IF EXISTS "Users can manage their organization's orders" ON orders;
CREATE POLICY "Users can manage their organization's orders"
    ON orders FOR ALL
    USING  (organization_id = public.current_user_org_id())
    WITH CHECK (organization_id = public.current_user_org_id());

-- Anonymous users (QR order page) — can insert orders
DROP POLICY IF EXISTS "Public can place orders" ON orders;
CREATE POLICY "Public can place orders"
    ON orders FOR INSERT
    WITH CHECK (true);

-- Anonymous users — can view/update their own placed order (status tracking)
DROP POLICY IF EXISTS "Public can view and update placed orders" ON orders;
CREATE POLICY "Public can view and update placed orders"
    ON orders FOR UPDATE
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read their own orders" ON orders;
CREATE POLICY "Public can read their own orders"
    ON orders FOR SELECT
    USING (true);


-- ─────────────────────────────────────────────
-- ORDER ITEMS
-- ─────────────────────────────────────────────
-- Org members
DROP POLICY IF EXISTS "Users can manage their organization's order items" ON order_items;
CREATE POLICY "Users can manage their organization's order items"
    ON order_items FOR ALL
    USING (
        order_id IN (
            SELECT id FROM orders
             WHERE organization_id = public.current_user_org_id()
        )
    )
    WITH CHECK (
        order_id IN (
            SELECT id FROM orders
             WHERE organization_id = public.current_user_org_id()
        )
    );

-- Anonymous users (QR order page) — can insert and manage their order items
DROP POLICY IF EXISTS "Public can manage order items" ON order_items;
CREATE POLICY "Public can manage order items"
    ON order_items FOR ALL
    USING (true)
    WITH CHECK (true);


-- ─────────────────────────────────────────────
-- EXPENSES
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their organization's expenses" ON expenses;
CREATE POLICY "Users can manage their organization's expenses"
    ON expenses FOR ALL
    USING  (organization_id = public.current_user_org_id())
    WITH CHECK (organization_id = public.current_user_org_id());


-- ─────────────────────────────────────────────
-- CUSTOMERS
-- ─────────────────────────────────────────────
-- Org members — full read access
DROP POLICY IF EXISTS "Users can view their organization's customers" ON customers;
CREATE POLICY "Users can view their organization's customers"
    ON customers FOR SELECT
    USING (organization_id = public.current_user_org_id());

-- Anonymous users (QR order page) — can upsert customer records
DROP POLICY IF EXISTS "Public can upsert customers" ON customers;
CREATE POLICY "Public can upsert customers"
    ON customers FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update customers" ON customers;
CREATE POLICY "Public can update customers"
    ON customers FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Anonymous users — can look up their own record by contact
DROP POLICY IF EXISTS "Public can read customers" ON customers;
CREATE POLICY "Public can read customers"
    ON customers FOR SELECT
    USING (true);


-- ============================================================================
-- 16. ENABLE REALTIME  (for postgres_changes subscriptions)
-- ============================================================================
-- Supabase requires tables to be added to the supabase_realtime publication.
-- This is idempotent — adding an already-published table is a no-op.
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE inventory_items;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE menu_ingredients;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE customers;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-- ============================================================================
-- DONE ✓
-- ============================================================================
-- Tables:  organizations, profiles, inventory_items, menu_items,
--          menu_ingredients, orders, order_items, expenses, customers
--
-- Functions: adjust_inventory_quantity, deduct_inventory_for_order,
--            current_user_org_id, handle_new_user, update_updated_at_column
--
-- Triggers: on_auth_user_created, set_updated_at_inventory,
--           set_updated_at_menu, set_updated_at_customers
--
-- RLS:      Enabled on ALL tables with org-scoped policies +
--           public access for QR ordering flow
-- ============================================================================

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      UUID REFERENCES auth.users(id),
  
  title           TEXT NOT NULL,
  description     TEXT,
  
  -- Type: 'task' | 'reminder' | 'event'
  event_type      TEXT NOT NULL DEFAULT 'task',
  
  -- Scheduling
  start_date      DATE NOT NULL,
  end_date        DATE,                          -- null = single-day
  start_time      TIME,                          -- null = all-day
  end_time        TIME,
  is_all_day      BOOLEAN NOT NULL DEFAULT true,
  
  -- Category / color
  category        TEXT NOT NULL DEFAULT 'Primary', -- Primary | Success | Warning | Danger
  
  -- Task-specific
  is_completed    BOOLEAN NOT NULL DEFAULT false,
  
  -- Reminder-specific
  reminder_time   TIMESTAMPTZ,                    -- when to fire the reminder
  
  -- Metadata
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their org events"
  ON calendar_events FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org members can insert events"
  ON calendar_events FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org members can update their org events"
  ON calendar_events FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org members can delete their org events"
  ON calendar_events FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- ============================================================================
-- 17. VENUE MEMBERSHIPS
-- ============================================================================

-- Membership Plans
CREATE TABLE IF NOT EXISTS venue_membership_plans (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  duration_months INTEGER NOT NULL,
  price           NUMERIC NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Members
CREATE TABLE IF NOT EXISTS venue_members (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id    UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  contact            TEXT,
  email              TEXT,
  dob                DATE,
  membership_plan_id UUID REFERENCES venue_membership_plans(id),
  membership_start   DATE,
  membership_end     DATE,
  is_active          BOOLEAN DEFAULT true,
  created_at         TIMESTAMPTZ DEFAULT now()
);

-- Check-ins
CREATE TABLE IF NOT EXISTS venue_checkins (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id       UUID NOT NULL REFERENCES venue_members(id) ON DELETE CASCADE,
  checkin_time    TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE venue_membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage venue membership plans"
  ON venue_membership_plans FOR ALL
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());

CREATE POLICY "Users can manage venue members"
  ON venue_members FOR ALL
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());

CREATE POLICY "Users can manage venue checkins"
  ON venue_checkins FOR ALL
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE venue_membership_plans;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE venue_members;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE venue_checkins;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
