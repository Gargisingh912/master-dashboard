import React from "react";
import { BASE, NICHE_THEMES } from "../../config/themes";

export default function DashboardSwitcher({ currentNiche, onSwitch, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }} onClick={onClose}>
      <div style={{
        width: "100%", maxWidth: 400, background: BASE.surface, borderRadius: 20,
        padding: 24, border: `1px solid ${BASE.border}`
      }} onClick={e => e.stopPropagation()}>
        
        <h3 style={{ color: BASE.text, marginBottom: 4 }}>Switch Dashboard</h3>
        <p style={{ color: BASE.textMid, fontSize: 13, marginBottom: 20 }}>
          Select an industry to re-skin your operations interface.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {Object.entries(NICHE_THEMES).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => { onSwitch(key); onClose(); }}
              style={{
                padding: 16, borderRadius: 12, border: `2px solid ${currentNiche === key ? theme.accent : BASE.border}`,
                background: currentNiche === key ? `${theme.accent}15` : BASE.card,
                color: currentNiche === key ? theme.accent : BASE.textMid,
                cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "all 0.2s"
              }}
            >
              <span style={{ fontSize: 24 }}>{theme.icon}</span>
              <span style={{ fontWeight: 800, fontSize: 12 }}>{theme.label.split(' ')}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={onClose}
          style={{ width: "100%", marginTop: 20, padding: 12, background: "none", border: "none", color: BASE.textDim, fontWeight: 700, cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}