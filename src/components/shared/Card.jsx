import { BASE } from "../../config/themes";

export const Card = ({ children, accent }) => (
  <div style={{
    background: BASE.card,
    border: `1px solid ${BASE.border}`,
    borderTop: `3px solid ${accent}`,
    borderRadius: '12px',
    padding: '16px',
    color: BASE.text
  }}>
    {children}
  </div>
);