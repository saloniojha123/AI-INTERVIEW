



// import React, { useEffect, useState } from "react";
// import { useLocation, useNavigate, useParams } from "react-router-dom";
// import {
//   AlertTriangle,
//   ArrowLeft,
//   CheckCircle2,
//   FileText,
//   Gauge,
//   MessageSquare,
//   Download,
//   Printer,
//   ShieldAlert,
// } from "lucide-react";
// import { useAuth } from "../context/AuthContext.jsx";

// function clamp(value, min = 0, max = 100) {
//   return Math.max(min, Math.min(max, Math.round(value)));
// }

// function formatTimestamp(value) {
//   if (!value) return "";
//   const date = new Date(value);
//   return Number.isNaN(date.getTime())
//     ? String(value)
//     : date.toLocaleTimeString([], { minute: "2-digit", second: "2-digit" });
// }

// export default function Report() {
//   const { sessionId } = useParams();
//   const navigate = useNavigate();
//   const { state } = useLocation();
//   const { authFetch } = useAuth() || {};
//   const [storedData, setStoredData] = useState(null);
//   const [loadingReport, setLoadingReport] = useState(!state?.report && !state?.transcript);
//   const [reportError, setReportError] = useState("");

//   useEffect(() => {
//     if (state?.report || state?.transcript || !sessionId || typeof authFetch !== "function") return;
//     let active = true;
//     setLoadingReport(true);
//     authFetch(`/api/interview/${encodeURIComponent(sessionId)}/report`)
//       .then(async (response) => {
//         const data = await response.json().catch(() => ({}));
//         if (!response.ok) throw new Error(data.message || "Could not load this report");
//         if (active) setStoredData(data);
//       })
//       .catch((error) => {
//         if (active) setReportError(error.message || "Could not load this report");
//       })
//       .finally(() => {
//         if (active) setLoadingReport(false);
//       });
//     return () => { active = false; };
//   }, [authFetch, sessionId, state?.report, state?.transcript]);

//   const report = state?.report || storedData?.report || {};
//   const persistedInterview = storedData?.interview || {};
//   const transcript = Array.isArray(report.transcript) && report.transcript.length
//     ? report.transcript
//     : Array.isArray(state?.transcript) && state.transcript.length
//       ? state.transcript
//       : persistedInterview.transcript || [];
//   const flags = Array.isArray(report.flags) ? report.flags : [];
//   const targetRole = state?.role || persistedInterview.role || "Software Systems Engineer";
//   const targetLevel = state?.level || persistedInterview.level || "Senior";

//   if (loadingReport) {
//     return <div className="flex min-h-screen items-center justify-center bg-[#0f172a] text-sm text-slate-400">Loading interview report...</div>;
//   }

//   if (reportError) {
//     return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0f172a] text-sm text-red-300"><p>{reportError}</p><button type="button" onClick={() => navigate("/")} className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300">Return to dashboard</button></div>;
//   }

//   const candidateTurns = transcript.filter(
//     (turn) => turn.role === "Candidate" || turn.speaker === "candidate"
//   );
//   const panelTurns = transcript.filter(
//     (turn) => !candidateTurns.includes(turn)
//   );
//   const candidateWords = candidateTurns.reduce(
//     (total, turn) => total + String(turn.text || "").trim().split(/\s+/).filter(Boolean).length,
//     0
//   );
//   const averageWords = candidateTurns.length ? candidateWords / candidateTurns.length : 0;
//   const flagPenalty = flags.length * 8;

//   const calculatedScorecards = [
//     {
//       label: "Interview Engagement",
//       score: clamp(55 + candidateTurns.length * 8 - flagPenalty),
//       color: "text-indigo-400",
//       bar: "bg-indigo-500",
//     },
//     {
//       label: "Response Clarity",
//       score: clamp(58 + Math.min(30, averageWords / 4) - flagPenalty),
//       color: "text-emerald-400",
//       bar: "bg-emerald-500",
//     },
//     {
//       label: "Panel Coverage",
//       score: clamp(50 + new Set(panelTurns.map((turn) => turn.personaId || turn.speaker)).size * 10),
//       color: "text-blue-400",
//       bar: "bg-blue-500",
//     },
//     {
//       label: "Assessment Signal",
//       score: clamp(82 - flagPenalty),
//       color: flags.length ? "text-amber-400" : "text-purple-400",
//       bar: flags.length ? "bg-amber-500" : "bg-purple-500",
//     },
//   ];
//   const scorecards = report.summary?.scores?.length
//     ? report.summary.scores.map((card) => ({
//         ...card,
//         bar: card.bar || "bg-blue-500",
//         color: card.color || "text-blue-400",
//       }))
//     : calculatedScorecards;

//   const strengths = [];
//   if (candidateTurns.length >= 3) strengths.push("Provided multiple answers during the session, giving the panel useful evaluation evidence.");
//   if (averageWords >= 35) strengths.push("Gave sufficiently detailed responses for follow-up assessment.");
//   if (flags.length === 0) strengths.push("No vague or contradictory-answer flags were raised.");
//   if (!strengths.length) strengths.push("Complete more interview turns to produce stronger evidence-based strengths.");

//   const improvements = flags.length
//     ? flags.map((flag) => flag.note || `Review the ${flag.type || "flagged"} response.`)
//     : [
//         "Continue answering with specific actions, decisions, technologies, and measurable results.",
//         "Use a clear situation, action, and result structure for behavioural questions.",
//       ];

//   const downloadReport = () => {
//     const payload = {
//       sessionId,
//       role: targetRole,
//       level: targetLevel,
//       report,
//       transcript,
//       exportedAt: new Date().toISOString(),
//     };
//     const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href = url;
//     link.download = `intervyou-report-${sessionId || "session"}.json`;
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div className="print-report min-h-screen bg-[#0f172a] p-6 font-sans text-slate-100 lg:p-10">
//       <div className="mx-auto flex max-w-5xl flex-col gap-8">
//         <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
//           <div>
//             <div className="flex items-center gap-2">
//               <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase text-blue-400">
//                 Session Audit
//               </span>
//               <span className="font-mono text-xs text-slate-500">ID: {sessionId?.slice(0, 12)}...</span>
//             </div>
//             <h1 className="mt-1 text-2xl font-extrabold text-white lg:text-3xl">Interview Assessment Report</h1>
//             <p className="mt-1 text-xs text-slate-400">
//               Target Profile: <strong className="text-slate-200">{targetRole}</strong> ({targetLevel})
//             </p>
//           </div>
//           <div className="flex flex-wrap gap-2 print:hidden">
//             <button type="button" onClick={downloadReport} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800">
//               <Download size={14} /> JSON
//             </button>
//             <button type="button" onClick={() => window.print()} className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20">
//               <Printer size={14} /> Save PDF
//             </button>
//             <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800">
//               <ArrowLeft size={14} /> New Interview
//             </button>
//           </div>
//         </header>

//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
//           {scorecards.map((card) => (
//             <div key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
//               <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</span>
//               <div className="my-3 flex items-baseline gap-1.5">
//                 <span className={`text-3xl font-extrabold ${card.color}`}>{card.score}</span>
//                 <span className="font-mono text-xs text-slate-500">/ 100</span>
//               </div>
//               <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
//                 <div className={`h-full ${card.bar}`} style={{ width: `${card.score}%` }} />
//               </div>
//             </div>
//           ))}
//         </div>

//         {report.summary && (
//           <section className="print-report-accent rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
//             <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Overall assessment</p>
//             <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
//               <div><strong className="text-4xl text-white">{report.summary.overallScore ?? "—"}</strong><span className="ml-2 text-xs text-slate-500">/ 100 evidence score</span></div>
//               <p className="rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-2 text-sm font-semibold text-slate-200">{report.summary.recommendation || "Assessment complete"}</p>
//             </div>
//           </section>
//         )}

//         <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//           <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
//             <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400"><CheckCircle2 size={16} /> Verified Strengths</h2>
//             <ul className="mt-4 list-disc space-y-3 pl-5 text-xs leading-relaxed text-slate-300">
//               {strengths.map((item) => <li key={item}>{item}</li>)}
//             </ul>
//           </section>
//           <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
//             <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400"><AlertTriangle size={16} /> Development Areas</h2>
//             <ul className="mt-4 list-disc space-y-3 pl-5 text-xs leading-relaxed text-slate-300">
//               {improvements.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
//             </ul>
//           </section>
//         </div>

