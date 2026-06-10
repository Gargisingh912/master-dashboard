import React from "react";
import { BASE, NICHE_THEMES } from "../../config/themes";

export default function Sidebar({ industry, activePage, onNavigate, onLogout }) {
  const theme = NICHE_THEMES[industry] || NICHE_THEMES.agency;
  const accent = theme.accent;

  return (
    <div className="sidebar" style={{
      width: 260,
      background: BASE.surface,
      borderRight: `1px solid ${BASE.border}`,
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      position: "sticky",
      top: 0
    }}>
      {/* Branding Area */}
      <div style={{ padding: "24px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>{theme.icon}</span>
        <span style={{ fontWeight: 900, fontSize: 18, color: BASE.text }}>
          {industry.toUpperCase()}
        </span>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: "10px 0" }}>
        {theme.navItems.map((item, i) => {
          const isActive = activePage === item;
          return (
            <div
              key={item}
              onClick={() => onNavigate(item)}
              style={{
                padding: "12px 24px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: isActive ? BASE.text : BASE.textMid,
                background: isActive ? `${accent}15` : "transparent",
                borderLeft: `4px solid ${isActive ? accent : "transparent"}`,
                transition: "all 0.2s ease"
              }}
            >
              <span style={{ fontSize: 18 }}>{theme.navIcons[i]}</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{theme.navLabels[i]}</span>
            </div>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div style={{ padding: 20, borderTop: `1px solid ${BASE.border}` }}>
        <button 
          onClick={onLogout}
          style={{
            width: "100%", padding: 12, borderRadius: 8, background: `${BASE.red}15`,
            color: BASE.red, border: "none", fontWeight: 700, cursor: "pointer"
          }}
        >
          ✕ Logout
        </button>
      </div>
    </div>
  );
}