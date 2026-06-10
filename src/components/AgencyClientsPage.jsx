export const AgencyClientsPage = ({ data, accent }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {data.clients.map((client, i) => (
        <Card key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: accent + "22", color: accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
                {client.name.charAt(0)}
              </div>
              <div>
                <p style={{ color: "#F0F6FF", fontWeight: 700, margin: 0 }}>{client.name}</p>
                <p style={{ color: "#7B9EC4", fontSize: 11 }}>{client.industry} · {client.campaigns} campaigns</p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: "#34D399", fontWeight: 900 }}>₹{client.retainer.toLocaleString()}/mo</p>
              <StatusBadge status={client.status} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};