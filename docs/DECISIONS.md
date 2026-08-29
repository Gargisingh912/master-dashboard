# Implementation Decisions

## RLS Org ID Function
- **Problem:** Writing Row Level Security (RLS) policies directly against `auth.uid()` joining to `profiles` can lead to recursive loops or "column does not exist" exceptions at runtime if schema updates asynchronously.
- **Options:** 
  - Subquery in every policy: `(SELECT organization_id FROM profiles WHERE id = auth.uid())`
  - Set a JWT claim containing the `organization_id`.
  - Create a stable PL/pgSQL function to abstract it.
- **Decision:** Use a PL/pgSQL helper function `public.current_user_org_id()`.
- **Why:** The function body is validated at runtime rather than creation time. It provides a clean, abstract, and safe way to enforce tenant isolation across dozens of policies while avoiding edge cases where the `profiles` table might not have been fully hydrated yet.

## Single Database for Multiple Verticals
- **Problem:** The platform supports wildly different verticals (Kitchens, Salons, Venues), each requiring unique schema structures.
- **Options:** 
  - Distinct database per tenant.
  - Distinct Postgres schema per vertical.
  - Single public schema with all tables, using a `type` column in `organizations`.
- **Decision:** Single public schema with all tables. Verticals are differentiated via the `type` column in the `organizations` table.
- **Why:** Reduces infrastructure complexity, makes migrations centralized, and allows sharing core tables (profiles, customers, expenses) across all verticals.

## Backward Compatibility for QR Codes
- **Problem:** Route paths for salons were reorganized to make the codebase cleaner, which would break existing printed QR codes in the real world.
- **Options:** 
  - Force users to reprint QR codes.
  - Handle redirects on the server.
  - Keep legacy routes in the React Router.
- **Decision:** Kept legacy route aliases in `App.tsx` (e.g., `Route path="/salon-booking/:organizationId" element={<SalonBookingPage />}`).
- **Why:** This ensures physical QR codes already deployed by businesses continue to function perfectly without any disruption.

## Push Notification Architecture
- **Problem:** Need to alert staff reliably when a new order is placed by a customer.
- **Options:** 
  - Client-side trigger (React calls FCM).
  - Supabase Realtime catching the event on the frontend and showing a toast.
  - Database webhook triggering an Edge Function.
- **Decision:** Supabase Database Webhook triggering the `push` Edge Function, which authenticates with FCM.
- **Why:** Decouples notification delivery from the client application. Even if the dashboard is closed, the webhook fires asynchronously on the backend insert, ensuring the mobile device receives the high-priority push notification.

## Idempotent Database Migrations
- **Problem:** Database scripts might be executed multiple times accidentally or as part of CI/CD, potentially crashing if resources already exist.
- **Options:** 
  - Strict migration tracking tools (like Prisma or Flyway).
  - Defensive SQL scripting.
- **Decision:** Every SQL statement uses `IF NOT EXISTS`, `CREATE OR REPLACE`, or `DO $$ BEGIN ... EXCEPTION` blocks.
- **Why:** Allows developers to copy-paste and run the entire `schema.sql` file repeatedly in the Supabase SQL Editor safely without raising errors or dropping existing data.

## Android Notification Channels
- **Problem:** Android requires notification channels for high-priority alerts with sound, but FCM's v1 API ignores top-level `notification.sound`.
- **Options:** 
  - Ignore sound on Android.
  - Use legacy FCM API.
  - Explicitly define an Android payload config.
- **Decision:** Implemented an explicit `android` object in the FCM payload with `channel_id: 'orders'` and `sound: 'default'`.
- **Why:** Guarantees that restaurant staff hear an auditory ping when an order arrives, which is critical for fast-paced kitchen environments.
