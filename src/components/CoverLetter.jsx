import { useState } from 'react'
import { Mail, Sparkles, RefreshCw, Download, Loader2 } from 'lucide-react'
import Card          from './ui/Card.jsx'
import Btn           from './ui/Btn.jsx'
import Input         from './ui/Input.jsx'
import Badge         from './ui/Badge.jsx'
import SectionHeader from './ui/SectionHeader.jsx'
import { callClaude } from '../api.js'

const TONES = [
  { value: 'confident',    label: 'Confident',    color: '#38BDF8' },
  { value: 'formal',       label: 'Formal',       color: '#94A3B8' },
  { value: 'creative',     label: 'Creative',     color: '#A78BFA' },
  { value: 'enthusiastic', label: 'Enthusiastic', color: '#34D399' },
]

function CoverLetter() {
  const [jobTitle,      setJobTitle]      = useState('Senior Frontend Engineer')
  const [company,       setCompany]       = useState('Stripe')
  const [tone,          setTone]          = useState('confident')
  const [extraContext,  setExtraContext]  = useState('I have 5 years of experience in React and TypeScript, and I led a team that shipped a real-time payments dashboard.')
  const [letter,        setLetter]        = useState('')
  const [loading,       setLoading]       = useState(false)

  const generate = async () => {
    setLoading(true)
    setLetter('')
    try {
      const text = await callClaude(
        [{
          role: 'user',
          content: `Write a ${tone} cover letter for a ${jobTitle} position at ${company}.\nAdditional context: ${extraContext}\nThe letter should be 3 paragraphs: opening hook, value proposition with specifics, closing call to action.\nReturn only the letter text, no subject line.`,
        }],
        'You are an expert career coach and cover letter writer.',
        800
      )
      setLetter(text)
    } catch (e) {
      setLetter('Error generating letter — please try again.')
    }
    setLoading(false)
  }

  return (
    <div>
      <SectionHeader title="Cover Letter Generator" subtitle="One-click AI cover letters tailored to each job" />

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
        {/* Config panel */}
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Job Title" value={jobTitle} onChange={setJobTitle} placeholder="e.g. Senior Engineer" />
            <Input label="Company"   value={company}  onChange={setCompany}  placeholder="e.g. Stripe" />

            <div>
              <label style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Tone</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {TONES.map(t => (
                  <button key={t.value} onClick={() => setTone(t.value)}
                    style={{ padding: '8px', borderRadius: 8, border: `1px solid ${tone === t.value ? t.color : '#1E2D47'}`, background: tone === t.value ? t.color + '15' : '#070D1A', color: tone === t.value ? t.color : '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <Input label="Your Background (brief)" value={extraContext} onChange={setExtraContext} multiline rows={3} placeholder="Key achievements, skills, years of experience..." />

            <Btn onClick={generate} loading={loading} style={{ width: '100%', justifyContent: 'center' }}>
              <Sparkles size={14} />Generate Letter
            </Btn>
          </div>
        </Card>

        {/* Output */}
        <Card style={{ minHeight: 400 }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
              <Loader2 size={28} color="#38BDF8" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>Crafting your letter...</p>
            </div>
          )}
          {!loading && !letter && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, opacity: 0.5 }}>
              <Mail size={36} color="#334155" />
              <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>Fill in the details and click Generate</p>
            </div>
          )}
          {letter && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Badge color="#34D399">Generated</Badge>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn onClick={generate} variant="ghost" style={{ padding: '6px 12px', fontSize: 12 }}><RefreshCw size={12} />Regenerate</Btn>
                  <Btn variant="success" style={{ padding: '6px 12px', fontSize: 12 }}><Download size={12} />Export</Btn>
                </div>
              </div>
              <div style={{ color: '#CBD5E1', fontSize: 14, lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{letter}</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default CoverLetter