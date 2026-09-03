import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { LayoutDashboard, Calendar, Scissors, Users, Package, Receipt, User, BookOpen } from "lucide-react";

import {
  BoxIcon,
  ChatIcon,
  ChevronDownIcon,
  DollarLineIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  TableIcon,
  UserCircleIcon,
  DocsIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { supabase } from "../config/supabase";
import { useAuth } from "../hooks/useAuth";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

// ── Kitchen nav (existing) ───────────────────────────────────────────────────
const kitchenNavItems: NavItem[] = [
  { icon: <GridIcon />, name: "Overview", path: "/dashboard/kitchen" },
  { icon: <BoxIcon />, name: "Orders", path: "/orders-tables" },
  { icon: <ListIcon />, name: "Menu", path: "/menu" },
  { icon: <ListIcon />, name: "QR Code", path: "/qr-code" },
  { icon: <TableIcon />, name: "Inventory", path: "/inventory" },
  { icon: <DollarLineIcon />, name: "Finance", path: "/finance" },
  { icon: <UserCircleIcon />, name: "Customers", path: "/customer-tables" },
  { icon: <UserCircleIcon />, name: "Discount Coupons", path: "/coupons" },
  { icon: <Calendar size={20} strokeWidth={2} />, name: "Calendar & Tasks", path: "/calendar" },
  { icon: <ChatIcon />, name: "Talk to your Data!!", path: "/blank" },
  { icon: <DocsIcon />, name: "Docs", path: "/docs" },
];

// ── Salon nav ────────────────────────────────────────────────────────────────
const salonNavItems: NavItem[] = [
  { icon: <LayoutDashboard size={20} strokeWidth={2} />, name: "Overview", path: "/dashboard" },
  { icon: <Calendar size={20} strokeWidth={2} />, name: "Appointments", path: "/salon/appointments" },
  { icon: <Scissors size={20} strokeWidth={2} />, name: "Services", path: "/salon/services" },
  { icon: <Users size={20} strokeWidth={2} />, name: "Staff", path: "/salon/staff" },
  { icon: <Package size={20} strokeWidth={2} />, name: "Packages", path: "/salon/packages" },
  { icon: <Receipt size={20} strokeWidth={2} />, name: "Billing", path: "/salon/billing" },
  { icon: <User size={20} strokeWidth={2} />, name: "Customers", path: "/customer-tables" },
  { icon: <ListIcon />, name: "QR Code", path: "/qr-code" },
  { icon: <Calendar size={20} strokeWidth={2} />, name: "Calendar & Tasks", path: "/calendar" },
  { icon: <BookOpen size={20} strokeWidth={2} />, name: "Docs", path: "/docs" },
];

// ── Academy nav ──────────────────────────────────────────────────────────────
const batchIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const attendanceIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);
const feeIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const coachIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" /><polyline points="12 12 13.5 17 12 16 10.5 17 12 12" />
  </svg>
);
const studentIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const academyNavItems: NavItem[] = [
  { icon: <GridIcon />, name: "Overview", path: "/dashboard" },
  { icon: batchIcon, name: "Batch Scheduling", path: "/academy/batches" },
  { icon: feeIcon, name: "Fee Management", path: "/academy/fees" },
  { icon: studentIcon, name: "Student Profiles", path: "/academy/students" },
  { icon: attendanceIcon, name: "Attendance", path: "/academy/attendance" },
  { icon: coachIcon, name: "Coaches", path: "/academy/coaches" },
  { icon: <ListIcon />, name: "QR Code", path: "/qr-code" },
  { icon: <Calendar size={20} strokeWidth={2} />, name: "Calendar & Tasks", path: "/calendar" },
  { icon: <DocsIcon />, name: "Docs", path: "/docs" },
];

// ── Sports Club nav ────────────────────────────────────────────────────────
const sportsClubNavItems: NavItem[] = [
  { icon: <LayoutDashboard size={20} strokeWidth={2} />, name: "Overview", path: "/sports-club/overview" },
  { icon: <Users size={20} strokeWidth={2} />, name: "Members", path: "/sports-club/members" },
  { icon: <LayoutDashboard size={20} strokeWidth={2} />, name: "Facilities", path: "/sports-club/facilities" },
  { icon: <Calendar size={20} strokeWidth={2} />, name: "Bookings", path: "/sports-club/bookings" },
  { icon: <ListIcon />, name: "QR Code", path: "/qr-code" },
  { icon: <Calendar size={20} strokeWidth={2} />, name: "Calendar & Tasks", path: "/calendar" },
  { icon: <BookOpen size={20} strokeWidth={2} />, name: "Docs", path: "/docs" },
];

