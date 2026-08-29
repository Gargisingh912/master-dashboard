import React, { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from "../../hooks/useAuth";
import { uuidToBase62 } from "../../utils/helpers";
import { QrCode, X, Download, Share2 } from "lucide-react";

// ── Per-vertical config (mirrors QRCodePage) ─────────────────────────────────
const VERTICAL_CONFIG: Record<string, {
  urlPath: string;
  widgetLabel: string;
  widgetTitle: string;
  modalTitle: string;
  modalSub: string;
  shareText: string;
}> = {
  kitchen: {
    urlPath: "order",
    widgetLabel: "Table Ordering",
    widgetTitle: "QR Menu",
    modalTitle: "Your Table QR Code",
    modalSub: "Customers scan this to view your menu and place orders.",
    shareText: "Check out the menu and place your order!",
  },
  salon: {
    urlPath: "salon",
    widgetLabel: "Online Booking",
    widgetTitle: "Booking QR",
    modalTitle: "Your Appointment QR Code",
    modalSub: "Clients scan this to browse services and book appointments.",
    shareText: "Book your appointment instantly!",
  },
  "sports club": {
    urlPath: "sports-club-booking",
    widgetLabel: "Facility Booking",
    widgetTitle: "Facility QR",
    modalTitle: "Your Facility Booking QR",
    modalSub: "Members scan this to book courts, slots, and facilities.",
    shareText: "Book a facility slot online!",
  },
  wellness: {
    urlPath: "wellness-booking",
    widgetLabel: "Treatment Booking",
    widgetTitle: "Wellness QR",
    modalTitle: "Your Wellness Booking QR",
    modalSub: "Clients scan this to browse treatments and schedule appointments.",
    shareText: "Book a wellness treatment!",
  },
  venue: {
    urlPath: "venue-enquiry",
    widgetLabel: "Venue Enquiry",
    widgetTitle: "Venue QR",
    modalTitle: "Your Venue Enquiry QR",
    modalSub: "Clients scan this to browse venues and submit enquiries.",
    shareText: "Explore our venues and send an enquiry!",
  },
  "venue booking": {
    urlPath: "venue-enquiry",
    widgetLabel: "Venue Enquiry",
    widgetTitle: "Venue QR",
    modalTitle: "Your Venue Enquiry QR",
    modalSub: "Clients scan this to browse venues and submit enquiries.",
    shareText: "Explore our venues and send an enquiry!",
  },
  academy: {
    urlPath: "order",
    widgetLabel: "QR Code",
    widgetTitle: "Booking QR",
    modalTitle: "Your Academy QR Code",
    modalSub: "Share this QR code with students and parents.",
    shareText: "Scan to learn more about our academy!",
  },
};

export default function QrKpiWidget() {
  const { org } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!org?.id) return null;

  const vertical = (org.type || "kitchen").toLowerCase();
  const cfg = VERTICAL_CONFIG[vertical] ?? VERTICAL_CONFIG.kitchen;

  const slug = (org.name || "booking").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  const shortId = uuidToBase62(org.id);
  const bookingUrl = `${window.location.origin}/${cfg.urlPath}/${slug}/${shortId}`;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${org.name || "booking"}-qr-code.png`;
    link.click();
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: org.name,
          text: `${org.name} — ${cfg.shareText}`,
          url: bookingUrl,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      navigator.clipboard.writeText(bookingUrl);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <>
      {/* Widget card */}
      <div
        onClick={() => setIsFullscreen(true)}
        className="bento-glass p-6 cursor-pointer group"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <QrCode size={80} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-400 text-white rounded-2xl mb-4 shadow-lg shadow-brand-500/30">
            <QrCode size={24} />
          </div>

          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            {cfg.widgetLabel}
          </h4>
          <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {cfg.widgetTitle}
          </p>
          <p className="text-xs text-gray-400 mt-2 font-medium">
            Tap to view, download, or share your QR Code
          </p>
        </div>
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setIsFullscreen(false)}
          />

          <div className="relative z-10 w-full max-w-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-[2.5rem] p-8 animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-gray-100/50 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 tracking-tight">
                {cfg.modalTitle}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {cfg.modalSub}
              </p>
            </div>

            <div className="flex justify-center mb-8">
              <div
                ref={qrRef}
                className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100"
              >
                <QRCodeCanvas value={bookingUrl} size={220} level="M" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold transition-colors shadow-lg shadow-brand-500/30"
              >
                <Download size={18} />
                Download
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white hover:bg-gray-50 text-gray-700 font-semibold transition-colors shadow-lg border border-gray-200/50 dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <Share2 size={18} />
                Share
              </button>
            </div>

            <p className="text-center text-[10px] text-gray-400 mt-6 break-all px-4">
              {bookingUrl}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

