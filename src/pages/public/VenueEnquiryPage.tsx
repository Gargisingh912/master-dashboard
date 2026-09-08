import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { supabasePublic } from "../../config/supabasePublic";
import { base62ToUuid } from "../../utils/helpers";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CheckCircle, Calendar, Users, PartyPopper } from "lucide-react";

export default function VenueEnquiryPage({ organizationId: propOrgId }: { organizationId?: string }) {
  const { organizationId: paramOrgId, slug } = useParams<{ organizationId: string; slug: string }>();
  let organizationId = propOrgId || paramOrgId;
  
  const [orgName, setOrgName] = useState("");
  const [orgLogo, setOrgLogo] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [eventType, setEventType] = useState("");
  const [guestCount, setGuestCount] = useState<number | "">("");
  const [bookingDate, setBookingDate] = useState<Date | null>(null);
  
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

      } catch (err: any) {
        console.error(err);
        setError("Failed to load enquiry page.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [organizationId, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventType || !bookingDate || !customerName || !customerContact) {
        setError("Please fill all required fields.");
        return;
    }
    
    let resolvedOrgId = propOrgId || paramOrgId;
    if (resolvedOrgId && !resolvedOrgId.includes("-")) resolvedOrgId = base62ToUuid(resolvedOrgId);
    
    setSubmitting(true);
    setError(null);
    try {
        const dStr = bookingDate.toISOString().split("T")[0];
        
        const { error: insErr } = await supabasePublic.from("venue_bookings").insert([{
            organization_id: resolvedOrgId,
            customer_name: customerName,
            customer_contact: customerContact,
            event_type: eventType,
            booking_date: dStr,
            guest_count: guestCount || null,
            status: "Enquiry",
            total_amount: 0,
            advance_paid: 0,
            is_qr_booking: true
        }]);
        if (insErr) throw insErr;
        setSuccess(true);
    } catch (err: any) {
        console.error(err);
        setError("Failed to submit enquiry. Please try again.");
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
                  <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Enquiry Sent!</h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-8">Thank you for your interest in {orgName}. Our team will contact you shortly to confirm details and finalize your booking.</p>
                  <button onClick={() => window.location.reload()} className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl font-bold transition-colors">Submit Another Enquiry</button>
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
                  <p className="text-brand-100 mt-1 font-medium">Event Venue Enquiry</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                  {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-sm font-medium">{error}</div>}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                              <PartyPopper size={16} className="text-brand-500" /> Event Type *
                          </label>
                          <input type="text" required value={eventType} onChange={e => setEventType(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g. Wedding, Birthday, Corporate" />
                      </div>
                      <div>
                          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                              <Users size={16} className="text-brand-500" /> Expected Guests
                          </label>
                          <input type="number" min="1" value={guestCount} onChange={e => setGuestCount(Number(e.target.value))} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="100" />
                      </div>
                  </div>

                  <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                          <Calendar size={16} className="text-brand-500" /> Event Date *
                      </label>
                      <DatePicker
                        selected={bookingDate}
                        onChange={(d: Date | null) => setBookingDate(d)}
                        minDate={new Date()}
                        placeholderText="Select event date"
                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                  </div>

                  <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Your Name *</label>
                              <input type="text" required value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="John Doe" />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Contact Number *</label>
                              <input type="text" required value={customerContact} onChange={e => setCustomerContact(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="+91..." />
                          </div>
                      </div>
                  </div>

                  <button type="submit" disabled={submitting} className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 disabled:opacity-50 mt-4">
                      {submitting ? "Sending Enquiry..." : "Send Enquiry"}
                  </button>

              </form>
          </div>
      </div>
    </div>
  );
}