// ── Wellness nav ───────────────────────────────────────────────────────────
const wellnessNavItems: NavItem[] = [
  { icon: <LayoutDashboard size={20} strokeWidth={2} />, name: "Overview", path: "/wellness/overview" },
  { icon: <Package size={20} strokeWidth={2} />, name: "Treatments", path: "/wellness/treatments" },
  { icon: <Calendar size={20} strokeWidth={2} />, name: "Appointments", path: "/wellness/appointments" },
  { icon: <User size={20} strokeWidth={2} />, name: "Customers", path: "/customer-tables" },
  { icon: <ListIcon />, name: "QR Code", path: "/qr-code" },
  { icon: <Calendar size={20} strokeWidth={2} />, name: "Calendar & Tasks", path: "/calendar" },
  { icon: <BookOpen size={20} strokeWidth={2} />, name: "Docs", path: "/docs" },
];

// ── Venue Booking nav ──────────────────────────────────────────────────────
const venueNavItems: NavItem[] = [
  /*{ icon: <PieChart size={20} strokeWidth={2} />, name: "Overview", path: "/venue-booking/overview" },*/
  { icon: <Calendar size={20} strokeWidth={2} />, name: "Bookings", path: "/venue-booking/bookings" },
  { icon: <Users size={20} strokeWidth={2} />, name: "Memberships", path: "/venue-booking/memberships" },
  { icon: <GridIcon />, name: "Venues & Addons", path: "/venue-booking/settings" },
  { icon: <User size={20} strokeWidth={2} />, name: "Customers", path: "/customer-tables" },
  { icon: <ListIcon />, name: "QR Code", path: "/qr-code" },
  { icon: <Calendar size={20} strokeWidth={2} />, name: "Calendar & Tasks", path: "/calendar" },
  { icon: <BookOpen size={20} strokeWidth={2} />, name: "Docs", path: "/docs" },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const [orgName, setOrgName] = useState<string>("");
  const { plan, role, type } = useAuth();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Pick correct nav based on org vertical
  const vertical = (type || "kitchen").toLowerCase();
  let navItems: NavItem[] = kitchenNavItems;
  if (vertical === "salon") navItems = salonNavItems;
  else if (vertical.includes("academy") || vertical === "sports academy") navItems = academyNavItems;
  else if (vertical === "sports club") navItems = sportsClubNavItems;
  else if (vertical === "wellness") navItems = wellnessNavItems;
  else if (vertical === "venue booking" || vertical === "venue") navItems = venueNavItems;

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    async function fetchOrgName() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) return;

      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", profileData.organization_id)
        .single();

      if (orgError || !orgData) return;
      setOrgName(orgData.name);
    }
    fetchOrgName();
  }, []);

  useEffect(() => {
    let submenuMatched = false;
    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: "main", index });
            submenuMatched = true;
          }
        });
      }
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive, navItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main") => {
    setOpenSubmenu((prev) => {
      if (prev && prev.type === menuType && prev.index === index) return null;
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main") => {
    const filteredItems = items.filter((nav) => {
      if (plan === "standard" && nav.name === "Talk to your Data!!") return false;
      if (role === "admin" && (nav.name === "Finance" || nav.name === "Customers" || nav.name === "Discount Coupons")) return false;
      if (nav.name === "Discount Coupons" && role !== "owner" && role !== "superadmin") return false;
      return true;
    });

    return (
      <ul className="flex flex-col gap-4">
        {filteredItems.map((nav, index) => (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-active"
                    : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                      openSubmenu?.type === menuType && openSubmenu?.index === index
                        ? "rotate-180 text-brand-500"
                        : ""
                    }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group ${
                    isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => { subMenuRefs.current[`${menuType}-${index}`] = el; }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? `${subMenuHeight[`${menuType}-${index}`]}px`
                      : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path}
                        className={`menu-dropdown-item ${
                          isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        {subItem.name}
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span className={`ml-auto ${isActive(subItem.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"} menu-dropdown-badge`}>
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span className={`ml-auto ${isActive(subItem.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"} menu-dropdown-badge`}>
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  // Vertical badge label
  const verticalLabel =
    vertical === "salon"
      ? "Salon"
      : vertical.includes("academy") || vertical === "sports academy"
      ? "Academy"
      : "Kitchen";

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link to="/dashboard">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-800 dark:text-white/90">
                {orgName}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
                  {plan} Plan
                </span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  · {verticalLabel}
                </span>
              </div>
            </div>
          ) : (
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500 text-white text-sm font-bold">
              {orgName?.charAt(0).toUpperCase()}
            </span>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;