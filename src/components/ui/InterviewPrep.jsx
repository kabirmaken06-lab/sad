import { useState } from 'react'
import { Brain, Sparkles, MessageSquare, ChevronUp, ChevronDown, Loader2 } from 'lucide-react'
import Card          from './ui/Card.jsx'
import Btn           from './ui/Btn.jsx'
import Input         from './ui/Input.jsx'
import Badge         from './ui/Badge.jsx'
import SectionHeader from './ui/SectionHeader.jsx'
import { callClaude } from '../../api.js'

const TYPE_COLORS = {
  Behavioral:         '#38BDF8',
  Technical:          '#A78BFA',
  'System Design':    '#F59E0B',
  'Company-specific': '#34D399',
}

function InterviewPrep() {
  const [role,            setRole]           = useState('Senior Frontend Engineer')
  const [company,         setCompany]        = useState('Stripe')
  const [questions,       setQuestions]      = useState([])
  const [loadingQ,        setLoadingQ]       = useState(false)
  const [answers,         setAnswers]        = useState({})
  const [feedback,        setFeedback]       = useState({})
  const [loadingFeedback, setLoadingFeedback]= useState({})
  const [expanded,        setExpanded]       = useState(null)

  const generateQuestions = async () => {
    setLoadingQ(true)
    setQuestions([])
    setAnswers({})
    setFeedback({})
    try {
      const text = await callClaude(
        [{
          role: 'user',
          content: `Generate 6 interview questions for a ${role} position at ${company}. Mix: 2 behavioral, 2 technical, 1 system design, 1 company-specific. Return ONLY a JSON array of objects: [{"id":1,"type":"Behavioral","question":"..."},...]`,
        }],
        'You are an expert interview coach. Return only valid JSON.'
      )
      const clean = text.replace(/```json|```/g, '').trim()
      setQuestions(JSON.parse(clean))
    } catch (e) { console.error(e) }
    setLoadingQ(false)
  }

  const getFeedback = async (qId, question, answer) => {
    setLoadingFeedback(f => ({ ...f, [qId]: true }))
    try {
      const fb = await callClaude(
        [{
          role: 'user',
          content: `Interview question: "${question}"\nCandidate's answer: "${answer}"\n\nProvide coaching feedback in 2-3 sentences: what was good, what to improve, and a tip. Be specific and actionable.`,
        }],
        'You are an expert interview coach.',
        400
      )
      setFeedback(f => ({ ...f, [qId]: fb }))
    } catch (e) { console.error(e) }
    setLoadingFeedback(f => ({ ...f, [qId]: false }))
  }

  return (
    <div>
      <SectionHeader title="AI Interview Prep" subtitle="Practice with role-specific questions and get real-time coaching" />

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Input label="Target Role" value={role}    onChange={setRole}    placeholder="e.g. Senior Engineer" style={{ flex: 1, minWidth: 160 }} />
          <Input label="Company"     value={company} onChange={setCompany} placeholder="e.g. Google"          style={{ flex: 1, minWidth: 160 }} />
          <Btn onClick={generateQuestions} loading={loadingQ} style={{ flexShrink: 0, padding: '10px 20px' }}>
            <Brain size={14} />Generate Questions
          </Btn>
        </div>
      </Card>

      {loadingQ && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '60px 0' }}>
          <Loader2 size={28} color="#38BDF8" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>Generating tailored interview questions...</p>
        </div>
      )}

      {questions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {questions.map((q, i) => (
            <Card key={q.id}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#1E2D47', color: '#64748B', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <Badge color={TYPE_COLORS[q.type] || '#38BDF8'}>{q.type}</Badge>
                  <p style={{ color: '#E2E8F0', fontSize: 14, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>{q.question}</p>
                </div>
                <button onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4, flexShrink: 0, marginLeft: 12 }}>
                  {expanded === q.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {expanded === q.id && (
                <div style={{ marginTop: 16 }}>
                  <textarea
                    value={answers[q.id] || ''}
                    onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                    placeholder="Type your answer here to get AI coaching feedback..."
                    rows={4}
                    style={{ width: '100%', background: '#070D1A', border: '1px solid #1E2D47', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, marginBottom: feedback[q.id] ? 14 : 0 }}>
                    <Btn
                      onClick={() => getFeedback(q.id, q.question, answers[q.id])}
                      loading={loadingFeedback[q.id]}
                      disabled={!answers[q.id]?.trim()}
                      variant="ghost"
                    >
                      <MessageSquare size={13} />Get AI Feedback
                    </Btn>
                  </div>
                  {feedback[q.id] && (
                    <div style={{ background: '#0A1628', border: '1px solid #1E3A5A', borderRadius: 10, padding: '14px 16px' }}>
                      <p style={{ color: '#38BDF8', fontSize: 12, fontWeight: 700, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles size={13} />Coaching Feedback
                      </p>
                      <p style={{ color: '#CBD5E1', fontSize: 13, margin: 0, lineHeight: 1.7 }}>{feedback[q.id]}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {!loadingQ && questions.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '80px 0', opacity: 0.5 }}>
          <Brain size={40} color="#334155" />
          <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>Set your role and company, then generate questions</p>
        </div>
      )}
    </div>
  )
}

export default InterviewPrep
