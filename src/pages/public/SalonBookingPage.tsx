import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { supabasePublic } from "../../config/supabasePublic";
import { base62ToUuid } from "../../utils/helpers";

interface SalonService {
  id: string;
  name: string;
  category?: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
}

interface SalonStaff {
  id: string;
  name: string;
  role?: string;
  isActive: boolean;
}

export default function SalonBookingPage({ organizationId: propOrgId }: { organizationId?: string }) {
  const { organizationId: paramOrgId } = useParams<{ organizationId: string }>();
  const organizationId = propOrgId || paramOrgId;
  const [orgName, setOrgName] = useState("");
  const [orgLogo, setOrgLogo] = useState("");
  const [services, setServices] = useState<SalonService[]>([]);
  const [staffList, setStaffList] = useState<SalonStaff[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  
  // Booking Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<string>("");
  const [appointmentTime, setAppointmentTime] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const ensureAnonSession = async () => {
      const { data: sessionData } = await supabasePublic.auth.getSession();
      if (!sessionData.session) {
        await supabasePublic.auth.signInAnonymously();
      }
      setAuthReady(true);
    };
    ensureAnonSession();
  }, []);

  useEffect(() => {
    if (!authReady || !organizationId) return;

    const fetchOrgAndData = async () => {
      setLoading(true);
      try {
        let uuid = organizationId;
        if (organizationId.length < 32 && !organizationId.includes("-")) {
          uuid = base62ToUuid(organizationId);
        }

        const { data: orgData } = await supabasePublic
          .from("organizations")
          .select("name, logo_url")
          .eq("id", uuid)
          .single();

        if (orgData) {
          setOrgName(orgData.name || "Salon");
          if (orgData.logo_url) setOrgLogo(orgData.logo_url);
        } else {
          setError("Salon not found.");
          setLoading(false);
          return;
        }

        const { data: svcData } = await supabasePublic
          .from("salon_services")
          .select("*")
          .eq("organization_id", uuid)
          .eq("is_active", true);

        if (svcData) {
          setServices(svcData.map(s => ({
            id: s.id,
            name: s.name,
            category: s.category,
            durationMinutes: s.duration_minutes,
            price: s.price,
            isActive: s.is_active
          })));
          
          const cats = new Set<string>();
          svcData.forEach(s => { if(s.category) cats.add(s.category); });
          setOpenCategories(cats);
        }

        const { data: staffData } = await supabasePublic
          .from("salon_staff")
          .select("id, name, role, is_active")
          .eq("organization_id", uuid)
          .eq("is_active", true);

        if (staffData) {
          setStaffList(staffData.map(s => ({
            id: s.id,
            name: s.name,
            role: s.role,
            isActive: s.is_active
          })));
        }

      } catch (err: any) {
        console.error(err);
        setError("Error loading salon details.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrgAndData();
  }, [authReady, organizationId]);

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleBook = async () => {
    if (!selectedServiceId || !appointmentDate || !appointmentTime || !customerName) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      let uuid = organizationId;
      if (organizationId && organizationId.length < 32 && !organizationId.includes("-")) {
        uuid = base62ToUuid(organizationId);
      }

      const { error: insErr } = await supabasePublic
        .from("salon_appointments")
        .insert({
          organization_id: uuid,
          customer_name: customerName,
          customer_contact: customerContact,
          staff_id: selectedStaffId === "none" ? null : selectedStaffId,
          service_id: selectedServiceId,
          appointment_date: appointmentDate,
          start_time: appointmentTime,
          status: "Booked",
          is_qr_booked: true, // distinguishes customer-created QR bookings from staff-created walk-ins
        });

      if (insErr) throw insErr;
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError("Failed to book appointment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error && !submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Booking Confirmed!</h2>
        <p className="text-gray-500 text-center max-w-sm">
          Your appointment has been successfully booked at {orgName}. We'll see you on {appointmentDate} at {appointmentTime}.
        </p>
      </div>
    );
  }

  // Group services by category
  const categories: Record<string, SalonService[]> = {};
  services.forEach(s => {
    const cat = s.category || "Other";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(s);
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-sm sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          {orgLogo ? (
            <img src={orgLogo} alt={orgName} className="w-12 h-12 object-contain rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 p-1" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center font-bold text-xl">
              {orgName.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{orgName}</h1>
            <p className="text-xs text-gray-500">Book an appointment</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Step 1: Select Service */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-brand-50 dark:bg-brand-500/10 px-5 py-4 border-b border-brand-100 dark:border-brand-500/20">
            <h2 className="text-brand-700 dark:text-brand-300 font-bold">1. Select a Service</h2>
          </div>
          <div className="p-2">
            {Object.keys(categories).map(cat => (
              <div key={cat} className="mb-2">
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <span className="font-bold text-gray-800 dark:text-white/90">{cat}</span>
                  <svg
                    width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={`text-gray-400 transition-transform ${openCategories.has(cat) ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {openCategories.has(cat) && (
                  <div className="px-2 pb-2 space-y-2">
                    {categories[cat].map(svc => (
                      <div
                        key={svc.id}
                        onClick={() => setSelectedServiceId(svc.id)}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedServiceId === svc.id ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-500/10' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                      >
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white/90">{svc.name}</p>
                          <p className="text-xs text-gray-500">{svc.durationMinutes} mins</p>
                        </div>
                        <p className="font-bold text-brand-600 dark:text-brand-400">₹{svc.price}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Select Staff */}
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-opacity ${!selectedServiceId ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="bg-gray-50 dark:bg-gray-800 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-gray-800 dark:text-white/90 font-bold">2. Select a Professional</h2>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div
              onClick={() => setSelectedStaffId("none")}
              className={`p-3 text-center rounded-xl border-2 cursor-pointer transition-all ${selectedStaffId === "none" ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 font-bold' : 'border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-200'}`}
            >
              No Preference
            </div>
            {staffList.map(staff => (
              <div
                key={staff.id}
                onClick={() => setSelectedStaffId(staff.id)}
                className={`p-3 text-center rounded-xl border-2 cursor-pointer transition-all ${selectedStaffId === staff.id ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 font-bold' : 'border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-200'}`}
              >
                {staff.name}
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Date & Time */}
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-opacity ${!selectedStaffId ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="bg-gray-50 dark:bg-gray-800 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-gray-800 dark:text-white/90 font-bold">3. Date & Time</h2>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input
                type="date"
                value={appointmentDate}
                onChange={e => setAppointmentDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
              <input
                type="time"
                value={appointmentTime}
                onChange={e => setAppointmentTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Step 4: Your Details */}
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-opacity ${!appointmentTime ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="bg-gray-50 dark:bg-gray-800 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-gray-800 dark:text-white/90 font-bold">4. Your Details</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Number</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={customerContact}
                onChange={e => setCustomerContact(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            <button
              onClick={handleBook}
              disabled={submitting || !customerName}
              className="w-full mt-4 py-3.5 rounded-xl bg-brand-500 text-white font-bold text-lg hover:bg-brand-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}