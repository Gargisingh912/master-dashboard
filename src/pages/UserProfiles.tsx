import { useEffect, useState, useRef } from "react";
import { Link } from "react-router";
import PageMeta from "../components/common/PageMeta";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import { isSilentMode, setSilentMode } from "../utils/helpers";
import { supabase } from "../config/supabase";
import { useAuth } from "../hooks/useAuth";
import {
  Users,
  MessageSquareText,
  FileText,
  Headset,
  LogOut,
  Camera,
  Bell,
  BellOff,
  Power,
  ChevronDown,
  Clock
} from "lucide-react";

interface BusinessHours {
  [day: string]: { open: string; close: string; isClosed: boolean };
}

const defaultHours: BusinessHours = {
  Monday: { open: "09:00", close: "18:00", isClosed: false },
  Tuesday: { open: "09:00", close: "18:00", isClosed: false },
  Wednesday: { open: "09:00", close: "18:00", isClosed: false },
  Thursday: { open: "09:00", close: "18:00", isClosed: false },
  Friday: { open: "09:00", close: "18:00", isClosed: false },
  Saturday: { open: "09:00", close: "18:00", isClosed: false },
  Sunday: { open: "09:00", close: "18:00", isClosed: true },
};

export default function UserProfiles() {
  const { org, type } = useAuth();
  const [silent, setSilent] = useState(isSilentMode());
  
  const vertical = (type || "kitchen").toLowerCase();
  const isAcademy = vertical.includes("academy") || vertical === "sports academy";
  const [kitchenName, setKitchenName] = useState(org?.name || "My Kitchen");
  const [isLive, setIsLive] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [openHours, setOpenHours] = useState<BusinessHours>(defaultHours);
  const [savingHours, setSavingHours] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchOrgStatus() {
      if (!org?.id) return;
      const { data } = await supabase
        .from("organizations")
        .select("is_live, name, open_hours")
        .eq("id", org.id)
        .single();

      if (data) {
        if (data.is_live !== undefined && data.is_live !== null) setIsLive(data.is_live);
        if (data.name) setKitchenName(data.name);
        if (data.open_hours) setOpenHours(data.open_hours as unknown as BusinessHours);
      }
    }
    fetchOrgStatus();
  }, [org?.id]);

  const toggleSilent = () => {
    const next = !silent;
    setSilentMode(next);
    setSilent(next);
  };

  const toggleLiveStatus = async () => {
    if (!org?.id) return;
    const nextStatus = !isLive;
    setIsLive(nextStatus);
    // You should have an is_live column in organizations table. 
    // If it fails, we revert UI or handle error. Assuming it works.
    await supabase.from("organizations").update({ is_live: nextStatus }).eq("id", org.id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleSupportWhatsApp = () => {
    const msg = encodeURIComponent("I have a query/problem");
    window.open(`https://wa.me/919098470355?text=${msg}`, "_blank");
  };

  const saveBusinessHours = async () => {
    if (!org?.id) return;
    setSavingHours(true);
    await supabase.from("organizations").update({ open_hours: openHours as any }).eq("id", org.id);
    setSavingHours(false);
  };

  const updateHour = (day: string, field: "open" | "close" | "isClosed", val: any) => {
    setOpenHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: val }
    }));
  };

  return (
    <>
      <PageMeta title="Profile | Master-Dashboard" description="Manage your kitchen profile" />

      <div className="max-w-4xl mx-auto pb-12">
        {/* Settings Dropdown & Header Area */}
        <div className="flex justify-end mb-6 relative z-30">
          {isAcademy ? (
            <div className="flex items-center gap-3 px-4 py-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-full shadow-sm text-sm font-semibold text-gray-700 dark:text-gray-300">
              <span>Theme</span>
              <ThemeToggleButton />
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-full shadow-sm hover:shadow-md transition-all text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Quick Settings <ChevronDown size={16} className={`transition-transform duration-300 ${showSettings ? "rotate-180" : ""}`} />
              </button>

              {showSettings && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-3xl p-2 animate-in slide-in-from-top-2 fade-in duration-200 overflow-hidden">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-colors">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                      <ThemeToggleButton />
                    </div>

                    <button
                      onClick={toggleSilent}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-colors text-left"
                    >
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notifications</span>
                      <div className={`p-1.5 rounded-full transition-colors ${silent ? "bg-red-100 text-red-500 dark:bg-red-500/20" : "bg-brand-100 text-brand-500 dark:bg-brand-500/20"}`}>
                        {silent ? <BellOff size={16} /> : <Bell size={16} />}
                      </div>
                    </button>

                    <button
                      onClick={toggleLiveStatus}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-colors text-left"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Kitchen Status</span>
                        <span className="text-[10px] text-gray-400">{isLive ? "Accepting orders" : "Offline"}</span>
                      </div>
                      <div className={`p-1.5 rounded-full transition-colors ${!isLive ? "bg-red-100 text-red-500 dark:bg-red-500/20" : "bg-success-100 text-success-600 dark:bg-success-500/20"}`}>
                        <Power size={16} />
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Brand & Logo Section */}
        <div className="flex flex-col items-center justify-center mb-12">
          <div className="relative group mb-4">
            <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-tr from-brand-500 to-brand-400 flex items-center justify-center text-white font-bold text-5xl shadow-xl shadow-brand-500/20 overflow-hidden">
              {kitchenName.charAt(0) || "K"}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
            >
              <Camera size={24} className="mb-1" />
              <span className="text-xs font-medium">Edit Logo</span>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight text-center">
            {kitchenName}
          </h2>
          {!isAcademy && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span className={`w-2 h-2 rounded-full ${isLive ? "bg-success-500 animate-pulse" : "bg-red-500"}`}></span>
              {isLive ? "Online & Accepting Orders" : "Currently Offline"}
            </div>
          )}
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12">

          {isAcademy ? (
            <Link to="/academy/coaches" className="flex items-center gap-4 p-5 rounded-[2rem] bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-500/40 transition-all group">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white/90">Coaches</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage coaches, timings, performance & batches</p>
              </div>
            </Link>
          ) : vertical === "salon" ? (
            <Link to="/salon/staff" className="flex items-center gap-4 p-5 rounded-[2rem] bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-500/40 transition-all group">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white/90">Staff Directory</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Update staff details and mark attendance</p>
              </div>
            </Link>
          ) : (
            <Link to="/customer-tables" className="flex items-center gap-4 p-5 rounded-[2rem] bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-500/40 transition-all group">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white/90">Customer Directory</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">View and manage your customers</p>
              </div>
            </Link>
          )}

          <Link to="/blank" className="flex items-center gap-4 p-5 rounded-[2rem] bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-500/40 transition-all group">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
              <MessageSquareText size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white/90">Talk to Data (AI Bot)</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Ask questions about your data</p>
            </div>
          </Link>

          <Link to="/docs" className="flex items-center gap-4 p-5 rounded-[2rem] bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-500/40 transition-all group">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white/90">Documentation</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Guides and tutorials</p>
            </div>
          </Link>

          <div onClick={handleSupportWhatsApp} className="cursor-pointer flex items-center gap-4 p-5 rounded-[2rem] bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-500/40 transition-all group">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-500/10 text-green-500 group-hover:scale-110 transition-transform">
              <Headset size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 dark:text-white/90">Help & Support</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">gargiaiagency@gmail.com</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-100 px-2 py-1 rounded-full">WhatsApp</span>
          </div>

        </div>

        {/* Business Hours for Salon */}
        {vertical === "salon" && (
          <div className="mb-12 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-10 h-10 bg-brand-50 dark:bg-brand-500/10 text-brand-500 rounded-xl">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white/90">Business Hours</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage when customers can book appointments</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {Object.keys(openHours).map(day => {
                const hrs = openHours[day];
                return (
                  <div key={day} className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div className="w-28 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!hrs.isClosed}
                        onChange={(e) => updateHour(day, "isClosed", !e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      <span className={`text-sm font-semibold ${hrs.isClosed ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{day}</span>
                    </div>
                    {hrs.isClosed ? (
                      <span className="text-sm text-gray-400 font-medium italic">Closed</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={hrs.open}
                          onChange={(e) => updateHour(day, "open", e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <span className="text-gray-400 text-sm">to</span>
                        <input
                          type="time"
                          value={hrs.close}
                          onChange={(e) => updateHour(day, "close", e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={saveBusinessHours}
                disabled={savingHours}
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {savingHours ? "Saving..." : "Save Hours"}
              </button>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="flex justify-center">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 rounded-[1.5rem] bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

      </div>
    </>
  );
}
