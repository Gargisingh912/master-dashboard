import React from "react";
import { BASE } from "../../config/themes";

/**
 * Basic Card Container
 * The structural foundation for all dashboard sections [2].
 */
export const Card = ({ children, style = {}, accent }) => (
  <div style={{
    background: BASE.card,
    border: `1px solid ${BASE.border}`,
    borderTop: accent ? `3px solid ${accent}` : `1px solid ${BASE.border}`,
    borderRadius: 12,
    padding: 16,
    position: "relative",
    ...style
  }}>
    {children}
  </div>
);

/**
 * Status Badge
 * Maps Agency-specific statuses (Active, Paused, At-Risk, Completed) 
 * to their respective colors [5, 6].
 */
export const StatusBadge = ({ status }) => {
  const map = {
    active: [BASE.green, "Active"],
    completed: [BASE.green, "Completed"],
    paused: [BASE.yellow, "Paused"],
    "at-risk": [BASE.red, "At Risk"], // Specifically used in Agency niche [7]
    pending: [BASE.orange, "Pending Invoices"],
  };
  const [color, label] = map[status] || [BASE.textMid, status];
  
  return (
    <span style={{
      background: color + "22",
      color,
      border: `1px solid ${color}44`,
      borderRadius: 20,
      padding: "2px 9px",
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      display: "inline-block",
    }}>
      {label}
    </span>
  );
};

/**
 * KPI Card
 * Powers the Agency metrics like MRR, Active Campaigns, and Leads [4, 8].
 */
export const KpiCard = ({ label, value, sub, color, icon, trend }) => (
  <Card accent={color}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
      <div style={{ 
        width: 32, height: 32, borderRadius: 8, 
        background: color + "15", color, 
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 
      }}>
        {icon}
      </div>
      {trend && (
        <span style={{ color: BASE.green, fontSize: 10, fontWeight: 800 }}>
          ↑ {trend}%
        </span>
      )}
    </div>
    <p style={{ color: BASE.textMid, fontSize: 11, fontWeight: 700, margin: "0 0 2px", textTransform: "uppercase" }}>
      {label}
    </p>
    <h2 style={{ color: BASE.text, fontSize: 20, fontWeight: 900, margin: 0 }}>{value}</h2>
    {sub && <p style={{ color: BASE.textDim, fontSize: 10, margin: "4px 0 0" }}>{sub}</p>}
  </Card>
);

/**
 * Section Header
 * Standardized header for modules like "Campaign Performance" [8].
 */
export const SectionHead = ({ title, action, actionLabel, actionColor }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
    <h3 style={{ color: BASE.text, fontSize: 14, fontWeight: 800, margin: 0 }}>{title}</h3>
    {action && (
      <button onClick={action} style={{ background: "none", border: "none", color: actionColor || BASE.textMid, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
        {actionLabel || "View All →"}
      </button>
    )}
  </div>
);

/**
 * Custom Tooltip for Charts
 * Ensures Agency analytics match the dark theme and accent colors [8].
 */
export const CustomTooltip = ({ active, payload, label, accent }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: BASE.surface, border: `1px solid ${BASE.border}`, borderRadius: 10, padding: "10px 14px" }}>
      <p style={{ color: BASE.textMid, fontSize: 10, margin: "0 0 6px", fontWeight: 700 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || accent, fontSize: 12, fontWeight: 700, margin: "2px 0" }}>
          {p.name}: {typeof p.value === "number" && p.value > 1000 ? `₹${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};