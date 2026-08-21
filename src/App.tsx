import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Docs from "./pages/Docs";
import Support from "./pages/Support";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import Orders from "./pages/Tables/Orders";
import Customer from "./pages/Tables/Customer";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import Menu from "./pages/Dashboard/Menu";
import Inventory from "./pages/Dashboard/Inventory";
import Finance from "./pages/Dashboard/Finance";
import DiscountCoupons from "./pages/Dashboard/DiscountCoupons";
import LandingPage from "./pages/public/LandingPage";
import RegisterPage from "./pages/public/RegisterPage";
import LoginPage from "./pages/public/LoginPage";
import FreeTrialPage from "./pages/public/FreeTrialPage";
import RequireSuperAdmin from "./components/RequireSuperAdmin";
import SuperAdminPage from "./components/SuperAdminPage";
import QRCodePage from "./pages/Dashboard/QRCodePage";
import KitchenOrderPage from "./pages/public/KitchenOrderPage";
import SalonOrderPage from "./pages/public/SalonOrderPage";
import SalonBookingPage from "./pages/public/SalonBookingPage"; // legacy alias

// Salon pages
import SalonAppointments from "./pages/salon/SalonAppointments";
import SalonServices from "./pages/salon/SalonServices";
import SalonStaff from "./pages/salon/SalonStaff";
import SalonPackages from "./pages/salon/SalonPackages";
import SalonBilling from "./pages/salon/SalonBilling";

// Academy pages
import AcademyCoaches from "./pages/academy/AcademyCoaches";
import AcademyBatches from "./pages/academy/AcademyBatches";
import AcademyStudents from "./pages/academy/AcademyStudents";
import AcademyAttendance from "./pages/academy/AcademyAttendance";
import AcademyFees from "./pages/academy/AcademyFees";


export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/free-trial" element={<FreeTrialPage />} />
          {/* Kitchen ordering (QR code → food order) */}
          <Route path="/order/:organizationId" element={<KitchenOrderPage />} />
          <Route path="/order/:slug/:organizationId" element={<KitchenOrderPage />} />

          {/* Salon booking (QR code → appointment) */}
          <Route path="/salon/:organizationId" element={<SalonOrderPage />} />
          <Route path="/salon/:slug/:organizationId" element={<SalonOrderPage />} />

          {/* Legacy aliases — keep so existing QR codes keep working */}
          <Route path="/salon-booking/:organizationId" element={<SalonBookingPage />} />
          <Route path="/salon-booking/:slug/:organizationId" element={<SalonBookingPage />} />

          {/* Superadmin — standalone, guarded */}
          <Route element={<RequireSuperAdmin />}>
            <Route path="/superadmin" element={<SuperAdminPage />} />
          </Route>

          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            {/* Shared / vertical-dispatched dashboard */}
            <Route path="/dashboard" element={<Home />} />
            <Route path="/dashboard/:type" element={<Home />} />

            {/* Kitchen vertical */}
            <Route path="/menu" element={<Menu />} />
            <Route path="/qr-code" element={<QRCodePage />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/coupons" element={<DiscountCoupons />} />

            {/* Salon vertical */}
            <Route path="/salon/appointments" element={<SalonAppointments />} />
            <Route path="/salon/services" element={<SalonServices />} />
            <Route path="/salon/staff" element={<SalonStaff />} />
            <Route path="/salon/packages" element={<SalonPackages />} />
            <Route path="/salon/billing" element={<SalonBilling />} />
            {/* Salon also reuses /inventory and /customer-tables */}

            {/* Academy vertical */}
            <Route path="/academy/coaches" element={<AcademyCoaches />} />
            <Route path="/academy/batches" element={<AcademyBatches />} />
            <Route path="/academy/students" element={<AcademyStudents />} />
            <Route path="/academy/attendance" element={<AcademyAttendance />} />
            <Route path="/academy/fees" element={<AcademyFees />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/support" element={<Support />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/orders-tables" element={<Orders />} />
            <Route path="/customer-tables" element={<Customer />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
