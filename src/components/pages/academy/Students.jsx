import React from "react";
import { KpiCard } from "./../../shared/KpiCard";
import { Card } from "./../../shared/Card";

export default function SportsStudents({ data, accent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.recentStudents.map((s, i) => (
        <Card key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${accent}22`, color: accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
                {s.name.charAt(0)}
              </div>
              <div>
                <p style={{ fontWeight: 700, margin: 0 }}>{s.name}</p>
                <span style={{ fontSize: 11 }}>{s.course}</span>
              </div>
            </div>
            <StatusBadge status={s.status} />
          </div>
        </Card>
      ))}
    </div>
  );
}