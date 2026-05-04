const Card = ({ children, style = {} }) => (
  <div
    style={{
      background: '#0F172A',
      border: '1px solid #1E2D47',
      borderRadius: 12,
      padding: '20px 24px',
      ...style,
    }}
  >
    {children}
  </div>
)

export default Card