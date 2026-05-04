import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary: { background: 'linear-gradient(135deg,#0EA5E9,#6366F1)', color: '#fff' },
  ghost:   { background: '#1E2D47', color: '#94A3B8' },
  danger:  { background: '#3B1212', color: '#F87171' },
  success: { background: '#0A2E20', color: '#34D399' },
}

const Btn = ({ children, onClick, loading, variant = 'primary', style = {}, disabled }) => {
  const isDisabled = disabled || loading
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '9px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'all 0.15s',
    opacity: isDisabled ? 0.6 : 1,
    fontFamily: 'inherit',
    ...style,
  }

  return (
    <button onClick={onClick} disabled={isDisabled} style={{ ...base, ...VARIANTS[variant] }}>
      {loading && (
        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
      )}
      {children}
    </button>
  )
}

export default Btn