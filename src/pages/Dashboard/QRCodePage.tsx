import React, { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from "../../hooks/useAuth";
import { uuidToBase62 } from "../../utils/helpers";

// ── Per-vertical config ──────────────────────────────────────────────────────
const VERTICAL_CONFIG: Record<string, {
  urlPath: string;
  title: string;
  description: string;
  fileLabel: string;
}> = {
  kitchen: {
    urlPath: "order",
    title: "Menu & Order QR Code",
    description: "Place this on tables. Customers scan to view your menu and place orders directly.",
    fileLabel: "menu",
  },
  salon: {
    urlPath: "salon",
    title: "Appointment Booking QR Code",
    description: "Display this in your salon. Clients scan to browse services and book appointments instantly.",
    fileLabel: "salon-booking",
  },
  "sports club": {
    urlPath: "sports-club-booking",
    title: "Facility Booking QR Code",
    description: "Post this at reception. Members scan to book courts, slots, and facilities online.",
    fileLabel: "sports-club-booking",
  },
  wellness: {
    urlPath: "wellness-booking",
    title: "Treatment Booking QR Code",
    description: "Display at your centre. Clients scan to browse treatments and schedule appointments.",
    fileLabel: "wellness-booking",
  },
  venue: {
    urlPath: "venue-enquiry",
    title: "Venue Enquiry QR Code",
    description: "Share this with potential clients. They scan to browse your venues and submit enquiries.",
    fileLabel: "venue-enquiry",
  },
  "venue booking": {
    urlPath: "venue-enquiry",
    title: "Venue Enquiry QR Code",
    description: "Share this with potential clients. They scan to browse your venues and submit enquiries.",
    fileLabel: "venue-enquiry",
  },
};

const QRCodePage: React.FC = () => {
  const { org } = useAuth();
  const qrRef = useRef<HTMLDivElement>(null);

  if (!org?.id) {
    return <p style={{ padding: 24, color: "#7B9EC4" }}>Loading organization info…</p>;
  }

  const vertical = (org.type || "kitchen").toLowerCase();
  const config = VERTICAL_CONFIG[vertical] ?? VERTICAL_CONFIG.kitchen;

  const slug = (org.name || "booking")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const shortId = uuidToBase62(org.id);
  const bookingUrl = `${window.location.origin}/${config.urlPath}/${slug}/${shortId}`;

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${org.name || config.fileLabel}-qr-code.png`;
    link.click();
  };

  const handlePrint = () => window.print();

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 20px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4, color: "#F0F6FF", letterSpacing: "-0.02em" }}>
          {org.name}
        </h2>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: "#F0F6FF" }}>
          {config.title}
        </h1>
        <p style={{ color: "#7B9EC4", fontSize: 13 }}>{config.description}</p>
      </div>

      {/* QR code card */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div
          ref={qrRef}
          style={{
            display: "inline-block",
            padding: 24,
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}
        >
          <QRCodeCanvas value={bookingUrl} size={260} level="M" includeMargin />
        </div>

        {/* Org name label below QR (for print) */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#F0F6FF", marginBottom: 4 }}>
            {org.name}
          </p>
          <p style={{ fontSize: 11, color: "#7B9EC4", wordBreak: "break-all" }}>
            {bookingUrl}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
          <button onClick={handleDownload} style={primaryBtn}>
            ⬇ Download PNG
          </button>
          <button onClick={handlePrint} style={secondaryBtn}>
            🖨 Print
          </button>
          <button
            onClick={() => { navigator.clipboard?.writeText(bookingUrl); }}
            style={secondaryBtn}
          >
            📋 Copy Link
          </button>
        </div>

        {/* Usage tip */}
        <p style={{
          marginTop: 16,
          background: "rgba(129,140,248,0.08)",
          border: "1px solid rgba(129,140,248,0.2)",
          borderRadius: 10,
          padding: "12px 16px",
          fontSize: 12,
          color: "#7B9EC4",
          textAlign: "center",
          lineHeight: 1.6,
          maxWidth: 380,
        }}>
          💡 <strong style={{ color: "#A5B4FC" }}>Tip:</strong> Download the PNG and print it on
          a card or table tent. You can also share the link directly via WhatsApp or email.
        </p>
      </div>
    </div>
  );
};

const primaryBtn: React.CSSProperties = {
  background: "#818CF8",
  color: "#000",
  border: "none",
  borderRadius: 8,
  padding: "10px 20px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const secondaryBtn: React.CSSProperties = {
  ...primaryBtn,
  background: "transparent",
  border: "1px solid #2D3F5A",
  color: "#7B9EC4",
};

export default QRCodePage;