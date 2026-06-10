import React, { useState } from "react";
import { BASE, NICHE_THEMES } from "../config/themes";

export default function DashboardLayout({ children, industry, role, onLogout, activePage, onNavigate }) {
  const theme = NICHE_THEMES[industry] || NICHE_THEMES.agency;
  const accent = theme.accent;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: BASE.bg, color: BASE.text }}>
      {/* Sidebar */}
      <div style={{ width: 260, background: BASE.surface, borderRight: `1px solid ${BASE.border}`, padding: "20px 0" }}>
        <div style={{ padding: "0 24px 30px", fontSize: 24, fontWeight: 900, color: accent }}>
          {theme.icon} {industry.toUpperCase()}
        </div>
        
        {theme.navItems.map((item, i) => (
          <div 
            key={item} 
            onClick={() => onNavigate(item)}
            style={{ 
              padding: "12px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
              background: activePage === item ? `${accent}15` : "transparent",
              borderLeft: activePage === item ? `4px solid ${accent}` : "4px solid transparent",
              color: activePage === item ? BASE.text : BASE.textMid
            }}
          >
            <span>{theme.navIcons[i]}</span>
            <span style={{ fontWeight: 600 }}>{theme.navLabels[i]}</span>
          </div>
        ))}
        
        <button onClick={onLogout} style={{ marginTop: "auto", width: "100%", padding: 12, color: BASE.red, background: "none", border: "none", cursor: "pointer" }}>
          Logout
        </button>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, padding: 32, overflowY: "auto" }}>
        <header style={{ marginBottom: 32, display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>{activePage.charAt(0).toUpperCase() + activePage.slice(1)}</h2>
          <div style={{ color: BASE.textDim }}>Role: <span style={{ color: accent }}>{role}</span></div>
        </header>
        {children}
      </main>
    </div>
  );
}