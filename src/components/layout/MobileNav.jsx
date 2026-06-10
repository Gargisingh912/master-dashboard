import React from "react";
import { BASE, NICHE_THEMES } from "../../config/themes";

export default function MobileNav({ industry, activePage, onNavigate }) {
  const theme = NICHE_THEMES[industry] || NICHE_THEMES.agency;
  const accent = theme.accent;

  // Show first 5 items on mobile to prevent crowding
  const mobileItems = theme.navItems.slice(0, 5);

  return (
    <div className="mobile-btm" style={{
      position: "fixed", bottom: 0, left: 0, right: 0, height: 65,
      background: BASE.surface, borderTop: `1px solid ${BASE.border}`,
      display: "flex", justifyContent: "space-around", alignItems: "center",
      zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)"
    }}>
      {mobileItems.map((item, i) => {
        const isActive = activePage === item;
        return (
          <div
            key={item}
            onClick={() => onNavigate(item)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, color: isActive ? accent : BASE.textDim, cursor: "pointer"
            }}
          >
            <span style={{ fontSize: 20 }}>{theme.navIcons[i]}</span>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>
              {theme.navLabels[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}