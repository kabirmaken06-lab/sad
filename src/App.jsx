import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  Bell,
  Brain,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Crown,
  Download,
  FileText,
  GraduationCap,
  Kanban,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
  User,
  UserCircle,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

const API = async (messages, systemPrompt = "", maxTokens = 1000) => {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, systemPrompt, maxTokens }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `AI request failed with HTTP ${res.status}`);
  }

  const textBlock = Array.isArray(data.content)
    ? data.content.find(block => block?.type === "text") || data.content[0]
    : null;
  const text = textBlock?.text || "";

  if (!text.trim()) {
    throw new Error(data.error || "AI returned an empty response.");
  }

  return text.trim();
};

const configuredClientEnv = (value) => {
  const clean = (value || "").trim();
  const normalized = clean.toLowerCase();
  if (!clean || normalized.startsWith("your_") || normalized.startsWith("replace_") || normalized.endsWith("_here")) {
    return "";
  }
  return clean;
};

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore private-mode/localStorage failures; the app can still run in memory.
  }
};

const emitNotice = ({ title = "Notice", message, type = "info" }) => {
  window.dispatchEvent(new CustomEvent("careerai:notice", {
    detail: { title, message, type },
  }));
};

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized)
      .split("")
      .map(char => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join("");
    return JSON.parse(decodeURIComponent(json));
  } catch {
    return null;
  }
};

const extractJson = (text) => {
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(clean.slice(start, end + 1));
    }
    throw new Error("AI response was not valid JSON.");
  }
};

const extractJsonArray = (text) => {
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf("[");
    const end = clean.lastIndexOf("]");
    if (start >= 0 && end > start) {
      return JSON.parse(clean.slice(start, end + 1));
    }
    throw new Error("AI response was not a valid JSON array.");
  }
};

const normalizeAtsResult = (value) => ({
  score: Number.isFinite(Number(value?.score)) ? Math.max(0, Math.min(100, Number(value.score))) : 0,
  matched_keywords: Array.isArray(value?.matched_keywords) ? value.matched_keywords : [],
  missing_keywords: Array.isArray(value?.missing_keywords) ? value.missing_keywords : [],
  suggestions: Array.isArray(value?.suggestions) ? value.suggestions : [],
  summary: value?.summary || "Analysis completed, but the response was missing a summary.",
});

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const safeFilename = (value, fallback = "career-ai-document") => {
  const cleaned = String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || fallback;
};

const downloadBlob = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const buildDocumentHtml = (title, bodyHtml) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; line-height: 1.55; margin: 40px; }
    h1 { font-size: 24px; margin: 0 0 8px; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .08em; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-top: 22px; }
    h3 { font-size: 15px; margin: 14px 0 2px; }
    p { margin: 4px 0; }
    ul { margin-top: 6px; }
    .muted { color: #4b5563; }
    .center { text-align: center; }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`;

const htmlToText = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.innerText.replace(/\n{3,}/g, "\n\n").trim();
};

const rtfEscape = (text) => String(text ?? "")
  .replace(/\\/g, "\\\\")
  .replace(/{/g, "\\{")
  .replace(/}/g, "\\}")
  .replace(/\n/g, "\\par\n");

const downloadRtf = (text, filename) => {
  const rtf = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\fs22 ${rtfEscape(text)}}`;
  downloadBlob(rtf, `${safeFilename(filename)}.rtf`, "application/rtf;charset=utf-8");
};

const downloadTxt = (text, filename) => {
  downloadBlob(text, `${safeFilename(filename)}.txt`, "text/plain;charset=utf-8");
};

const printDocument = (title, bodyHtml) => {
  const popup = window.open("", "_blank", "width=900,height=700");
  if (!popup) {
    emitNotice({
      title: "Export blocked",
      message: "Please allow popups in your browser, then try exporting the PDF again.",
      type: "warning",
    });
    return;
  }

  popup.document.open();
  popup.document.write(buildDocumentHtml(title, bodyHtml));
  popup.document.close();
  popup.focus();
  setTimeout(() => popup.print(), 250);
};

const downloadCsv = (rows, filename) => {
  const csv = rows
    .map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  downloadBlob(csv, `${safeFilename(filename)}.csv`, "text/csv;charset=utf-8");
};

const downloadJson = (data, filename) => {
  downloadBlob(JSON.stringify(data, null, 2), `${safeFilename(filename)}.json`, "application/json;charset=utf-8");
};

const ExportOptions = ({ label = "Export", document }) => {
  if (!document) return null;
  const text = () => htmlToText(document.bodyHtml);

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
      <Btn onClick={() => printDocument(document.title, document.bodyHtml)} variant="success" style={{ padding: "8px 12px", fontSize: 12 }}><Download size={13} />PDF</Btn>
      <Btn onClick={() => downloadRtf(text(), document.filename)} variant="ghost" style={{ padding: "8px 12px", fontSize: 12 }}><FileText size={13} />Word</Btn>
      <Btn onClick={() => downloadTxt(text(), document.filename)} variant="ghost" style={{ padding: "8px 12px", fontSize: 12 }}>{label} TXT</Btn>
    </div>
  );
};

