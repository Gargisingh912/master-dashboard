import { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import { Plus } from "lucide-react";
import CreateOrderModal from "../../components/ecommerce/CreateOrderModal";
import CreateAppointmentModal from "../../components/salon/CreateAppointmentModal";
import { useAuth } from "../../hooks/useAuth";
import StudentAdmissionModal from "../../components/academy/StudentAdmissionModal";

export default function GreetingHeader() {
  const { type } = useAuth();
  const vertical = (type || "kitchen").toLowerCase();
  const isAcademy = vertical.includes("academy") || vertical === "sports academy";

  const [userName, setUserName] = useState<string>("User");
  const [kitchenName, setKitchenName] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, organization_id")
        .eq("id", user.id)
        .single();
        
      if (profile) {
        if (profile.full_name) setUserName(profile.full_name);
        
        const { data: orgData } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", profile.organization_id)
          .single();
          
        if (orgData && orgData.name) {
          setKitchenName(orgData.name);
        }
      } else if (user.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name);
      }
    }
    fetchDetails();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="mb-8 w-full flex items-center justify-between gap-4">
      {/* Mobile view: Logo left, greeting right */}
      <div className="lg:hidden flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-brand-400 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-brand-500/30 shrink-0">
          {kitchenName.charAt(0) || "K"}
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white tracking-tight line-clamp-1">
            Hello, {userName} <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{getGreeting()}!</p>
        </div>
      </div>

      {/* Desktop view: Just greeting (logo is in nav) */}
      <div className="hidden lg:block flex-1">
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
          Welcome back, {userName} <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{getGreeting()}! Here's what's happening today.</p>
      </div>

      {/* Floating Button to Take Live Orders (All Devices) */}
      <div className="flex items-center ml-auto">
        <button 
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 transition-all shadow-[0_4px_14px_0_rgba(70,95,255,0.39)] hover:shadow-[0_6px_20px_rgba(70,95,255,0.23)] hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base"
        >
          <Plus size={18} strokeWidth={3} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          <span>{isAcademy ? "Admit Student" : vertical === "salon" ? "New Appointment" : "Take Order"}</span>
        </button>
      </div>

      {isAcademy ? (
        <StudentAdmissionModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      ) : vertical === "salon" ? (
        <CreateAppointmentModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      ) : (
        <CreateOrderModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}
