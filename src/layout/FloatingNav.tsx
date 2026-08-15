import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { LayoutDashboard, Utensils, Package, Wallet, User, CalendarDays, Banknote, Users, Scissors, Receipt } from "lucide-react";
import { supabase } from "../config/supabase";
import { useAuth } from "../hooks/useAuth";

export default function FloatingNav() {
  const location = useLocation();
  const [kitchenName, setKitchenName] = useState<string>("");
  const { type } = useAuth();

  const vertical = (type || "kitchen").toLowerCase();
  const isAcademy = vertical.includes("academy") || vertical === "sports academy";
  const isSalon = vertical === "salon";

  const navItems = isSalon
    ? [
        { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
        { name: "Services", path: "/salon/services", icon: Scissors },
        { name: "Staff", path: "/salon/staff", icon: Users },
        { name: "Billing", path: "/salon/billing", icon: Receipt },
        { name: "Profile", path: "/profile", icon: User },
      ]
    : [
        { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
        isAcademy
          ? { name: "Batch Scheduling", path: "/academy/batches", icon: CalendarDays }
          : { name: "Menu", path: "/menu", icon: Utensils },
        isAcademy
          ? { name: "Fee Management", path: "/academy/fees", icon: Banknote }
          : { name: "Inventory", path: "/inventory", icon: Package },
        isAcademy
          ? { name: "Student Profiles", path: "/academy/students", icon: Users }
          : { name: "Finances", path: "/finance", icon: Wallet },
        { name: "Profile", path: "/profile", icon: User },
      ];

  useEffect(() => {
    async function fetchKitchenName() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profileData) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", profileData.organization_id)
          .single();

        if (orgData) {
          setKitchenName(orgData.name);
        }
      }
    }
    fetchKitchenName();
  }, []);

  return (
    <div className="fixed z-50 left-1/2 -translate-x-1/2 bottom-4 w-[calc(100%-2rem)] max-w-md lg:w-[72px] lg:h-[calc(100vh-3rem)] lg:left-6 lg:top-6 lg:bottom-6 lg:translate-x-0 transition-all duration-300">
      <nav className="flex lg:flex-col items-center justify-between lg:justify-start px-4 lg:px-0 py-3 lg:py-6 h-full rounded-[2rem] backdrop-blur-3xl bg-white/40 dark:bg-black/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] border border-white/60 dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        
        {/* Brand Section (Top of sidebar on desktop) */}
        <Link to="/dashboard" className="hidden lg:flex items-center justify-center w-full mb-8" title={kitchenName || "Dashboard"}>
          <div className="w-10 h-10 rounded-[14px] bg-gradient-to-tr from-brand-500 to-brand-300 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-brand-500/30 ring-2 ring-white/20 dark:ring-white/10">
            {kitchenName.charAt(0) || "K"}
          </div>
        </Link>

        {/* Navigation Items */}
        <div className="flex lg:flex-col items-center justify-between w-full lg:w-auto lg:justify-start gap-1 sm:gap-2 lg:gap-4 flex-1 lg:flex-none">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.path}
                title={item.name}
                className={`relative flex items-center justify-center w-12 h-12 lg:w-12 lg:h-12 rounded-[16px] transition-all duration-300 group overflow-hidden ${
                  isActive
                    ? "text-white dark:text-white"
                    : "text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white"
                }`}
              >
                {/* Active Indicator Background */}
                <div
                  className={`absolute inset-0 rounded-[16px] transition-all duration-300 ${
                    isActive
                      ? "bg-brand-500 shadow-md shadow-brand-500/30 scale-100 opacity-100"
                      : "bg-white/40 dark:bg-white/5 scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                  }`}
                />
                
                <Icon
                  size={22}
                  className={`relative z-10 transition-transform duration-300 ${
                    isActive ? "scale-100" : "scale-100 group-hover:scale-110"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}