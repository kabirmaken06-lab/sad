import { useState } from 'react'
import { Target, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import Card          from './ui/Card.jsx'
import Btn           from './ui/Btn.jsx'
import Input         from './ui/Input.jsx'
import Badge         from './ui/Badge.jsx'
import SectionHeader from './ui/SectionHeader.jsx'
import { callClaude } from '../../api.js'

function ATSAnalyzer() {
  const [resumeText, setResumeText] = useState(
    'Senior Software Engineer with 5+ years of experience in React, Node.js, TypeScript, PostgreSQL, AWS, and Docker. Led teams of 4+ engineers, built microservices, reduced latency by 40%, and improved CI/CD pipelines by 60%.'
  )
  const [jobDesc, setJobDesc] = useState(
    'We are looking for a Senior Frontend Engineer with strong experience in React, TypeScript, Next.js, and GraphQL. The ideal candidate has experience with AWS, CI/CD pipelines, and leading engineering teams. Knowledge of PostgreSQL and Docker is a plus.'
  )
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)

  const analyze = async () => {
    setLoading(true)
    setResult(null)
    try {
      const text = await callClaude(
        [{
          role: 'user',
          content: `Analyze this resume against the job description and return ONLY a JSON object (no markdown) with this exact structure:
{"score": <0-100 number>, "matched_keywords": [<array of matched keywords>], "missing_keywords": [<array of missing keywords>], "suggestions": [<array of 4 specific improvement suggestions>], "summary": "<2 sentence assessment>"}

RESUME: ${resumeText}

JOB DESCRIPTION: ${jobDesc}`,
        }],
        'You are an expert ATS resume analyzer. Return only valid JSON, no markdown.'
      )
      const clean = text.replace(/```json|```/g, '').trim()
      setResult(JSON.parse(clean))
    } catch (e) {
      setResult({ score: 0, matched_keywords: [], missing_keywords: [], suggestions: ['Error analyzing — try again'], summary: 'Could not parse results.' })
    }
    setLoading(false)
  }

  const scoreColor = result
    ? result.score >= 75 ? '#34D399' : result.score >= 50 ? '#F59E0B' : '#F87171'
    : '#38BDF8'

  return (
    <div>
      <SectionHeader title="ATS Analyzer" subtitle="See how well your resume matches a job description" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Input label="Your Resume Text" value={resumeText} onChange={setResumeText} multiline rows={8} placeholder="Paste your resume content here..." />
        <Input label="Job Description"  value={jobDesc}    onChange={setJobDesc}    multiline rows={8} placeholder="Paste the job description here..." />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <Btn onClick={analyze} loading={loading} style={{ padding: '12px 32px', fontSize: 14 }}>
          <Target size={15} />Analyze Match
        </Btn>
      </div>

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
          {/* Score circle */}
          <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', border: `6px solid ${scoreColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, background: scoreColor + '10' }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: scoreColor }}>{result.score}%</span>
            </div>
            <p style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>ATS Match</p>
            <Badge color={scoreColor}>{result.score >= 75 ? 'Strong' : result.score >= 50 ? 'Moderate' : 'Weak'}</Badge>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card>
              <p style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>Assessment</p>
              <p style={{ color: '#CBD5E1', fontSize: 13, margin: 0, lineHeight: 1.7 }}>{result.summary}</p>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Card>
                <p style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} color="#34D399" />Matched Keywords
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.matched_keywords.map(k => <Badge key={k} color="#34D399">{k}</Badge>)}
                </div>
              </Card>
              <Card>
                <p style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={13} color="#F87171" />Missing Keywords
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.missing_keywords.map(k => <Badge key={k} color="#F87171">{k}</Badge>)}
                </div>
              </Card>
            </div>

            <Card>
              <p style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={13} color="#A78BFA" />AI Suggestions
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.suggestions.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#1E1040', color: '#A78BFA', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                    <p style={{ color: '#CBD5E1', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{s}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default ATSAnalyzer
