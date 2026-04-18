type Props = { errors: string[] };

export function ValidationPanel({ errors }: Props) {
  if (errors.length === 0) return null;
  return (
    <div
      style={{
        background: '#2a0e0e',
        borderTop: '1px solid #7f1d1d',
        color: '#fecaca',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 12,
        padding: '8px 16px',
        maxHeight: 140,
        overflowY: 'auto',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Validation errors</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {errors.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
    </div>
  );
}
