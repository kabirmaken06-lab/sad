function Input({ label, value, onChange, placeholder, type = 'text', multiline, rows = 3, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</label>}
      {multiline ? (
        <textarea
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={placeholder}
          rows={rows}
          style={{ background: '#070D1A', border: '1px solid #1E2D47', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, ...style }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={placeholder}
          style={{ background: '#070D1A', border: '1px solid #1E2D47', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 13, outline: 'none', fontFamily: 'inherit', ...style }}
        />
      )}
    </div>
  )
}

export default Input