//         <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
//           <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><MessageSquare className="mb-2 text-blue-400" size={18} /><p className="text-xs text-slate-400">Candidate responses</p><strong className="text-xl text-white">{candidateTurns.length}</strong></div>
//           <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><Gauge className="mb-2 text-purple-400" size={18} /><p className="text-xs text-slate-400">Final difficulty</p><strong className="capitalize text-xl text-white">{report.finalDifficulty || "medium"}</strong></div>
//           <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><ShieldAlert className="mb-2 text-amber-400" size={18} /><p className="text-xs text-slate-400">Assessment flags</p><strong className="text-xl text-white">{flags.length}</strong></div>
//         </section>

//         <section className="print-transcript rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
//           <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
//             <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300"><FileText size={15} /> Verified Dialogue Log ({transcript.length} turns)</h2>
//             <span className="text-[11px] text-slate-500">Transcript-linked evidence</span>
//           </div>
//           {transcript.length ? (
//             <div className="max-h-96 space-y-3 overflow-y-auto pr-2 text-xs">
//               {transcript.map((item, index) => {
//                 const isCandidate = item.role === "Candidate" || item.speaker === "candidate";
//                 return <div key={item.id || index} className={`print-transcript-entry rounded-2xl border p-3.5 ${isCandidate ? "ml-4 border-indigo-500/20 bg-indigo-950/20" : "mr-4 border-slate-800/80 bg-slate-950/40"}`}>
//                   <div className="mb-1 flex items-center justify-between text-[10px]"><span className={isCandidate ? "font-semibold text-indigo-300" : "font-semibold text-blue-400"}>{isCandidate ? "Candidate" : item.speakerName || item.speaker || "AI Panel"}</span><span className="font-mono text-slate-500">{formatTimestamp(item.timestamp)}</span></div>
//                   <p className="leading-relaxed text-slate-300">{item.text}</p>
//                 </div>;
//               })}
//             </div>
//           ) : <p className="py-8 text-center text-xs text-slate-500">No transcript was returned for this session.</p>}
//         </section>
//       </div>
//     </div>
//   );
// }





// import React, { useEffect, useState } from "react";
// import { useLocation, useNavigate, useParams } from "react-router-dom";
// import {
//   AlertTriangle,
//   ArrowLeft,
//   CheckCircle2,
//   FileText,
//   Gauge,
//   MessageSquare,
//   Download,
//   Printer,
//   ShieldAlert,
// } from "lucide-react";
// import { useAuth } from "../context/AuthContext.jsx";

// function clamp(value, min = 0, max = 100) {
//   return Math.max(min, Math.min(max, Math.round(value)));
// }

// function formatTimestamp(value) {
//   if (!value) return "";
//   const date = new Date(value);
//   return Number.isNaN(date.getTime())
//     ? String(value)
//     : date.toLocaleTimeString([], { minute: "2-digit", second: "2-digit" });
// }

// export default function Report() {
//   const { sessionId } = useParams();
//   const navigate = useNavigate();
//   const { state } = useLocation();
//   const { authFetch } = useAuth() || {};
//   const [storedData, setStoredData] = useState(null);
//   const [loadingReport, setLoadingReport] = useState(!state?.report && !state?.transcript);
//   const [reportError, setReportError] = useState("");

//   useEffect(() => {
//     if (state?.report || state?.transcript || !sessionId || typeof authFetch !== "function") return;
//     let active = true;
//     setLoadingReport(true);
//     authFetch(`/api/interview/${encodeURIComponent(sessionId)}/report`)
//       .then(async (response) => {
//         const data = await response.json().catch(() => ({}));
//         if (!response.ok) throw new Error(data.message || "Could not load this report");
//         if (active) setStoredData(data);
//       })
//       .catch((error) => {
//         if (active) setReportError(error.message || "Could not load this report");
//       })
//       .finally(() => {
//         if (active) setLoadingReport(false);
//       });
//     return () => { active = false; };
//   }, [authFetch, sessionId, state?.report, state?.transcript]);

//   const report = state?.report || storedData?.report || {};
//   const persistedInterview = storedData?.interview || {};
//   const transcript = Array.isArray(report.transcript) && report.transcript.length
//     ? report.transcript
//     : Array.isArray(state?.transcript) && state.transcript.length
//       ? state.transcript
//       : persistedInterview.transcript || [];
//   const flags = Array.isArray(report.flags) ? report.flags : [];
//   const targetRole = state?.role || persistedInterview.role || "Software Systems Engineer";
//   const targetLevel = state?.level || persistedInterview.level || "Senior";

//   if (loadingReport) {
//     return <div className="flex min-h-screen items-center justify-center bg-[#0f172a] text-sm text-slate-400">Loading interview report...</div>;
//   }

//   if (reportError) {
//     return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0f172a] text-sm text-red-300"><p>{reportError}</p><button type="button" onClick={() => navigate("/")} className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300">Return to dashboard</button></div>;
//   }

//   const candidateTurns = transcript.filter(
//     (turn) => turn.role === "Candidate" || turn.speaker === "candidate"
//   );
//   const panelTurns = transcript.filter(
//     (turn) => !candidateTurns.includes(turn)
//   );
//   const candidateWords = candidateTurns.reduce(
//     (total, turn) => total + String(turn.text || "").trim().split(/\s+/).filter(Boolean).length,
//     0
//   );
//   const averageWords = candidateTurns.length ? candidateWords / candidateTurns.length : 0;
//   const flagPenalty = flags.length * 8;

//   const calculatedScorecards = [
//     {
//       label: "Interview Engagement",
//       score: clamp(55 + candidateTurns.length * 8 - flagPenalty),
//       color: "text-indigo-400",
//       bar: "bg-indigo-500",
//     },
//     {
//       label: "Response Clarity",
//       score: clamp(58 + Math.min(30, averageWords / 4) - flagPenalty),
//       color: "text-emerald-400",
//       bar: "bg-emerald-500",
//     },
//     {
//       label: "Panel Coverage",
//       score: clamp(50 + new Set(panelTurns.map((turn) => turn.personaId || turn.speaker)).size * 10),
//       color: "text-blue-400",
//       bar: "bg-blue-500",
//     },
//     {
//       label: "Assessment Signal",
//       score: clamp(82 - flagPenalty),
//       color: flags.length ? "text-amber-400" : "text-purple-400",
//       bar: flags.length ? "bg-amber-500" : "bg-purple-500",
//     },
//   ];
//   const scorecards = report.summary?.scores?.length
//     ? report.summary.scores.map((card) => ({
//         ...card,
//         bar: card.bar || "bg-blue-500",
//         color: card.color || "text-blue-400",
//       }))
//     : calculatedScorecards;

//   const strengths = [];
//   if (candidateTurns.length >= 3) strengths.push("Provided multiple answers during the session, giving the panel useful evaluation evidence.");
//   if (averageWords >= 35) strengths.push("Gave sufficiently detailed responses for follow-up assessment.");
//   if (flags.length === 0) strengths.push("No vague or contradictory-answer flags were raised.");
//   if (!strengths.length) strengths.push("Complete more interview turns to produce stronger evidence-based strengths.");

//   const improvements = flags.length
//     ? flags.map((flag) => flag.note || `Review the ${flag.type || "flagged"} response.`)
//     : [
//         "Continue answering with specific actions, decisions, technologies, and measurable results.",
//         "Use a clear situation, action, and result structure for behavioural questions.",
//       ];
//   const technologyEvidence = report.evidence?.technologyEvidence || [];
//   const projectEvidence = report.evidence?.projectEvidence || [];
//   const hasEvidence = technologyEvidence.length > 0 || projectEvidence.length > 0;

