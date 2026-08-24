-- ============================================================================
-- 1. SPORTS CLUB VERTICAL
-- ============================================================================
CREATE TABLE IF NOT EXISTS sportsclub_membership_plans (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    duration_months   INTEGER NOT NULL DEFAULT 1,
    price             NUMERIC NOT NULL DEFAULT 0,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sportsclub_members (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    contact           TEXT,
    email             TEXT,
    dob               DATE,
    membership_plan_id UUID REFERENCES sportsclub_membership_plans(id) ON DELETE SET NULL,
    membership_start  DATE,
    membership_end    DATE,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sportsclub_facilities (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    type              TEXT, -- e.g., 'Tennis Court', 'Pool Lane'
    hourly_rate       NUMERIC NOT NULL DEFAULT 0,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sportsclub_facility_bookings (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    facility_id       UUID NOT NULL REFERENCES sportsclub_facilities(id) ON DELETE CASCADE,
    member_id         UUID REFERENCES sportsclub_members(id) ON DELETE CASCADE,
    guest_name        TEXT, -- If booked by non-member
    guest_contact     TEXT,
    booking_date      DATE NOT NULL,
    start_time        TEXT NOT NULL,
    end_time          TEXT NOT NULL,
    status            TEXT NOT NULL DEFAULT 'Booked', -- Booked | Completed | Cancelled
    is_qr_booking     BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sportsclub_checkins (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    member_id         UUID NOT NULL REFERENCES sportsclub_members(id) ON DELETE CASCADE,
    checkin_time      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sportsclub_dues (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    member_id         UUID NOT NULL REFERENCES sportsclub_members(id) ON DELETE CASCADE,
    amount            NUMERIC NOT NULL DEFAULT 0,
    description       TEXT NOT NULL,
    due_date          DATE NOT NULL,
    is_paid           BOOLEAN NOT NULL DEFAULT false,
    paid_date         DATE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 2. WELLNESS CENTER VERTICAL
-- ============================================================================
CREATE TABLE IF NOT EXISTS wellness_therapists (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    specialty         TEXT,
    phone             TEXT,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wellness_rooms (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    type              TEXT, -- e.g., 'Massage', 'Sauna'
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wellness_treatments (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    category          TEXT,
    duration_minutes  INTEGER NOT NULL DEFAULT 60,
    price             NUMERIC NOT NULL DEFAULT 0,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wellness_treatment_products (
    id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    treatment_id        UUID NOT NULL REFERENCES wellness_treatments(id) ON DELETE CASCADE,
    inventory_item_id   UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity            NUMERIC NOT NULL DEFAULT 1,
    unit                TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wellness_appointments (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_name     TEXT NOT NULL,
    customer_contact  TEXT,
    therapist_id      UUID REFERENCES wellness_therapists(id) ON DELETE SET NULL,
    room_id           UUID REFERENCES wellness_rooms(id) ON DELETE SET NULL,
    treatment_id      UUID REFERENCES wellness_treatments(id) ON DELETE SET NULL,
    appointment_date  DATE NOT NULL,
    start_time        TEXT NOT NULL,  -- HH:MM
    end_time          TEXT,
    status            TEXT NOT NULL DEFAULT 'Booked', -- Booked | InProgress | Completed | NoShow | Cancelled
    notes             TEXT,
    is_qr_booking     BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wellness_packages (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    total_sessions    INTEGER,
    validity_days     INTEGER,
    price             NUMERIC NOT NULL DEFAULT 0,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wellness_package_redemptions (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    package_id        UUID NOT NULL REFERENCES wellness_packages(id) ON DELETE CASCADE,
    customer_contact  TEXT,
    appointment_id    UUID REFERENCES wellness_appointments(id) ON DELETE SET NULL,
    redeemed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wellness_client_notes (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_contact  TEXT NOT NULL,
    note_text         TEXT NOT NULL,
    created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 3. VENUE BOOKING VERTICAL
-- ============================================================================
CREATE TABLE IF NOT EXISTS venue_venues (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    capacity          INTEGER,
    base_price        NUMERIC NOT NULL DEFAULT 0,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venue_addon_services (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              TEXT NOT NULL, -- e.g., 'Catering', 'DJ', 'Decor'
    price             NUMERIC NOT NULL DEFAULT 0,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venue_bookings (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    venue_id          UUID REFERENCES venue_venues(id) ON DELETE SET NULL,
    customer_name     TEXT NOT NULL,
    customer_contact  TEXT,
    event_type        TEXT,
    booking_date      DATE NOT NULL,
    start_time        TEXT,
    end_time          TEXT,
    guest_count       INTEGER,
    status            TEXT NOT NULL DEFAULT 'Enquiry', -- Enquiry | Confirmed | Completed | Cancelled
    total_amount      NUMERIC NOT NULL DEFAULT 0,
    advance_paid      NUMERIC NOT NULL DEFAULT 0,
    is_qr_booking     BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venue_booking_addons (
    id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id          UUID NOT NULL REFERENCES venue_bookings(id) ON DELETE CASCADE,
    addon_service_id    UUID NOT NULL REFERENCES venue_addon_services(id) ON DELETE CASCADE,
    quantity            INTEGER NOT NULL DEFAULT 1,
    price_at_booking    NUMERIC NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venue_payments (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    booking_id        UUID NOT NULL REFERENCES venue_bookings(id) ON DELETE CASCADE,
    amount            NUMERIC NOT NULL,
    payment_type      TEXT NOT NULL, -- Advance | Balance | Refund
    payment_method    TEXT,
    payment_date      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- INDEXES & RLS (Applied to all)
-- ============================================================================
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
          AND (tablename LIKE 'sportsclub_%' OR tablename LIKE 'wellness_%' OR tablename LIKE 'venue_%')
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);

        -- Organization scoping policy
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = tbl AND column_name = 'organization_id') THEN
            EXECUTE format('
                DROP POLICY IF EXISTS "org members manage %1$s" ON %1$I;
                CREATE POLICY "org members manage %1$s" ON %1$I
                FOR ALL USING (organization_id = public.current_user_org_id())
                WITH CHECK (organization_id = public.current_user_org_id());
            ', tbl);
        END IF;

        -- Realtime publication
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I;', tbl);
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END LOOP;
END $$;
