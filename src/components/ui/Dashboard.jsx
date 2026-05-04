import { Send, MessageSquare, Award, TrendingUp, Sparkles, ArrowRight, Briefcase, FileText, Target, Mail, Brain } from 'lucide-react'
import Card  from './ui/Card.jsx'
import Badge from './ui/Badge.jsx'
import { COL_COLORS } from '../constants.js'

function Dashboard({ jobs, setView }) {
  const stats = [
    { label: 'Applications Sent', val: jobs.length,                                                                                                       icon: Send,         color: '#38BDF8' },
    { label: 'Interviews',        val: jobs.filter(j => j.status === 'Interview').length,                                                                  icon: MessageSquare, color: '#A78BFA' },
    { label: 'Offers',            val: jobs.filter(j => j.status === 'Offer').length,                                                                      icon: Award,        color: '#34D399' },
    { label: 'Response Rate',     val: Math.round((jobs.filter(j => j.status !== 'Applied' && j.status !== 'Rejected').length / jobs.length) * 100) + '%', icon: TrendingUp,   color: '#F59E0B' },
  ]

  const quickActions = [
    { label: 'Build Resume',       icon: FileText, view: 'resume',    color: '#38BDF8' },
    { label: 'Analyze ATS Fit',    icon: Target,   view: 'ats',       color: '#A78BFA' },
    { label: 'Write Cover Letter', icon: Mail,     view: 'cover',     color: '#34D399' },
    { label: 'Prep for Interview', icon: Brain,    view: 'interview', color: '#F59E0B' },
  ]

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#E2E8F0', fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
          Good morning, Alex 👋
        </h1>
        <p style={{ color: '#64748B', fontSize: 14, margin: '6px 0 0' }}>
          You have {jobs.filter(j => j.status === 'Interview').length} upcoming interviews. Keep pushing!
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map(({ label, val, icon: Icon, color }) => (
          <Card key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <p style={{ color: '#64748B', fontSize: 12, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} color={color} />
              </div>
            </div>
            <p style={{ color, fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-1px' }}>{val}</p>
          </Card>
        ))}
      </div>

      {/* Two-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Quick actions */}
        <Card>
          <h3 style={{ color: '#E2E8F0', fontSize: 14, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={14} color="#38BDF8" />Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quickActions.map(({ label, icon: Icon, view, color }) => (
              <button
                key={view}
                onClick={() => setView(view)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#070D1A', border: '1px solid #1E2D47', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%' }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color={color} />
                </div>
                <span style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 500 }}>{label}</span>
                <ArrowRight size={14} color="#334155" style={{ marginLeft: 'auto' }} />
              </button>
            ))}
          </div>
        </Card>

        {/* Recent applications */}
        <Card>
          <h3 style={{ color: '#E2E8F0', fontSize: 14, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={14} color="#38BDF8" />Recent Applications
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {jobs.slice(0, 4).map(job => (
              <div
                key={job.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#070D1A', borderRadius: 8, border: '1px solid #1E2D47' }}
              >
                <div>
                  <p style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 500, margin: 0 }}>{job.title}</p>
                  <p style={{ color: '#64748B', fontSize: 11, margin: '2px 0 0' }}>{job.company} · {job.date}</p>
                </div>
                <Badge color={COL_COLORS[job.status]}>{job.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard