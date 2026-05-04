import { LayoutDashboard, FileText, Target, Mail, Kanban, Brain, Star, Menu } from 'lucide-react'

const NAV = [
  { id: 'dashboard', label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'resume',    label: 'Resume Builder', icon: FileText },
  { id: 'ats',       label: 'ATS Analyzer',   icon: Target },
  { id: 'cover',     label: 'Cover Letter',   icon: Mail },
  { id: 'tracker',   label: 'Job Tracker',    icon: Kanban },
  { id: 'interview', label: 'Interview Prep', icon: Brain },
]

function Sidebar({ view, setView, collapsed, setCollapsed }) {
  return (
    <aside
      style={{
        width: collapsed ? 64 : 220,
        background: '#070D1A',
        borderRight: '1px solid #1E2D47',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflow: 'hidden',
      }}
    >
      {/* Logo row */}
      <div
        style={{
          padding: '20px 16px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: '1px solid #1E2D47',
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            background: 'linear-gradient(135deg,#38BDF8,#6366F1)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Star size={15} color="#fff" fill="#fff" />
        </div>
        {!collapsed && (
          <span style={{ color: '#E2E8F0', fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
            CareerAI
          </span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 2, display: 'flex', flexShrink: 0 }}
        >
          <Menu size={16} />
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px 14px' : '9px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background: active ? '#0F2540' : 'transparent',
                color: active ? '#38BDF8' : '#64748B',
                fontWeight: active ? 600 : 400,
                fontSize: 13,
                textAlign: 'left',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                fontFamily: 'inherit',
                width: '100%',
              }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              {!collapsed && label}
            </button>
          )
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid #1E2D47' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: '#1E2D47',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 12,
              color: '#38BDF8',
              fontWeight: 700,
            }}
          >
            AJ
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <p style={{ color: '#E2E8F0', fontSize: 12, fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Alex Johnson
              </p>
              <p style={{ color: '#64748B', fontSize: 11, margin: 0 }}>Free Plan</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar