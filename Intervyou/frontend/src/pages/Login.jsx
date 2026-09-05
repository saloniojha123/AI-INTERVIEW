


import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  FileText,
  MessageSquare,
  Video,
  Mic,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await login({ email: email.trim(), password });
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    }
  }

  function handleForgotPassword(e) {
    e.preventDefault();
    setNotice("Password reset isn't set up yet — contact support for help.");
  }

  function handleOAuth(provider) {
    window.location.href = `${API_BASE}/api/auth/${provider}`;
  }

  return (
    <div className="relative min-h-screen w-full bg-[#0f172a] text-slate-100 font-sans flex items-center justify-center p-6 sm:p-10 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -left-28 -top-28 h-[550px] w-[550px] rounded-full bg-blue-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-10%] h-[550px] w-[550px] rounded-full bg-indigo-600/15 blur-[120px]" />

      {/* Top Header Link */}
      <header className="absolute top-6 right-8 sm:top-8 sm:right-12 z-20">
        <button
          type="button"
          onClick={handleForgotPassword}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
        >
          <HelpCircle size={15} />
          Need help?
        </button>
      </header>

      {/* Main Grid Wrapper */}
      <div className="relative z-10 grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
        
        {/* Left Side: Product Feature Visuals */}
        <div className="flex flex-col justify-center lg:col-span-6 xl:col-span-7 pr-0 lg:pr-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/25">
              <Sparkles size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-100">
              Interviewly <span className="text-blue-400">AI</span>
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold leading-[1.15] tracking-tight text-slate-50">
            Your next <br />
            interview <br />
            starts <span className="text-blue-400">here.</span>
          </h1>

          <p className="mt-5 text-sm sm:text-base font-normal leading-relaxed text-slate-400 max-w-md">
            Practice smarter. Interview with confidence. Grow with clarity.
          </p>

          {/* Floating UI Elements */}
          <div className="relative mt-10 h-72 sm:h-80 w-full max-w-lg">
            {/* Center Glowing Node */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-28 w-28 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 shadow-inner">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 border border-blue-400/40 text-blue-400 shadow-lg shadow-blue-500/20">
                <Sparkles size={28} />
              </div>
            </div>

            {/* Resume Card */}
            <div className="absolute top-2 left-4 sm:left-6 flex items-center gap-3 rounded-2xl bg-slate-900/80 p-3.5 shadow-lg shadow-slate-950/40 backdrop-blur-md border border-slate-700/60">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Resume</p>
                <div className="mt-1 h-1.5 w-14 rounded-full bg-slate-700" />
              </div>
            </div>

            {/* AI Feedback Card */}
            <div className="absolute top-2 right-4 sm:right-6 flex items-center gap-3 rounded-2xl bg-slate-900/80 p-3.5 shadow-lg shadow-slate-950/40 backdrop-blur-md border border-slate-700/60">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <MessageSquare size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">AI Feedback</p>
                <div className="mt-1 h-1.5 w-16 rounded-full bg-emerald-500/30" />
              </div>
            </div>

            {/* Mic Badge */}
            <div className="absolute top-1/2 -translate-y-1/2 left-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-blue-400 shadow-md border border-slate-700/60">
              <Mic size={18} />
            </div>

            {/* Video Badge */}
            <div className="absolute top-1/2 -translate-y-1/2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-indigo-400 shadow-md border border-slate-700/60">
              <Video size={18} />
            </div>

            {/* Strengths Card */}
            <div className="absolute bottom-2 left-4 sm:left-6 rounded-2xl bg-slate-900/80 p-3.5 shadow-lg shadow-slate-950/40 backdrop-blur-md border border-slate-700/60 min-w-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Strengths</span>
                <span className="text-xs font-bold text-emerald-400">85%</span>
              </div>
              <div className="mt-2 flex items-end gap-1 h-4">
                {[4, 7, 5, 9, 12, 10, 14, 16].map((h, i) => (
                  <span
                    key={i}
                    className="w-2 rounded-full bg-emerald-400/80"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </div>

            {/* Mock Interview Audio Waveform */}
            <div className="absolute bottom-2 right-4 sm:right-6 rounded-2xl bg-slate-900/80 p-3.5 shadow-lg shadow-slate-950/40 backdrop-blur-md border border-slate-700/60 min-w-[150px]">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5">
                <span>Mock Interview</span>
                <span className="text-slate-400 font-normal">12:48</span>
              </div>
              <div className="flex items-center gap-0.5 h-5">
                {[6, 12, 18, 10, 14, 8, 16, 20, 11, 7, 15, 9, 4].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 rounded-full bg-blue-400/70"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs font-medium text-slate-400">
            <Sparkles size={14} className="text-blue-400" />
            AI-powered interview practice for ambitious candidates.
          </div>
        </div>

        {/* Right Side: Form Card */}
        <div className="lg:col-span-6 xl:col-span-5 flex justify-center">
          <div className="w-full max-w-md rounded-3xl bg-slate-900/90 p-8 sm:p-10 shadow-2xl shadow-slate-950/50 border border-slate-800 backdrop-blur-xl">
            
            <div className="flex justify-center mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Sparkles size={20} />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-100">Welcome back</h2>
              <p className="mt-1 text-xs text-slate-400">
                Sign in to continue your interview journey.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 py-2.5 pl-10 pr-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500/30"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-medium text-blue-400 hover:text-blue-300 transition"
                >
                  Forgot password?
                </button>
              </div>

              {notice && <p className="text-xs text-slate-400 text-center">{notice}</p>}
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-center text-xs font-medium text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-60"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-[11px] font-medium text-slate-500">or continue with</span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-700/80 bg-slate-950/60 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 hover:border-slate-600"
              >
                <GoogleMark />
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuth("linkedin")}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-700/80 bg-slate-950/60 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 hover:border-slate-600"
              >
                <LinkedInMark />
                Continue with LinkedIn
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              New to Interviewly AI?{" "}
              <Link to="/signup" className="font-semibold text-blue-400 hover:text-blue-300">
                Create an account
              </Link>
            </p>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck size={13} className="text-emerald-400" />
              Your data is encrypted and secure
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-3.1-.4-4.6H24v9h11.9c-.5 2.7-2.1 5-4.4 6.6v5.5h7.1c4.1-3.8 6.5-9.4 6.5-16.5z"
      />
      <path
        fill="#34A853"
        d="M24 46c6 0 11-2 14.6-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.6-3.9-12.4-9.1H4.3v5.7C7.9 41.1 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.6 28.1c-.5-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.7H4.3C2.8 17.1 2 20.5 2 24s.8 6.9 2.3 9.8l7.3-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.7c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C34.9 4.2 30 2 24 2 15.4 2 7.9 6.9 4.3 14.2l7.3 5.7c1.8-5.2 6.6-9.2 12.4-9.2z"
      />
    </svg>
  );
}

function LinkedInMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}