//   const downloadReport = () => {
//     const payload = {
//       sessionId,
//       role: targetRole,
//       level: targetLevel,
//       report,
//       transcript,
//       exportedAt: new Date().toISOString(),
//     };
//     const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href = url;
//     link.download = `intervyou-report-${sessionId || "session"}.json`;
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div className="print-report min-h-screen bg-[#0f172a] p-6 font-sans text-slate-100 lg:p-10">
//       <div className="mx-auto flex max-w-5xl flex-col gap-8">
//         <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
//           <div>
//             <div className="flex items-center gap-2">
//               <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase text-blue-400">
//                 Session Audit
//               </span>
//               <span className="font-mono text-xs text-slate-500">ID: {sessionId?.slice(0, 12)}...</span>
//             </div>
//             <h1 className="mt-1 text-2xl font-extrabold text-white lg:text-3xl">Interview Assessment Report</h1>
//             <p className="mt-1 text-xs text-slate-400">
//               Target Profile: <strong className="text-slate-200">{targetRole}</strong> ({targetLevel})
//             </p>
//           </div>
//           <div className="flex flex-wrap gap-2 print:hidden">
//             <button type="button" onClick={downloadReport} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800">
//               <Download size={14} /> JSON
//             </button>
//             <button type="button" onClick={() => window.print()} className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20">
//               <Printer size={14} /> Save PDF
//             </button>
//             <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800">
//               <ArrowLeft size={14} /> New Interview
//             </button>
//           </div>
//         </header>

//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
//           {scorecards.map((card) => (
//             <div key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
//               <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</span>
//               <div className="my-3 flex items-baseline gap-1.5">
//                 <span className={`text-3xl font-extrabold ${card.color}`}>{card.score}</span>
//                 <span className="font-mono text-xs text-slate-500">/ 100</span>
//               </div>
//               <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
//                 <div className={`h-full ${card.bar}`} style={{ width: `${card.score}%` }} />
//               </div>
//             </div>
//           ))}
//         </div>

//         {report.summary && (
//           <section className="print-report-accent rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
//             <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Overall assessment</p>
//             <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
//               <div><strong className="text-4xl text-white">{report.summary.overallScore ?? "—"}</strong><span className="ml-2 text-xs text-slate-500">/ 100 evidence score</span></div>
//               <p className="rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-2 text-sm font-semibold text-slate-200">{report.summary.recommendation || "Assessment complete"}</p>
//             </div>
//           </section>
//         )}

//         {hasEvidence && (
//           <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
//             <div className="mb-4 border-b border-slate-800 pb-3">
//               <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">Resume evidence citations</h2>
//               <p className="mt-1 text-[11px] text-slate-500">Resume claims are shown beside the candidate answers that supported them during the interview.</p>
//             </div>
//             <div className="space-y-4">
//               {technologyEvidence.filter((item) => item.mentioned).map((item) => (
//                 <div key={item.technology} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
//                   <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-emerald-300">{item.technology}</span><span className="text-[10px] font-semibold uppercase text-emerald-400">Mentioned in interview</span></div>
//                   {item.answerMatches.map((answer, index) => <p key={`${item.technology}-${index}`} className="mt-2 border-l-2 border-emerald-500/40 pl-3 text-xs leading-relaxed text-slate-300">“{answer}”</p>)}
//                 </div>
//               ))}
//               {projectEvidence.filter((item) => item.supportedInInterview).map((item, index) => (
//                 <div key={`${item.resumeClaim}-${index}`} className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
//                   <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Resume project claim</p>
//                   <p className="mt-1 text-xs leading-relaxed text-slate-300">{item.resumeClaim}</p>
//                   {item.answerMatches.map((answer, answerIndex) => <p key={`${index}-${answerIndex}`} className="mt-2 border-l-2 border-blue-500/40 pl-3 text-xs leading-relaxed text-slate-300">Interview evidence: “{answer}”</p>)}
//                 </div>
//               ))}
//               {!technologyEvidence.some((item) => item.mentioned) && !projectEvidence.some((item) => item.supportedInInterview) && (
//                 <p className="text-xs text-slate-500">No resume claim was directly supported by a recorded answer.</p>
//               )}
//             </div>
//           </section>
//         )}

//         <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//           <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
//             <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400"><CheckCircle2 size={16} /> Verified Strengths</h2>
//             <ul className="mt-4 list-disc space-y-3 pl-5 text-xs leading-relaxed text-slate-300">
//               {strengths.map((item) => <li key={item}>{item}</li>)}
//             </ul>
//           </section>
//           <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
//             <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400"><AlertTriangle size={16} /> Development Areas</h2>
//             <ul className="mt-4 list-disc space-y-3 pl-5 text-xs leading-relaxed text-slate-300">
//               {improvements.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
//             </ul>
//           </section>
//         </div>

//         <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
//           <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><MessageSquare className="mb-2 text-blue-400" size={18} /><p className="text-xs text-slate-400">Candidate responses</p><strong className="text-xl text-white">{candidateTurns.length}</strong></div>
//           <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><Gauge className="mb-2 text-purple-400" size={18} /><p className="text-xs text-slate-400">Final difficulty</p><strong className="capitalize text-xl text-white">{report.finalDifficulty || "medium"}</strong></div>
//           <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><ShieldAlert className="mb-2 text-amber-400" size={18} /><p className="text-xs text-slate-400">Assessment flags</p><strong className="text-xl text-white">{flags.length}</strong></div>
//         </section>

//         <section className="print-transcript rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
//           <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
//             <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300"><FileText size={15} /> Verified Dialogue Log ({transcript.length} turns)</h2>
//             <span className="text-[11px] text-slate-500">Transcript-linked evidence</span>
//           </div>
//           {transcript.length ? (
//             <div className="max-h-96 space-y-3 overflow-y-auto pr-2 text-xs">
//               {transcript.map((item, index) => {
//                 const isCandidate = item.role === "Candidate" || item.speaker === "candidate";
//                 return <div key={item.id || index} className={`print-transcript-entry rounded-2xl border p-3.5 ${isCandidate ? "ml-4 border-indigo-500/20 bg-indigo-950/20" : "mr-4 border-slate-800/80 bg-slate-950/40"}`}>
//                   <div className="mb-1 flex items-center justify-between text-[10px]"><span className={isCandidate ? "font-semibold text-indigo-300" : "font-semibold text-blue-400"}>{isCandidate ? "Candidate" : item.speakerName || item.speaker || "AI Panel"}</span><span className="font-mono text-slate-500">{formatTimestamp(item.timestamp)}</span></div>
//                   <p className="leading-relaxed text-slate-300">{item.text}</p>
//                 </div>;
//               })}
//             </div>
//           ) : <p className="py-8 text-center text-xs text-slate-500">No transcript was returned for this session.</p>}
//         </section>
//       </div>
//     </div>
//   );
// }


// import React, { useEffect, useState } from "react";
// import { useLocation, useNavigate, useParams } from "react-router-dom";
// import {
//   AlertTriangle,
//   ArrowLeft,
//   CheckCircle2,
//   Clock,
//   FileText,
//   Gauge,
//   MessageSquare,
//   Download,
//   Printer,
//   ShieldAlert,
// } from "lucide-react";
// import { useAuth } from "../context/AuthContext.jsx";

// function clamp(value, min = 0, max = 100) {
//   return Math.max(min, Math.min(max, Math.round(value)));
// }

// function formatTimestamp(value) {
//   if (!value) return "";
//   const date = new Date(value);
//   return Number.isNaN(date.getTime())
//     ? String(value)
//     : date.toLocaleTimeString([], { minute: "2-digit", second: "2-digit" });
// }

// export default function Report() {
//   const { sessionId } = useParams();
//   const navigate = useNavigate();
//   const { state } = useLocation();
//   const { authFetch } = useAuth() || {};
//   const [storedData, setStoredData] = useState(null);
//   const [loadingReport, setLoadingReport] = useState(!state?.report && !state?.transcript);
//   const [reportError, setReportError] = useState("");

//   useEffect(() => {
//     if (state?.report || state?.transcript || !sessionId || typeof authFetch !== "function") return;
//     let active = true;
//     setLoadingReport(true);
//     authFetch(`/api/interview/${encodeURIComponent(sessionId)}/report`)
//       .then(async (response) => {
//         const data = await response.json().catch(() => ({}));
//         if (!response.ok) throw new Error(data.message || "Could not load this report");
//         if (active) setStoredData(data);
//       })
//       .catch((error) => {
//         if (active) setReportError(error.message || "Could not load this report");
//       })
//       .finally(() => {
//         if (active) setLoadingReport(false);
//       });
//     return () => { active = false; };
//   }, [authFetch, sessionId, state?.report, state?.transcript]);

//   const report = state?.report || storedData?.report || {};
//   const persistedInterview = storedData?.interview || {};
//   const transcript = Array.isArray(report.transcript) && report.transcript.length
//     ? report.transcript
//     : Array.isArray(state?.transcript) && state.transcript.length
//       ? state.transcript
//       : persistedInterview.transcript || [];
//   const flags = Array.isArray(report.flags) ? report.flags : [];
//   const targetRole = state?.role || persistedInterview.role || "Software Systems Engineer";
//   const targetLevel = state?.level || persistedInterview.level || "Senior";
//   const metadata = report.metadata || persistedInterview;

//   function formatDuration(seconds) {
//     if (seconds === undefined || seconds === null) return "—";
//     const value = Math.max(0, Number(seconds));
//     return `${Math.floor(value / 60)}m ${String(value % 60).padStart(2, "0")}s`;
//   }

//   if (loadingReport) {
//     return <div className="flex min-h-screen items-center justify-center bg-[#0f172a] text-sm text-slate-400">Loading interview report...</div>;
//   }

//   if (reportError) {
//     return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0f172a] text-sm text-red-300"><p>{reportError}</p><button type="button" onClick={() => navigate("/")} className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300">Return to dashboard</button></div>;
//   }

//   const candidateTurns = transcript.filter(
//     (turn) => turn.role === "Candidate" || turn.speaker === "candidate"
//   );
//   const panelTurns = transcript.filter(
//     (turn) => !candidateTurns.includes(turn)
//   );
//   const candidateWords = candidateTurns.reduce(
//     (total, turn) => total + String(turn.text || "").trim().split(/\s+/).filter(Boolean).length,
//     0
//   );
//   const averageWords = candidateTurns.length ? candidateWords / candidateTurns.length : 0;
//   const flagPenalty = flags.length * 8;

//   const calculatedScorecards = [
//     {
//       label: "Interview Engagement",
//       score: clamp(55 + candidateTurns.length * 8 - flagPenalty),
//       color: "text-indigo-400",
//       bar: "bg-indigo-500",
//     },
//     {
//       label: "Response Clarity",
//       score: clamp(58 + Math.min(30, averageWords / 4) - flagPenalty),
//       color: "text-emerald-400",
//       bar: "bg-emerald-500",
//     },
//     {
//       label: "Panel Coverage",
//       score: clamp(50 + new Set(panelTurns.map((turn) => turn.personaId || turn.speaker)).size * 10),
//       color: "text-blue-400",
//       bar: "bg-blue-500",
//     },
//     {
//       label: "Assessment Signal",
//       score: clamp(82 - flagPenalty),
//       color: flags.length ? "text-amber-400" : "text-purple-400",
//       bar: flags.length ? "bg-amber-500" : "bg-purple-500",
//     },
//   ];
//   const scorecards = report.summary?.scores?.length
//     ? report.summary.scores.map((card) => ({
//         ...card,
//         bar: card.bar || "bg-blue-500",
//         color: card.color || "text-blue-400",
//       }))
//     : calculatedScorecards;

//   const strengths = [];
//   if (candidateTurns.length >= 3) strengths.push("Provided multiple answers during the session, giving the panel useful evaluation evidence.");
//   if (averageWords >= 35) strengths.push("Gave sufficiently detailed responses for follow-up assessment.");
//   if (flags.length === 0) strengths.push("No vague or contradictory-answer flags were raised.");
//   if (!strengths.length) strengths.push("Complete more interview turns to produce stronger evidence-based strengths.");

//   const improvements = flags.length
//     ? flags.map((flag) => flag.note || `Review the ${flag.type || "flagged"} response.`)
//     : [
//         "Continue answering with specific actions, decisions, technologies, and measurable results.",
//         "Use a clear situation, action, and result structure for behavioural questions.",
//       ];
//   const technologyEvidence = report.evidence?.technologyEvidence || [];
//   const projectEvidence = report.evidence?.projectEvidence || [];
//   const hasEvidence = technologyEvidence.length > 0 || projectEvidence.length > 0;

//   const downloadReport = () => {
//     const payload = {
//       sessionId,
//       role: targetRole,
//       level: targetLevel,
//       report,
//       transcript,
//       exportedAt: new Date().toISOString(),
//     };
//     const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href = url;
//     link.download = `intervyou-report-${sessionId || "session"}.json`;
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div className="print-report min-h-screen bg-[#0f172a] p-6 font-sans text-slate-100 lg:p-10">
//       <div className="mx-auto flex max-w-5xl flex-col gap-8">
//         <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
//           <div>
//             <div className="flex items-center gap-2">
//               <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase text-blue-400">
//                 Session Audit
//               </span>
//               <span className="font-mono text-xs text-slate-500">ID: {sessionId?.slice(0, 12)}...</span>
//             </div>
//             <h1 className="mt-1 text-2xl font-extrabold text-white lg:text-3xl">Interview Assessment Report</h1>
//             <p className="mt-1 text-xs text-slate-400">
//               Target Profile: <strong className="text-slate-200">{targetRole}</strong> ({targetLevel})
//             </p>
//           </div>
//           <div className="flex flex-wrap gap-2 print:hidden">
//             <button type="button" onClick={downloadReport} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800">
//               <Download size={14} /> JSON
//             </button>
//             <button type="button" onClick={() => window.print()} className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20">
//               <Printer size={14} /> Save PDF
//             </button>
//             <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800">
//               <ArrowLeft size={14} /> New Interview
//             </button>
//           </div>
//         </header>

//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
//           {scorecards.map((card) => (
//             <div key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
//               <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</span>
//               <div className="my-3 flex items-baseline gap-1.5">
//                 <span className={`text-3xl font-extrabold ${card.color}`}>{card.score}</span>
//                 <span className="font-mono text-xs text-slate-500">/ 100</span>
//               </div>
//               <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
//                 <div className={`h-full ${card.bar}`} style={{ width: `${card.score}%` }} />
//               </div>
//             </div>
//           ))}
//         </div>

//         {report.summary && (
//           <section className="print-report-accent rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
//             <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Overall assessment</p>
//             <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
//               <div><strong className="text-4xl text-white">{report.summary.overallScore ?? "—"}</strong><span className="ml-2 text-xs text-slate-500">/ 100 evidence score</span></div>
//               <p className="rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-2 text-sm font-semibold text-slate-200">{report.summary.recommendation || "Assessment complete"}</p>
//             </div>
//           </section>
//         )}

//         <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
//           <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><Clock className="mb-2 text-blue-400" size={18} /><p className="text-xs text-slate-400">Interview duration</p><strong className="text-xl text-white">{formatDuration(metadata.durationSeconds)}</strong></div>
//           <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Started</p><strong className="text-sm text-white">{metadata.startTime ? new Date(metadata.startTime).toLocaleString() : "—"}</strong></div>
//           <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Completion</p><strong className="capitalize text-sm text-white">{metadata.completionReason || "unknown"}</strong>{metadata.endTime && <p className="mt-1 text-[10px] text-slate-500">Ended {new Date(metadata.endTime).toLocaleString()}</p>}</div>
//         </section>

//         {hasEvidence && (
//           <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
//             <div className="mb-4 border-b border-slate-800 pb-3">
//               <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">Resume evidence citations</h2>
//               <p className="mt-1 text-[11px] text-slate-500">Resume claims are shown beside the candidate answers that supported them during the interview.</p>
//             </div>
//             <div className="space-y-4">
//               {technologyEvidence.filter((item) => item.mentioned).map((item) => (
//                 <div key={item.technology} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
//                   <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-emerald-300">{item.technology}</span><span className="text-[10px] font-semibold uppercase text-emerald-400">Mentioned in interview</span></div>
//                   {item.answerMatches.map((answer, index) => <p key={`${item.technology}-${index}`} className="mt-2 border-l-2 border-emerald-500/40 pl-3 text-xs leading-relaxed text-slate-300">“{answer}”</p>)}
//                 </div>
//               ))}
//               {projectEvidence.filter((item) => item.supportedInInterview).map((item, index) => (
//                 <div key={`${item.resumeClaim}-${index}`} className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
//                   <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Resume project claim</p>
//                   <p className="mt-1 text-xs leading-relaxed text-slate-300">{item.resumeClaim}</p>
//                   {item.answerMatches.map((answer, answerIndex) => <p key={`${index}-${answerIndex}`} className="mt-2 border-l-2 border-blue-500/40 pl-3 text-xs leading-relaxed text-slate-300">Interview evidence: “{answer}”</p>)}
//                 </div>
//               ))}
//               {!technologyEvidence.some((item) => item.mentioned) && !projectEvidence.some((item) => item.supportedInInterview) && (
//                 <p className="text-xs text-slate-500">No resume claim was directly supported by a recorded answer.</p>
//               )}
//             </div>
//           </section>
//         )}

