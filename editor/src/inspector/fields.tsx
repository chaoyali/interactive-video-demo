import type { CSSProperties, ReactNode } from 'react';

export const row: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 };
export const labelStyle: CSSProperties = { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#94a3b8' };
export const inputStyle: CSSProperties = {
  background: '#0b1220',
  color: '#e2e8f0',
  border: '1px solid #334155',
  borderRadius: 4,
  padding: '6px 8px',
  fontSize: 13,
  fontFamily: 'inherit',
};
export const sectionStyle: CSSProperties = {
  borderTop: '1px solid #1e293b',
  paddingTop: 10,
  marginTop: 14,
};
export const sectionTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#cbd5e1',
  marginBottom: 8,
};
export const buttonStyle: CSSProperties = {
  background: '#1e293b',
  border: '1px solid #334155',
  color: '#e2e8f0',
  borderRadius: 4,
  padding: '4px 8px',
  fontSize: 12,
  cursor: 'pointer',
};
export const dangerButtonStyle: CSSProperties = { ...buttonStyle, borderColor: '#7f1d1d', color: '#fecaca' };

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={row}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}
