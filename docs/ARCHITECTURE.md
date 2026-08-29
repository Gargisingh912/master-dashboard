# Architecture

## Stack Overview
- **Frontend:** React 19, Vite, TailwindCSS (v4), React Router (v7).
- **Backend & Database:** Supabase (PostgreSQL), Supabase Edge Functions.
- **Push Notifications:** Firebase Cloud Messaging (FCM).
- **AI Integration:** Google Gemini API (used in Edge Functions for text embeddings and RAG search).

## Tables
- `organizations` - Multi-tenant core table defining the business (Kitchen, Salon, Sports Academy, etc.).
- `profiles` - User profiles linked 1:1 with `auth.users`, storing role and linked `organization_id`.
- `inventory_items` - General inventory items tracked per organization.
- `menu_items` - Specific food/beverage items available for ordering.
- `menu_ingredients` - Join table linking `menu_items` to `inventory_items` for inventory deduction.
- `orders` - Customer orders with totals, status, and discount details.
- `order_items` - Join table for items contained within an order.
- `expenses` - Organization-level expense tracking.
- `customers` - Global customer records upserted by contact number.
- `discount_coupons` - Tracks discount codes (from migration file).
- `sportsclub_membership_plans` - Plans available for sports club members.
- `sportsclub_members` - Individual members enrolled in a sports club.
- `sportsclub_facilities` - Bookable courts/facilities in a sports club.
- `sportsclub_facility_bookings` - Reservations of sports club facilities.
- `sportsclub_checkins` - Check-in logs for sports club members.
- `sportsclub_dues` - Tracking of unpaid dues for members.
- `wellness_therapists` - Therapists available for wellness bookings.
- `wellness_rooms` - Rooms used for wellness treatments.
- `wellness_treatments` - Catalog of treatments offered at wellness centers.
- `wellness_treatment_products` - Products consumed during a wellness treatment.
- `wellness_appointments` - Booked appointments for wellness treatments.
- `wellness_packages` - Prepaid bundles of wellness treatments.
- `wellness_package_redemptions` - Ledger tracking usage of wellness packages.
- `wellness_client_notes` - Historical treatment notes for wellness clients.
- `venue_venues` - Details of bookable event venues.
- `venue_addon_services` - Extra services (catering, decor) available for venues.
- `venue_bookings` - Bookings of event venues.
- `venue_booking_addons` - Addon services attached to a venue booking.
- `venue_payments` - Payment installments for venue bookings.
- `salon_staff` - Employees working at a salon.
- `salon_services` - Catalog of services offered at a salon.
- `salon_service_products` - Products consumed during a salon service.
- `salon_appointments` - Customer appointments for salon services.
- `salon_packages` - Bundled services sold upfront.
- `salon_package_redemptions` - Usage tracking of salon packages.
- `salon_bills` - Invoices for salon visits.
- `salon_bill_items` - Line items for salon bills.
- `academy_coaches` - Instructors teaching at a sports academy.
- `academy_batches` - Class batches scheduled in an academy.
- `academy_students` - Students enrolled in academy batches.
- `salon_staff_attendance` - Daily attendance records for salon staff.
- `academy_attendance` - Daily attendance records for academy students.
- `academy_fee_payments` - Record of fee payments by academy students.

## Multi-Tenant Model
The application employs a **row-level multi-tenant architecture**. All data resides in a single database schema. 
- The `organizations` table uses the `type` column to define the specific vertical (e.g., Kitchen, Salon, Sports Academy).
- Every core table includes an `organization_id` foreign key.
- Row Level Security (RLS) policies strictly enforce tenant isolation using a custom PostgreSQL function `public.current_user_org_id()` that extracts the `organization_id` from the current authenticated user's `profile`.
- Superadmins are handled via a specific check on `profiles.role`.

## Auth Flow
1. User submits signup credentials.
2. Supabase Auth creates a new user record.
3. A PostgreSQL trigger (`on_auth_user_created`) fires on the `auth.users` table.
4. The trigger automatically creates a corresponding record in the `profiles` table with the default role of `'owner'`.
5. The user completes onboarding, which creates an `organizations` record and updates the `profiles.organization_id`.

## Edge Functions List
- `push` - Triggered via Database Webhook. Fetches a user's FCM token and uses Google Auth (service account) to dispatch Firebase push notifications for new orders.
- `embed-documents` - Loops through DB tables (orders, menu_items, inventory, customers), converts rows to plain English strings, fetches embeddings from the Gemini API, and upserts them into a `documents` vector table.
- `search-and-answer` - Provides Retrieval-Augmented Generation (RAG). It receives a user question, gets a query embedding from Gemini, performs a vector search using `match_documents` RPC, and passes context to Gemini 2.5 Flash to generate an answer.
- `invite-admin` - (Directory exists but is currently empty/unimplemented in the codebase).

## n8n Workflows List
- **No n8n workflows exist natively in the codebase.**
- The system includes an `'n8n_automations'` string in the permissions config (`src/config/permission.ts`), indicating that this feature is either planned or handled externally via Webhooks without code checked into this repository.

## Environment Variables List
- **Supabase:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (Used in edge functions)
- **Firebase:**
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_FIREBASE_VAPID_KEY`
- **Gemini:**
  - `GEMINI_API_KEY` (Used in edge functions for embedding and RAG generation)