//         <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//           <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
//             <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400"><CheckCircle2 size={16} /> Verified Strengths</h2>
//             <ul className="mt-4 list-disc space-y-3 pl-5 text-xs leading-relaxed text-slate-300">
//               {strengths.map((item) => <li key={item}>{item}</li>)}
//             </ul>
//           </section>
//           <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
//             <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400"><AlertTriangle size={16} /> Development Areas</h2>
//             <ul className="mt-4 list-disc space-y-3 pl-5 text-xs leading-relaxed text-slate-300">
//               {improvements.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
//             </ul>
//           </section>
//         </div>

//         <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
//           <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><MessageSquare className="mb-2 text-blue-400" size={18} /><p className="text-xs text-slate-400">Candidate responses</p><strong className="text-xl text-white">{candidateTurns.length}</strong></div>
//           <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><Gauge className="mb-2 text-purple-400" size={18} /><p className="text-xs text-slate-400">Final difficulty</p><strong className="capitalize text-xl text-white">{report.finalDifficulty || "medium"}</strong></div>
//           <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><ShieldAlert className="mb-2 text-amber-400" size={18} /><p className="text-xs text-slate-400">Assessment flags</p><strong className="text-xl text-white">{flags.length}</strong></div>
//         </section>

//         <section className="print-transcript rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
//           <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
//             <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300"><FileText size={15} /> Verified Dialogue Log ({transcript.length} turns)</h2>
//             <span className="text-[11px] text-slate-500">Transcript-linked evidence</span>
//           </div>
//           {transcript.length ? (
//             <div className="max-h-96 space-y-3 overflow-y-auto pr-2 text-xs">
//               {transcript.map((item, index) => {
//                 const isCandidate = item.role === "Candidate" || item.speaker === "candidate";
//                 return <div key={item.id || index} className={`print-transcript-entry rounded-2xl border p-3.5 ${isCandidate ? "ml-4 border-indigo-500/20 bg-indigo-950/20" : "mr-4 border-slate-800/80 bg-slate-950/40"}`}>
//                   <div className="mb-1 flex items-center justify-between text-[10px]"><span className={isCandidate ? "font-semibold text-indigo-300" : "font-semibold text-blue-400"}>{isCandidate ? "Candidate" : item.speakerName || item.speaker || "AI Panel"}</span><span className="font-mono text-slate-500">{formatTimestamp(item.timestamp)}</span></div>
//                   <p className="leading-relaxed text-slate-300">{item.text}</p>
//                 </div>;
//               })}
//             </div>
//           ) : <p className="py-8 text-center text-xs text-slate-500">No transcript was returned for this session.</p>}
//         </section>
//       </div>
//     </div>
//   );
// }


// import React, { useEffect, useState } from "react";
// import { useLocation, useNavigate, useParams } from "react-router-dom";
// import {
//   AlertTriangle,
//   ArrowLeft,
//   CheckCircle2,
//   Clock,
//   FileText,
//   Gauge,
//   MessageSquare,
//   Download,
//   Printer,
//   ShieldAlert,
// } from "lucide-react";
// import { useAuth } from "../context/AuthContext.jsx";

// function clamp(value, min = 0, max = 100) {
//   return Math.max(min, Math.min(max, Math.round(value)));
// }

// function formatTimestamp(value) {
//   if (!value) return "";
//   const date = new Date(value);
//   return Number.isNaN(date.getTime())
//     ? String(value)
//     : date.toLocaleTimeString([], { minute: "2-digit", second: "2-digit" });
// }

// function isCandidateTurn(turn) {
//   if (turn?.role === "Candidate" || String(turn?.speaker).toLowerCase() === "candidate") return true;
//   return /^\d+$/.test(String(turn?.speaker ?? "")) && !["9999", "99999"].includes(String(turn.speaker));
// }

// function displaySpeaker(turn) {
//   if (isCandidateTurn(turn)) return "Candidate";
//   if (["9999", "99999"].includes(String(turn?.speaker ?? ""))) return "AI Panel";
//   return turn?.speakerName || turn?.speaker || "AI Panel";
// }

// export default function Report() {
//   const { sessionId } = useParams();
//   const navigate = useNavigate();
//   const { state } = useLocation();
//   const { authFetch } = useAuth() || {};
//   const [storedData, setStoredData] = useState(null);
//   const [loadingReport, setLoadingReport] = useState(!state?.report && !state?.transcript);
//   const [reportError, setReportError] = useState("");

//   useEffect(() => {
//     if (state?.report || state?.transcript || !sessionId || typeof authFetch !== "function") return;
//     let active = true;
//     setLoadingReport(true);
//     authFetch(`/api/interview/${encodeURIComponent(sessionId)}/report`)
//       .then(async (response) => {
//         const data = await response.json().catch(() => ({}));
//         if (!response.ok) throw new Error(data.message || "Could not load this report");
//         if (active) setStoredData(data);
//       })
//       .catch((error) => {
//         if (active) setReportError(error.message || "Could not load this report");
//       })
//       .finally(() => {
//         if (active) setLoadingReport(false);
//       });
//     return () => { active = false; };
//   }, [authFetch, sessionId, state?.report, state?.transcript]);

//   const report = state?.report || storedData?.report || {};
//   const persistedInterview = storedData?.interview || {};
//   const transcript = Array.isArray(report.transcript) && report.transcript.length
//     ? report.transcript
//     : Array.isArray(state?.transcript) && state.transcript.length
//       ? state.transcript
//       : persistedInterview.transcript || [];
//   const flags = Array.isArray(report.flags) ? report.flags : [];
//   const targetRole = state?.role || persistedInterview.role || "Software Systems Engineer";
//   const targetLevel = state?.level || persistedInterview.level || "Senior";
//   const metadata = report.metadata || persistedInterview;

//   function formatDuration(seconds) {
//     if (seconds === undefined || seconds === null) return "—";
//     const value = Math.max(0, Number(seconds));
//     return `${Math.floor(value / 60)}m ${String(value % 60).padStart(2, "0")}s`;
//   }

//   if (loadingReport) {
//     return <div className="flex min-h-screen items-center justify-center bg-[#0f172a] text-sm text-slate-400">Loading interview report...</div>;
//   }

//   if (reportError) {
//     return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0f172a] text-sm text-red-300"><p>{reportError}</p><button type="button" onClick={() => navigate("/")} className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300">Return to dashboard</button></div>;
//   }

//   const candidateTurns = transcript.filter(isCandidateTurn);
//   const panelTurns = transcript.filter(
//     (turn) => !candidateTurns.includes(turn)
//   );
//   const candidateWords = candidateTurns.reduce(
//     (total, turn) => total + String(turn.text || "").trim().split(/\s+/).filter(Boolean).length,
//     0
//   );
//   const averageWords = candidateTurns.length ? candidateWords / candidateTurns.length : 0;
//   const flagPenalty = flags.length * 8;

