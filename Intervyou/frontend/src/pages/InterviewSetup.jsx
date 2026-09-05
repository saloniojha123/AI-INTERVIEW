


import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Captions,
  CheckCircle2,
  Clock,
  Loader2,
  Mic,
  Sparkles,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const PANELS = [
  { id: 1, name: "Recruiter screen", desc: "Background & communication" },
  { id: 2, name: "Hiring manager", desc: "Leadership, trade-offs & execution" },
  { id: 3, name: "Portfolio deep dive", desc: "Design systems & technical craft" },
  { id: 4, name: "Culture & values", desc: "Cross-functional team alignment" },
];

const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];

export default function InterviewSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authFetch } = useAuth() || {};

  const [captionsOn, setCaptionsOn] = useState(true);
  const [resumeFile, setResumeFile] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const videoPreviewRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let active = true;

    const requestCamera = async () => {
      try {
        // Do not open the microphone here. Agora opens the microphone in
        // InterviewRoom and publishes the Agora audio track.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setCameraReady(true);

        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      } catch (cameraError) {
        console.warn(
          "[InterviewSetup] Camera permission notice:",
          cameraError?.message || cameraError
        );
        setCameraReady(false);
      }
    };

    requestCamera();

    return () => {
      active = false;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleResumeChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setResumeFile(null);
      return;
    }

    const dotIndex = file.name.lastIndexOf(".");
    const extension = dotIndex >= 0
      ? file.name.slice(dotIndex).toLowerCase()
      : "";

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setResumeFile(null);
      setError("Only PDF, DOCX, and TXT resumes are supported.");
      return;
    }

    if (file.size > MAX_RESUME_SIZE) {
      setResumeFile(null);
      setError("Resume must be smaller than 5 MB.");
      return;
    }

    setResumeFile(file);
    setError("");

    console.log("[InterviewSetup] Resume selected:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });
  };

  const handleStartInterview = async () => {
    if (!resumeFile) {
      setError("Please upload your resume before starting.");
      return;
    }

    if (typeof authFetch !== "function") {
      setError("Authentication request helper is unavailable.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("role", location.state?.role || "Candidate");
      formData.append("level", location.state?.level || "Mid-Senior");
      formData.append("resume", resumeFile, resumeFile.name);

      console.log("[InterviewSetup] Starting interview:", {
        role: location.state?.role || "Candidate",
        level: location.state?.level || "Mid-Senior",
        resume: resumeFile.name,
      });

      // Do not set Content-Type manually. The browser adds the multipart
      // boundary required by Multer.
      const response = await authFetch("/api/interview/start", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { rawResponse: responseText };
      }

      console.log("[InterviewSetup] Backend response:", {
        status: response.status,
        ok: response.ok,
        data,
      });

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.error ||
            `Interview start failed with HTTP ${response.status}`
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

      navigate(`/interview/${data.sessionId}`, {
        state: {
       ...location.state,
       sessionId: data.sessionId,
        rtc: data.rtc,
       agentId: data.agentId,
       agentUid: data.agentUid,
       channelName: data.channelName,
        panel: data.panel,
       }
,
      });
    } catch (startError) {
      console.error("[InterviewSetup] Start interview failed:", startError);
      setError(startError?.message || "Could not start interview.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-full max-w-5xl p-6 font-sans sm:p-10">
      <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-blue-400">
            <Sparkles size={18} />
            AI Interview Setup
          </div>
          <h1 className="text-3xl font-bold text-slate-100">
            Prepare for your interview
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Upload your resume so the AI panel can ask relevant questions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock size={16} />
          Live voice interview
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-800 bg-slate-950/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">
            Upload resume
          </h2>

          <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-8 text-center transition hover:border-blue-500">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={handleResumeChange}
            />
            <span className="text-sm text-slate-300">
              Choose PDF, DOCX, or TXT
            </span>
            <span className="mt-2 block text-xs text-slate-500">
              Maximum size: 5 MB
            </span>
          </label>

          {resumeFile && (
            <p className="mt-3 flex items-center gap-1 text-sm text-emerald-400">
              <CheckCircle2 size={16} />
              {resumeFile.name}
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="mt-8 space-y-3 text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <Users size={17} className="text-blue-400" />
              Five-person AI panel
            </div>
            <div className="flex items-center gap-3">
              <Mic size={17} className="text-emerald-400" />
              Real-time Agora voice conversation
            </div>
            <div className="flex items-center gap-3">
              <Captions size={17} className="text-amber-400" />
              Live captions {captionsOn ? "enabled" : "disabled"}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCaptionsOn((current) => !current)}
            className="mt-5 text-xs text-slate-400 underline"
          >
            {captionsOn ? "Disable captions" : "Enable captions"}
          </button>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">
            Device preview
          </h2>

          <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900">
            {cameraReady ? (
              <video
                ref={videoPreviewRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover -scale-x-100"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-sm text-slate-500">
                <VideoOff size={24} className="mb-2" />
                Camera unavailable
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <span className={cameraReady ? "text-emerald-400" : "text-red-400"}>
              <Video size={14} className="mr-1 inline" />
              Camera {cameraReady ? "ready" : "not ready"}
            </span>
            <span className="text-slate-500">
              <Mic size={14} className="mr-1 inline" />
              Microphone will be opened by Agora
            </span>
          </div>

          <button
            type="button"
            disabled={loading || !resumeFile}
            onClick={handleStartInterview}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <ArrowRight size={17} />
            )}
            {loading ? "Starting interview..." : "Start interview"}
          </button>
        </section>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PANELS.map((panel) => (
          <div
            key={panel.id}
            className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
          >
            <p className="text-sm font-semibold text-slate-200">
              {panel.name}
            </p>
            <p className="mt-1 text-xs text-slate-500">{panel.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