const getResumeExportData = (resume) => {
  const body = `
    <div class="center">
      <h1>${escapeHtml(resume.name)}</h1>
      <p class="muted">${escapeHtml(resume.email)} | ${escapeHtml(resume.phone)} | ${escapeHtml(resume.location)}</p>
      <p class="muted">${escapeHtml(resume.linkedin)}</p>
    </div>
    <h2>Summary</h2>
    <p>${escapeHtml(resume.summary)}</p>
    <h2>Experience</h2>
    ${resume.experience.map(exp => `
      <h3>${escapeHtml(exp.title)} - ${escapeHtml(exp.company)}</h3>
      <p class="muted">${escapeHtml(exp.duration)}</p>
      <ul>${exp.bullets.filter(Boolean).map(bullet => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>
    `).join("")}
    <h2>Education</h2>
    ${resume.education.map(ed => `
      <p><strong>${escapeHtml(ed.degree)}</strong></p>
      <p class="muted">${escapeHtml(ed.school)} | ${escapeHtml(ed.year)}</p>
    `).join("")}
    <h2>Skills</h2>
    <p>${escapeHtml(resume.skills.join(" | "))}</p>
  `;
  return { title: `${resume.name} Resume`, bodyHtml: body, filename: `${resume.name}-resume` };
};

const getCoverLetterExportData = ({ jobTitle, company, letter }) => {
  const body = `
    <h1>Cover Letter</h1>
    <p class="muted">${escapeHtml(jobTitle)} at ${escapeHtml(company)}</p>
    ${letter.split(/\n{2,}/).map(paragraph => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`).join("")}
  `;
  return { title: `Cover Letter - ${company}`, bodyHtml: body, filename: `${company}-${jobTitle}-cover-letter` };
};

const getAtsExportData = ({ resumeText, jobDesc, result }) => {
  const body = `
    <h1>ATS Analysis</h1>
    <h2>Score</h2>
    <p><strong>${escapeHtml(result.score)}%</strong></p>
    <h2>Summary</h2>
    <p>${escapeHtml(result.summary)}</p>
    <h2>Matched Keywords</h2>
    <p>${escapeHtml((result.matched_keywords || []).join(", "))}</p>
    <h2>Missing Keywords</h2>
    <p>${escapeHtml((result.missing_keywords || []).join(", "))}</p>
    <h2>Suggestions</h2>
    <ul>${(result.suggestions || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    <h2>Resume Text</h2>
    <p>${escapeHtml(resumeText).replace(/\n/g, "<br>")}</p>
    <h2>Job Description</h2>
    <p>${escapeHtml(jobDesc).replace(/\n/g, "<br>")}</p>
  `;
  return { title: "ATS Analysis", bodyHtml: body, filename: "ats-analysis" };
};

const getInterviewExportData = ({ role, company, questions, answers, feedback }) => {
  const body = `
    <h1>Interview Prep</h1>
    <p class="muted">${escapeHtml(role)} at ${escapeHtml(company)}</p>
    ${questions.map((q, index) => `
      <h2>Question ${index + 1}: ${escapeHtml(q.type || "Interview")}</h2>
      <p><strong>${escapeHtml(q.question)}</strong></p>
      <p><strong>Your Answer:</strong><br>${escapeHtml(answers[q.id] || "").replace(/\n/g, "<br>")}</p>
      <p><strong>Feedback:</strong><br>${escapeHtml(feedback[q.id] || "").replace(/\n/g, "<br>")}</p>
    `).join("")}
  `;
  return { title: `Interview Prep - ${company}`, bodyHtml: body, filename: `${company}-${role}-interview-prep` };
};

const COLUMNS = ["Applied", "Screening", "Interview", "Offer", "Rejected"];
const COL_COLORS = {
  Applied: "#38BDF8", Screening: "#A78BFA", Interview: "#F59E0B",
  Offer: "#34D399", Rejected: "#F87171",
};

const SAMPLE_JOBS = [
  { id: 1, title: "Senior Frontend Engineer", company: "Stripe", status: "Interview", date: "Apr 28", salary: "$160k–$190k", notes: "3rd round — System Design" },
  { id: 2, title: "Product Manager", company: "Notion", status: "Applied", date: "Apr 30", salary: "$130k–$150k", notes: "" },
  { id: 3, title: "Full Stack Developer", company: "Linear", status: "Screening", date: "Apr 25", salary: "$140k–$170k", notes: "HR call scheduled May 5" },
  { id: 4, title: "Software Engineer", company: "Vercel", status: "Offer", date: "Apr 20", salary: "$155k–$180k", notes: "Offer letter received!" },
  { id: 5, title: "UX Engineer", company: "Figma", status: "Rejected", date: "Apr 15", salary: "$145k", notes: "Feedback: needed more system design" },
];

const INITIAL_RESUME = {
  name: "Alex Johnson", email: "alex@example.com", phone: "(555) 012-3456",
  location: "San Francisco, CA", linkedin: "linkedin.com/in/alexjohnson",
  summary: "Full-stack engineer with 5+ years building scalable web applications.",
  experience: [
    { id: 1, title: "Senior Software Engineer", company: "TechCorp", duration: "2022–Present", bullets: ["Led migration of monolithic app to microservices, reducing latency by 40%", "Mentored 4 junior engineers and established code review best practices"] },
    { id: 2, title: "Software Engineer", company: "StartupXYZ", duration: "2019–2022", bullets: ["Built real-time dashboard serving 50k daily active users", "Reduced CI/CD pipeline time by 60% through parallelization"] },
  ],
  education: [{ id: 1, degree: "B.S. Computer Science", school: "UC Berkeley", year: "2019" }],
  skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker", "GraphQL", "Python"],
};

const PLAN_CONFIG = {
  free: {
    id: "free",
    name: "Free",
    price: "$0",
    aiLimit: 5,
    jobLimit: 10,
    badge: "#64748B",
    features: ["5 AI actions per day", "10 tracked jobs", "Resume builder", "Basic ATS analysis"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: "$9.99",
    originalPrice: "$19",
    offer: "Limited offer",
    aiLimit: 100,
    jobLimit: 75,
    badge: "#38BDF8",
    features: ["100 AI actions per day", "75 tracked jobs", "Advanced prompts", "Cover letters", "Interview coaching"],
  },
  elite: {
    id: "elite",
    name: "Elite",
    price: "$19.99",
    originalPrice: "$49",
    offer: "Limited offer",
    aiLimit: 500,
    jobLimit: 300,
    badge: "#A78BFA",
    features: ["500 AI actions per day", "300 tracked jobs", "Priority quality prompts", "Unlimited exports", "Premium support"],
  },
};

const DEFAULT_USER = {
  name: "Alex Johnson",
  email: "alex@example.com",
  plan: "free",
  planRenewsAt: "",
};

const addMonths = (date, months) => {
  const next = new Date(date);
  const day = next.getDate();
  next.setMonth(next.getMonth() + months);
  if (next.getDate() !== day) {
    next.setDate(0);
  }
  return next;
};

const getMonthlyPlanExpiry = () => addMonths(new Date(), 1).toISOString();

const isPlanExpired = (user) => {
  if (!user || user.plan === "free") return false;
  if (!user.planRenewsAt) return true;
  return new Date(user.planRenewsAt).getTime() <= Date.now();
};

const normalizeUserPlan = (user) => {
  if (!user) return user;
  if (!isPlanExpired(user)) return user;
  return {
    ...user,
    plan: "free",
    planRenewsAt: "",
    expiredPlan: user.plan,
  };
};

const activatePlanForOneMonth = (user, planId) => ({
  ...user,
  plan: planId,
  planRenewsAt: planId === "free" ? "" : getMonthlyPlanExpiry(),
});

const formatPlanDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const PLAN_RENEWAL_REMINDER_DAYS = 3;

const getDaysUntil = (value) => {
  if (!value) return Infinity;
  const diff = new Date(value).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getRenewalReminderKey = (user) => `careerai:renewal-reminder:${user?.email || "user"}:${user?.plan}:${user?.planRenewsAt || "none"}`;

const DEFAULT_USAGE = {
  date: getTodayKey(),
  aiActions: 0,
};

const SUGGESTED_SKILLS = [
  "Next.js",
  "Tailwind CSS",
  "Redux",
  "REST APIs",
  "MongoDB",
  "Git",
  "CI/CD",
  "Jest",
  "Figma",
  "Agile",
  "Problem Solving",
  "Leadership",
];

// ── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "resume", label: "Resume Builder", icon: FileText },
  { id: "ats", label: "ATS Analyzer", icon: Target },
  { id: "cover", label: "Cover Letter", icon: Mail },
  { id: "tracker", label: "Job Tracker", icon: Kanban },
  { id: "interview", label: "Interview Prep", icon: Brain },
  { id: "plans", label: "Plans", icon: CreditCard },
];

function Sidebar({ view, setView, collapsed, setCollapsed, user, onLogout }) {
  const normalizedUser = normalizeUserPlan(user);
  const plan = PLAN_CONFIG[normalizedUser?.plan] || PLAN_CONFIG.free;
  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside style={{ width: collapsed ? 64 : 220, background: "#070D1A", borderRight: "1px solid #1E2D47", display: "flex", flexDirection: "column", transition: "width 0.2s", flexShrink: 0, height: "100vh", position: "sticky", top: 0 }}>
      <div style={{ padding: "20px 16px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #1E2D47" }}>
        <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#38BDF8,#6366F1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Star size={15} color="#fff" fill="#fff" />
        </div>
        {!collapsed && <span style={{ color: "#E2E8F0", fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px" }}>CareerAI</span>}
        <button onClick={() => setCollapsed(!collapsed)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#64748B", padding: 2 }}>
          <Menu size={16} />
        </button>
      </div>
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id;
          return (
            <button key={id} onClick={() => setView(id)} title={collapsed ? label : undefined}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "10px 14px" : "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: active ? "#0F2540" : "transparent", color: active ? "#38BDF8" : "#64748B", fontWeight: active ? 600 : 400, fontSize: 13, textAlign: "left", transition: "all 0.15s", whiteSpace: "nowrap", overflow: "hidden" }}>
              <Icon size={16} style={{ flexShrink: 0 }} />
              {!collapsed && label}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: "12px 8px", borderTop: "1px solid #1E2D47" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1E2D47", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, color: plan.badge, fontWeight: 700 }}>{initials}</div>
          {!collapsed && (<div style={{ overflow: "hidden", flex: 1 }}><p style={{ color: "#E2E8F0", fontSize: 12, fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{normalizedUser?.name || "CareerAI User"}</p><p style={{ color: plan.badge, fontSize: 11, margin: 0 }}>{plan.name} Plan</p>{normalizedUser?.plan !== "free" && normalizedUser?.planRenewsAt && <p style={{ color: "#64748B", fontSize: 10, margin: "1px 0 0" }}>Expires {formatPlanDate(normalizedUser.planRenewsAt)}</p>}</div>)}
          {!collapsed && <button onClick={onLogout} title="Logout" style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", padding: 4, display: "flex" }}><LogOut size={14} /></button>}
        </div>
      </div>
    </aside>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div className="app-card" style={{ background: "#0F172A", border: "1px solid #1E2D47", borderRadius: 12, padding: "20px 24px", ...style }}>{children}</div>
);

const Btn = ({ children, onClick, loading, variant = "primary", style = {}, disabled }) => {
  const base = { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: disabled || loading ? "not-allowed" : "pointer", border: "none", transition: "all 0.15s", opacity: disabled || loading ? 0.6 : 1, ...style };
  const variants = {
    primary: { background: "linear-gradient(135deg,#0EA5E9,#6366F1)", color: "#fff" },
    ghost: { background: "#1E2D47", color: "#94A3B8" },
    danger: { background: "#3B1212", color: "#F87171" },
    success: { background: "#0A2E20", color: "#34D399" },
  };
  return <button onClick={onClick} disabled={disabled || loading} style={{ ...base, ...variants[variant] }}>{loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}{children}</button>;
};

const Input = ({ label, value, onChange, placeholder, type = "text", multiline, rows = 3, style = {} }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && <label style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</label>}
    {multiline ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ background: "#070D1A", border: "1px solid #1E2D47", borderRadius: 8, padding: "10px 12px", color: "#E2E8F0", fontSize: 13, resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.6, ...style }} />
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ background: "#070D1A", border: "1px solid #1E2D47", borderRadius: 8, padding: "10px 12px", color: "#E2E8F0", fontSize: 13, outline: "none", fontFamily: "inherit", ...style }} />
    )}
  </div>
);

const Badge = ({ children, color = "#38BDF8" }) => (
  <span style={{ background: color + "18", color, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, letterSpacing: "0.3px" }}>{children}</span>
);

const SectionHeader = ({ title, subtitle, action }) => (
  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
    <div>
      <h2 style={{ color: "#E2E8F0", fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: "-0.4px" }}>{title}</h2>
      {subtitle && <p style={{ color: "#64748B", fontSize: 13, margin: "4px 0 0" }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("Alex Johnson");
  const [email, setEmail] = useState("alex@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const googleButtonRef = useRef(null);
  const googleClientId = configuredClientEnv(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const loginWithGoogleProfile = (profile) => {
    const cleanEmail = (profile.email || "google.user@example.com").trim().toLowerCase();
    const storedUser = readStorage("careerai:user", DEFAULT_USER);
    onLogin({
      name: profile.name || cleanEmail.split("@")[0],
      email: cleanEmail,
      plan: storedUser?.plan || "free",
      planRenewsAt: storedUser?.planRenewsAt || "",
      provider: "google",
      picture: profile.picture || "",
    });
  };

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          const profile = decodeJwtPayload(response.credential);
          if (!profile?.email) {
            setError("Google login failed. Please try again.");
            return;
          }
          loginWithGoogleProfile(profile);
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 360,
        text: mode === "signup" ? "signup_with" : "signin_with",
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return;
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener("load", renderGoogleButton, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.body.appendChild(script);
  }, [googleClientId, mode]);

  const demoGoogleLogin = () => {
    loginWithGoogleProfile({
      name: "Google Demo User",
      email: "google.demo@example.com",
    });
  };

  const submit = (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    const storedUser = readStorage("careerai:user", DEFAULT_USER);
    onLogin({
      name: mode === "signup" ? (name.trim() || cleanEmail.split("@")[0]) : (storedUser?.name || cleanEmail.split("@")[0]),
      email: cleanEmail,
      plan: storedUser?.plan || "free",
      planRenewsAt: storedUser?.planRenewsAt || "",
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#070D1A", display: "grid", placeItems: "center", padding: 24 }}>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 420 }}>
        <Card style={{ padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,#38BDF8,#6366F1)", borderRadius: 8, display: "grid", placeItems: "center" }}>
              <Star size={18} color="#fff" fill="#fff" />
            </div>
            <div>
              <h1 style={{ color: "#E2E8F0", fontSize: 20, margin: 0 }}>CareerAI</h1>
              <p style={{ color: "#64748B", fontSize: 13, margin: "2px 0 0" }}>{mode === "login" ? "Sign in to continue" : "Create your workspace"}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
            {["login", "signup"].map(item => (
              <button key={item} type="button" onClick={() => { setMode(item); setError(""); }}
                style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${mode === item ? "#38BDF8" : "#1E2D47"}`, background: mode === item ? "#0F2540" : "#070D1A", color: mode === item ? "#38BDF8" : "#64748B", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                {item === "login" ? "Login" : "Sign Up"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {googleClientId ? (
              <div ref={googleButtonRef} style={{ minHeight: 42, display: "flex", justifyContent: "center" }} />
            ) : (
              <button type="button" onClick={demoGoogleLogin}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: "1px solid #1E2D47", background: "#fff", color: "#111827", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", display: "grid", placeItems: "center", color: "#4285F4", fontWeight: 800 }}>G</span>
                Continue with Google
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: "#1E2D47" }} />
              <span style={{ color: "#475569", fontSize: 11, fontWeight: 700 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: "#1E2D47" }} />
            </div>
            {mode === "signup" && <Input label="Name" value={name} onChange={setName} placeholder="Your name" />}
            <Input label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
            <Input label="Password" value={password} onChange={setPassword} placeholder="Any demo password" type="password" />
            {error && <p style={{ color: "#F87171", fontSize: 12, margin: 0 }}>{error}</p>}
            <Btn style={{ width: "100%", justifyContent: "center" }}>
              <Lock size={14} />{mode === "login" ? "Login" : "Create Account"}
            </Btn>
          </div>
        </Card>
      </form>
    </div>
  );
}

function PlansView({ user, setUser, usage, notify }) {
  const normalizedUser = normalizeUserPlan(user);
  const activePlan = PLAN_CONFIG[normalizedUser.plan] || PLAN_CONFIG.free;

  const selectPlan = (planId) => {
    const updated = activatePlanForOneMonth(normalizedUser, planId);
    setUser(updated);
    writeStorage("careerai:user", updated);
    notify({
      title: `${PLAN_CONFIG[planId].name} plan active`,
      message: planId === "free"
        ? "Your workspace now uses the Free plan limits."
        : `Your ${PLAN_CONFIG[planId].name} plan is active until ${formatPlanDate(updated.planRenewsAt)}.`,
      type: "success",
    });
  };

  return (
    <div>
      <SectionHeader title="Plans" subtitle="Choose the limits that fit your career workflow" />
      <Card style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <p style={{ color: "#64748B", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px" }}>Current Usage</p>
          <h3 style={{ color: "#E2E8F0", fontSize: 18, margin: 0 }}>{usage.aiActions}/{activePlan.aiLimit} AI actions used today</h3>
          {normalizedUser.plan !== "free" && normalizedUser.planRenewsAt && <p style={{ color: "#64748B", fontSize: 12, margin: "6px 0 0" }}>Expires on {formatPlanDate(normalizedUser.planRenewsAt)}. Email reminder is sent {PLAN_RENEWAL_REMINDER_DAYS} days before expiry.</p>}
        </div>
        <Badge color={activePlan.badge}>{activePlan.name} Plan</Badge>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 18 }}>
        {Object.values(PLAN_CONFIG).map(plan => {
          const active = normalizedUser.plan === plan.id;
          return (
            <Card key={plan.id} style={{ borderColor: active ? plan.badge : "#1E2D47" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: plan.badge + "18", display: "grid", placeItems: "center" }}>
                  {plan.id === "free" ? <UserCircle size={18} color={plan.badge} /> : plan.id === "pro" ? <Zap size={18} color={plan.badge} /> : <Crown size={18} color={plan.badge} />}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {plan.offer && <Badge color="#F59E0B">{plan.offer}</Badge>}
                  {active && <Badge color={plan.badge}>Active</Badge>}
                </div>
              </div>
              <h3 style={{ color: "#E2E8F0", fontSize: 18, margin: 0 }}>{plan.name}</h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "8px 0 18px", flexWrap: "wrap" }}>
                <p style={{ color: plan.badge, fontSize: 28, fontWeight: 800, margin: 0 }}>{plan.price}<span style={{ color: "#64748B", fontSize: 12, fontWeight: 500 }}>/mo</span></p>
                {plan.originalPrice && <span style={{ color: "#64748B", fontSize: 13, fontWeight: 700, textDecoration: "line-through" }}>{plan.originalPrice}/mo</span>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {plan.features.map(feature => (
                  <p key={feature} style={{ color: "#CBD5E1", fontSize: 13, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <Check size={14} color={plan.badge} />{feature}
                  </p>
                ))}
              </div>
              <Btn onClick={() => selectPlan(plan.id)} disabled={active} variant={active ? "ghost" : "primary"} style={{ width: "100%", justifyContent: "center" }}>
                {active ? "Current Plan" : plan.id === "free" ? "Switch to Free" : `Buy ${plan.name} Monthly`}
              </Btn>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function UpgradeModal({ plan, usage, onClose, onUpgrade }) {
  if (!plan) return null;
  const nextPlan = plan.id === "free" ? PLAN_CONFIG.pro : plan.id === "pro" ? PLAN_CONFIG.elite : null;

  return (
    <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.72)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}>
      <div className="upgrade-modal" style={{ width: "100%", maxWidth: 440, background: "#0F172A", border: "1px solid #1E3A5A", borderRadius: 12, padding: 24, boxShadow: "0 24px 80px rgba(0,0,0,0.45)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "linear-gradient(135deg,#38BDF8,#6366F1)", display: "grid", placeItems: "center" }}>
            <Crown size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ color: "#E2E8F0", margin: 0, fontSize: 18 }}>Daily AI limit reached</h3>
            <p style={{ color: "#64748B", margin: "3px 0 0", fontSize: 13 }}>{usage.aiActions}/{plan.aiLimit} AI actions used today</p>
          </div>
        </div>

        <p style={{ color: "#CBD5E1", fontSize: 14, lineHeight: 1.7, margin: "0 0 18px" }}>
          {nextPlan
            ? `You have used all AI actions on the ${plan.name} plan. Upgrade to ${nextPlan.name} to keep generating resumes, cover letters, ATS reports, and interview feedback.`
            : `You have used all AI actions on the ${plan.name} plan for today. Your usage will reset tomorrow.`}
        </p>

        {nextPlan && (
          <div style={{ background: "#070D1A", border: "1px solid #1E2D47", borderRadius: 10, padding: 14, marginBottom: 18 }}>
            <p style={{ color: nextPlan.badge, fontSize: 13, fontWeight: 800, margin: "0 0 6px" }}>{nextPlan.name} Plan</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <p style={{ color: "#E2E8F0", fontSize: 22, fontWeight: 800, margin: 0 }}>{nextPlan.price}<span style={{ color: "#64748B", fontSize: 12, fontWeight: 500 }}>/mo</span></p>
              {nextPlan.originalPrice && <span style={{ color: "#64748B", fontSize: 12, fontWeight: 700, textDecoration: "line-through" }}>{nextPlan.originalPrice}/mo</span>}
            </div>
            <p style={{ color: "#94A3B8", fontSize: 12, margin: "6px 0 0" }}>{nextPlan.aiLimit} AI actions/day and {nextPlan.jobLimit} tracked jobs</p>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn onClick={onClose} variant="ghost">{nextPlan ? "Maybe Later" : "Close"}</Btn>
          {nextPlan && <Btn onClick={() => onUpgrade(nextPlan.id)}><Zap size={14} />Buy Monthly</Btn>}
        </div>
      </div>
    </div>
  );
}

function NoticeModal({ notice, onClose }) {
  if (!notice) return null;
  const colors = {
    info: "#38BDF8",
    success: "#34D399",
    warning: "#F59E0B",
    danger: "#F87171",
  };
  const color = colors[notice.type] || colors.info;

  return (
    <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.62)", display: "grid", placeItems: "center", zIndex: 60, padding: 20 }}>
      <div className="upgrade-modal" style={{ width: "100%", maxWidth: 420, background: "#0F172A", border: `1px solid ${color}55`, borderRadius: 12, padding: 22, boxShadow: "0 24px 80px rgba(0,0,0,0.45)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: color + "18", display: "grid", placeItems: "center", flexShrink: 0 }}>
            {notice.type === "success" ? <CheckCircle2 size={18} color={color} /> : notice.type === "warning" ? <AlertCircle size={18} color={color} /> : <Sparkles size={18} color={color} />}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: "#E2E8F0", margin: 0, fontSize: 17 }}>{notice.title}</h3>
            <p style={{ color: "#CBD5E1", fontSize: 14, lineHeight: 1.65, margin: "8px 0 18px" }}>{notice.message}</p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Btn onClick={onClose}>Got it</Btn>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#64748B", cursor: "pointer", padding: 2, display: "flex" }}>
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ jobs, setView }) {
  const activeJobs = jobs.filter(j => j.status !== "Applied" && j.status !== "Rejected").length;
  const responseRate = jobs.length ? `${Math.round((activeJobs / jobs.length) * 100)}%` : "0%";
  const stats = [
    { label: "Applications Sent", val: jobs.length, icon: Send, color: "#38BDF8" },
    { label: "Interviews", val: jobs.filter(j => j.status === "Interview").length, icon: MessageSquare, color: "#A78BFA" },
    { label: "Offers", val: jobs.filter(j => j.status === "Offer").length, icon: Award, color: "#34D399" },
    { label: "Response Rate", val: responseRate, icon: TrendingUp, color: "#F59E0B" },
  ];

  const quickActions = [
    { label: "Build Resume", icon: FileText, view: "resume", color: "#38BDF8" },
    { label: "Analyze ATS Fit", icon: Target, view: "ats", color: "#A78BFA" },
    { label: "Write Cover Letter", icon: Mail, view: "cover", color: "#34D399" },
    { label: "Prep for Interview", icon: Brain, view: "interview", color: "#F59E0B" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#E2E8F0", fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>Good morning, Alex 👋</h1>
        <p style={{ color: "#64748B", fontSize: 14, margin: "6px 0 0" }}>You have {jobs.filter(j => j.status === "Interview").length} upcoming interviews. Keep pushing!</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {stats.map(({ label, val, icon: Icon, color }) => (
          <Card key={label}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <p style={{ color: "#64748B", fontSize: 12, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={15} color={color} /></div>
            </div>
            <p style={{ color, fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-1px" }}>{val}</p>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <h3 style={{ color: "#E2E8F0", fontSize: 14, fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}><Sparkles size={14} color="#38BDF8" />Quick Actions</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {quickActions.map(({ label, icon: Icon, view, color }) => (
              <button key={view} onClick={() => setView(view)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#070D1A", border: "1px solid #1E2D47", borderRadius: 10, cursor: "pointer", transition: "border-color 0.15s", textAlign: "left" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={15} color={color} /></div>
                <span style={{ color: "#CBD5E1", fontSize: 13, fontWeight: 500 }}>{label}</span>
                <ArrowRight size={14} color="#334155" style={{ marginLeft: "auto" }} />
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 style={{ color: "#E2E8F0", fontSize: 14, fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}><Briefcase size={14} color="#38BDF8" />Recent Applications</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {jobs.length === 0 && (
              <div style={{ padding: "18px 14px", background: "#070D1A", borderRadius: 8, border: "1px solid #1E2D47", textAlign: "center" }}>
                <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>No applications yet. Add your first job in the tracker.</p>
              </div>
            )}
            {jobs.slice(0, 4).map(job => (
              <div key={job.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#070D1A", borderRadius: 8, border: "1px solid #1E2D47" }}>
                <div>
                  <p style={{ color: "#CBD5E1", fontSize: 13, fontWeight: 500, margin: 0 }}>{job.title}</p>
                  <p style={{ color: "#64748B", fontSize: 11, margin: "2px 0 0" }}>{job.company} · {job.date}</p>
                </div>
                <Badge color={COL_COLORS[job.status]}>{job.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Resume Builder ────────────────────────────────────────────────────────────
function ResumeBuilder({ runAI, notify }) {
  const [resume, setResume] = useState(INITIAL_RESUME);
  const [activeSection, setActiveSection] = useState("personal");
  const [loadingBullet, setLoadingBullet] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  const addSkill = (skill) => {
    const clean = skill.trim();
    if (!clean) return;

    setResume(r => {
      const exists = r.skills.some(existing => existing.toLowerCase() === clean.toLowerCase());
      if (exists) return r;
      return { ...r, skills: [...r.skills, clean] };
    });
    setNewSkill("");
  };

  const enhanceBullet = async (expId, bulletIdx) => {
    const key = `${expId}-${bulletIdx}`;
    setLoadingBullet(key);
    const exp = resume.experience.find(e => e.id === expId);
    const bullet = exp.bullets[bulletIdx];
    try {
      const enhanced = await runAI([{ role: "user", content: `Rewrite this resume bullet point to be more achievement-oriented, quantified, and impactful. Use strong action verbs, preserve truthful meaning, add metrics only when implied. Return ONLY the improved bullet, nothing else:\n\n"${bullet}"` }], "You are a professional resume writer. Improve bullet points to be achievement-oriented, specific, and ATS-friendly.");
      setResume(r => ({ ...r, experience: r.experience.map(e => e.id === expId ? { ...e, bullets: e.bullets.map((b, i) => i === bulletIdx ? enhanced.replace(/^["']|["']$/g, "") : b) } : e) }));
    } catch (e) { notify({ title: "AI enhancement failed", message: e.message, type: "warning" }); }
    setLoadingBullet(null);
  };

  const enhanceSummary = async () => {
    setLoadingSummary(true);
    try {
      const s = await runAI([{ role: "user", content: `Improve this professional summary for a resume. Make it compelling, specific, ATS-friendly, and 2-3 sentences. Keep it truthful to the source. Return ONLY the summary:\n\n"${resume.summary}"` }], "You are a professional resume writer.");
      setResume(r => ({ ...r, summary: s.replace(/^["']|["']$/g, "") }));
    } catch (e) { notify({ title: "AI summary failed", message: e.message, type: "warning" }); }
    setLoadingSummary(false);
  };

  const sections = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "skills", label: "Skills", icon: Wrench },
  ];

  return (
    <div>
      <SectionHeader title="Resume Builder" subtitle="Build an ATS-optimized resume with AI assistance"
        action={<ExportOptions label="Resume" document={getResumeExportData(resume)} />} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Editor */}
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {sections.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveSection(id)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${activeSection === id ? "#38BDF8" : "#1E2D47"}`, background: activeSection === id ? "#0F2540" : "#0F172A", color: activeSection === id ? "#38BDF8" : "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>

          {activeSection === "personal" && (
            <Card>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Input label="Full Name" value={resume.name} onChange={v => setResume(r => ({ ...r, name: v }))} />
                  <Input label="Email" value={resume.email} onChange={v => setResume(r => ({ ...r, email: v }))} />
                  <Input label="Phone" value={resume.phone} onChange={v => setResume(r => ({ ...r, phone: v }))} />
                  <Input label="Location" value={resume.location} onChange={v => setResume(r => ({ ...r, location: v }))} />
                </div>
                <Input label="LinkedIn" value={resume.linkedin} onChange={v => setResume(r => ({ ...r, linkedin: v }))} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Summary</label>
                    <Btn onClick={enhanceSummary} loading={loadingSummary} variant="ghost" style={{ padding: "5px 10px", fontSize: 11 }}><Sparkles size={12} />AI Enhance</Btn>
                  </div>
                  <textarea value={resume.summary} onChange={e => setResume(r => ({ ...r, summary: e.target.value }))} rows={3}
                    style={{ background: "#070D1A", border: "1px solid #1E2D47", borderRadius: 8, padding: "10px 12px", color: "#E2E8F0", fontSize: 13, resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.6 }} />
                </div>
              </div>
            </Card>
          )}

          {activeSection === "experience" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {resume.experience.map(exp => (
                <Card key={exp.id}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <Input label="Job Title" value={exp.title} onChange={v => setResume(r => ({ ...r, experience: r.experience.map(e => e.id === exp.id ? { ...e, title: v } : e) }))} />
                    <Input label="Company" value={exp.company} onChange={v => setResume(r => ({ ...r, experience: r.experience.map(e => e.id === exp.id ? { ...e, company: v } : e) }))} />
                    <Input label="Duration" value={exp.duration} onChange={v => setResume(r => ({ ...r, experience: r.experience.map(e => e.id === exp.id ? { ...e, duration: v } : e) }))} />
                  </div>
                  <div>
                    <label style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Bullet Points</label>
                    {exp.bullets.map((bullet, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                        <textarea value={bullet} onChange={e => setResume(r => ({ ...r, experience: r.experience.map(ex => ex.id === exp.id ? { ...ex, bullets: ex.bullets.map((b, idx) => idx === i ? e.target.value : b) } : ex) }))} rows={2}
                          style={{ flex: 1, background: "#070D1A", border: "1px solid #1E2D47", borderRadius: 8, padding: "8px 10px", color: "#E2E8F0", fontSize: 12, resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5 }} />
                        <Btn onClick={() => enhanceBullet(exp.id, i)} loading={loadingBullet === `${exp.id}-${i}`} variant="ghost" style={{ padding: "7px 10px", fontSize: 11, flexShrink: 0 }}><Sparkles size={12} /></Btn>
                      </div>
                    ))}
                    <button onClick={() => setResume(r => ({ ...r, experience: r.experience.map(e => e.id === exp.id ? { ...e, bullets: [...e.bullets, ""] } : e) }))}
                      style={{ background: "none", border: "1px dashed #1E2D47", color: "#64748B", fontSize: 12, padding: "6px 12px", borderRadius: 6, cursor: "pointer" }}>+ Add bullet</button>
                  </div>
                </Card>
              ))}
              <button onClick={() => setResume(r => ({ ...r, experience: [...r.experience, { id: Date.now(), title: "", company: "", duration: "", bullets: [""] }] }))}
                style={{ background: "#070D1A", border: "1px dashed #1E2D47", color: "#64748B", fontSize: 13, padding: "12px", borderRadius: 10, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Plus size={14} />Add Experience</button>
            </div>
          )}

          {activeSection === "education" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {resume.education.map(ed => (
                <Card key={ed.id}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <Input label="Degree / Program" value={ed.degree} onChange={v => setResume(r => ({ ...r, education: r.education.map(item => item.id === ed.id ? { ...item, degree: v } : item) }))} placeholder="e.g. B.S. Computer Science" />
                    <Input label="School / University" value={ed.school} onChange={v => setResume(r => ({ ...r, education: r.education.map(item => item.id === ed.id ? { ...item, school: v } : item) }))} placeholder="e.g. University of Punjab" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
                    <Input label="Year" value={ed.year} onChange={v => setResume(r => ({ ...r, education: r.education.map(item => item.id === ed.id ? { ...item, year: v } : item) }))} placeholder="e.g. 2025" />
                    <Btn onClick={() => setResume(r => ({ ...r, education: r.education.filter(item => item.id !== ed.id) }))} variant="danger" style={{ height: 38 }}>
                      <Trash2 size={13} />Remove
                    </Btn>
                  </div>
                </Card>
              ))}

              <button onClick={() => setResume(r => ({ ...r, education: [...r.education, { id: Date.now(), degree: "", school: "", year: "" }] }))}
                style={{ background: "#070D1A", border: "1px dashed #1E2D47", color: "#64748B", fontSize: 13, padding: "12px", borderRadius: 10, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Plus size={14} />Add Education
              </button>
            </div>
          )}

          {activeSection === "skills" && (
            <Card>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {resume.skills.map((skill, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#0F2540", color: "#38BDF8", fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 20, border: "1px solid #1E4A6E" }}>
                    {skill}
                    <button onClick={() => setResume(r => ({ ...r, skills: r.skills.filter((_, idx) => idx !== i) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#38BDF8", padding: 0, display: "flex" }}><X size={11} /></button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                <input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Add a custom skill..." style={{ flex: 1, background: "#070D1A", border: "1px solid #1E2D47", borderRadius: 8, padding: "9px 12px", color: "#E2E8F0", fontSize: 13, outline: "none", fontFamily: "inherit" }}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(newSkill); } }} />
                <Btn onClick={() => addSkill(newSkill)} disabled={!newSkill.trim()} style={{ flexShrink: 0 }}>
                  <Plus size={13} />Add
                </Btn>
              </div>

              <div>
                <p style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", margin: "0 0 10px" }}>Suggested Skills</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {SUGGESTED_SKILLS.filter(skill => !resume.skills.some(existing => existing.toLowerCase() === skill.toLowerCase())).map(skill => (
                    <button key={skill} onClick={() => addSkill(skill)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#070D1A", color: "#94A3B8", fontSize: 12, fontWeight: 600, padding: "6px 10px", borderRadius: 20, border: "1px solid #1E2D47", cursor: "pointer" }}>
                      <Plus size={12} />{skill}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Live Preview */}
        <div>
          <p style={{ color: "#64748B", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Live Preview</p>
          <div style={{ background: "#fff", borderRadius: 12, padding: "32px 28px", color: "#1a1a1a", fontSize: 12, lineHeight: 1.6, border: "1px solid #1E2D47", maxHeight: 600, overflowY: "auto" }}>
            <div style={{ textAlign: "center", borderBottom: "2px solid #1a1a1a", paddingBottom: 12, marginBottom: 16 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: "#111" }}>{resume.name}</h1>
              <p style={{ color: "#555", margin: 0, fontSize: 11 }}>{resume.email} · {resume.phone} · {resume.location}</p>
              <p style={{ color: "#2563EB", margin: "2px 0 0", fontSize: 11 }}>{resume.linkedin}</p>
            </div>
            {resume.summary && (<><h2 style={{ fontSize: 11, fontWeight: 700, color: "#111", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 6px", borderBottom: "1px solid #ddd", paddingBottom: 4 }}>Summary</h2><p style={{ margin: "0 0 16px", color: "#333", fontSize: 11 }}>{resume.summary}</p></>)}
            <h2 style={{ fontSize: 11, fontWeight: 700, color: "#111", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px", borderBottom: "1px solid #ddd", paddingBottom: 4 }}>Experience</h2>
            {resume.experience.map(exp => (
              <div key={exp.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ fontSize: 12 }}>{exp.title}</strong>
                  <span style={{ color: "#555", fontSize: 11 }}>{exp.duration}</span>
                </div>
                <p style={{ color: "#2563EB", margin: "1px 0 4px", fontSize: 11 }}>{exp.company}</p>
                <ul style={{ margin: 0, paddingLeft: 14 }}>{exp.bullets.map((b, i) => <li key={i} style={{ color: "#333", marginBottom: 2, fontSize: 11 }}>{b}</li>)}</ul>
              </div>
            ))}
            <h2 style={{ fontSize: 11, fontWeight: 700, color: "#111", textTransform: "uppercase", letterSpacing: "1px", margin: "8px 0", borderBottom: "1px solid #ddd", paddingBottom: 4 }}>Education</h2>
            {resume.education.map(ed => (
              <div key={ed.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div><strong style={{ fontSize: 12 }}>{ed.degree}</strong><br /><span style={{ color: "#555", fontSize: 11 }}>{ed.school}</span></div>
                <span style={{ color: "#555", fontSize: 11 }}>{ed.year}</span>
              </div>
            ))}
            <h2 style={{ fontSize: 11, fontWeight: 700, color: "#111", textTransform: "uppercase", letterSpacing: "1px", margin: "8px 0", borderBottom: "1px solid #ddd", paddingBottom: 4 }}>Skills</h2>
            <p style={{ margin: 0, color: "#333", fontSize: 11 }}>{resume.skills.join(" · ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ATS Analyzer ──────────────────────────────────────────────────────────────
function ATSAnalyzer({ runAI }) {
  const [resumeText, setResumeText] = useState("Senior Software Engineer with 5+ years of experience in React, Node.js, TypeScript, PostgreSQL, AWS, and Docker. Led teams of 4+ engineers, built microservices, reduced latency by 40%, and improved CI/CD pipelines by 60%.");
  const [jobDesc, setJobDesc] = useState("We are looking for a Senior Frontend Engineer with strong experience in React, TypeScript, Next.js, and GraphQL. The ideal candidate has experience with AWS, CI/CD pipelines, and leading engineering teams. Knowledge of PostgreSQL and Docker is a plus.");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const text = await runAI([{
        role: "user", content: `Analyze this resume against the job description and return ONLY a JSON object (no markdown) with this exact structure:
{"score": <0-100 number>, "matched_keywords": [<array of matched keywords>], "missing_keywords": [<array of missing keywords>], "suggestions": [<array of 4 specific improvement suggestions>], "summary": "<2 sentence assessment>"}

RESUME: ${resumeText}

JOB DESCRIPTION: ${jobDesc}`
      }], "You are an expert ATS resume analyzer. Be strict, practical, and specific. Return only valid JSON, no markdown.");
      setResult(normalizeAtsResult(extractJson(text)));
    } catch (e) {
      setResult({ score: 0, matched_keywords: [], missing_keywords: [], suggestions: [e.message || "Error analyzing - try again"], summary: "Could not complete the analysis." });
    }
    setLoading(false);
  };

  const scoreColor = result ? (result.score >= 75 ? "#34D399" : result.score >= 50 ? "#F59E0B" : "#F87171") : "#38BDF8";

  return (
    <div>
      <SectionHeader title="ATS Analyzer" subtitle="See how well your resume matches a job description"
        action={result ? <ExportOptions label="Report" document={getAtsExportData({ resumeText, jobDesc, result })} /> : null} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Input label="Your Resume Text" value={resumeText} onChange={setResumeText} multiline rows={8} placeholder="Paste your resume content here..." />
        <Input label="Job Description" value={jobDesc} onChange={setJobDesc} multiline rows={8} placeholder="Paste the job description here..." />
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <Btn onClick={analyze} loading={loading} style={{ padding: "12px 32px", fontSize: 14 }}><Target size={15} />Analyze Match</Btn>
      </div>

      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
          <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", border: `6px solid ${scoreColor}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, background: scoreColor + "10" }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: scoreColor }}>{result.score}%</span>
            </div>
            <p style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px" }}>ATS Match</p>
            <Badge color={scoreColor}>{result.score >= 75 ? "Strong" : result.score >= 50 ? "Moderate" : "Weak"}</Badge>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <p style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>Assessment</p>
              <p style={{ color: "#CBD5E1", fontSize: 13, margin: 0, lineHeight: 1.7 }}>{result.summary}</p>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Card>
                <p style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}><CheckCircle2 size={13} color="#34D399" />Matched Keywords</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {result.matched_keywords.length === 0 && <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>No matched keywords found yet.</p>}
                  {result.matched_keywords.map(k => <Badge key={k} color="#34D399">{k}</Badge>)}
                </div>
              </Card>
              <Card>
                <p style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}><AlertCircle size={13} color="#F87171" />Missing Keywords</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {result.missing_keywords.length === 0 && <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>No missing keywords detected.</p>}
                  {result.missing_keywords.map(k => <Badge key={k} color="#F87171">{k}</Badge>)}
                </div>
              </Card>
            </div>

            <Card>
              <p style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}><Sparkles size={13} color="#A78BFA" />AI Suggestions</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {result.suggestions.length === 0 && <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>No suggestions returned.</p>}
                {result.suggestions.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#1E1040", color: "#A78BFA", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                    <p style={{ color: "#CBD5E1", fontSize: 13, margin: 0, lineHeight: 1.6 }}>{s}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Cover Letter ──────────────────────────────────────────────────────────────
function CoverLetter({ runAI }) {
  const [jobTitle, setJobTitle] = useState("Senior Frontend Engineer");
  const [company, setCompany] = useState("Stripe");
  const [tone, setTone] = useState("confident");
  const [extraContext, setExtraContext] = useState("I have 5 years of experience in React and TypeScript, and I led a team that shipped a real-time payments dashboard.");
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setLetter("");
    try {
      const text = await runAI([{
        role: "user", content: `Write a ${tone} cover letter for a ${jobTitle} position at ${company}. 
Additional context: ${extraContext}
The letter should be 3 polished paragraphs: opening hook, value proposition with concrete specifics, closing call to action. Keep it natural, truthful, and recruiter-friendly.
Return only the letter text, no subject line.`
      }], "You are an expert career coach and cover letter writer. Write concise, specific, high-quality application material.", 900);
      setLetter(text);
    } catch (e) { setLetter(e.message || "Error generating letter - please try again."); }
    setLoading(false);
  };

  const tones = [
    { value: "confident", label: "Confident", color: "#38BDF8" },
    { value: "formal", label: "Formal", color: "#94A3B8" },
    { value: "creative", label: "Creative", color: "#A78BFA" },
    { value: "enthusiastic", label: "Enthusiastic", color: "#34D399" },
  ];

  return (
    <div>
      <SectionHeader title="Cover Letter Generator" subtitle="One-click AI cover letters tailored to each job" />
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Input label="Job Title" value={jobTitle} onChange={setJobTitle} placeholder="e.g. Senior Engineer" />
              <Input label="Company" value={company} onChange={setCompany} placeholder="e.g. Stripe" />
              <div>
                <label style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Tone</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {tones.map(t => (
                    <button key={t.value} onClick={() => setTone(t.value)}
                      style={{ padding: "8px", borderRadius: 8, border: `1px solid ${tone === t.value ? t.color : "#1E2D47"}`, background: tone === t.value ? t.color + "15" : "#070D1A", color: tone === t.value ? t.color : "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <Input label="Your Background (brief)" value={extraContext} onChange={setExtraContext} multiline rows={3} placeholder="Key achievements, skills, years of experience..." />
              <Btn onClick={generate} loading={loading} style={{ width: "100%", justifyContent: "center" }}><Sparkles size={14} />Generate Letter</Btn>
            </div>
          </Card>
        </div>

        <Card style={{ minHeight: 400 }}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 16 }}>
              <Loader2 size={28} color="#38BDF8" style={{ animation: "spin 1s linear infinite" }} />
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Crafting your letter...</p>
            </div>
          )}
          {!loading && !letter && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 12, opacity: 0.5 }}>
              <Mail size={36} color="#334155" />
              <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>Fill in the details and click Generate</p>
            </div>
          )}
          {letter && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <Badge color="#34D399">Generated</Badge>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn onClick={generate} variant="ghost" style={{ padding: "6px 12px", fontSize: 12 }}><RefreshCw size={12} />Regenerate</Btn>
                  <ExportOptions label="Letter" document={getCoverLetterExportData({ jobTitle, company, letter })} />
                </div>
              </div>
              <div style={{ color: "#CBD5E1", fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{letter}</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ── Job Tracker ────────────────────────────────────────────────────────────────
function JobTracker({ jobs, setJobs, plan, setView, notify }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newJob, setNewJob] = useState({ title: "", company: "", salary: "", notes: "", status: "Applied" });
  const [dragging, setDragging] = useState(null);

  const addJob = () => {
    if (!newJob.title || !newJob.company) return;
    if (jobs.length >= plan.jobLimit) {
      notify({
        title: "Job limit reached",
        message: `Your ${plan.name} plan supports ${plan.jobLimit} tracked jobs. Upgrade your plan to add more applications.`,
        type: "warning",
      });
      setView("plans");
      return;
    }
    setJobs(j => [...j, { ...newJob, id: Date.now(), date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }) }]);
    setNewJob({ title: "", company: "", salary: "", notes: "", status: "Applied" });
    setShowAdd(false);
  };

  const moveJob = (id, status) => setJobs(j => j.map(job => job.id === id ? { ...job, status } : job));
  const deleteJob = (id) => setJobs(j => j.filter(job => job.id !== id));
  const jobRows = [
      ["Title", "Company", "Status", "Date", "Salary", "Notes"],
      ...jobs.map(job => [job.title, job.company, job.status, job.date, job.salary, job.notes]),
    ];
  const exportJobsCsv = () => downloadCsv(jobRows, "job-tracker");
  const exportJobsJson = () => downloadJson(jobs, "job-tracker");
  const exportJobsTxt = () => downloadTxt(jobRows.map(row => row.join(" | ")).join("\n"), "job-tracker");

  return (
    <div>
      <SectionHeader title="Job Tracker" subtitle={`Track every application - ${jobs.length}/${plan.jobLimit} jobs used on ${plan.name}`}
        action={<div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}><Btn onClick={exportJobsCsv} variant="success"><Download size={14} />CSV</Btn><Btn onClick={exportJobsJson} variant="ghost">JSON</Btn><Btn onClick={exportJobsTxt} variant="ghost">TXT</Btn><Btn onClick={() => setShowAdd(!showAdd)}><Plus size={14} />Add Job</Btn></div>} />

      {showAdd && (
        <Card style={{ marginBottom: 20 }}>
          <h4 style={{ color: "#E2E8F0", fontSize: 13, fontWeight: 600, margin: "0 0 16px" }}>New Application</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Input label="Job Title" value={newJob.title} onChange={v => setNewJob(j => ({ ...j, title: v }))} placeholder="e.g. Engineer" />
            <Input label="Company" value={newJob.company} onChange={v => setNewJob(j => ({ ...j, company: v }))} placeholder="e.g. Google" />
            <Input label="Salary Range" value={newJob.salary} onChange={v => setNewJob(j => ({ ...j, salary: v }))} placeholder="e.g. $120k–$150k" />
          </div>
          <Input label="Notes" value={newJob.notes} onChange={v => setNewJob(j => ({ ...j, notes: v }))} multiline rows={2} placeholder="Any notes..." style={{ marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={addJob}><Plus size={13} />Add Application</Btn>
            <Btn onClick={() => setShowAdd(false)} variant="ghost">Cancel</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, overflowX: "auto" }}>
        {COLUMNS.map(col => {
          const colJobs = jobs.filter(j => j.status === col);
          return (
            <div key={col} style={{ minWidth: 180 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: COL_COLORS[col] }} />
                <span style={{ color: "#94A3B8", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{col}</span>
                <span style={{ marginLeft: "auto", color: "#64748B", fontSize: 12, fontWeight: 600, background: "#1E2D47", padding: "1px 6px", borderRadius: 10 }}>{colJobs.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 200 }}>
                {colJobs.map(job => (
                  <div key={job.id} style={{ background: "#0F172A", border: "1px solid #1E2D47", borderRadius: 10, padding: "12px", borderLeft: `3px solid ${COL_COLORS[col]}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <p style={{ color: "#E2E8F0", fontSize: 12, fontWeight: 600, margin: 0, lineHeight: 1.4 }}>{job.title}</p>
                      <button onClick={() => deleteJob(job.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#334155", padding: 2, flexShrink: 0 }}><Trash2 size={11} /></button>
                    </div>
                    <p style={{ color: "#38BDF8", fontSize: 11, margin: "0 0 6px" }}>{job.company}</p>
                    {job.salary && <p style={{ color: "#64748B", fontSize: 11, margin: "0 0 4px" }}>{job.salary}</p>}
                    {job.notes && <p style={{ color: "#475569", fontSize: 10, margin: "0 0 8px", lineHeight: 1.5, fontStyle: "italic" }}>{job.notes}</p>}
                    <p style={{ color: "#334155", fontSize: 10, margin: "0 0 8px" }}>{job.date}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {COLUMNS.filter(c => c !== col).map(c => (
                        <button key={c} onClick={() => moveJob(job.id, c)}
                          style={{ background: "#0F2540", border: "1px solid #1E3A5A", color: "#64748B", fontSize: 9, fontWeight: 600, padding: "3px 6px", borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap" }}>→ {c}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Interview Prep ────────────────────────────────────────────────────────────
function InterviewPrep({ runAI, notify }) {
  const [role, setRole] = useState("Senior Frontend Engineer");
  const [company, setCompany] = useState("Stripe");
  const [questions, setQuestions] = useState([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [loadingFeedback, setLoadingFeedback] = useState({});
  const [expanded, setExpanded] = useState(null);

  const generateQuestions = async () => {
    setLoadingQ(true);
    setQuestions([]);
    setAnswers({});
    setFeedback({});
    try {
      const text = await runAI([{
        role: "user", content: `Generate 6 interview questions for a ${role} position at ${company}. Mix: 2 behavioral, 2 technical, 1 system design, 1 company-specific. Return ONLY a JSON array of objects: [{"id":1,"type":"Behavioral","question":"..."},...]`
      }], "You are an expert interview coach. Make questions realistic, role-specific, and seniority-appropriate. Return only valid JSON.");
      const parsed = extractJsonArray(text);
      setQuestions(Array.isArray(parsed) ? parsed : []);
    } catch (e) { notify({ title: "Question generation failed", message: e.message, type: "warning" }); }
    setLoadingQ(false);
  };

  const getFeedback = async (qId, question, answer) => {
    setLoadingFeedback(f => ({ ...f, [qId]: true }));
    try {
      const fb = await runAI([{
        role: "user", content: `Interview question: "${question}"\nCandidate's answer: "${answer}"\n\nProvide coaching feedback in 2-3 sentences: what was good, what to improve, and a tip. Be specific and actionable.`
      }], "You are an expert interview coach.", 400);
      setFeedback(f => ({ ...f, [qId]: fb }));
    } catch (e) { setFeedback(f => ({ ...f, [qId]: e.message || "Could not generate feedback." })); }
    setLoadingFeedback(f => ({ ...f, [qId]: false }));
  };

  const typeColors = { Behavioral: "#38BDF8", Technical: "#A78BFA", "System Design": "#F59E0B", "Company-specific": "#34D399" };

  return (
    <div>
      <SectionHeader title="AI Interview Prep" subtitle="Practice with role-specific questions and get real-time coaching"
        action={questions.length > 0 ? <ExportOptions label="Prep" document={getInterviewExportData({ role, company, questions, answers, feedback })} /> : null} />
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end" }}>
          <Input label="Target Role" value={role} onChange={setRole} placeholder="e.g. Senior Engineer" style={{ flex: 1 }} />
          <Input label="Company" value={company} onChange={setCompany} placeholder="e.g. Google" style={{ flex: 1 }} />
          <Btn onClick={generateQuestions} loading={loadingQ} style={{ flexShrink: 0, padding: "10px 20px" }}><Brain size={14} />Generate Questions</Btn>
        </div>
      </Card>

      {loadingQ && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "60px 0" }}>
          <Loader2 size={28} color="#38BDF8" style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Generating tailored interview questions...</p>
        </div>
      )}

      {questions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {questions.map((q, i) => (
            <Card key={q.id}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: "#1E2D47", color: "#64748B", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                  <Badge color={typeColors[q.type] || "#38BDF8"}>{q.type}</Badge>
                  <p style={{ color: "#E2E8F0", fontSize: 14, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>{q.question}</p>
                </div>
                <button onClick={() => setExpanded(expanded === q.id ? null : q.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", padding: 4, flexShrink: 0, marginLeft: 12 }}>
                  {expanded === q.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {expanded === q.id && (
                <div style={{ marginTop: 12 }}>
                  <textarea value={answers[q.id] || ""} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                    placeholder="Type your answer here to get AI coaching feedback..." rows={4}
                    style={{ width: "100%", background: "#070D1A", border: "1px solid #1E2D47", borderRadius: 8, padding: "10px 12px", color: "#E2E8F0", fontSize: 13, resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }} />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, marginBottom: feedback[q.id] ? 14 : 0 }}>
                    <Btn onClick={() => getFeedback(q.id, q.question, answers[q.id])} loading={loadingFeedback[q.id]} disabled={!answers[q.id]?.trim()} variant="ghost">
                      <MessageSquare size={13} />Get AI Feedback
                    </Btn>
                  </div>
                  {feedback[q.id] && (
                    <div style={{ background: "#0A1628", border: "1px solid #1E3A5A", borderRadius: 10, padding: "14px 16px" }}>
                      <p style={{ color: "#38BDF8", fontSize: 12, fontWeight: 700, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}><Sparkles size={13} />Coaching Feedback</p>
                      <p style={{ color: "#CBD5E1", fontSize: 13, margin: 0, lineHeight: 1.7 }}>{feedback[q.id]}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {!loadingQ && questions.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "80px 0", opacity: 0.5 }}>
          <Brain size={40} color="#334155" />
          <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>Set your role and company, then generate questions</p>
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
function CareerAI() {
  const [view, setView] = useState("dashboard");
  const [user, setUser] = useState(() => normalizeUserPlan(readStorage("careerai:user", null)));
  const [usage, setUsage] = useState(() => {
    const stored = readStorage("careerai:usage", DEFAULT_USAGE);
    return stored.date === getTodayKey() ? stored : DEFAULT_USAGE;
  });
  const [jobs, setJobs] = useState(() => readStorage("careerai:jobs", SAMPLE_JOBS));
  const [collapsed, setCollapsed] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const plan = PLAN_CONFIG[user?.plan] || PLAN_CONFIG.free;

  useEffect(() => {
    writeStorage("careerai:jobs", jobs);
  }, [jobs]);

  useEffect(() => {
    writeStorage("careerai:usage", usage);
  }, [usage]);

  const notify = ({ title = "Notice", message, type = "info" }) => {
    setNotice({ title, message, type });
  };

  useEffect(() => {
    if (!user) return;
    const normalized = normalizeUserPlan(user);
    if (normalized !== user) {
      setUser(normalized);
      writeStorage("careerai:user", normalized);
      if (user.plan !== "free") {
        notify({
          title: `${PLAN_CONFIG[user.plan]?.name || "Paid"} plan expired`,
          message: "Your monthly plan has expired, so your workspace has been moved back to the Free plan.",
          type: "warning",
        });
      }
      return;
    }
    writeStorage("careerai:user", user);
  }, [user]);

  useEffect(() => {
    if (!user || user.plan === "free" || isPlanExpired(user)) return;

    const daysLeft = getDaysUntil(user.planRenewsAt);
    if (daysLeft < 0 || daysLeft > PLAN_RENEWAL_REMINDER_DAYS) return;

    const reminderKey = getRenewalReminderKey(user);
    if (readStorage(reminderKey, null)) return;

    const sendReminder = async () => {
      try {
        const res = await fetch("/api/send-renewal-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: user.email,
            name: user.name,
            planName: PLAN_CONFIG[user.plan]?.name || "Paid",
            renewsAt: formatPlanDate(user.planRenewsAt),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Could not send renewal reminder email.");
        }

        writeStorage(reminderKey, {
          sentAt: new Date().toISOString(),
          mode: data.mode || "sent",
        });

        notify({
          title: "Renewal reminder sent",
          message: data.mode === "mock"
            ? "A test renewal email was prepared. Add RESEND_API_KEY to send real emails when live."
            : `We emailed ${user.email} because your ${PLAN_CONFIG[user.plan]?.name || "paid"} plan expires soon.`,
          type: data.mode === "mock" ? "info" : "success",
        });
      } catch (err) {
        notify({
          title: "Renewal email failed",
          message: err.message,
          type: "warning",
        });
      }
    };

    sendReminder();
  }, [user]);

  useEffect(() => {
    const handleNotice = (event) => setNotice(event.detail);
    window.addEventListener("careerai:notice", handleNotice);
    return () => window.removeEventListener("careerai:notice", handleNotice);
  }, []);

  const handleLogin = (nextUser) => {
    const normalized = normalizeUserPlan(nextUser);
    setUser(normalized);
    writeStorage("careerai:user", normalized);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("careerai:user");
  };

  const runAI = async (messages, systemPrompt = "", maxTokens = 1000) => {
    const today = getTodayKey();
    const currentUsage = usage.date === today ? usage : DEFAULT_USAGE;

    if (currentUsage.aiActions >= plan.aiLimit) {
      setUpgradeModalOpen(true);
      throw new Error(`Your ${plan.name} plan has reached ${plan.aiLimit} AI actions today. Upgrade your plan to continue.`);
    }

    const response = await API(messages, systemPrompt, maxTokens);
    setUsage(prev => {
      const fresh = prev.date === today ? prev : DEFAULT_USAGE;
      return { ...fresh, aiActions: fresh.aiActions + 1 };
    });
    return response;
  };

  const renderView = () => {
    switch (view) {
      case "dashboard": return <Dashboard jobs={jobs} setView={setView} />;
      case "resume": return <ResumeBuilder runAI={runAI} notify={notify} />;
      case "ats": return <ATSAnalyzer runAI={runAI} />;
      case "cover": return <CoverLetter runAI={runAI} />;
      case "tracker": return <JobTracker jobs={jobs} setJobs={setJobs} plan={plan} setView={setView} notify={notify} />;
      case "interview": return <InterviewPrep runAI={runAI} notify={notify} />;
      case "plans": return <PlansView user={user} setUser={setUser} usage={usage.date === getTodayKey() ? usage : DEFAULT_USAGE} notify={notify} />;
      default: return null;
    }
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const upgradeFromModal = (planId) => {
    const updated = activatePlanForOneMonth(user, planId);
    setUser(updated);
    writeStorage("careerai:user", updated);
    setUpgradeModalOpen(false);
    setView("plans");
    notify({
      title: `${PLAN_CONFIG[planId].name} plan active`,
      message: `Your ${PLAN_CONFIG[planId].name} plan is active until ${formatPlanDate(updated.planRenewsAt)}.`,
      type: "success",
    });
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'DM Sans', system-ui, sans-serif; background: #070D1A; }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalPop { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes softPulse { 0%, 100% { box-shadow: 0 0 0 rgba(56,189,248,0); } 50% { box-shadow: 0 0 24px rgba(56,189,248,0.16); } }
        .app-card { animation: fadeInUp 220ms ease both; transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease; }
        .app-card:hover { transform: translateY(-1px); border-color: #2B4467; box-shadow: 0 10px 30px rgba(2,6,23,0.22); }
        .upgrade-modal { animation: modalPop 180ms ease both; }
        .modal-backdrop { animation: fadeInUp 140ms ease both; }
        aside > div:first-child > div:first-child { animation: softPulse 2.8s ease-in-out infinite; }
        input::placeholder, textarea::placeholder { color: #334155; }
        input:focus, textarea:focus { border-color: #38BDF8 !important; }
        button:hover { opacity: 0.9; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #1E2D47; border-radius: 3px; }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: "#070D1A" }}>
        <UpgradeModal plan={upgradeModalOpen ? plan : null} usage={usage.date === getTodayKey() ? usage : DEFAULT_USAGE} onClose={() => setUpgradeModalOpen(false)} onUpgrade={upgradeFromModal} />
        <NoticeModal notice={notice} onClose={() => setNotice(null)} />
        <Sidebar view={view} setView={setView} collapsed={collapsed} setCollapsed={setCollapsed} user={user} onLogout={handleLogout} />
        <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto", minWidth: 0 }}>
          {/* Top Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 28, gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#0F172A", border: "1px solid #1E2D47", borderRadius: 8, padding: "8px 14px" }}>
              <Search size={13} color="#64748B" />
              <span style={{ color: "#334155", fontSize: 13 }}>Search everything...</span>
            </div>
            <button style={{ background: "#0F172A", border: "1px solid #1E2D47", borderRadius: 8, padding: "8px 10px", cursor: "pointer", color: "#64748B", display: "flex" }}><Bell size={15} /></button>
            <button onClick={() => setView("plans")} style={{ background: "linear-gradient(135deg,#0EA5E9,#6366F1)", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 700 }}>{plan.name === "Free" ? "Upgrade Pro" : `${plan.name} Plan`}</button>
          </div>
          {renderView()}
        </main>
      </div>
    </>
  );
}

export default CareerAI;