//   const calculatedScorecards = [
//     {
//       label: "Interview Engagement",
//       score: clamp(55 + candidateTurns.length * 8 - flagPenalty),
//       color: "text-indigo-400",
//       bar: "bg-indigo-500",
//     },
//     {
//       label: "Response Clarity",
//       score: clamp(58 + Math.min(30, averageWords / 4) - flagPenalty),
//       color: "text-emerald-400",
//       bar: "bg-emerald-500",
//     },
//     {
//       label: "Panel Coverage",
//       score: clamp(50 + new Set(panelTurns.map((turn) => turn.personaId || turn.speaker)).size * 10),
//       color: "text-blue-400",
//       bar: "bg-blue-500",
//     },
//     {
//       label: "Assessment Signal",
//       score: clamp(82 - flagPenalty),
//       color: flags.length ? "text-amber-400" : "text-purple-400",
//       bar: flags.length ? "bg-amber-500" : "bg-purple-500",
//     },
//     {
//       label: "Role Alignment",
//       score: candidateTurns.length >= 2 ? clamp(50 + Math.min(35, averageWords / 3) - flags.length * 8) : null,
//       color: "text-purple-400",
//       bar: "bg-purple-500",
//     },
//   ];
//   const insufficientByTranscript = candidateTurns.length < 2 || candidateWords < 50;
//   const insufficientEvidence = insufficientByTranscript;
//   const hasUsablePersistedScores = report.summary?.scores?.some((card) => card.score !== null && card.score !== undefined);
//   const persistedSummaryMatchesTranscript = report.summary?.totalExchanges === candidateTurns.length && report.summary?.overallScore > 0;
//   const scorecards = report.summary?.scores?.length && hasUsablePersistedScores && persistedSummaryMatchesTranscript
//     ? report.summary.scores.map((card) => ({
//         ...card,
//         score: insufficientEvidence ? null : card.score,
//         bar: card.bar || "bg-blue-500",
//         color: card.color || "text-blue-400",
//       }))
//     : calculatedScorecards.map((card) => ({
//         ...card,
//         score: insufficientEvidence ? null : card.score,
//       }));
//   const fallbackOverallScore = scorecards.filter((card) => card.score !== null).length
//     ? clamp(scorecards.filter((card) => card.score !== null).reduce((sum, card) => sum + card.score, 0) / scorecards.filter((card) => card.score !== null).length)
//     : null;
//   const displayedOverallScore = insufficientEvidence ? null : (persistedSummaryMatchesTranscript ? report.summary?.overallScore : fallbackOverallScore);
//   const displayedRecommendation = insufficientEvidence
//     ? "Insufficient evidence"
//     : (persistedSummaryMatchesTranscript
//       ? (report.summary.recommendation || "Assessment complete")
//       : fallbackOverallScore >= 75 ? "Strong evidence" : fallbackOverallScore >= 60 ? "Proceed with targeted follow-up" : "More evidence required");

//   const strengths = [];
//   if (candidateTurns.length >= 3) strengths.push("Provided multiple answers during the session, giving the panel useful evaluation evidence.");
//   if (averageWords >= 35) strengths.push("Gave sufficiently detailed responses for follow-up assessment.");
//   if (flags.length === 0) strengths.push("No vague or contradictory-answer flags were raised.");
//   if (!strengths.length) strengths.push("Complete more interview turns to produce stronger evidence-based strengths.");

//   const improvements = flags.length
//     ? flags.map((flag) => flag.note || `Review the ${flag.type || "flagged"} response.`)
//     : [
//         "Continue answering with specific actions, decisions, technologies, and measurable results.",
//         "Use a clear situation, action, and result structure for behavioural questions.",
//       ];
//   const technologyEvidence = report.evidence?.technologyEvidence || [];
//   const projectEvidence = report.evidence?.projectEvidence || [];
//   const hasEvidence = technologyEvidence.length > 0 || projectEvidence.length > 0;

//   const downloadReport = () => {
//     const payload = {
//       sessionId,
//       role: targetRole,
//       level: targetLevel,
//       report,
//       transcript,
//       exportedAt: new Date().toISOString(),
//     };
//     const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href = url;
//     link.download = `intervyou-report-${sessionId || "session"}.json`;
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div className="print-report min-h-screen bg-[#0f172a] p-6 font-sans text-slate-100 lg:p-10">
//       <div className="mx-auto flex max-w-5xl flex-col gap-8">
//         <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
//           <div>
//             <div className="flex items-center gap-2">
//               <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase text-blue-400">
//                 Session Audit
//               </span>
//               <span className="font-mono text-xs text-slate-500">ID: {sessionId?.slice(0, 12)}...</span>
//             </div>
//             <h1 className="mt-1 text-2xl font-extrabold text-white lg:text-3xl">Interview Assessment Report</h1>
//             <p className="mt-1 text-xs text-slate-400">
//               Target Profile: <strong className="text-slate-200">{targetRole}</strong> ({targetLevel})
//             </p>
//           </div>
//           <div className="flex flex-wrap gap-2 print:hidden">
//             <button type="button" onClick={downloadReport} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800">
//               <Download size={14} /> JSON
//             </button>
//             <button type="button" onClick={() => window.print()} className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20">
//               <Printer size={14} /> Save PDF
//             </button>
//             <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800">
//               <ArrowLeft size={14} /> New Interview
//             </button>
//           </div>
//         </header>

//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
//           {scorecards.map((card) => (
//             <div key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
//               <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</span>
//               <div className="my-3 flex items-baseline gap-1.5">
//                 <span className={`text-3xl font-extrabold ${card.score === null ? "text-slate-500" : card.color}`}>{card.score === null ? "N/A" : card.score}</span>
//                 <span className="font-mono text-xs text-slate-500">/ 100</span>
//               </div>
//               <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
//                 <div className={`h-full ${card.score === null ? "bg-slate-700" : card.bar}`} style={{ width: `${card.score ?? 0}%` }} />
//               </div>
//             </div>
//           ))}
//         </div>

//         {report.summary && (
//           <section className="print-report-accent rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
//             <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Overall assessment</p>
//             <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
//               <div><strong className="text-4xl text-white">{displayedOverallScore ?? "N/A"}</strong><span className="ml-2 text-xs text-slate-500">/ 100 evidence score</span></div>
//               <p className="rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-2 text-sm font-semibold text-slate-200">{displayedRecommendation}</p>
//             </div>
//           </section>
//         )}

//         <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
//           <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><Clock className="mb-2 text-blue-400" size={18} /><p className="text-xs text-slate-400">Interview duration</p><strong className="text-xl text-white">{formatDuration(metadata.durationSeconds)}</strong></div>
//           <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Started</p><strong className="text-sm text-white">{metadata.startTime ? new Date(metadata.startTime).toLocaleString() : "—"}</strong></div>
//           <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Completion</p><strong className="capitalize text-sm text-white">{metadata.completionReason || "unknown"}</strong>{metadata.endTime && <p className="mt-1 text-[10px] text-slate-500">Ended {new Date(metadata.endTime).toLocaleString()}</p>}</div>
//         </section>

//         {insufficientEvidence && (
//           <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
//             <strong>Insufficient evidence for a complete assessment.</strong>
//             <p className="mt-1 text-xs text-amber-200/80">This interview was too short to score every category reliably. Complete at least 2 substantive candidate answers and 50 total words for a full assessment.</p>
//           </section>
//         )}

//         {hasEvidence && (
//           <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
//             <div className="mb-4 border-b border-slate-800 pb-3">
//               <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">Resume evidence citations</h2>
//               <p className="mt-1 text-[11px] text-slate-500">Resume claims are shown beside the candidate answers that supported them during the interview.</p>
//             </div>
//             <div className="space-y-4">
//               {technologyEvidence.filter((item) => item.mentioned).map((item) => (
//                 <div key={item.technology} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
//                   <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-emerald-300">{item.technology}</span><span className="text-[10px] font-semibold uppercase text-emerald-400">Mentioned in interview</span></div>
//                   {item.answerMatches.map((answer, index) => <p key={`${item.technology}-${index}`} className="mt-2 border-l-2 border-emerald-500/40 pl-3 text-xs leading-relaxed text-slate-300">“{answer}”</p>)}
//                 </div>
//               ))}
//               {projectEvidence.filter((item) => item.supportedInInterview).map((item, index) => (
//                 <div key={`${item.resumeClaim}-${index}`} className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
//                   <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Resume project claim</p>
//                   <p className="mt-1 text-xs leading-relaxed text-slate-300">{item.resumeClaim}</p>
//                   {item.answerMatches.map((answer, answerIndex) => <p key={`${index}-${answerIndex}`} className="mt-2 border-l-2 border-blue-500/40 pl-3 text-xs leading-relaxed text-slate-300">Interview evidence: “{answer}”</p>)}
//                 </div>
//               ))}
//               {!technologyEvidence.some((item) => item.mentioned) && !projectEvidence.some((item) => item.supportedInInterview) && (
//                 <p className="text-xs text-slate-500">No resume claim was directly supported by a recorded answer.</p>
//               )}
//             </div>
//           </section>
//         )}

