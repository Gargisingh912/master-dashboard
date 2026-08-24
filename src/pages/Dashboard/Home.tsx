import PageMeta from "../../components/common/PageMeta";
import GreetingHeader from "./GreetingHeader";
import { useAuth } from "../../hooks/useAuth";

// Kitchen KPI widgets (existing)
import IncomingQrOrders from "../../components/ecommerce/Incomingqrorders";
import LiveOrdersKpiWidget from "../../components/ecommerce/LiveOrdersKpiWidget";
import QrKpiWidget from "../../components/ecommerce/QrKpiWidget";
import CouponKpiWidget from "../../components/ecommerce/CouponKpiWidget";
import InventoryKpiWidget from "../../components/ecommerce/InventoryKpiWidget";
import FinanceKpiWidget from "../../components/ecommerce/FinanceKpiWidget";
import HighestSellingDishes from "../../components/ecommerce/HighestSellingDishes";

// New vertical overview pages
import SalonOverview from "./SalonOverview";
import AcademyOverview from "../../components/academy/AcademyOverview";
import SportsClubOverview from "../SportsClub/Overview";
import WellnessOverview from "../Wellness/Overview";
import VenueOverview from "../VenueBooking/Overview";

export default function Home() {
  const { type } = useAuth();
  const vertical = (type || "kitchen").toLowerCase();

  if (vertical === "salon") {
    return (
      <>
        <PageMeta
          title="Salon Dashboard"
          description="Salon operations overview — appointments, revenue, staff"
        />
        <GreetingHeader />
        <SalonOverview />
      </>
    );
  }

  if (vertical.includes("academy") || vertical === "sports academy") {
    return (
      <>
        <PageMeta
          title="Academy Dashboard"
          description="Academy operations overview — fees, students, attendance"
        />
        <GreetingHeader />
        <AcademyOverview />
      </>
    );
  }

  if (vertical === "sports club") {
    return (
      <>
        <PageMeta title="Sports Club Dashboard" description="Sports Club overview" />
        <GreetingHeader />
        <SportsClubOverview />
      </>
    );
  }

  if (vertical === "wellness") {
    return (
      <>
        <PageMeta title="Wellness Dashboard" description="Wellness center overview" />
        <GreetingHeader />
        <WellnessOverview />
      </>
    );
  }

  if (vertical === "venue booking" || vertical === "venue") {
    return (
      <>
        <PageMeta title="Venue Booking Dashboard" description="Venue booking overview" />
        <GreetingHeader />
        <VenueOverview />
      </>
    );
  }

  // Default: Kitchen vertical
  return (
    <>
      <PageMeta
        title="Master-Dashboard"
        description="one stop solution for your data operations"
      />
      <GreetingHeader />

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-20">

        {/* Alerts / Full width pop-ins */}
        <div className="lg:col-span-12">
          <IncomingQrOrders />
        </div>

        {/* Left Column (Hero & List) */}
        <div className="lg:col-span-8 flex flex-col gap-4 md:gap-6">
          <LiveOrdersKpiWidget />
          <HighestSellingDishes />
        </div>

        {/* Right Column (Charts & Secondary KPIs) */}
        <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6">
          <FinanceKpiWidget />
          
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <QrKpiWidget />
            <CouponKpiWidget />
          </div>
          
          <InventoryKpiWidget />
        </div>
        
      </div>
    </>
  );
}