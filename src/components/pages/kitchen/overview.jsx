import React from "react";
import { KpiCard } from "./../../shared/KpiCard";
import { Card } from "./../../shared/Card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";

export default function RestaurantOverview({ data, accent }) {
  const { kpis, revenueChart, ordersChart } = data;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
        <KpiCard label="Today's Orders" value={kpis.todayOrders} icon="🛒" color="#60A5FA" sub={`${kpis.pendingOrders} pending`} trend={8} />
        <KpiCard label="Today's Revenue" value={`₹${kpis.todayRevenue.toLocaleString()}`} icon="💰" color={accent} sub="Daily total" trend={12} />
      </div>
      <Card>
        <SectionHead title="Revenue vs Expenses — 6 Months" />
        <ResponsiveContainer width="100%" height={170}>
          <AreaChart data={revenueChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1C2B42" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Area type="monotone" dataKey="revenue" stroke={accent} fill={accent} fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}