//         <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//           <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
//             <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400"><CheckCircle2 size={16} /> Verified Strengths</h2>
//             <ul className="mt-4 list-disc space-y-3 pl-5 text-xs leading-relaxed text-slate-300">
//               {strengths.map((item) => <li key={item}>{item}</li>)}
//             </ul>
//           </section>
//           <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
//             <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400"><AlertTriangle size={16} /> Development Areas</h2>
//             <ul className="mt-4 list-disc space-y-3 pl-5 text-xs leading-relaxed text-slate-300">
//               {improvements.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
//             </ul>
//           </section>
//         </div>

//         <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
//           <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><MessageSquare className="mb-2 text-blue-400" size={18} /><p className="text-xs text-slate-400">Candidate responses</p><strong className="text-xl text-white">{candidateTurns.length}</strong></div>
//           <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><Gauge className="mb-2 text-purple-400" size={18} /><p className="text-xs text-slate-400">Final difficulty</p><strong className="capitalize text-xl text-white">{report.finalDifficulty || "medium"}</strong></div>
//           <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><ShieldAlert className="mb-2 text-amber-400" size={18} /><p className="text-xs text-slate-400">Assessment flags</p><strong className="text-xl text-white">{flags.length}</strong></div>
//         </section>

//         <section className="print-transcript rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
//           <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
//             <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300"><FileText size={15} /> Verified Dialogue Log ({transcript.length} turns)</h2>
//             <span className="text-[11px] text-slate-500">Transcript-linked evidence</span>
//           </div>
//           {transcript.length ? (
//             <div className="max-h-96 space-y-3 overflow-y-auto pr-2 text-xs">
//               {transcript.map((item, index) => {
//                 const isCandidate = isCandidateTurn(item);
//                 return <div key={item.id || index} className={`print-transcript-entry rounded-2xl border p-3.5 ${isCandidate ? "ml-4 border-indigo-500/20 bg-indigo-950/20" : "mr-4 border-slate-800/80 bg-slate-950/40"}`}>
//                   <div className="mb-1 flex items-center justify-between text-[10px]"><span className={isCandidate ? "font-semibold text-indigo-300" : "font-semibold text-blue-400"}>{displaySpeaker(item)}</span><span className="font-mono text-slate-500">{formatTimestamp(item.timestamp)}</span></div>
//                   <p className="leading-relaxed text-slate-300">{item.text}</p>
//                 </div>;
//               })}
//             </div>
//           ) : <p className="py-8 text-center text-xs text-slate-500">No transcript was returned for this session.</p>}
//         </section>
//       </div>
//     </div>
//   );
// }



import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Gauge,
  MessageSquare,
  Download,
  Printer,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function formatTimestamp(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleTimeString([], { minute: "2-digit", second: "2-digit" });
}

function isCandidateTurn(turn) {
  if (turn?.role === "Candidate" || String(turn?.speaker).toLowerCase() === "candidate") return true;
  return /^\d+$/.test(String(turn?.speaker ?? "")) && !["9999", "99999"].includes(String(turn.speaker));
}

function displaySpeaker(turn) {
  if (isCandidateTurn(turn)) return "Candidate";
  if (["9999", "99999"].includes(String(turn?.speaker ?? ""))) return "AI Panel";
  return turn?.speakerName || turn?.speaker || "AI Panel";
}

function normalizeSearch(text = "") {
  return String(text).toLowerCase().replace(/node\s*\.?(?:js)?/g, "nodejs").replace(/[^a-z0-9]+/g, "");
}

