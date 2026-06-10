import React, { useState } from 'react';
import Sidebar from './layout/Sidebar';
import { BASE, NICHE_THEMES } from '../config/themes';

// Import Niche-specific Pages
import AgencyOverview from './pages/agency/overview'; // Assumes you have an index.jsx or Overview.jsx inside
import RestaurantOverview from './pages/kitchen/overview'; 
import SalonAppointments from './pages/salon/Appointments';
import SportsStudents from './pages/academy/Students';

export default function Dashboard({ org, role, niche, onLogout }) {
  const [activePage, setActivePage] = useState("overview");
  
  // Use the themes defined in your config to apply branding [1]
  const theme = NICHE_THEMES[niche] || NICHE_THEMES.agency;
  const accent = theme.accent;

  // Logic to render the correct page based on the niche [2]
  const renderContent = () => {
    switch (niche) {
      case "agency":
        return <AgencyOverview org={org} accent={accent} />;
      case "restaurant":
        return <RestaurantOverview org={org} accent={accent} />;
      case "salon":
        return <SalonAppointments org={org} accent={accent} />;
      case "sports":
        return <SportsStudents org={org} accent={accent} />;
      default:
        return <div style={{ color: BASE.text }}>Select a valid niche in settings.</div>;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: BASE.bg }}>
      {/* Persistent Sidebar [3] */}
      <Sidebar 
        industry={niche} 
        activePage={activePage} 
        onNavigate={setActivePage} 
        onLogout={onLogout} 
      />

      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        <header style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ color: BASE.text, margin: 0, textTransform: "capitalize" }}>
            {activePage}
          </h2>
          <div style={{ color: BASE.textDim, fontSize: "12px" }}>
            {org?.name} • <span style={{ color: accent }}>{role}</span>
          </div>
        </header>

        {/* Dynamic Niche Content [2] */}
        <div className="page-anim">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}