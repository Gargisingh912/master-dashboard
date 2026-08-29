# Features

The Master-Dashboard supports multiple distinct business verticals (niches) managed through a single platform. Below is the breakdown of features by niche.

## Kitchen & Restaurant
- **Menu Management:** Admins define food items, categories, and prices.
- **Inventory Tracking:** Tracks raw ingredients and uses join tables (`menu_ingredients`) to deduct stock via RPC when orders are delivered.
- **QR Ordering:** Customers scan QR codes to view `is_available` menu items and place orders directly.
- **Finance & Discount Coupons:** Logs business expenses and manages discount codes.
- **Tables Used:** `menu_items`, `inventory_items`, `menu_ingredients`, `orders`, `order_items`, `expenses`, `discount_coupons`.
- **Key Files:** `src/pages/Dashboard/Menu.tsx`, `src/pages/Dashboard/Inventory.tsx`, `src/pages/public/KitchenOrderPage.tsx`.

## Salon & Spa
- **Service & Staff Management:** Defines salon services (e.g., haircuts) and employee details.
- **Appointment Booking:** Allows public users and admins to book time slots via a QR interface.
- **Packages & Billing:** Sells bundled service packages and handles complex invoicing.
- **Tables Used:** `salon_services`, `salon_staff`, `salon_appointments`, `salon_packages`, `salon_bills`.
- **Key Files:** `src/pages/salon/SalonAppointments.tsx`, `src/pages/salon/SalonServices.tsx`, `src/pages/public/SalonOrderPage.tsx`.

## Sports Academy
- **Batches & Coaches:** Groups students into time-based batches assigned to specific coaches.
- **Attendance Tracking:** Logs daily student and coach presence.
- **Fee Management:** Records student tuition payments.
- **Tables Used:** `academy_coaches`, `academy_batches`, `academy_students`, `academy_attendance`, `academy_fee_payments`.
- **Key Files:** `src/pages/academy/AcademyBatches.tsx`, `src/pages/academy/AcademyStudents.tsx`, `src/pages/academy/AcademyAttendance.tsx`.

## Sports Club
- **Member Directory:** Manages recurring memberships and plans.
- **Facility Bookings:** Lets users reserve specific courts or amenities.
- **Check-ins:** Monitors live usage of the club.
- **Tables Used:** `sportsclub_members`, `sportsclub_membership_plans`, `sportsclub_facilities`, `sportsclub_facility_bookings`.
- **Key Files:** `src/pages/SportsClub/Members.tsx`, `src/pages/SportsClub/Facilities.tsx`, `src/pages/public/SportsClubBookingPage.tsx`.

## Wellness Center
- **Treatment Catalog:** Defines specialized wellness treatments and products consumed per session.
- **Appointments & Rooms:** Schedules sessions mapping therapists to specific treatment rooms.
- **Client Notes:** Keeps a historical record of treatments and observations for individual clients.
- **Tables Used:** `wellness_treatments`, `wellness_therapists`, `wellness_rooms`, `wellness_appointments`, `wellness_client_notes`.
- **Key Files:** `src/pages/Wellness/Treatments.tsx`, `src/pages/Wellness/Appointments.tsx`, `src/pages/public/WellnessBookingPage.tsx`.

## Venue Booking
- **Venue & Addon Offerings:** Configures main venue spaces and extra services (catering, decorations).
- **Event Reservations:** Books venues for specific date ranges.
- **Payment Installments:** Tracks multiple payment stages for expensive events.
- **Tables Used:** `venue_venues`, `venue_addon_services`, `venue_bookings`, `venue_payments`.
- **Key Files:** `src/pages/VenueBooking/Bookings.tsx`, `src/pages/VenueBooking/Settings.tsx`, `src/pages/public/VenueEnquiryPage.tsx`.

## System-Wide Features
- **AI Search & RAG:** Users can query their organization's data in plain English.
- **Push Notifications:** Firebase FCM alerts for new orders.
- **Edge Functions:** `push`, `embed-documents`, `search-and-answer`.
- **Known Issues:** The `invite-admin` edge function folder exists but is empty. The `discount_coupons` table is created in a migration but lacks explicit RLS definition in `schema.sql`.
