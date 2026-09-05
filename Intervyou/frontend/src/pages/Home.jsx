



import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";




  export default function Home() {
  const navigate = useNavigate();
  const { authFetch, isAuthenticated } = useAuth();

  const [role, setRole] = useState("Full Stack Software Engineer");
  const [level, setLevel] = useState("Senior");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
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

    const res = await authFetch("/api/interview/start", {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      if (res.status === 401) {
        throw new Error("Your login session has expired. Please log in again.");
      }

      throw new Error(
        data.message ||
          data.error ||
          `Backend error (${res.status})`
      );
    }

    if (
      !data.sessionId ||
      !data.rtc?.appId ||
      !data.rtc?.channel ||
      !data.rtc?.token ||
      data.rtc?.uid === undefined ||
      data.rtc?.uid === null
    ) {
      throw new Error("Backend returned incomplete Agora session data.");
    }

    console.log("[Home] Interview started successfully:", data);

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
    setError(
      err.message ||
        "Could not start interview. Ensure the backend is running."
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
            <Sparkles size={13} /> Resume-Grounded Voice Interview
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Intervyou AI
          </h1>
          <p className="text-slate-400 text-xs mt-1.5">
            Practice with an adaptive AI interview panel built around your experience
          </p>
        </div>

        <div className="space-y-4">
          {/* Resume upload — required, matches backend's multer field name "resume" */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Resume
            </label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700/80 hover:border-indigo-500/60 bg-slate-950 rounded-xl p-4 cursor-pointer transition">
              <UploadCloud size={20} className="text-indigo-400 mb-1.5" />
              <span className="text-xs font-medium text-slate-300">
                {file ? "Change file" : "Click to upload PDF, DOCX, or TXT"}
              </span>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {file && (
              <div className="mt-2 flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={14} className="text-indigo-400 shrink-0" />
                  <span className="text-xs text-slate-300 truncate">{file.name}</span>
                </div>
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Target Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Seniority Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="Junior">Junior Engineer</option>
              <option value="Mid-Level">Mid-Level Engineer</option>
              <option value="Senior">Senior (L5) Engineer</option>
              <option value="Staff/Lead">Staff / Principal Lead</option>
            </select>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Your resume guides the questions, follow-ups, and evidence-based assessment.</span>
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          <button
            type="button"
            onClick={handleStartInterview}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 rounded-xl font-semibold text-white text-xs transition shadow-lg shadow-indigo-600/20 active:scale-[0.99]"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            {loading ? "Initializing Panel..." : "Enter Interview Room"}
          </button>
        </div>
      </div>
    </div>
  );
}
