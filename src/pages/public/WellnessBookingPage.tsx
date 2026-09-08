import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { supabasePublic } from "../../config/supabasePublic";
import { base62ToUuid } from "../../utils/helpers";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CheckCircle, Clock, Calendar, Heart } from "lucide-react";

interface Treatment {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

export default function WellnessBookingPage({ organizationId: propOrgId }: { organizationId?: string }) {
  const { organizationId: paramOrgId, slug } = useParams<{ organizationId: string; slug: string }>();
  let organizationId = propOrgId || paramOrgId;
  
  const [orgName, setOrgName] = useState("");
  const [orgLogo, setOrgLogo] = useState("");
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState("10:00");
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        if (organizationId && !organizationId.includes("-")) {
          organizationId = base62ToUuid(organizationId);
        } else if (slug && !organizationId) {
            const { data: orgData } = await supabasePublic.from("organizations").select("id").eq("slug", slug).single();
            if (orgData) organizationId = orgData.id;
        }

        if (!organizationId) {
          setError("Invalid organization link.");
          setLoading(false);
          return;
        }

        const { data: orgData, error: orgErr } = await supabasePublic.from("organizations").select("name, logo_url").eq("id", organizationId).single();
        if (orgErr) throw orgErr;
        setOrgName(orgData.name);
        if (orgData.logo_url) setOrgLogo(orgData.logo_url);

        const { data: trtData, error: trtErr } = await supabasePublic.from("wellness_treatments").select("*").eq("organization_id", organizationId).eq("is_active", true);
        if (trtErr) throw trtErr;
        setTreatments(trtData || []);

      } catch (err: any) {
        console.error(err);
        setError("Failed to load booking page.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [organizationId, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTreatment || !bookingDate || !startTime || !customerName) {
        setError("Please fill all required fields.");
        return;
    }
    
    let resolvedOrgId = propOrgId || paramOrgId;
    if (resolvedOrgId && !resolvedOrgId.includes("-")) resolvedOrgId = base62ToUuid(resolvedOrgId);
    
    setSubmitting(true);
    setError(null);
    try {
        const dStr = bookingDate.toISOString().split("T")[0];
        
        // Calculate end time implicitly based on treatment duration
        const treatment = treatments.find(t => t.id === selectedTreatment);
        const duration = treatment ? treatment.duration_minutes : 60;
        const [h, m] = startTime.split(":").map(Number);
        const endD = new Date();
        endD.setHours(h, m, 0, 0);
        endD.setMinutes(endD.getMinutes() + duration);
        const endTime = `${endD.getHours().toString().padStart(2, "0")}:${endD.getMinutes().toString().padStart(2, "0")}`;

        const { error: insErr } = await supabasePublic.from("wellness_appointments").insert([{
            organization_id: resolvedOrgId,
            treatment_id: selectedTreatment,
            customer_name: customerName,
            customer_contact: customerContact || null,
            appointment_date: dStr,
            start_time: startTime,
            end_time: endTime,
            status: "Booked",
            is_qr_booking: true
        }]);
        if (insErr) throw insErr;
        setSuccess(true);
    } catch (err: any) {
        console.error(err);
        setError("Failed to book appointment. Please try again.");
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div></div>;

  if (success) {
      return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
                  <div className="w-20 h-20 bg-success-50 dark:bg-success-500/10 text-success-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle size={40} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Appointment Booked!</h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-8">Your wellness session at {orgName} is confirmed.</p>
                  <button onClick={() => window.location.reload()} className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl font-bold transition-colors">Book Another</button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
              
              <div className="p-8 border-b border-gray-100 dark:border-gray-700 text-center bg-brand-500 text-white">
                  {orgLogo && (
                    <img src={orgLogo} alt="Logo" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4 ring-4 ring-white/30 shadow-lg" />
                  )}
                  <h1 className="text-2xl font-black">{orgName}</h1>
                  <p className="text-brand-100 mt-1 font-medium">Wellness Appointments</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                  {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-sm font-medium">{error}</div>}
                  
                  <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                          <Heart size={16} className="text-brand-500" /> Select Treatment
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {treatments.map(t => (
                              <label key={t.id} className={`flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedTreatment === t.id ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-gray-100 dark:border-gray-700 hover:border-brand-200"}`}>
                                  <input type="radio" name="treatment" value={t.id} checked={selectedTreatment === t.id} onChange={() => setSelectedTreatment(t.id)} className="sr-only" />
                                  <span className="font-bold text-gray-800 dark:text-white">{t.name}</span>
                                  <span className="text-sm font-semibold text-brand-600 dark:text-brand-400 mt-1">₹{t.price} &bull; {t.duration_minutes} min</span>
                              </label>
                          ))}
                      </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                              <Calendar size={16} className="text-brand-500" /> Date
                          </label>
                          <DatePicker
                            selected={bookingDate}
                            onChange={(d: Date | null) => setBookingDate(d)}
                            minDate={new Date()}
                            className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                          />
                      </div>
                      <div>
                          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                              <Clock size={16} className="text-brand-500" /> Time
                          </label>
                          <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl font-medium focus:ring-brand-500" />
                      </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Your Name *</label>
                              <input type="text" required value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="John Doe" />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Contact Number</label>
                              <input type="text" value={customerContact} onChange={e => setCustomerContact(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="+91..." />
                          </div>
                      </div>
                  </div>

                  <button type="submit" disabled={submitting} className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 disabled:opacity-50 mt-4">
                      {submitting ? "Booking..." : "Book Appointment"}
                  </button>

              </form>
          </div>
      </div>
    </div>
  );
}
