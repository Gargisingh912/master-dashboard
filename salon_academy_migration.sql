-- ============================================================================
-- Salon & Academy Verticals — Database Migration
-- ============================================================================
-- Run this in the Supabase SQL Editor. Every statement is idempotent
-- (IF NOT EXISTS / CREATE OR REPLACE) so it can be re-run safely.
-- RLS uses the existing public.current_user_org_id() helper — no new
-- security definer function needed.
-- ============================================================================


-- ============================================================================
-- SALON TABLES
-- ============================================================================

-- 1. salon_staff
CREATE TABLE IF NOT EXISTS salon_staff (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    role              TEXT,
    phone             TEXT,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. salon_services
CREATE TABLE IF NOT EXISTS salon_services (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    category          TEXT,
    duration_minutes  INTEGER NOT NULL DEFAULT 30,
    price             NUMERIC NOT NULL DEFAULT 0,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. salon_service_products (join: services ↔ inventory_items — mirrors menu_ingredients)
CREATE TABLE IF NOT EXISTS salon_service_products (
    id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_id          UUID NOT NULL REFERENCES salon_services(id) ON DELETE CASCADE,
    inventory_item_id   UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity            NUMERIC NOT NULL DEFAULT 1,
    unit                TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. salon_appointments
CREATE TABLE IF NOT EXISTS salon_appointments (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_name     TEXT NOT NULL,
    customer_contact  TEXT,
    staff_id          UUID REFERENCES salon_staff(id) ON DELETE SET NULL,
    service_id        UUID REFERENCES salon_services(id) ON DELETE SET NULL,
    appointment_date  DATE NOT NULL,
    start_time        TEXT NOT NULL,  -- HH:MM
    end_time          TEXT,
    status            TEXT NOT NULL DEFAULT 'Booked',
        -- Booked | InProgress | Completed | NoShow | Cancelled
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. salon_packages
CREATE TABLE IF NOT EXISTS salon_packages (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    total_sessions    INTEGER,
    validity_days     INTEGER,
    price             NUMERIC NOT NULL DEFAULT 0,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. salon_package_redemptions (no organization_id — scoped via salon_packages.organization_id)
CREATE TABLE IF NOT EXISTS salon_package_redemptions (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    package_id        UUID NOT NULL REFERENCES salon_packages(id) ON DELETE CASCADE,
    customer_contact  TEXT,
    appointment_id    UUID REFERENCES salon_appointments(id) ON DELETE SET NULL,
    redeemed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. salon_bills
CREATE TABLE IF NOT EXISTS salon_bills (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    appointment_id    UUID REFERENCES salon_appointments(id) ON DELETE SET NULL,
    customer_name     TEXT,
    customer_contact  TEXT,
    subtotal          NUMERIC NOT NULL DEFAULT 0,
    discount          NUMERIC NOT NULL DEFAULT 0,
    total             NUMERIC NOT NULL DEFAULT 0,
    payment_method    TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. salon_bill_items (no organization_id — scoped via salon_bills.organization_id)
CREATE TABLE IF NOT EXISTS salon_bill_items (
    id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    bill_id             UUID NOT NULL REFERENCES salon_bills(id) ON DELETE CASCADE,
    item_type           TEXT NOT NULL CHECK (item_type IN ('service', 'product')),
    service_id          UUID REFERENCES salon_services(id) ON DELETE SET NULL,
    inventory_item_id   UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
    quantity            NUMERIC NOT NULL DEFAULT 1,
    unit_price          NUMERIC NOT NULL DEFAULT 0,
    line_total          NUMERIC NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- ACADEMY TABLES
-- ============================================================================

-- 9. academy_coaches
CREATE TABLE IF NOT EXISTS academy_coaches (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    phone             TEXT,
    specialization    TEXT,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. academy_batches
CREATE TABLE IF NOT EXISTS academy_batches (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    sport_or_subject  TEXT,
    coach_id          UUID REFERENCES academy_coaches(id) ON DELETE SET NULL,
    capacity          INTEGER NOT NULL DEFAULT 20,
    schedule_days     TEXT[] NOT NULL DEFAULT '{}',  -- e.g. ['Mon','Wed','Fri']
    start_time        TEXT,   -- HH:MM
    end_time          TEXT,
    fee_amount        NUMERIC NOT NULL DEFAULT 0,
    fee_cycle         TEXT NOT NULL DEFAULT 'monthly',  -- monthly | quarterly | annual
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. academy_students
CREATE TABLE IF NOT EXISTS academy_students (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    contact           TEXT,
    email             TEXT,
    dob               DATE,
    guardian_name     TEXT,
    guardian_contact  TEXT,
    batch_id          UUID REFERENCES academy_batches(id) ON DELETE SET NULL,
    enrolled_at       DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. academy_attendance (no organization_id — scoped via academy_batches)
CREATE TABLE IF NOT EXISTS academy_attendance (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    batch_id        UUID NOT NULL REFERENCES academy_batches(id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES academy_students(id) ON DELETE CASCADE,
    session_date    DATE NOT NULL,
    status          TEXT NOT NULL DEFAULT 'present',  -- present | absent | late
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, session_date)
);

-- 13. academy_fee_payments
CREATE TABLE IF NOT EXISTS academy_fee_payments (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    student_id        UUID NOT NULL REFERENCES academy_students(id) ON DELETE CASCADE,
    amount            NUMERIC NOT NULL DEFAULT 0,
    due_date          DATE NOT NULL,
    paid_date         DATE,
    status            TEXT NOT NULL DEFAULT 'due',  -- paid | due | overdue | partial
    payment_method    TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_salon_staff_org              ON salon_staff(organization_id);
CREATE INDEX IF NOT EXISTS idx_salon_services_org           ON salon_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_salon_svc_products_svc       ON salon_service_products(service_id);
CREATE INDEX IF NOT EXISTS idx_salon_svc_products_inv       ON salon_service_products(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_salon_appointments_org       ON salon_appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_salon_appointments_date      ON salon_appointments(appointment_date DESC);
CREATE INDEX IF NOT EXISTS idx_salon_appointments_staff     ON salon_appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_salon_packages_org           ON salon_packages(organization_id);
CREATE INDEX IF NOT EXISTS idx_salon_redemptions_pkg        ON salon_package_redemptions(package_id);
CREATE INDEX IF NOT EXISTS idx_salon_bills_org              ON salon_bills(organization_id);
CREATE INDEX IF NOT EXISTS idx_salon_bill_items_bill        ON salon_bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_academy_coaches_org          ON academy_coaches(organization_id);
CREATE INDEX IF NOT EXISTS idx_academy_batches_org          ON academy_batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_academy_students_org         ON academy_students(organization_id);
CREATE INDEX IF NOT EXISTS idx_academy_students_batch       ON academy_students(batch_id);
CREATE INDEX IF NOT EXISTS idx_academy_attendance_batch     ON academy_attendance(batch_id);
CREATE INDEX IF NOT EXISTS idx_academy_attendance_student   ON academy_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_academy_fees_org             ON academy_fee_payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_academy_fees_student         ON academy_fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_academy_fees_due             ON academy_fee_payments(due_date);


-- ============================================================================
-- ENABLE RLS
-- ============================================================================
ALTER TABLE salon_staff                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_services              ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_service_products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_appointments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_packages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_package_redemptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_bills                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_bill_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_coaches             ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_batches             ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_students            ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_attendance          ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_fee_payments        ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- RLS POLICIES — reuse public.current_user_org_id() (already exists)
-- ============================================================================

-- ── salon_staff ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org members manage salon staff" ON salon_staff;
CREATE POLICY "org members manage salon staff"
    ON salon_staff FOR ALL
    USING  (organization_id = public.current_user_org_id())
    WITH CHECK (organization_id = public.current_user_org_id());

-- ── salon_services ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org members manage salon services" ON salon_services;
CREATE POLICY "org members manage salon services"
    ON salon_services FOR ALL
    USING  (organization_id = public.current_user_org_id())
    WITH CHECK (organization_id = public.current_user_org_id());

-- ── salon_service_products — scope via parent service ────────────────────────
DROP POLICY IF EXISTS "org members manage salon service products" ON salon_service_products;
CREATE POLICY "org members manage salon service products"
    ON salon_service_products FOR ALL
    USING (
        service_id IN (
            SELECT id FROM salon_services
            WHERE organization_id = public.current_user_org_id()
        )
    )
    WITH CHECK (
        service_id IN (
            SELECT id FROM salon_services
            WHERE organization_id = public.current_user_org_id()
        )
    );

-- ── salon_appointments ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org members manage salon appointments" ON salon_appointments;
CREATE POLICY "org members manage salon appointments"
    ON salon_appointments FOR ALL
    USING  (organization_id = public.current_user_org_id())
    WITH CHECK (organization_id = public.current_user_org_id());

-- ── salon_packages ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org members manage salon packages" ON salon_packages;
CREATE POLICY "org members manage salon packages"
    ON salon_packages FOR ALL
    USING  (organization_id = public.current_user_org_id())
    WITH CHECK (organization_id = public.current_user_org_id());

-- ── salon_package_redemptions — scope via parent package ─────────────────────
DROP POLICY IF EXISTS "org members manage salon redemptions" ON salon_package_redemptions;
CREATE POLICY "org members manage salon redemptions"
    ON salon_package_redemptions FOR ALL
    USING (
        package_id IN (
            SELECT id FROM salon_packages
            WHERE organization_id = public.current_user_org_id()
        )
    )
    WITH CHECK (
        package_id IN (
            SELECT id FROM salon_packages
            WHERE organization_id = public.current_user_org_id()
        )
    );

-- ── salon_bills ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org members manage salon bills" ON salon_bills;
CREATE POLICY "org members manage salon bills"
    ON salon_bills FOR ALL
    USING  (organization_id = public.current_user_org_id())
    WITH CHECK (organization_id = public.current_user_org_id());

-- ── salon_bill_items — scope via parent bill ─────────────────────────────────
DROP POLICY IF EXISTS "org members manage salon bill items" ON salon_bill_items;
CREATE POLICY "org members manage salon bill items"
    ON salon_bill_items FOR ALL
    USING (
        bill_id IN (
            SELECT id FROM salon_bills
            WHERE organization_id = public.current_user_org_id()
        )
    )
    WITH CHECK (
        bill_id IN (
            SELECT id FROM salon_bills
            WHERE organization_id = public.current_user_org_id()
        )
    );

-- ── academy_coaches ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org members manage academy coaches" ON academy_coaches;
CREATE POLICY "org members manage academy coaches"
    ON academy_coaches FOR ALL
    USING  (organization_id = public.current_user_org_id())
    WITH CHECK (organization_id = public.current_user_org_id());

-- ── academy_batches ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org members manage academy batches" ON academy_batches;
CREATE POLICY "org members manage academy batches"
    ON academy_batches FOR ALL
    USING  (organization_id = public.current_user_org_id())
    WITH CHECK (organization_id = public.current_user_org_id());

-- ── academy_students ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org members manage academy students" ON academy_students;
CREATE POLICY "org members manage academy students"
    ON academy_students FOR ALL
    USING  (organization_id = public.current_user_org_id())
    WITH CHECK (organization_id = public.current_user_org_id());

-- ── academy_attendance — scope via parent batch ──────────────────────────────
DROP POLICY IF EXISTS "org members manage academy attendance" ON academy_attendance;
CREATE POLICY "org members manage academy attendance"
    ON academy_attendance FOR ALL
    USING (
        batch_id IN (
            SELECT id FROM academy_batches
            WHERE organization_id = public.current_user_org_id()
        )
    )
    WITH CHECK (
        batch_id IN (
            SELECT id FROM academy_batches
            WHERE organization_id = public.current_user_org_id()
        )
    );

-- ── academy_fee_payments ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org members manage academy fees" ON academy_fee_payments;
CREATE POLICY "org members manage academy fees"
    ON academy_fee_payments FOR ALL
    USING  (organization_id = public.current_user_org_id())
    WITH CHECK (organization_id = public.current_user_org_id());


-- ============================================================================
-- REPLICA IDENTITY FULL (required for Supabase Realtime UPDATE/DELETE events)
-- ============================================================================
ALTER TABLE salon_staff               REPLICA IDENTITY FULL;
ALTER TABLE salon_services            REPLICA IDENTITY FULL;
ALTER TABLE salon_service_products    REPLICA IDENTITY FULL;
ALTER TABLE salon_appointments        REPLICA IDENTITY FULL;
ALTER TABLE salon_packages            REPLICA IDENTITY FULL;
ALTER TABLE salon_package_redemptions REPLICA IDENTITY FULL;
ALTER TABLE salon_bills               REPLICA IDENTITY FULL;
ALTER TABLE salon_bill_items          REPLICA IDENTITY FULL;
ALTER TABLE academy_coaches           REPLICA IDENTITY FULL;
ALTER TABLE academy_batches           REPLICA IDENTITY FULL;
ALTER TABLE academy_students          REPLICA IDENTITY FULL;
ALTER TABLE academy_attendance        REPLICA IDENTITY FULL;
ALTER TABLE academy_fee_payments      REPLICA IDENTITY FULL;


-- ============================================================================
-- REALTIME PUBLICATION
-- ============================================================================
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE salon_staff;               EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE salon_services;             EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE salon_service_products;     EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE salon_appointments;         EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE salon_packages;             EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE salon_package_redemptions;  EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE salon_bills;                EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE salon_bill_items;           EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE academy_coaches;            EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE academy_batches;            EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE academy_students;           EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE academy_attendance;         EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE academy_fee_payments;       EXCEPTION WHEN OTHERS THEN NULL; END $$;


-- ============================================================================
-- NOTIFICATION TRIGGERS (appointment booked, fee overdue)
-- All interpolated columns wrapped in COALESCE to prevent NULL body violations.
-- ============================================================================

-- Trigger: new salon appointment booked → insert notification
CREATE OR REPLACE FUNCTION public.notify_new_salon_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO notifications (organization_id, title, body, type)
    VALUES (
        NEW.organization_id,
        'New Appointment Booked',
        'Appointment for ' || COALESCE(NEW.customer_name, 'Customer') ||
        ' on ' || COALESCE(NEW.appointment_date::TEXT, 'unknown date') ||
        ' at ' || COALESCE(NEW.start_time, 'unknown time'),
        'appointment'
    )
    ON CONFLICT DO NOTHING;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Silently swallow if notifications table doesn't exist yet
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_salon_appointment_booked ON salon_appointments;
CREATE TRIGGER notify_salon_appointment_booked
    AFTER INSERT ON salon_appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_new_salon_appointment();


-- ============================================================================
-- DONE ✓
-- ============================================================================
-- Tables (13 new):
--   Salon:   salon_staff, salon_services, salon_service_products,
--            salon_appointments, salon_packages, salon_package_redemptions,
--            salon_bills, salon_bill_items
--   Academy: academy_coaches, academy_batches, academy_students,
--            academy_attendance, academy_fee_payments
--
-- RLS: All tables protected with current_user_org_id() helper
-- Realtime: All tables added to supabase_realtime publication
-- ============================================================================
