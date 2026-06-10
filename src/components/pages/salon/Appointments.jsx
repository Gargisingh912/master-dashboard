import React, { useState } from "react";
import { KpiCard } from "./../../shared/KpiCard";
import { Card } from "./../../shared/Card";

export default function SalonAppointments({ data, accent }) {
  const [filter, setFilter] = useState("all");
  const appointments = filter === "all" ? data.recentAppointments : data.recentAppointments.filter(a => a.status === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {appointments.map((a, i) => (
        <Card key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ color: "#F0F6FF", fontWeight: 700, margin: 0 }}>{a.client}</p>
              <p style={{ color: "#7B9EC4", fontSize: 11 }}>{a.service} · {a.time}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: "#34D399", fontWeight: 900, margin: "0 0 6px" }}>₹{a.amount.toLocaleString()}</p>
              <StatusBadge status={a.status} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}