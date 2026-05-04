const getPrompt = (messages = []) => {
  const last = messages[messages.length - 1]
  return typeof last?.content === 'string' ? last.content : ''
}

const json = value => JSON.stringify(value, null, 2)

const pick = items => items[Math.floor(Math.random() * items.length)]

const sample = (items, count) => {
  const shuffled = [...items].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

const getRoleCompany = prompt => ({
  role: prompt.match(/for a (.*?) position/i)?.[1] || prompt.match(/for a (.*?) at/i)?.[1] || 'Software Engineer',
  company: prompt.match(/at ([^.\n]+)(?:\.|\n|$)/i)?.[1] || 'the company',
})

const makeCoverLetter = prompt => {
  const { role, company } = getRoleCompany(prompt)
  const openings = [
    `I am excited to apply for the ${role} role at ${company}.`,
    `The ${role} opportunity at ${company} stood out to me because it matches the kind of practical, impact-focused work I enjoy.`,
    `I would be glad to bring my product-minded engineering experience to the ${role} team at ${company}.`,
  ]
  const strengths = [
    'I have built reliable web products, improved user-facing workflows, and collaborated closely with product and design teams.',
    'My background includes React, TypeScript, backend integrations, performance improvements, and clear cross-functional communication.',
    'I focus on shipping maintainable features, improving reliability, and turning business goals into polished product experiences.',
  ]
  const closings = [
    `I would welcome the chance to discuss how my experience can support ${company}'s goals.`,
    `I would appreciate the opportunity to talk about the team, the product, and where I can contribute quickly.`,
    `Thank you for your time and consideration. I would be excited to continue the conversation.`,
  ]

  return `Dear Hiring Team,

${pick(openings)} ${pick(strengths)}

In recent work, I have taken ownership across planning, implementation, and delivery while keeping user experience and measurable outcomes in view. I bring a steady mix of technical depth, product judgment, and communication that helps teams move faster without losing quality.

${pick(closings)}`
}

const makeAtsResult = prompt => {
  const keywords = ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker', 'GraphQL', 'PostgreSQL', 'CI/CD', 'Next.js', 'REST APIs', 'Leadership']
  const lower = prompt.toLowerCase()
  const matched = keywords.filter(keyword => lower.includes(keyword.toLowerCase()))
  const missing = sample(keywords.filter(keyword => !matched.includes(keyword)), 4)
  const score = Math.min(94, Math.max(42, 52 + matched.length * 4 + Math.floor(Math.random() * 9)))
  const suggestions = sample([
    'Add the highest-priority job-description keywords naturally inside your summary and most recent role.',
    'Use measurable achievements that show scope, technical ownership, and business outcome.',
    'Mirror the target role title and core technologies where they truthfully match your background.',
    'Move your strongest technical skills into a concise skills section for easier ATS scanning.',
    'Add one bullet that shows collaboration with product, design, or stakeholders.',
    'Clarify impact with numbers such as latency reduction, users served, revenue supported, or delivery speed.',
  ], 4)

  return json({
    score,
    matched_keywords: matched,
    missing_keywords: missing,
    suggestions,
    summary: `This resume has a ${score}% estimated match based on keyword coverage and role alignment. It can improve by adding more job-specific language, clearer impact metrics, and stronger alignment to the target responsibilities.`,
  })
}

const behavioral = [
  'Tell me about a time you had to deliver a project with unclear or changing requirements.',
  'Describe a situation where you disagreed with a teammate and how you handled it.',
  'Tell me about a time you received critical feedback and changed your approach.',
  'Describe a project where you had to balance speed, quality, and scope.',
  'Tell me about a time you helped unblock another engineer or teammate.',
]

const technical = [
  'How would you structure a scalable React application with shared state, API data, and reusable UI?',
  'What steps would you take to diagnose and improve a slow frontend page?',
  'How do you decide between client-side state, server state, and persisted storage?',
  'Walk me through how you would make a form-heavy dashboard reliable and accessible.',
  'How would you design error handling for API calls across a production frontend?',
]

const systemDesign = [
  'Design a dashboard that tracks job applications, reminders, and interview status in real time.',
  'Design a resume analysis tool that processes user text and returns structured recommendations.',
  'Design a notification system for interview reminders and application follow-ups.',
  'Design a collaborative career workspace where users can manage documents and application progress.',
]

const companySpecific = [
  'Why are you interested in this company, and how would your experience help this team?',
  'What would you want to learn in your first 30 days here?',
  'How would you evaluate whether your work is creating value for this product?',
  'What part of our product or market would you be most excited to improve?',
]

const makeQuestions = () => {
  const selected = [
    ...sample(behavioral, 2).map(question => ({ type: 'Behavioral', question })),
    ...sample(technical, 2).map(question => ({ type: 'Technical', question })),
    { type: 'System Design', question: pick(systemDesign) },
    { type: 'Company-specific', question: pick(companySpecific) },
  ].sort(() => Math.random() - 0.5)

  return json(selected.map((item, index) => ({ id: Date.now() + index, ...item })))
}

const makeFeedback = () => pick([
  'Good start: your answer has a clear direction. Make it stronger by adding a specific example, your exact action, and a measurable result using the STAR structure.',
  'Your answer is relevant, but it would land better with more detail. Add context, explain the tradeoff you made, and end with what changed because of your work.',
  'This answer shows useful experience. Tighten it by removing general statements and adding one concrete metric, user outcome, or technical decision.',
  'You are on the right track. Make the response more interview-ready by naming the problem, your responsibility, the steps you took, and the final impact.',
])

const makeBullet = () => pick([
  'Improved a production workflow by owning implementation end-to-end, coordinating with stakeholders, and increasing reliability, usability, and delivery speed.',
  'Delivered a user-facing feature from planning through launch, improving product quality through clearer requirements, testing, and cross-functional feedback.',
  'Reduced operational friction by refining a core application flow, strengthening error handling, and improving the experience for repeat users.',
  'Led implementation of a maintainable solution that improved team velocity, reduced manual effort, and supported more reliable product delivery.',
])

const makeSummary = () => pick([
  'Full-stack engineer with 5+ years of experience building scalable web applications, improving product performance, and shipping user-focused features. Skilled in React, Node.js, TypeScript, and cloud-based delivery, with a track record of improving reliability and business outcomes.',
  'Product-minded software engineer experienced in React, TypeScript, backend integrations, and performance-focused delivery. Known for turning ambiguous requirements into maintainable features that improve usability, reliability, and team velocity.',
  'Software engineer with strong frontend and full-stack experience across modern web products, API integrations, and cloud-based workflows. Brings clear communication, practical technical judgment, and a focus on measurable product impact.',
])

export const mockClaudeResponse = (messages = []) => {
  const prompt = getPrompt(messages)
  const lower = prompt.toLowerCase()

  let text = 'This is a varied testing response from CareerAI mock mode. Add ANTHROPIC_API_KEY to .env when you want real AI results.'

  if (lower.includes('analyze this resume')) {
    text = makeAtsResult(prompt)
  } else if (lower.includes('generate 6 interview questions')) {
    text = makeQuestions()
  } else if (lower.includes('interview question:')) {
    text = makeFeedback()
  } else if (lower.includes('cover letter')) {
    text = makeCoverLetter(prompt)
  } else if (lower.includes('rewrite this resume bullet')) {
    text = makeBullet()
  } else if (lower.includes('improve this professional summary')) {
    text = makeSummary()
  }

  return {
    id: `mock_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    type: 'message',
    role: 'assistant',
    model: 'careerai-free-mock',
    content: [{ type: 'text', text }],
    stop_reason: 'end_turn',
    usage: { input_tokens: 0, output_tokens: 0 },
  }
}
