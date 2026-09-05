


import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Mic2,
  Play,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
  Workflow,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const productHighlights = [
  {
    icon: Mic2,
    title: "Live voice interview",
    description: "Natural conversation with pause-aware AI responses.",
    color: "text-blue-300 bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Users,
    title: "Multi-persona panel",
    description: "Technical, hiring, product, behavioural, and customer perspectives.",
    color: "text-violet-300 bg-violet-500/10 border-violet-500/20",
  },
  {
    icon: Workflow,
    title: "Evidence-based report",
    description: "Resume claims linked to the answers that support them.",
    color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { authFetch, isAuthenticated } = useAuth();

  const [role, setRole] = useState("Full Stack Software Engineer");
  const [level, setLevel] = useState("Senior");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(event) {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setError("");
    }
  }

  const handleStartInterview = async () => {
    setError("");

    if (!file) {
      setError("Please upload your resume (PDF, DOCX, or TXT) to continue.");
      return;
    }

    if (!isAuthenticated) {
      setError("Your login session has expired. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("role", role);
      formData.append("level", level);

      const response = await authFetch("/api/interview/start", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        if (response.status === 401) throw new Error("Your login session has expired. Please log in again.");
        throw new Error(data.message || data.error || `Backend error (${response.status})`);
      }

      if (!data.sessionId || !data.rtc?.appId || !data.rtc?.channel || !data.rtc?.token || data.rtc?.uid === undefined || data.rtc?.uid === null) {
        throw new Error("Backend returned incomplete Agora session data.");
      }

      navigate(`/interview/${data.sessionId}`, {
        state: {
          rtc: data.rtc,
          role,
          level,
          agentId: data.agentId,
          agentUid: data.agentUid,
          channelName: data.channelName,
          panel: data.panel,
        },
      });
    } catch (err) {
      console.error("[Home] Start interview error:", err);
      setError(err.message || "Could not start interview. Ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#0f172a] px-4 py-8 text-slate-100 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <section className="max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-300">
            <Sparkles size={13} /> Resume-grounded voice interview
          </div>
          <h1 className="max-w-lg text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Practice like the real panel is in the room.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-slate-400 sm:text-base">
            IntervYou AI turns your resume into a live, adaptive interview with multiple expert perspectives and an evidence-backed report.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {productHighlights.map(({ icon: Icon, title, description, color }) => (
              <div key={title} className="flex items-start gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/55 p-3.5 transition hover:border-slate-700 hover:bg-slate-900">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${color}`}>
                  <Icon size={17} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" /> Agora Conversational AI</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" /> Resume-linked evidence</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" /> PDF report export</span>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-black/20 sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-400">Start a session</p>
              <h2 className="mt-1 text-xl font-bold text-white">Configure your interview</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">The panel will use these details to shape the conversation.</p>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2.5 text-blue-300"><Mic2 size={18} /></div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Resume</label>
              <label className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 p-4 transition hover:border-blue-500/60 hover:bg-slate-950">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><UploadCloud size={19} /></div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-200">{file ? file.name : "Upload your resume"}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{file ? "Ready for interview context" : "PDF, DOCX, or TXT · required"}</p>
                </div>
                {file ? <CheckCircle2 size={17} className="ml-auto shrink-0 text-emerald-400" /> : <ArrowRight size={16} className="ml-auto shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-blue-400" />}
                <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1.3fr_0.7fr]">
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Target role</label>
                <input type="text" value={role} onChange={(event) => setRole(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/10" />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Seniority</label>
                <select value={level} onChange={(event) => setLevel(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm text-slate-200 outline-none transition focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/10">
                  <option value="Junior">Junior</option>
                  <option value="Mid-Level">Mid-Level</option>
                  <option value="Senior">Senior (L5)</option>
                  <option value="Staff/Lead">Staff / Lead</option>
                </select>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-3.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <p className="text-xs leading-5 text-slate-400">Your resume guides the questions, follow-ups, persona handoffs, and evidence-based assessment.</p>
            </div>

            {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-center text-xs text-red-300">{error}</p>}

            <button type="button" onClick={handleStartInterview} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-blue-900">
              <Play size={16} className="fill-white" />
              {loading ? "Initializing panel..." : "Enter interview room"}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-[10px] text-slate-600"><FileText size={12} /> Your uploaded resume is used to personalize this session.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
