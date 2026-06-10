import React from "react";
import { KpiCard } from "./../../shared/KpiCard";
import { Card } from "./../../shared/Card";

export default function AgencyOverview({ data, accent }) {
  const { kpis } = data;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
        <KpiCard label="Active Clients" value={kpis.activeClients} icon="🤝" color={accent} sub="Retainer-based" trend={12} />
        <KpiCard label="Monthly Revenue" value={`₹${(kpis.totalRevenue / 1000).toFixed(0)}K`} icon="💰" color="#34D399" trend={18} />
        <KpiCard label="Active Campaigns" value={kpis.activeCampaigns} icon="🚀" color="#60A5FA" sub="All clients" trend={4} />
        <KpiCard label="Leads Generated" value={kpis.totalLeads.toLocaleString()} icon="🎯" color="#FBBF24" trend={28} />
      </div>
    </div>
  );
}