const SectionHeader = ({ title, subtitle, action }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 24,
    }}
  >
    <div>
      <h2 style={{ color: '#E2E8F0', fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.4px' }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ color: '#64748B', fontSize: 13, margin: '4px 0 0' }}>{subtitle}</p>
      )}
    </div>
    {action}
  </div>
)

export default SectionHeader