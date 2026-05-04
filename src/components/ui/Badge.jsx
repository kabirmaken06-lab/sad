const Badge = ({ children, color = '#38BDF8' }) => (
  <span
    style={{
      background: color + '18',
      color,
      fontSize: 11,
      fontWeight: 700,
      padding: '3px 8px',
      borderRadius: 20,
      letterSpacing: '0.3px',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </span>
)

export default Badge