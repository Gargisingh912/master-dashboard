import React from "react";
import { BASE, NICHE_THEMES } from "../config/themes"; 
import { KpiCard, Card, SectionHead } from "./shared/KpiCard"; 
export const AgencyOverview = ({ data, accent }) => {
  const { kpis } = data;
  const cur = "₹"; // Default currency from source [5]

  const agencyKpis = [
    { label: "Active Clients", value: kpis.activeClients, icon: "🤝", color: accent, sub: "Retainer-based", trend: 12 },
    { label: "Monthly Revenue", value: `${cur}${(kpis.totalRevenue / 1000).toFixed(0)}K`, icon: "💰", color: "#34D399", sub: "Total billings", trend: 18 },
    { label: "Active Campaigns", value: kpis.activeCampaigns, icon: "🚀", color: "#60A5FA", sub: "All clients", trend: 4 },
    { label: "Leads Generated", value: kpis.totalLeads.toLocaleString(), icon: "🎯", color: "#FBBF24", sub: "This month", trend: 28 },
    { label: "Pending Invoices", value: `${cur}${(kpis.pendingInvoices / 1000).toFixed(0)}K`, icon: "⚠", color: "#FB923C", sub: "Collection needed" },
    { label: "Net Profit", value: `${cur}${(kpis.netProfit / 1000).toFixed(0)}K`, icon: "✦", color: accent, sub: `${Math.round(kpis.netProfit / kpis.totalRevenue * 100)}% margin`, trend: 22 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
        {agencyKpis.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>
      {/* Revenue and Industry Charts go here [6] */}
    </div>
  );
};