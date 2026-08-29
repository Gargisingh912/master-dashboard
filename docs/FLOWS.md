# System Flows

## 1. QR Order Flow (Kitchen)
1. Customer visits physical table and scans a QR code.
2. QR code directs browser to `/order/:organizationId` or `/order/:slug/:organizationId`.
3. App fetches available menu items from `menu_items` where `is_available = true` (allowed via public RLS).
4. Customer adds items to cart and enters basic contact info.
5. Customer submits order.
6. Record inserted into `orders` and `order_items` (allowed via public insert RLS).
7. Customer is shown an order tracking view where they can monitor status.

## 2. Signup Flow
1. User visits `/signup` and submits email/password.
2. Supabase Auth creates the user in `auth.users`.
3. The database trigger `on_auth_user_created` fires automatically.
4. The trigger inserts a corresponding row into `public.profiles` setting the role to `'owner'`.
5. Frontend pushes user to organization setup.
6. User provides business details, creating an `organizations` record.
7. User's `profiles.organization_id` is updated to link them to their new business workspace.

## 3. Kitchen Dashboard Live Update Flow
1. Staff logs into the Master Dashboard.
2. Dashboard mounts and subscribes to Supabase Realtime (`postgres_changes` on the `orders` table).
3. A customer places an order (see Flow 1).
4. Realtime subscription catches the `INSERT` event.
5. The React state updates, rendering the new order instantly without a refresh.
6. Staff marks the order as "Delivered".
7. (Optional configuration): The system calls the `deduct_inventory_for_order` RPC, reducing the `quantity` in `inventory_items` based on the recipe in `menu_ingredients`.

## 4. Push Notification Flow
1. Customer places an order via the QR interface.
2. Supabase PostgreSQL accepts the insert to the `orders` table.
3. A Database Webhook configured on `INSERT` to `orders` fires.
4. The webhook sends the payload to the `push` Supabase Edge Function.
5. The edge function fetches the admin's `fcm_token` from the `profiles` table.
6. The edge function generates an OAuth access token using the Firebase Service Account JSON.
7. The edge function sends an HTTP POST request to FCM's v1 API.
8. The mobile device receives the high-priority notification (with sound) alerting staff.

## 5. Subscription/Trial Flow
1. Upon completing registration (Flow 2), the newly created `organizations` record receives a default `plan` of `'trial'`.
2. The system calculates and sets `trial_ends` (e.g., 14 days from creation).
3. Whenever the user navigates the dashboard, app logic checks if the current date exceeds `trial_ends`.
4. If the trial is expired, the user's access to premium modules is restricted.
5. The user is redirected to the `/free-trial` page to prompt an upgrade to `standard`, `premium`, or `enterprise` plans.
