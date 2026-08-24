import { useState } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import {
  LayoutDashboard, UtensilsCrossed, ChefHat, Banknote, QrCode, Users, ArrowRight,
  PlusCircle, ImagePlus, BellRing, Tag, VolumeX, Leaf, 
  Bell, BarChart2, Sparkles, Scissors, Calendar, Package, Receipt,
  BookOpen, Heart, Activity, MapPin, PartyPopper
} from "lucide-react";

// ── Reusable sub-components ─────────────────────────────────────────────────

function StepCard({ number, icon, iconBg, title, children }: any) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] lg:p-8">
      <div className="flex items-start gap-5">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            {number ? `${number}. ` : ""}{title}
          </h2>
          {children}
        </div>
      </div>
    </section>
  );
}

function FeaturePill({ label, color = "brand" }: any) {
  const map: any = {
    brand: "bg-brand-50 text-brand-600 border-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-900/40",
    green: "bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-900/30",
    orange: "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-900/30",
    purple: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-900/30",
    red: "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-900/30",
  };
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[color] || map.brand}`}>
      {label}
    </span>
  );
}

function InfoBox({ icon, title, children }: any) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
      <div className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500">{icon}</div>
      <div>
        <h4 className="font-semibold text-gray-800 dark:text-white mb-1">{title}</h4>
        <div className="text-sm text-gray-600 dark:text-gray-400">{children}</div>
      </div>
    </div>
  );
}

function TipBox({ children }: any) {
  return (
    <div className="mt-4 flex gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-4 dark:border-brand-900/40 dark:bg-brand-500/5">
      <Sparkles size={18} className="mt-0.5 shrink-0 text-brand-500" />
      <div className="text-sm text-brand-700 dark:text-brand-300">{children}</div>
    </div>
  );
}

// ── Vertical Docs Components ──────────────────────────────────────────────────

function KitchenDocs() {
  return (
    <div className="grid gap-8">
      <StepCard number={1} icon={<LayoutDashboard size={28} />} iconBg="bg-blue-50 text-blue-500 dark:bg-blue-500/10" title="The Overview Dashboard">
        <p className="text-gray-600 dark:text-gray-400 mb-6">When you log in, you land on the <strong>Overview Dashboard</strong> — your daily command center.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoBox icon={<BellRing size={18} />} title="Live Order Status — Today Only">
            The KPI cards at the top show <strong>only today's</strong> order counts for Placed, Preparing, and Delivered statuses. Numbers reset every midnight so you always see fresh data.
          </InfoBox>
          <InfoBox icon={<ArrowRight size={18} />} title="Inventory Alerts">
            Instantly see if any ingredients are running critically low based on your linked menu items — with a clear warning before you run out.
          </InfoBox>
        </div>
      </StepCard>

      <StepCard number={2} icon={<UtensilsCrossed size={28} />} iconBg="bg-orange-50 text-orange-500 dark:bg-orange-500/10" title="Setting Up Your Menu & Inventory">
        <p className="text-gray-600 dark:text-gray-400 mb-6">Go to the <strong>Menu Management</strong> tab to add your dishes. Link each dish to raw inventory items so stock deducts automatically when an order is delivered!</p>
        <div className="flex flex-col gap-4">
          <InfoBox icon={<PlusCircle size={18} />} title="Step A: Add Raw Ingredients (Inventory)">
            Before adding a dish, add your ingredients (e.g., Flour, Cheese) in the <strong>Inventory</strong> tab.
          </InfoBox>
          <InfoBox icon={<ImagePlus size={18} />} title="Step B: Create a Dish & Upload an Image">
            Click <strong>"+ Add New Dish"</strong>, enter the price, select the ingredients it uses, and upload a photo.
          </InfoBox>
          <InfoBox icon={<Leaf size={18} />} title="Step C: Set Diet Type">
            When adding or editing a dish, you can now select its <strong>Diet Type</strong> (Veg, Non-Veg, Vegan).
          </InfoBox>
        </div>
      </StepCard>

      <StepCard number={3} icon={<QrCode size={28} />} iconBg="bg-purple-50 text-purple-500 dark:bg-purple-500/10" title="Generating QR Codes">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Go to the <strong>QR Code</strong> tab to generate a unique QR code for every table in your restaurant.</p>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-300">
          <ul className="list-disc pl-5 space-y-2">
            <li>Print these codes and place them on your tables.</li>
            <li>Customers scan them with their phone camera — <strong>no app needed!</strong></li>
            <li>They see your digital menu (with photos), and can place orders directly to the kitchen.</li>
          </ul>
        </div>
      </StepCard>

      <StepCard number={4} icon={<ChefHat size={28} />} iconBg="bg-red-50 text-red-500 dark:bg-red-500/10" title="Live Kitchen Orders & Alerts">
        <p className="text-gray-600 dark:text-gray-400 mb-6">Orders pop up in your <strong>Orders</strong> tab with a loud alert tone that rings for <strong>up to 5 minutes</strong>.</p>
        <div className="flex flex-col gap-3">
          <InfoBox icon={<Bell size={18} />} title="Notification Click → Orders Tab">
            Click the <strong>notification bell</strong> in the header to jump directly to the Orders tab.
          </InfoBox>
          <InfoBox icon={<VolumeX size={18} />} title="Silent Mode">
            Use the Silent Mode toggle next to the theme button in the top header if you want to mute the 5-minute alarm.
          </InfoBox>
        </div>
      </StepCard>

      <StepCard number={5} icon={<Tag size={28} />} iconBg="bg-pink-50 text-pink-500 dark:bg-pink-500/10" title="Discount Coupons">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Go to the <strong>Discount Coupons</strong> tab to create and manage percentage-based discount codes.</p>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <InfoBox icon={<PlusCircle size={16} />} title="Creating a Coupon">
            Set a unique code, a discount percentage, usage limit, and optional dates.
          </InfoBox>
          <InfoBox icon={<BarChart2 size={16} />} title="Tracking Usage">
            Each coupon card shows a usage progress bar. Customers enter these on the QR page.
          </InfoBox>
        </div>
      </StepCard>
    </div>
  );
}

function SalonDocs() {
  return (
    <div className="grid gap-8">
      <StepCard number={1} icon={<LayoutDashboard size={28} />} iconBg="bg-blue-50 text-blue-500 dark:bg-blue-500/10" title="Salon Overview Dashboard">
        <p className="text-gray-600 dark:text-gray-400 mb-6">Your daily command center for managing appointments, revenue, and staff.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoBox icon={<Calendar size={18} />} title="Today's Pipeline">
            Track appointments moving from Booked → In Progress → Completed.
          </InfoBox>
          <InfoBox icon={<Banknote size={18} />} title="Revenue Tracking">
            Instantly see today's collected revenue from all completed salon sessions.
          </InfoBox>
        </div>
      </StepCard>

      <StepCard number={2} icon={<Scissors size={28} />} iconBg="bg-orange-50 text-orange-500 dark:bg-orange-500/10" title="Services & Packages">
        <p className="text-gray-600 dark:text-gray-400 mb-6">Manage your offerings and combo packages.</p>
        <div className="flex flex-col gap-4">
          <InfoBox icon={<Scissors size={18} />} title="Salon Services">
            Define categories (e.g. Hair, Skin), durations, and prices for all services.
          </InfoBox>
          <InfoBox icon={<Package size={18} />} title="Packages">
            Bundle multiple services together (e.g. Bridal Package) at a discounted rate.
          </InfoBox>
        </div>
      </StepCard>

      <StepCard number={3} icon={<Users size={28} />} iconBg="bg-purple-50 text-purple-500 dark:bg-purple-500/10" title="Staff & Appointments">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Manage your workforce and their schedules.</p>
        <div className="flex flex-col gap-4">
          <InfoBox icon={<Users size={18} />} title="Staff Directory">
            Add stylists and therapists, define their specialities, and track their active status.
          </InfoBox>
          <InfoBox icon={<Calendar size={18} />} title="Appointments Calendar">
            Book clients into specific time slots, assigning them to a staff member and service.
          </InfoBox>
        </div>
      </StepCard>

      <StepCard number={4} icon={<QrCode size={28} />} iconBg="bg-pink-50 text-pink-500 dark:bg-pink-500/10" title="QR Public Booking Page">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Customers can book their own appointments via a public link or QR code.</p>
        <TipBox>The QR link automatically fetches your active services and creates appointments in your pipeline.</TipBox>
      </StepCard>
    </div>
  );
}

function AcademyDocs() {
  return (
    <div className="grid gap-8">
      <StepCard number={1} icon={<LayoutDashboard size={28} />} iconBg="bg-blue-50 text-blue-500 dark:bg-blue-500/10" title="Academy Overview">
        <p className="text-gray-600 dark:text-gray-400 mb-6">Track your students, fees, and batch schedules.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoBox icon={<Users size={18} />} title="Student Count">
            Monitor total active students across all batches.
          </InfoBox>
          <InfoBox icon={<Banknote size={18} />} title="Pending Fees">
            Easily track how much fee collection is currently pending.
          </InfoBox>
        </div>
      </StepCard>

      <StepCard number={2} icon={<BookOpen size={28} />} iconBg="bg-orange-50 text-orange-500 dark:bg-orange-500/10" title="Batches & Students">
        <p className="text-gray-600 dark:text-gray-400 mb-6">Organize your academy into manageable groups.</p>
        <div className="flex flex-col gap-4">
          <InfoBox icon={<BookOpen size={18} />} title="Batch Scheduling">
            Create batches (e.g. Morning Yoga, Evening Karate) with specific timings and coaches.
          </InfoBox>
          <InfoBox icon={<Users size={18} />} title="Student Profiles">
            Register students and assign them to specific batches.
          </InfoBox>
        </div>
      </StepCard>

      <StepCard number={3} icon={<Receipt size={28} />} iconBg="bg-green-50 text-green-500 dark:bg-green-500/10" title="Fee Management & Attendance">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Financial tracking and class participation.</p>
        <div className="flex flex-col gap-4">
          <InfoBox icon={<Banknote size={18} />} title="Fees">
            Generate fee records for students and mark them as Paid or Pending.
          </InfoBox>
          <InfoBox icon={<Activity size={18} />} title="Attendance">
            Log daily attendance (Present, Absent, Late) for students by batch.
          </InfoBox>
        </div>
      </StepCard>
    </div>
  );
}

function WellnessDocs() {
  return (
    <div className="grid gap-8">
      <StepCard number={1} icon={<LayoutDashboard size={28} />} iconBg="bg-blue-50 text-blue-500 dark:bg-blue-500/10" title="Wellness Center Dashboard">
        <p className="text-gray-600 dark:text-gray-400 mb-6">Manage your spa, wellness clinic, or holistic center.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoBox icon={<Activity size={18} />} title="Appointments Pipeline">
            Track daily appointments from Booked to Completed.
          </InfoBox>
          <InfoBox icon={<Users size={18} />} title="Staff & Revenue">
            Monitor active therapists and total collected revenue.
          </InfoBox>
        </div>
      </StepCard>

      <StepCard number={2} icon={<Heart size={28} />} iconBg="bg-orange-50 text-orange-500 dark:bg-orange-500/10" title="Treatments & Settings">
        <p className="text-gray-600 dark:text-gray-400 mb-6">Configure everything you offer in one place.</p>
        <div className="flex flex-col gap-4">
          <InfoBox icon={<Heart size={18} />} title="Treatments & Packages">
            Add massages, therapies, and bundled session packages with durations and prices.
          </InfoBox>
          <InfoBox icon={<Users size={18} />} title="Therapists & Rooms">
            Manage your staff directory and configure bookable treatment rooms.
          </InfoBox>
        </div>
      </StepCard>

      <StepCard number={3} icon={<Calendar size={28} />} iconBg="bg-purple-50 text-purple-500 dark:bg-purple-500/10" title="Appointments & Bookings">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Schedule clients and assign resources.</p>
        <div className="flex flex-col gap-4">
          <InfoBox icon={<Calendar size={18} />} title="Internal Booking">
            Create an appointment by selecting the client, treatment, therapist, and room. End times calculate automatically.
          </InfoBox>
          <InfoBox icon={<QrCode size={18} />} title="Public QR Booking Page">
            Share your custom link for clients to self-book treatments online.
          </InfoBox>
        </div>
      </StepCard>
    </div>
  );
}

function SportsClubDocs() {
  return (
    <div className="grid gap-8">
      <StepCard number={1} icon={<LayoutDashboard size={28} />} iconBg="bg-blue-50 text-blue-500 dark:bg-blue-500/10" title="Sports Club Dashboard">
        <p className="text-gray-600 dark:text-gray-400 mb-6">The command center for your sports facilities and members.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoBox icon={<Users size={18} />} title="Member KPIs">
            Track active members and recent signups.
          </InfoBox>
          <InfoBox icon={<Calendar size={18} />} title="Facility Usage">
            Monitor upcoming facility bookings for the day.
          </InfoBox>
        </div>
      </StepCard>

      <StepCard number={2} icon={<MapPin size={28} />} iconBg="bg-orange-50 text-orange-500 dark:bg-orange-500/10" title="Facilities & Members">
        <p className="text-gray-600 dark:text-gray-400 mb-6">Manage your infrastructure and your community.</p>
        <div className="flex flex-col gap-4">
          <InfoBox icon={<MapPin size={18} />} title="Facilities Configuration">
            Add courts, pitches, pools, or halls. Set hourly rates for rentals.
          </InfoBox>
          <InfoBox icon={<Users size={18} />} title="Member Management">
            Register members, track their join dates, and manage their status.
          </InfoBox>
        </div>
      </StepCard>

      <StepCard number={3} icon={<Calendar size={28} />} iconBg="bg-purple-50 text-purple-500 dark:bg-purple-500/10" title="Bookings & Reservations">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Track facility usage.</p>
        <div className="flex flex-col gap-4">
          <InfoBox icon={<Calendar size={18} />} title="Internal Booking Calendar">
            Reserve facilities for members, specifying start and end times.
          </InfoBox>
          <InfoBox icon={<QrCode size={18} />} title="Public QR Booking">
            Allow users to browse facilities and request a booking time via your public page.
          </InfoBox>
        </div>
      </StepCard>
    </div>
  );
}

function VenueBookingDocs() {
  return (
    <div className="grid gap-8">
      <StepCard number={1} icon={<LayoutDashboard size={28} />} iconBg="bg-blue-50 text-blue-500 dark:bg-blue-500/10" title="Venue Booking Dashboard">
        <p className="text-gray-600 dark:text-gray-400 mb-6">Manage event spaces, enquiries, and financial balances.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoBox icon={<Activity size={18} />} title="Pipeline Overview">
            Track leads from New Enquiries → Confirmed Events → Completed.
          </InfoBox>
          <InfoBox icon={<Banknote size={18} />} title="Outstanding Balance">
            Instantly see total amounts collected vs. balances pending on confirmed events.
          </InfoBox>
        </div>
      </StepCard>

      <StepCard number={2} icon={<MapPin size={28} />} iconBg="bg-orange-50 text-orange-500 dark:bg-orange-500/10" title="Venues & Addons Settings">
        <p className="text-gray-600 dark:text-gray-400 mb-6">Configure your event spaces and extras.</p>
        <div className="flex flex-col gap-4">
          <InfoBox icon={<MapPin size={18} />} title="Venues">
            Add halls, lawns, or conference rooms with capacity limits and base prices.
          </InfoBox>
          <InfoBox icon={<Package size={18} />} title="Add-on Services">
            Configure extra services like Catering, Decoration, or AV Equipment with fixed prices.
          </InfoBox>
        </div>
      </StepCard>

      <StepCard number={3} icon={<PartyPopper size={28} />} iconBg="bg-purple-50 text-purple-500 dark:bg-purple-500/10" title="Bookings Pipeline & Enquiries">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Move clients through the booking process.</p>
        <div className="flex flex-col gap-4">
          <InfoBox icon={<Calendar size={18} />} title="Pipeline Management">
            Convert enquiries to confirmed bookings, assign a venue, select add-ons, and record advance payments.
          </InfoBox>
          <InfoBox icon={<QrCode size={18} />} title="Public Enquiry Page">
            Share your QR link so prospective clients can send event enquiries directly into your dashboard.
          </InfoBox>
        </div>
      </StepCard>
    </div>
  );
}


// ── Main Page ────────────────────────────────────────────────────────────────

export default function Docs() {
  const [activeTab, setActiveTab] = useState<"kitchen" | "salon" | "academy" | "wellness" | "sportsclub" | "venue">("kitchen");

  const tabs = [
    { id: "kitchen", label: "Kitchen & Restaurant" },
    { id: "salon", label: "Salon & Spa" },
    { id: "academy", label: "Academy & Education" },
    { id: "wellness", label: "Wellness Center" },
    { id: "sportsclub", label: "Sports Club" },
    { id: "venue", label: "Venue Booking" },
  ];

  return (
    <>
      <PageMeta
        title="Walkthrough & Docs | Dashboard"
        description="Complete walkthrough of your Master Dashboard — all features explained."
      />
      <PageBreadcrumb pageTitle="System Walkthrough & Documentation" />

      <div className="mx-auto max-w-5xl space-y-8 pb-20">

        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-8 text-white shadow-theme-lg">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <FeaturePill label="All Verticals Included" color="green" />
              <span className="text-brand-200 text-xs font-medium">Select your vertical below</span>
            </div>
            <h1 className="text-3xl font-bold mb-4">Master Documentation</h1>
            <p className="text-brand-100 text-lg leading-relaxed">
              This system automates your entire business. Select your vertical below to view the dedicated documentation and learn how to master every feature of your dashboard.
            </p>
          </div>
          <BookOpen className="absolute -bottom-10 -right-10 h-64 w-64 text-brand-600 opacity-40" />
        </div>

        {/* Vertical Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Content */}
        <div>
          {activeTab === "kitchen" && <KitchenDocs />}
          {activeTab === "salon" && <SalonDocs />}
          {activeTab === "academy" && <AcademyDocs />}
          {activeTab === "wellness" && <WellnessDocs />}
          {activeTab === "sportsclub" && <SportsClubDocs />}
          {activeTab === "venue" && <VenueBookingDocs />}
        </div>

        {/* Footer note */}
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center mt-12">
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Have questions or need a feature? Contact your system administrator or reach out via the <strong>Support</strong> tab.
          </p>
        </div>

      </div>
    </>
  );
}