export default function Report() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { authFetch } = useAuth() || {};
  const [storedData, setStoredData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(!state?.report && !state?.transcript);
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    if (state?.report || state?.transcript || !sessionId || typeof authFetch !== "function") return;
    let active = true;
    setLoadingReport(true);
    authFetch(`/api/interview/${encodeURIComponent(sessionId)}/report`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Could not load this report");
        if (active) setStoredData(data);
      })
      .catch((error) => {
        if (active) setReportError(error.message || "Could not load this report");
      })
      .finally(() => {
        if (active) setLoadingReport(false);
      });
    return () => { active = false; };
  }, [authFetch, sessionId, state?.report, state?.transcript]);

  const report = state?.report || storedData?.report || {};
  const persistedInterview = storedData?.interview || {};
  const transcript = Array.isArray(report.transcript) && report.transcript.length
    ? report.transcript
    : Array.isArray(state?.transcript) && state.transcript.length
      ? state.transcript
      : persistedInterview.transcript || [];
  const flags = Array.isArray(report.flags) ? report.flags : [];
  const targetRole = state?.role || persistedInterview.role || "Software Systems Engineer";
  const targetLevel = state?.level || persistedInterview.level || "Senior";
  const metadata = report.metadata || persistedInterview;

  function formatDuration(seconds) {
    if (seconds === undefined || seconds === null) return "—";
    const value = Math.max(0, Number(seconds));
    return `${Math.floor(value / 60)}m ${String(value % 60).padStart(2, "0")}s`;
  }

  if (loadingReport) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0f172a] text-sm text-slate-400">Loading interview report...</div>;
  }

  if (reportError) {
    return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0f172a] text-sm text-red-300"><p>{reportError}</p><button type="button" onClick={() => navigate("/")} className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300">Return to dashboard</button></div>;
  }

  const candidateTurns = transcript.filter(isCandidateTurn);
  const panelTurns = transcript.filter(
    (turn) => !candidateTurns.includes(turn)
  );
  const candidateWords = candidateTurns.reduce(
    (total, turn) => total + String(turn.text || "").trim().split(/\s+/).filter(Boolean).length,
    0
  );
  const averageWords = candidateTurns.length ? candidateWords / candidateTurns.length : 0;
  const flagPenalty = flags.length * 8;

  const calculatedScorecards = [
    {
      label: "Interview Engagement",
      score: clamp(55 + candidateTurns.length * 8 - flagPenalty),
      color: "text-indigo-400",
      bar: "bg-indigo-500",
    },
    {
      label: "Response Clarity",
      score: clamp(58 + Math.min(30, averageWords / 4) - flagPenalty),
      color: "text-emerald-400",
      bar: "bg-emerald-500",
    },
    {
      label: "Panel Coverage",
      score: clamp(50 + new Set(panelTurns.map((turn) => turn.personaId || turn.speaker)).size * 10),
      color: "text-blue-400",
      bar: "bg-blue-500",
    },
    {
      label: "Assessment Signal",
      score: clamp(82 - flagPenalty),
      color: flags.length ? "text-amber-400" : "text-purple-400",
      bar: flags.length ? "bg-amber-500" : "bg-purple-500",
    },
    {
      label: "Role Alignment",
      score: candidateTurns.length >= 2 ? clamp(50 + Math.min(35, averageWords / 3) - flags.length * 8) : null,
      color: "text-purple-400",
      bar: "bg-purple-500",
    },
  ];
  const insufficientByTranscript = candidateTurns.length < 2 || candidateWords < 50;
  const insufficientEvidence = insufficientByTranscript;
  const hasUsablePersistedScores = report.summary?.scores?.some((card) => card.score !== null && card.score !== undefined);
  const persistedSummaryMatchesTranscript = report.summary?.totalExchanges === candidateTurns.length && report.summary?.overallScore > 0;
  const scorecards = report.summary?.scores?.length && hasUsablePersistedScores && persistedSummaryMatchesTranscript
    ? report.summary.scores.map((card) => ({
        ...card,
        score: insufficientEvidence ? null : card.score,
        bar: card.bar || "bg-blue-500",
        color: card.color || "text-blue-400",
      }))
    : calculatedScorecards.map((card) => ({
        ...card,
        score: insufficientEvidence ? null : card.score,
      }));
  const fallbackOverallScore = scorecards.filter((card) => card.score !== null).length
    ? clamp(scorecards.filter((card) => card.score !== null).reduce((sum, card) => sum + card.score, 0) / scorecards.filter((card) => card.score !== null).length)
    : null;
  const displayedOverallScore = insufficientEvidence ? null : (persistedSummaryMatchesTranscript ? report.summary?.overallScore : fallbackOverallScore);
  const displayedRecommendation = insufficientEvidence
    ? "Insufficient evidence"
    : (persistedSummaryMatchesTranscript
      ? (report.summary.recommendation || "Assessment complete")
      : fallbackOverallScore >= 75 ? "Strong evidence" : fallbackOverallScore >= 60 ? "Proceed with targeted follow-up" : "More evidence required");

  const strengths = [];
  if (candidateTurns.length >= 3) strengths.push("Provided multiple answers during the session, giving the panel useful evaluation evidence.");
  if (averageWords >= 35) strengths.push("Gave sufficiently detailed responses for follow-up assessment.");
  if (flags.length === 0) strengths.push("No vague or contradictory-answer flags were raised.");
  if (!strengths.length) strengths.push("Complete more interview turns to produce stronger evidence-based strengths.");

  const improvements = flags.length
    ? flags.map((flag) => flag.note || `Review the ${flag.type || "flagged"} response.`)
    : [
        "Continue answering with specific actions, decisions, technologies, and measurable results.",
        "Use a clear situation, action, and result structure for behavioural questions.",
      ];
  const technologyEvidence = report.evidence?.technologyEvidence || [];
  const projectEvidence = report.evidence?.projectEvidence || [];
  const technologiesFound = report.evidence?.technologiesFound || [];
  const technologyEvidenceForDisplay = technologyEvidence.length > 0
    ? technologyEvidence
    : technologiesFound.map((technology) => ({
        technology,
        mentioned: candidateTurns.some((turn) => normalizeSearch(turn.text).includes(normalizeSearch(technology))),
        answerMatches: candidateTurns.filter((turn) => normalizeSearch(turn.text).includes(normalizeSearch(technology))).map((turn) => turn.text),
      }));
  const unverifiedTechnologies = technologyEvidenceForDisplay.filter((item) => !item.mentioned);
  const hasEvidence = technologyEvidenceForDisplay.length > 0 || projectEvidence.length > 0;

  const downloadReport = () => {
    const payload = {
      sessionId,
      role: targetRole,
      level: targetLevel,
      report,
      transcript,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `intervyou-report-${sessionId || "session"}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="print-report min-h-screen bg-[#0f172a] p-6 font-sans text-slate-100 lg:p-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase text-blue-400">
                Session Audit
              </span>
              <span className="font-mono text-xs text-slate-500">ID: {sessionId?.slice(0, 12)}...</span>
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-white lg:text-3xl">Interview Assessment Report</h1>
            <p className="mt-1 text-xs text-slate-400">
              Target Profile: <strong className="text-slate-200">{targetRole}</strong> ({targetLevel})
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button type="button" onClick={downloadReport} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800">
              <Download size={14} /> JSON
            </button>
            <button type="button" onClick={() => window.print()} className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20">
              <Printer size={14} /> Save PDF
            </button>
            <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800">
              <ArrowLeft size={14} /> New Interview
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {scorecards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</span>
              <div className="my-3 flex items-baseline gap-1.5">
                <span className={`text-3xl font-extrabold ${card.score === null ? "text-slate-500" : card.color}`}>{card.score === null ? "N/A" : card.score}</span>
                <span className="font-mono text-xs text-slate-500">/ 100</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div className={`h-full ${card.score === null ? "bg-slate-700" : card.bar}`} style={{ width: `${card.score ?? 0}%` }} />
              </div>
            </div>
          ))}
        </div>

        {report.summary && (
          <section className="print-report-accent rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Overall assessment</p>
            <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div><strong className="text-4xl text-white">{displayedOverallScore ?? "N/A"}</strong><span className="ml-2 text-xs text-slate-500">/ 100 evidence score</span></div>
              <p className="rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-2 text-sm font-semibold text-slate-200">{displayedRecommendation}</p>
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><Clock className="mb-2 text-blue-400" size={18} /><p className="text-xs text-slate-400">Interview duration</p><strong className="text-xl text-white">{formatDuration(metadata.durationSeconds)}</strong></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Started</p><strong className="text-sm text-white">{metadata.startTime ? new Date(metadata.startTime).toLocaleString() : "—"}</strong></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Completion</p><strong className="capitalize text-sm text-white">{metadata.completionReason || "unknown"}</strong>{metadata.endTime && <p className="mt-1 text-[10px] text-slate-500">Ended {new Date(metadata.endTime).toLocaleString()}</p>}</div>
        </section>

        {insufficientEvidence && (
          <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            <strong>Insufficient evidence for a complete assessment.</strong>
            <p className="mt-1 text-xs text-amber-200/80">This interview was too short to score every category reliably. Complete at least 2 substantive candidate answers and 50 total words for a full assessment.</p>
          </section>
        )}

        {hasEvidence && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="mb-4 border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">Resume evidence citations</h2>
              <p className="mt-1 text-[11px] text-slate-500">Resume claims are shown beside the candidate answers that supported them during the interview.</p>
            </div>
            <div className="space-y-4">
              {technologyEvidenceForDisplay.filter((item) => item.mentioned).map((item) => (
                <div key={item.technology} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-emerald-300">{item.technology}</span><span className="text-[10px] font-semibold uppercase text-emerald-400">Mentioned in interview</span></div>
                  {item.answerMatches.map((answer, index) => <p key={`${item.technology}-${index}`} className="mt-2 border-l-2 border-emerald-500/40 pl-3 text-xs leading-relaxed text-slate-300">“{answer}”</p>)}
                </div>
              ))}
              {projectEvidence.filter((item) => item.supportedInInterview).map((item, index) => (
                <div key={`${item.resumeClaim}-${index}`} className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Resume project claim</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">{item.resumeClaim}</p>
                  {item.answerMatches.map((answer, answerIndex) => <p key={`${index}-${answerIndex}`} className="mt-2 border-l-2 border-blue-500/40 pl-3 text-xs leading-relaxed text-slate-300">Interview evidence: “{answer}”</p>)}
                </div>
              ))}
              {unverifiedTechnologies.map((item) => (
                <div key={`unverified-${item.technology}`} className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
                  <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-slate-300">{item.technology}</span><span className="text-[10px] font-semibold uppercase text-slate-500">Not directly verified</span></div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">This resume technology was not clearly discussed in a recorded candidate answer.</p>
                </div>
              ))}
              {!technologyEvidenceForDisplay.some((item) => item.mentioned) && !projectEvidence.some((item) => item.supportedInInterview) && (
                <p className="text-xs text-slate-500">Resume claims were found, but none were directly verified in the recorded answers.</p>
              )}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400"><CheckCircle2 size={16} /> Verified Strengths</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-xs leading-relaxed text-slate-300">
              {strengths.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
          <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400"><AlertTriangle size={16} /> Development Areas</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-xs leading-relaxed text-slate-300">
              {improvements.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
            </ul>
          </section>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><MessageSquare className="mb-2 text-blue-400" size={18} /><p className="text-xs text-slate-400">Candidate responses</p><strong className="text-xl text-white">{candidateTurns.length}</strong></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><Gauge className="mb-2 text-purple-400" size={18} /><p className="text-xs text-slate-400">Final difficulty</p><strong className="capitalize text-xl text-white">{report.finalDifficulty || "medium"}</strong></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><ShieldAlert className="mb-2 text-amber-400" size={18} /><p className="text-xs text-slate-400">Assessment flags</p><strong className="text-xl text-white">{flags.length}</strong></div>
        </section>

        <section className="print-transcript rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300"><FileText size={15} /> Verified Dialogue Log ({transcript.length} turns)</h2>
            <span className="text-[11px] text-slate-500">Transcript-linked evidence</span>
          </div>
          {transcript.length ? (
            <div className="max-h-96 space-y-3 overflow-y-auto pr-2 text-xs">
              {transcript.map((item, index) => {
                const isCandidate = isCandidateTurn(item);
                return <div key={item.id || index} className={`print-transcript-entry rounded-2xl border p-3.5 ${isCandidate ? "ml-4 border-indigo-500/20 bg-indigo-950/20" : "mr-4 border-slate-800/80 bg-slate-950/40"}`}>
                  <div className="mb-1 flex items-center justify-between text-[10px]"><span className={isCandidate ? "font-semibold text-indigo-300" : "font-semibold text-blue-400"}>{displaySpeaker(item)}</span><span className="font-mono text-slate-500">{formatTimestamp(item.timestamp)}</span></div>
                  <p className="leading-relaxed text-slate-300">{item.text}</p>
                </div>;
              })}
            </div>
          ) : <p className="py-8 text-center text-xs text-slate-500">No transcript was returned for this session.</p>}
        </section>
      </div>
    </div>
  );
}

