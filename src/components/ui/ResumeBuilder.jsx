import { useState } from 'react'
import { Download, User, Briefcase, GraduationCap, Wrench, X, Plus, Sparkles } from 'lucide-react'
import Card          from './ui/Card.jsx'
import Btn           from './ui/Btn.jsx'
import Input         from './ui/Input.jsx'
import SectionHeader from './ui/SectionHeader.jsx'
import { callClaude }    from '../../api.js'
import { INITIAL_RESUME } from '../constants.js'

const SECTIONS = [
  { id: 'personal',   label: 'Personal Info', icon: User },
  { id: 'experience', label: 'Experience',    icon: Briefcase },
  { id: 'education',  label: 'Education',     icon: GraduationCap },
  { id: 'skills',     label: 'Skills',        icon: Wrench },
]

function ResumeBuilder() {
  const [resume,        setResume]        = useState(INITIAL_RESUME)
  const [activeSection, setActiveSection] = useState('personal')
  const [loadingBullet, setLoadingBullet] = useState(null)
  const [loadingSummary,setLoadingSummary]= useState(false)

  const setExp = (id, patch) =>
    setResume(r => ({ ...r, experience: r.experience.map(e => e.id === id ? { ...e, ...patch } : e) }))

  const setEdu = (id, patch) =>
    setResume(r => ({ ...r, education: r.education.map(e => e.id === id ? { ...e, ...patch } : e) }))

  const enhanceBullet = async (expId, bulletIdx) => {
    const key = `${expId}-${bulletIdx}`
    setLoadingBullet(key)
    const exp    = resume.experience.find(e => e.id === expId)
    const bullet = exp.bullets[bulletIdx]
    try {
      const enhanced = await callClaude(
        [{ role: 'user', content: `Rewrite this resume bullet point to be more achievement-oriented, quantified, and impactful. Return ONLY the improved bullet, nothing else:\n\n"${bullet}"` }],
        'You are a professional resume writer. Improve bullet points to be achievement-oriented with metrics.'
      )
      setExp(expId, {
        bullets: exp.bullets.map((b, i) => i === bulletIdx ? enhanced.replace(/^["']|["']$/g, '') : b),
      })
    } catch (e) { console.error(e) }
    setLoadingBullet(null)
  }

  const enhanceSummary = async () => {
    setLoadingSummary(true)
    try {
      const s = await callClaude(
        [{ role: 'user', content: `Improve this professional summary for a resume. Make it compelling, specific, and 2-3 sentences. Return ONLY the summary:\n\n"${resume.summary}"` }],
        'You are a professional resume writer.'
      )
      setResume(r => ({ ...r, summary: s.replace(/^["']|["']$/g, '') }))
    } catch (e) { console.error(e) }
    setLoadingSummary(false)
  }

  /* shared textarea style */
  const ta = { background: '#070D1A', border: '1px solid #1E2D47', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, width: '100%' }

  return (
    <div>
      <SectionHeader
        title="Resume Builder"
        subtitle="Build an ATS-optimized resume with AI assistance"
        action={<Btn variant="success"><Download size={14} />Export PDF</Btn>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* ── EDITOR ── */}
        <div>
          {/* Section tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveSection(id)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: `1px solid ${activeSection === id ? '#38BDF8' : '#1E2D47'}`, background: activeSection === id ? '#0F2540' : '#0F172A', color: activeSection === id ? '#38BDF8' : '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>

          {/* ─ Personal ─ */}
          {activeSection === 'personal' && (
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Input label="Full Name" value={resume.name}     onChange={v => setResume(r => ({ ...r, name: v }))} />
                  <Input label="Email"     value={resume.email}    onChange={v => setResume(r => ({ ...r, email: v }))} />
                  <Input label="Phone"     value={resume.phone}    onChange={v => setResume(r => ({ ...r, phone: v }))} />
                  <Input label="Location"  value={resume.location} onChange={v => setResume(r => ({ ...r, location: v }))} />
                </div>
                <Input label="LinkedIn" value={resume.linkedin} onChange={v => setResume(r => ({ ...r, linkedin: v }))} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Summary</label>
                    <Btn onClick={enhanceSummary} loading={loadingSummary} variant="ghost" style={{ padding: '5px 10px', fontSize: 11 }}>
                      <Sparkles size={12} />AI Enhance
                    </Btn>
                  </div>
                  <textarea value={resume.summary} onChange={e => setResume(r => ({ ...r, summary: e.target.value }))} rows={3} style={ta} />
                </div>
              </div>
            </Card>
          )}

          {/* ─ Experience ─ */}
          {activeSection === 'experience' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {resume.experience.map(exp => (
                <Card key={exp.id}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <Input label="Job Title" value={exp.title}    onChange={v => setExp(exp.id, { title: v })} />
                    <Input label="Company"   value={exp.company}  onChange={v => setExp(exp.id, { company: v })} />
                    <Input label="Duration"  value={exp.duration} onChange={v => setExp(exp.id, { duration: v })} />
                  </div>
                  <label style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Bullet Points</label>
                  {exp.bullets.map((bullet, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                      <textarea
                        value={bullet}
                        onChange={e => setExp(exp.id, { bullets: exp.bullets.map((b, idx) => idx === i ? e.target.value : b) })}
                        rows={2}
                        style={{ ...ta, resize: 'none', fontSize: 12 }}
                      />
                      <Btn onClick={() => enhanceBullet(exp.id, i)} loading={loadingBullet === `${exp.id}-${i}`} variant="ghost" style={{ padding: '7px 10px', flexShrink: 0 }}>
                        <Sparkles size={12} />
                      </Btn>
                    </div>
                  ))}
                  <button
                    onClick={() => setExp(exp.id, { bullets: [...exp.bullets, ''] })}
                    style={{ background: 'none', border: '1px dashed #1E2D47', color: '#64748B', fontSize: 12, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                    + Add bullet
                  </button>
                </Card>
              ))}
              <button
                onClick={() => setResume(r => ({ ...r, experience: [...r.experience, { id: Date.now(), title: '', company: '', duration: '', bullets: [''] }] }))}
                style={{ background: '#070D1A', border: '1px dashed #1E2D47', color: '#64748B', fontSize: 13, padding: '12px', borderRadius: 10, cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                <Plus size={14} />Add Experience
              </button>
            </div>
          )}

          {/* ─ Education ─ */}
          {activeSection === 'education' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {resume.education.map(ed => (
                <Card key={ed.id}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Input label="Degree" value={ed.degree} onChange={v => setEdu(ed.id, { degree: v })} />
                    <Input label="School" value={ed.school} onChange={v => setEdu(ed.id, { school: v })} />
                    <Input label="Year"   value={ed.year}   onChange={v => setEdu(ed.id, { year: v })} />
                  </div>
                </Card>
              ))}
              <button
                onClick={() => setResume(r => ({ ...r, education: [...r.education, { id: Date.now(), degree: '', school: '', year: '' }] }))}
                style={{ background: '#070D1A', border: '1px dashed #1E2D47', color: '#64748B', fontSize: 13, padding: '12px', borderRadius: 10, cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                <Plus size={14} />Add Education
              </button>
            </div>
          )}

          {/* ─ Skills ─ */}
          {activeSection === 'skills' && (
            <Card>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {resume.skills.map((skill, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0F2540', color: '#38BDF8', fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 20, border: '1px solid #1E4A6E' }}>
                    {skill}
                    <button onClick={() => setResume(r => ({ ...r, skills: r.skills.filter((_, idx) => idx !== i) }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#38BDF8', padding: 0, display: 'flex' }}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                placeholder="Type a skill and press Enter..."
                style={{ width: '100%', background: '#070D1A', border: '1px solid #1E2D47', borderRadius: 8, padding: '9px 12px', color: '#E2E8F0', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    setResume(r => ({ ...r, skills: [...r.skills, e.target.value.trim()] }))
                    e.target.value = ''
                  }
                }}
              />
            </Card>
          )}
        </div>

        {/* ── LIVE PREVIEW ── */}
        <div>
          <p style={{ color: '#64748B', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Live Preview</p>
          <div style={{ background: '#fff', borderRadius: 12, padding: '32px 28px', color: '#1a1a1a', fontSize: 12, lineHeight: 1.6, border: '1px solid #1E2D47', maxHeight: 600, overflowY: 'auto' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #1a1a1a', paddingBottom: 12, marginBottom: 16 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: '#111' }}>{resume.name}</h1>
              <p style={{ color: '#555', margin: 0, fontSize: 11 }}>{resume.email} · {resume.phone} · {resume.location}</p>
              <p style={{ color: '#2563EB', margin: '2px 0 0', fontSize: 11 }}>{resume.linkedin}</p>
            </div>

            {resume.summary && (
              <>
                <h2 style={{ fontSize: 11, fontWeight: 700, color: '#111', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px', borderBottom: '1px solid #ddd', paddingBottom: 4 }}>Summary</h2>
                <p style={{ margin: '0 0 16px', color: '#333', fontSize: 11 }}>{resume.summary}</p>
              </>
            )}

            <h2 style={{ fontSize: 11, fontWeight: 700, color: '#111', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px', borderBottom: '1px solid #ddd', paddingBottom: 4 }}>Experience</h2>
            {resume.experience.map(exp => (
              <div key={exp.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: 12 }}>{exp.title}</strong>
                  <span style={{ color: '#555', fontSize: 11 }}>{exp.duration}</span>
                </div>
                <p style={{ color: '#2563EB', margin: '1px 0 4px', fontSize: 11 }}>{exp.company}</p>
                <ul style={{ margin: 0, paddingLeft: 14 }}>
                  {exp.bullets.map((b, i) => <li key={i} style={{ color: '#333', marginBottom: 2, fontSize: 11 }}>{b}</li>)}
                </ul>
              </div>
            ))}

            <h2 style={{ fontSize: 11, fontWeight: 700, color: '#111', textTransform: 'uppercase', letterSpacing: '1px', margin: '8px 0', borderBottom: '1px solid #ddd', paddingBottom: 4 }}>Education</h2>
            {resume.education.map(ed => (
              <div key={ed.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <strong style={{ fontSize: 12 }}>{ed.degree}</strong><br />
                  <span style={{ color: '#555', fontSize: 11 }}>{ed.school}</span>
                </div>
                <span style={{ color: '#555', fontSize: 11 }}>{ed.year}</span>
              </div>
            ))}

            <h2 style={{ fontSize: 11, fontWeight: 700, color: '#111', textTransform: 'uppercase', letterSpacing: '1px', margin: '8px 0', borderBottom: '1px solid #ddd', paddingBottom: 4 }}>Skills</h2>
            <p style={{ margin: 0, color: '#333', fontSize: 11 }}>{resume.skills.join(' · ')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumeBuilder
