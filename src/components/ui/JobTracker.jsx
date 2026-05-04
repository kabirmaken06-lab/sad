import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Card          from './ui/Card.jsx'
import Btn           from './ui/Btn.jsx'
import Input         from './ui/Input.jsx'
import SectionHeader from './ui/SectionHeader.jsx'
import { COLUMNS, COL_COLORS } from '../constants.js'

function JobTracker({ jobs, setJobs }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newJob,  setNewJob]  = useState({ title: '', company: '', salary: '', notes: '', status: 'Applied' })

  const addJob = () => {
    if (!newJob.title || !newJob.company) return
    setJobs(j => [
      ...j,
      { ...newJob, id: Date.now(), date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
    ])
    setNewJob({ title: '', company: '', salary: '', notes: '', status: 'Applied' })
    setShowAdd(false)
  }

  const moveJob   = (id, status) => setJobs(j => j.map(job => job.id === id ? { ...job, status } : job))
  const deleteJob = (id)         => setJobs(j => j.filter(job => job.id !== id))

  return (
    <div>
      <SectionHeader
        title="Job Tracker"
        subtitle="Track every application — from applied to offer"
        action={<Btn onClick={() => setShowAdd(s => !s)}><Plus size={14} />Add Job</Btn>}
      />

      {showAdd && (
        <Card style={{ marginBottom: 20 }}>
          <h4 style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600, margin: '0 0 16px' }}>New Application</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Input label="Job Title"    value={newJob.title}   onChange={v => setNewJob(j => ({ ...j, title: v }))}   placeholder="e.g. Engineer" />
            <Input label="Company"      value={newJob.company} onChange={v => setNewJob(j => ({ ...j, company: v }))} placeholder="e.g. Google" />
            <Input label="Salary Range" value={newJob.salary}  onChange={v => setNewJob(j => ({ ...j, salary: v }))}  placeholder="e.g. $120k–$150k" />
          </div>
          <Input label="Notes" value={newJob.notes} onChange={v => setNewJob(j => ({ ...j, notes: v }))} multiline rows={2} placeholder="Any notes..." style={{ marginBottom: 14 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={addJob}><Plus size={13} />Add Application</Btn>
            <Btn onClick={() => setShowAdd(false)} variant="ghost">Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Kanban columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        {COLUMNS.map(col => {
          const colJobs = jobs.filter(j => j.status === col)
          return (
            <div key={col} style={{ minWidth: 0 }}>
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COL_COLORS[col], flexShrink: 0 }} />
                <span style={{ color: '#94A3B8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col}</span>
                <span style={{ marginLeft: 'auto', color: '#64748B', fontSize: 11, fontWeight: 600, background: '#1E2D47', padding: '1px 6px', borderRadius: 10, flexShrink: 0 }}>{colJobs.length}</span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 200 }}>
                {colJobs.map(job => (
                  <div key={job.id} style={{ background: '#0F172A', border: '1px solid #1E2D47', borderRadius: 10, padding: '12px', borderLeft: `3px solid ${COL_COLORS[col]}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <p style={{ color: '#E2E8F0', fontSize: 12, fontWeight: 600, margin: 0, lineHeight: 1.4 }}>{job.title}</p>
                      <button onClick={() => deleteJob(job.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', padding: 2, flexShrink: 0 }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <p style={{ color: '#38BDF8', fontSize: 11, margin: '0 0 4px' }}>{job.company}</p>
                    {job.salary && <p style={{ color: '#64748B', fontSize: 11, margin: '0 0 4px' }}>{job.salary}</p>}
                    {job.notes  && <p style={{ color: '#475569', fontSize: 10, margin: '0 0 6px', lineHeight: 1.5, fontStyle: 'italic' }}>{job.notes}</p>}
                    <p style={{ color: '#334155', fontSize: 10, margin: '0 0 8px' }}>{job.date}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {COLUMNS.filter(c => c !== col).map(c => (
                        <button key={c} onClick={() => moveJob(job.id, c)}
                          style={{ background: '#0F2540', border: '1px solid #1E3A5A', color: '#64748B', fontSize: 9, fontWeight: 600, padding: '3px 6px', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                          → {c}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default JobTracker