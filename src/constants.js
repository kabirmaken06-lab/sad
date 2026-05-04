export const COLUMNS = ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected']

export const COL_COLORS = {
  Applied:   '#38BDF8',
  Screening: '#A78BFA',
  Interview: '#F59E0B',
  Offer:     '#34D399',
  Rejected:  '#F87171',
}

export const SAMPLE_JOBS = [
  { id: 1, title: 'Senior Frontend Engineer', company: 'Stripe',  status: 'Interview', date: 'Apr 28', salary: '$160k–$190k', notes: '3rd round — System Design' },
  { id: 2, title: 'Product Manager',          company: 'Notion',  status: 'Applied',   date: 'Apr 30', salary: '$130k–$150k', notes: '' },
  { id: 3, title: 'Full Stack Developer',     company: 'Linear',  status: 'Screening', date: 'Apr 25', salary: '$140k–$170k', notes: 'HR call scheduled May 5' },
  { id: 4, title: 'Software Engineer',        company: 'Vercel',  status: 'Offer',     date: 'Apr 20', salary: '$155k–$180k', notes: 'Offer letter received!' },
  { id: 5, title: 'UX Engineer',              company: 'Figma',   status: 'Rejected',  date: 'Apr 15', salary: '$145k',       notes: 'Feedback: needed more system design' },
]

export const INITIAL_RESUME = {
  name:     'Alex Johnson',
  email:    'alex@example.com',
  phone:    '(555) 012-3456',
  location: 'San Francisco, CA',
  linkedin: 'linkedin.com/in/alexjohnson',
  summary:  'Full-stack engineer with 5+ years building scalable web applications.',
  experience: [
    {
      id: 1,
      title:    'Senior Software Engineer',
      company:  'TechCorp',
      duration: '2022–Present',
      bullets: [
        'Led migration of monolithic app to microservices, reducing latency by 40%',
        'Mentored 4 junior engineers and established code review best practices',
      ],
    },
    {
      id: 2,
      title:    'Software Engineer',
      company:  'StartupXYZ',
      duration: '2019–2022',
      bullets: [
        'Built real-time dashboard serving 50k daily active users',
        'Reduced CI/CD pipeline time by 60% through parallelization',
      ],
    },
  ],
  education: [
    { id: 1, degree: 'B.S. Computer Science', school: 'UC Berkeley', year: '2019' },
  ],
  skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker', 'GraphQL', 'Python'],
}