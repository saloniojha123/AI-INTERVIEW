

// import { llmService } from "./llm.service.js";

// function clamp(value, min = 0, max = 100) {
//   return Math.max(min, Math.min(max, Math.round(value)));
// }

// function words(text = "") {
//   return String(text).trim().split(/\s+/).filter(Boolean);
// }

// class AssessmentService {
//   async evaluateTurn({ candidateText, resumeSummary = "", recentTranscript = [] }) {
//     const count = words(candidateText).length;
//     if (count < 5) {
//       return {
//         isVague: true,
//         isContradictory: false,
//         note: "Response is minimal and lacks substantive detail.",
//       };
//     }

//     const systemPrompt = `You are a real-time interview assessment evaluator.
// Analyze the candidate's answer for:
// 1. Vagueness (buzzwords without concrete evidence, metrics, or technical explanation).
// 2. Contradictions (conflicts with claims in their resume or previous answers).
// Respond with valid JSON only:
// {"isVague": boolean, "isContradictory": boolean, "note": "one concise sentence explaining the issue, or null"}`;

//     const prompt = `Resume Context: ${resumeSummary || "Standard candidate profile"}
// Recent Exchanges:
// ${recentTranscript.slice(-4).map((turn) => `${turn.speaker}: ${turn.text}`).join("\n")}

// Latest Candidate Response: "${candidateText}"`;

//     try {
//       const result = await llmService.generate({ systemPrompt, prompt });
//       return JSON.parse(result.replace(/```json|```/g, "").trim());
//     } catch {
//       return {
//         isVague: count < 8,
//         isContradictory: false,
//         note: count < 8 ? "Answer lacks substantive elaboration." : null,
//       };
//     }
//   }

//   buildFinalReport(contextStoreReport) {
//     const {
//       sessionId,
//       transcript = [],
//       flags = [],
//       finalDifficulty = "medium",
//       candidateProfile = {},
//       resumeSignals = {},
//     } = contextStoreReport;
//     const candidateTurns = transcript.filter((turn) => turn.speaker === "candidate");
//     const answers = candidateTurns.map((turn) => String(turn.text || ""));
//     const allAnswers = answers.join(" ").toLowerCase();
//     const totalWords = answers.reduce((sum, answer) => sum + words(answer).length, 0);
//     const averageWords = candidateTurns.length ? totalWords / candidateTurns.length : 0;
//     const vagueFlags = flags.filter((flag) => flag.type === "vague").length;
//     const contradictionFlags = flags.filter((flag) => flag.type === "contradiction").length;
//     const technologyTerms = resumeSignals.technologies || [];
//     const mentionedTechnologies = technologyTerms.filter((term) => allAnswers.includes(term.toLowerCase()));
//     const technicalTerms = /\b(api|database|sql|cache|redis|latency|scale|testing|architecture|trade.?off|deploy|algorithm|complexity|security|monitoring|react|node|python|java|cloud)\b/i;
//     const behaviouralTerms = /\b(team|conflict|feedback|led|owned|failed|learned|communicat|collaborat|deadline|stakeholder|result|impact)\b/i;
//     const roleText = `${candidateProfile.role || ""} ${candidateProfile.level || ""}`.toLowerCase();

//     const technical = clamp(42 + Math.min(32, averageWords / 3) + (answers.filter((answer) => technicalTerms.test(answer)).length * 7) - vagueFlags * 7);
//     const communication = clamp(48 + Math.min(34, averageWords / 3) + (candidateTurns.length * 3) - vagueFlags * 8);
//     const behavioural = clamp(45 + (answers.filter((answer) => behaviouralTerms.test(answer)).length * 12) + Math.min(20, averageWords / 6) - vagueFlags * 4);
//     const resumeAlignment = technologyTerms.length
//       ? clamp(45 + (mentionedTechnologies.length / technologyTerms.length) * 45 - contradictionFlags * 12)
//       : clamp(65 - contradictionFlags * 12);
//     const roleAlignment = roleText.includes("engineer") || roleText.includes("developer")
//       ? technical * 0.55 + communication * 0.25 + resumeAlignment * 0.2
//       : communication * 0.45 + behavioural * 0.35 + resumeAlignment * 0.2;
//     const overall = clamp(technical * 0.3 + communication * 0.2 + behavioural * 0.2 + resumeAlignment * 0.15 + roleAlignment * 0.15);
//     const recommendation = overall >= 75 ? "Strong evidence" : overall >= 60 ? "Proceed with targeted follow-up" : "More evidence required";

//     return {
//       sessionId,
//       summary: {
//         totalExchanges: candidateTurns.length,
//         totalCandidateWords: totalWords,
//         finalDifficulty,
//         flaggedMoments: flags.length,
//         overallScore: overall,
//         recommendation,
//         scores: [
//           { label: "Technical Depth", score: technical, color: "text-indigo-400" },
//           { label: "Communication Clarity", score: communication, color: "text-emerald-400" },
//           { label: "Behavioural Evidence", score: behavioural, color: "text-amber-400" },
//           { label: "Resume Alignment", score: resumeAlignment, color: "text-blue-400" },
//           { label: "Role Alignment", score: clamp(roleAlignment), color: "text-purple-400" },
//         ],
//       },
//       evidence: {
//         technologiesFound: technologyTerms,
//         technologiesMentioned: mentionedTechnologies,
//         projectSignals: resumeSignals.projectSignals || [],
//       },
//       flags,
//       transcript,
//       personasInvolved: [...new Set(transcript.filter((turn) => turn.speaker !== "candidate").map((turn) => turn.personaId).filter(Boolean))],
//       generatedAt: new Date().toISOString(),
//     };
//   }
// }

// export const assessmentService = new AssessmentService();



// import { llmService } from "./llm.service.js";

// function clamp(value, min = 0, max = 100) {
//   return Math.max(min, Math.min(max, Math.round(value)));
// }

// function words(text = "") {
//   return String(text).trim().split(/\s+/).filter(Boolean);
// }

// function meaningfulTerms(text = "") {
//   const ignored = new Set(["the", "and", "with", "for", "from", "that", "this", "using", "built", "used", "into", "they", "their", "was", "were"]);
//   return [...new Set(String(text).toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) || [])]
//     .filter((term) => !ignored.has(term));
// }

// class AssessmentService {
//   async evaluateTurn({ candidateText, resumeSummary = "", recentTranscript = [] }) {
//     const count = words(candidateText).length;
//     if (count < 5) {
//       return {
//         isVague: true,
//         isContradictory: false,
//         note: "Response is minimal and lacks substantive detail.",
//       };
//     }

//     const systemPrompt = `You are a real-time interview assessment evaluator.
// Analyze the candidate's answer for:
// 1. Vagueness (buzzwords without concrete evidence, metrics, or technical explanation).
// 2. Contradictions (conflicts with claims in their resume or previous answers).
// Respond with valid JSON only:
// {"isVague": boolean, "isContradictory": boolean, "note": "one concise sentence explaining the issue, or null"}`;

//     const prompt = `Resume Context: ${resumeSummary || "Standard candidate profile"}
// Recent Exchanges:
// ${recentTranscript.slice(-4).map((turn) => `${turn.speaker}: ${turn.text}`).join("\n")}

// Latest Candidate Response: "${candidateText}"`;

//     try {
//       const result = await llmService.generate({ systemPrompt, prompt });
//       return JSON.parse(result.replace(/```json|```/g, "").trim());
//     } catch {
//       return {
//         isVague: count < 8,
//         isContradictory: false,
//         note: count < 8 ? "Answer lacks substantive elaboration." : null,
//       };
//     }
//   }

//   buildFinalReport(contextStoreReport) {
//     const {
//       sessionId,
//       transcript = [],
//       flags = [],
//       finalDifficulty = "medium",
//       candidateProfile = {},
//       resumeSignals = {},
//     } = contextStoreReport;
//     const candidateTurns = transcript.filter((turn) => turn.speaker === "candidate");
//     const answers = candidateTurns.map((turn) => String(turn.text || ""));
//     const allAnswers = answers.join(" ").toLowerCase();
//     const totalWords = answers.reduce((sum, answer) => sum + words(answer).length, 0);
//     const averageWords = candidateTurns.length ? totalWords / candidateTurns.length : 0;
//     const vagueFlags = flags.filter((flag) => flag.type === "vague").length;
//     const contradictionFlags = flags.filter((flag) => flag.type === "contradiction").length;
//     const technologyTerms = resumeSignals.technologies || [];
//     const mentionedTechnologies = technologyTerms.filter((term) => allAnswers.includes(term.toLowerCase()));
//     const technologyEvidence = technologyTerms.map((technology) => {
//       const answerMatches = candidateTurns
//         .filter((turn) => String(turn.text || "").toLowerCase().includes(technology.toLowerCase()))
//         .map((turn) => turn.text);
//       return { technology, mentioned: answerMatches.length > 0, answerMatches };
//     });
//     const projectEvidence = (resumeSignals.projectSignals || []).map((project) => {
//       const terms = meaningfulTerms(project);
//       const answerMatches = candidateTurns
//         .filter((turn) => {
//           const answer = String(turn.text || "").toLowerCase();
//           const overlap = terms.filter((term) => answer.includes(term));
//           return overlap.length >= Math.min(2, Math.max(1, Math.ceil(terms.length * 0.15)));
//         })
//         .map((turn) => turn.text);
//       return { resumeClaim: project, supportedInInterview: answerMatches.length > 0, answerMatches };
//     });
//     const technicalTerms = /\b(api|database|sql|cache|redis|latency|scale|testing|architecture|trade.?off|deploy|algorithm|complexity|security|monitoring|react|node|python|java|cloud)\b/i;
//     const behaviouralTerms = /\b(team|conflict|feedback|led|owned|failed|learned|communicat|collaborat|deadline|stakeholder|result|impact)\b/i;
//     const roleText = `${candidateProfile.role || ""} ${candidateProfile.level || ""}`.toLowerCase();

//     const technical = clamp(42 + Math.min(32, averageWords / 3) + (answers.filter((answer) => technicalTerms.test(answer)).length * 7) - vagueFlags * 7);
//     const communication = clamp(48 + Math.min(34, averageWords / 3) + (candidateTurns.length * 3) - vagueFlags * 8);
//     const behavioural = clamp(45 + (answers.filter((answer) => behaviouralTerms.test(answer)).length * 12) + Math.min(20, averageWords / 6) - vagueFlags * 4);
//     const resumeAlignment = technologyTerms.length
//       ? clamp(45 + (mentionedTechnologies.length / technologyTerms.length) * 45 - contradictionFlags * 12)
//       : clamp(65 - contradictionFlags * 12);
//     const roleAlignment = roleText.includes("engineer") || roleText.includes("developer")
//       ? technical * 0.55 + communication * 0.25 + resumeAlignment * 0.2
//       : communication * 0.45 + behavioural * 0.35 + resumeAlignment * 0.2;
//     const overall = clamp(technical * 0.3 + communication * 0.2 + behavioural * 0.2 + resumeAlignment * 0.15 + roleAlignment * 0.15);
//     const recommendation = overall >= 75 ? "Strong evidence" : overall >= 60 ? "Proceed with targeted follow-up" : "More evidence required";

//     return {
//       sessionId,
//       summary: {
//         totalExchanges: candidateTurns.length,
//         totalCandidateWords: totalWords,
//         finalDifficulty,
//         flaggedMoments: flags.length,
//         overallScore: overall,
//         recommendation,
//         scores: [
//           { label: "Technical Depth", score: technical, color: "text-indigo-400" },
//           { label: "Communication Clarity", score: communication, color: "text-emerald-400" },
//           { label: "Behavioural Evidence", score: behavioural, color: "text-amber-400" },
//           { label: "Resume Alignment", score: resumeAlignment, color: "text-blue-400" },
//           { label: "Role Alignment", score: clamp(roleAlignment), color: "text-purple-400" },
//         ],
//       },
//       evidence: {
//         technologiesFound: technologyTerms,
//         technologiesMentioned: mentionedTechnologies,
//         projectSignals: resumeSignals.projectSignals || [],
//         technologyEvidence,
//         projectEvidence,
//       },
//       flags,
//       transcript,
//       personasInvolved: [...new Set(transcript.filter((turn) => turn.speaker !== "candidate").map((turn) => turn.personaId).filter(Boolean))],
//       generatedAt: new Date().toISOString(),
//     };
//   }
// }

// export const assessmentService = new AssessmentService();





// import { llmService } from "./llm.service.js";

// function clamp(value, min = 0, max = 100) {
//   return Math.max(min, Math.min(max, Math.round(value)));
// }

// function words(text = "") {
//   return String(text).trim().split(/\s+/).filter(Boolean);
// }

// function meaningfulTerms(text = "") {
//   const ignored = new Set(["the", "and", "with", "for", "from", "that", "this", "using", "built", "used", "into", "they", "their", "was", "were"]);
//   return [...new Set(String(text).toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) || [])]
//     .filter((term) => !ignored.has(term));
// }

// class AssessmentService {
//   async evaluateTurn({ candidateText, resumeSummary = "", recentTranscript = [] }) {
//     const count = words(candidateText).length;
//     if (count < 5) {
//       return {
//         isVague: true,
//         isContradictory: false,
//         note: "Response is minimal and lacks substantive detail.",
//       };
//     }

//     const systemPrompt = `You are a real-time interview assessment evaluator.
// Analyze the candidate's answer for:
// 1. Vagueness (buzzwords without concrete evidence, metrics, or technical explanation).
// 2. Contradictions (conflicts with claims in their resume or previous answers).
// Respond with valid JSON only:
// {"isVague": boolean, "isContradictory": boolean, "note": "one concise sentence explaining the issue, or null"}`;

//     const prompt = `Resume Context: ${resumeSummary || "Standard candidate profile"}
// Recent Exchanges:
// ${recentTranscript.slice(-4).map((turn) => `${turn.speaker}: ${turn.text}`).join("\n")}

// Latest Candidate Response: "${candidateText}"`;

//     try {
//       const result = await llmService.generate({ systemPrompt, prompt });
//       return JSON.parse(result.replace(/```json|```/g, "").trim());
//     } catch {
//       return {
//         isVague: count < 8,
//         isContradictory: false,
//         note: count < 8 ? "Answer lacks substantive elaboration." : null,
//       };
//     }
//   }

//   buildFinalReport(contextStoreReport) {
//     const {
//       sessionId,
//       transcript = [],
//       flags = [],
//       finalDifficulty = "medium",
//       candidateProfile = {},
//       resumeSignals = {},
//     } = contextStoreReport;
//     const candidateTurns = transcript.filter((turn) => turn.speaker === "candidate");
//     const answers = candidateTurns.map((turn) => String(turn.text || ""));
//     const allAnswers = answers.join(" ").toLowerCase();
//     const totalWords = answers.reduce((sum, answer) => sum + words(answer).length, 0);
//     const averageWords = candidateTurns.length ? totalWords / candidateTurns.length : 0;
//     const vagueFlags = flags.filter((flag) => flag.type === "vague").length;
//     const contradictionFlags = flags.filter((flag) => flag.type === "contradiction").length;
//     const technologyTerms = resumeSignals.technologies || [];
//     const mentionedTechnologies = technologyTerms.filter((term) => allAnswers.includes(term.toLowerCase()));
//     const technologyEvidence = technologyTerms.map((technology) => {
//       const answerMatches = candidateTurns
//         .filter((turn) => String(turn.text || "").toLowerCase().includes(technology.toLowerCase()))
//         .map((turn) => turn.text);
//       return { technology, mentioned: answerMatches.length > 0, answerMatches };
//     });
//     const projectEvidence = (resumeSignals.projectSignals || []).map((project) => {
//       const terms = meaningfulTerms(project);
//       const answerMatches = candidateTurns
//         .filter((turn) => {
//           const answer = String(turn.text || "").toLowerCase();
//           const overlap = terms.filter((term) => answer.includes(term));
//           return overlap.length >= Math.min(2, Math.max(1, Math.ceil(terms.length * 0.15)));
//         })
//         .map((turn) => turn.text);
//       return { resumeClaim: project, supportedInInterview: answerMatches.length > 0, answerMatches };
//     });
//     const technicalTerms = /\b(api|database|sql|cache|redis|latency|scale|testing|architecture|trade.?off|deploy|algorithm|complexity|security|monitoring|react|node|python|java|cloud)\b/i;
//     const behaviouralTerms = /\b(team|conflict|feedback|led|owned|failed|learned|communicat|collaborat|deadline|stakeholder|result|impact)\b/i;
//     const roleText = `${candidateProfile.role || ""} ${candidateProfile.level || ""}`.toLowerCase();
//     const technicalAnswers = answers.filter((answer) => technicalTerms.test(answer)).length;
//     const behaviouralAnswers = answers.filter((answer) => behaviouralTerms.test(answer)).length;
//     const enoughForGeneralScore = candidateTurns.length >= 3 && totalWords >= 90;
//     const technical = technicalAnswers > 0 && candidateTurns.length >= 2
//       ? clamp(42 + Math.min(32, averageWords / 3) + technicalAnswers * 7 - vagueFlags * 7)
//       : null;
//     const communication = candidateTurns.length >= 2
//       ? clamp(48 + Math.min(34, averageWords / 3) + candidateTurns.length * 3 - vagueFlags * 8)
//       : null;
//     const behavioural = behaviouralAnswers > 0 && candidateTurns.length >= 3
//       ? clamp(45 + behaviouralAnswers * 12 + Math.min(20, averageWords / 6) - vagueFlags * 4)
//       : null;
//     const resumeAlignment = technologyTerms.length && candidateTurns.length >= 2
//       ? clamp(45 + (mentionedTechnologies.length / technologyTerms.length) * 45 - contradictionFlags * 12)
//       : null;
//     const roleAlignment = enoughForGeneralScore && technical !== null && communication !== null
//       ? (roleText.includes("engineer") || roleText.includes("developer")
//         ? technical * 0.55 + communication * 0.25 + (resumeAlignment ?? communication) * 0.2
//         : communication * 0.45 + (behavioural ?? communication) * 0.35 + (resumeAlignment ?? communication) * 0.2)
//       : null;
//     const availableScores = [technical, communication, behavioural, resumeAlignment, roleAlignment].filter((score) => score !== null);
//     const overall = enoughForGeneralScore && availableScores.length >= 3
//       ? clamp(availableScores.reduce((sum, score) => sum + score, 0) / availableScores.length)
//       : null;
//     const recommendation = overall === null
//       ? "Insufficient evidence"
//       : overall >= 75
//         ? "Strong evidence"
//         : overall >= 60
//           ? "Proceed with targeted follow-up"
//           : "More evidence required";

//     return {
//       sessionId,
//       summary: {
//         totalExchanges: candidateTurns.length,
//         totalCandidateWords: totalWords,
//         finalDifficulty,
//         flaggedMoments: flags.length,
//         overallScore: overall,
//         recommendation,
//         evidenceStatus: overall === null ? "insufficient" : "sufficient",
//         minimumEvidence: "At least 3 candidate answers and 90 total words are required for a complete assessment.",
//         scores: [
//           { label: "Technical Depth", score: technical, color: "text-indigo-400" },
//           { label: "Communication Clarity", score: communication, color: "text-emerald-400" },
//           { label: "Behavioural Evidence", score: behavioural, color: "text-amber-400" },
//           { label: "Resume Alignment", score: resumeAlignment, color: "text-blue-400" },
//           { label: "Role Alignment", score: clamp(roleAlignment), color: "text-purple-400" },
//         ],
//       },
//       evidence: {
//         technologiesFound: technologyTerms,
//         technologiesMentioned: mentionedTechnologies,
//         projectSignals: resumeSignals.projectSignals || [],
//         technologyEvidence,
//         projectEvidence,
//       },
//       flags,
//       transcript,
//       personasInvolved: [...new Set(transcript.filter((turn) => turn.speaker !== "candidate").map((turn) => turn.personaId).filter(Boolean))],
//       generatedAt: new Date().toISOString(),
//     };
//   }
// }

// export const assessmentService = new AssessmentService();



// import { llmService } from "./llm.service.js";

// function clamp(value, min = 0, max = 100) {
//   return Math.max(min, Math.min(max, Math.round(value)));
// }

// function words(text = "") {
//   return String(text).trim().split(/\s+/).filter(Boolean);
// }

// function meaningfulTerms(text = "") {
//   const ignored = new Set(["the", "and", "with", "for", "from", "that", "this", "using", "built", "used", "into", "they", "their", "was", "were"]);
//   return [...new Set(String(text).toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) || [])]
//     .filter((term) => !ignored.has(term));
// }

// function isCandidateTurn(turn) {
//   if (turn?.role === "Candidate" || String(turn?.speaker).toLowerCase() === "candidate") return true;
//   // Agora VoiceAI uses a numeric UID for the candidate. The agent uses 9999.
//   return /^\d+$/.test(String(turn?.speaker ?? "")) && !["9999", "99999"].includes(String(turn.speaker));
// }

// class AssessmentService {
//   async evaluateTurn({ candidateText, resumeSummary = "", recentTranscript = [] }) {
//     const count = words(candidateText).length;
//     if (count < 5) {
//       return {
//         isVague: true,
//         isContradictory: false,
//         note: "Response is minimal and lacks substantive detail.",
//       };
//     }

//     const systemPrompt = `You are a real-time interview assessment evaluator.
// Analyze the candidate's answer for:
// 1. Vagueness (buzzwords without concrete evidence, metrics, or technical explanation).
// 2. Contradictions (conflicts with claims in their resume or previous answers).
// Respond with valid JSON only:
// {"isVague": boolean, "isContradictory": boolean, "note": "one concise sentence explaining the issue, or null"}`;

//     const prompt = `Resume Context: ${resumeSummary || "Standard candidate profile"}
// Recent Exchanges:
// ${recentTranscript.slice(-4).map((turn) => `${turn.speaker}: ${turn.text}`).join("\n")}

// Latest Candidate Response: "${candidateText}"`;

//     try {
//       const result = await llmService.generate({ systemPrompt, prompt });
//       return JSON.parse(result.replace(/```json|```/g, "").trim());
//     } catch {
//       return {
//         isVague: count < 8,
//         isContradictory: false,
//         note: count < 8 ? "Answer lacks substantive elaboration." : null,
//       };
//     }
//   }

//   buildFinalReport(contextStoreReport) {
//     const {
//       sessionId,
//       transcript = [],
//       flags = [],
//       finalDifficulty = "medium",
//       candidateProfile = {},
//       resumeSignals = {},
//     } = contextStoreReport;
//     const candidateTurns = transcript.filter(isCandidateTurn);
//     const answers = candidateTurns.map((turn) => String(turn.text || ""));
//     const allAnswers = answers.join(" ").toLowerCase();
//     const totalWords = answers.reduce((sum, answer) => sum + words(answer).length, 0);
//     const averageWords = candidateTurns.length ? totalWords / candidateTurns.length : 0;
//     const vagueFlags = flags.filter((flag) => flag.type === "vague").length;
//     const contradictionFlags = flags.filter((flag) => flag.type === "contradiction").length;
//     const technologyTerms = resumeSignals.technologies || [];
//     const mentionedTechnologies = technologyTerms.filter((term) => allAnswers.includes(term.toLowerCase()));
//     const technologyEvidence = technologyTerms.map((technology) => {
//       const answerMatches = candidateTurns
//         .filter((turn) => String(turn.text || "").toLowerCase().includes(technology.toLowerCase()))
//         .map((turn) => turn.text);
//       return { technology, mentioned: answerMatches.length > 0, answerMatches };
//     });
//     const projectEvidence = (resumeSignals.projectSignals || []).map((project) => {
//       const terms = meaningfulTerms(project);
//       const answerMatches = candidateTurns
//         .filter((turn) => {
//           const answer = String(turn.text || "").toLowerCase();
//           const overlap = terms.filter((term) => answer.includes(term));
//           return overlap.length >= Math.min(2, Math.max(1, Math.ceil(terms.length * 0.15)));
//         })
//         .map((turn) => turn.text);
//       return { resumeClaim: project, supportedInInterview: answerMatches.length > 0, answerMatches };
//     });
//     const technicalTerms = /\b(api|database|sql|cache|redis|latency|scale|testing|architecture|trade.?off|deploy|algorithm|complexity|security|monitoring|react|node|python|java|cloud)\b/i;
//     const behaviouralTerms = /\b(team|conflict|feedback|led|owned|failed|learned|communicat|collaborat|deadline|stakeholder|result|impact)\b/i;
//     const roleText = `${candidateProfile.role || ""} ${candidateProfile.level || ""}`.toLowerCase();
//     const technicalAnswers = answers.filter((answer) => technicalTerms.test(answer)).length;
//     const behaviouralAnswers = answers.filter((answer) => behaviouralTerms.test(answer)).length;
//     const enoughForGeneralScore = candidateTurns.length >= 2 && totalWords >= 50;
//     const technical = technicalAnswers > 0 && candidateTurns.length >= 2
//       ? clamp(42 + Math.min(32, averageWords / 3) + technicalAnswers * 7 - vagueFlags * 7)
//       : null;
//     const communication = candidateTurns.length >= 2
//       ? clamp(48 + Math.min(34, averageWords / 3) + candidateTurns.length * 3 - vagueFlags * 8)
//       : null;
//     const behavioural = behaviouralAnswers > 0 && candidateTurns.length >= 3
//       ? clamp(45 + behaviouralAnswers * 12 + Math.min(20, averageWords / 6) - vagueFlags * 4)
//       : null;
//     const resumeAlignment = technologyTerms.length && candidateTurns.length >= 2
//       ? clamp(45 + (mentionedTechnologies.length / technologyTerms.length) * 45 - contradictionFlags * 12)
//       : null;
//     const roleAlignment = enoughForGeneralScore && technical !== null && communication !== null
//       ? (roleText.includes("engineer") || roleText.includes("developer")
//         ? technical * 0.55 + communication * 0.25 + (resumeAlignment ?? communication) * 0.2
//         : communication * 0.45 + (behavioural ?? communication) * 0.35 + (resumeAlignment ?? communication) * 0.2)
//       : null;
//     const availableScores = [technical, communication, behavioural, resumeAlignment, roleAlignment].filter((score) => score !== null);
//     const overall = enoughForGeneralScore && availableScores.length >= 3
//       ? clamp(availableScores.reduce((sum, score) => sum + score, 0) / availableScores.length)
//       : null;
//     const recommendation = overall === null
//       ? "Insufficient evidence"
//       : overall >= 75
//         ? "Strong evidence"
//         : overall >= 60
//           ? "Proceed with targeted follow-up"
//           : "More evidence required";

//     return {
//       sessionId,
//       summary: {
//         totalExchanges: candidateTurns.length,
//         totalCandidateWords: totalWords,
//         finalDifficulty,
//         flaggedMoments: flags.length,
//         overallScore: overall,
//         recommendation,
//         evidenceStatus: overall === null ? "insufficient" : "sufficient",
//         minimumEvidence: "At least 2 substantive candidate answers and 50 total words are required for a complete assessment.",
//         scores: [
//           { label: "Technical Depth", score: technical, color: "text-indigo-400" },
//           { label: "Communication Clarity", score: communication, color: "text-emerald-400" },
//           { label: "Behavioural Evidence", score: behavioural, color: "text-amber-400" },
//           { label: "Resume Alignment", score: resumeAlignment, color: "text-blue-400" },
//           { label: "Role Alignment", score: clamp(roleAlignment), color: "text-purple-400" },
//         ],
//       },
//       evidence: {
//         technologiesFound: technologyTerms,
//         technologiesMentioned: mentionedTechnologies,
//         projectSignals: resumeSignals.projectSignals || [],
//         technologyEvidence,
//         projectEvidence,
//       },
//       flags,
//       transcript,
//       personasInvolved: [...new Set(transcript.filter((turn) => turn.speaker !== "candidate").map((turn) => turn.personaId).filter(Boolean))],
//       generatedAt: new Date().toISOString(),
//     };
//   }
// }

// export const assessmentService = new AssessmentService();




import { llmService } from "./llm.service.js";

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function words(text = "") {
  return String(text).trim().split(/\s+/).filter(Boolean);
}

function meaningfulTerms(text = "") {
  const ignored = new Set(["the", "and", "with", "for", "from", "that", "this", "using", "built", "used", "into", "they", "their", "was", "were"]);
  return [...new Set(String(text).toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) || [])]
    .filter((term) => !ignored.has(term));
}

function normalizeSearch(text = "") {
  return String(text).toLowerCase().replace(/node\s*\.?(?:js)?/g, "nodejs").replace(/[^a-z0-9]+/g, "");
}

function isCandidateTurn(turn) {
  if (turn?.role === "Candidate" || String(turn?.speaker).toLowerCase() === "candidate") return true;
  // Agora VoiceAI uses a numeric UID for the candidate. The agent uses 9999.
  return /^\d+$/.test(String(turn?.speaker ?? "")) && !["9999", "99999"].includes(String(turn.speaker));
}

class AssessmentService {
  async evaluateTurn({ candidateText, resumeSummary = "", recentTranscript = [] }) {
    const count = words(candidateText).length;
    if (count < 5) {
      return {
        isVague: true,
        isContradictory: false,
        note: "Response is minimal and lacks substantive detail.",
      };
    }

    const systemPrompt = `You are a real-time interview assessment evaluator.
Analyze the candidate's answer for:
1. Vagueness (buzzwords without concrete evidence, metrics, or technical explanation).
2. Contradictions (conflicts with claims in their resume or previous answers).
Respond with valid JSON only:
{"isVague": boolean, "isContradictory": boolean, "note": "one concise sentence explaining the issue, or null"}`;

    const prompt = `Resume Context: ${resumeSummary || "Standard candidate profile"}
Recent Exchanges:
${recentTranscript.slice(-4).map((turn) => `${turn.speaker}: ${turn.text}`).join("\n")}

Latest Candidate Response: "${candidateText}"`;

    try {
      const result = await llmService.generate({ systemPrompt, prompt });
      return JSON.parse(result.replace(/```json|```/g, "").trim());
    } catch {
      return {
        isVague: count < 8,
        isContradictory: false,
        note: count < 8 ? "Answer lacks substantive elaboration." : null,
      };
    }
  }

  buildFinalReport(contextStoreReport) {
    const {
      sessionId,
      transcript = [],
      flags = [],
      finalDifficulty = "medium",
      candidateProfile = {},
      resumeSignals = {},
    } = contextStoreReport;
    const candidateTurns = transcript.filter(isCandidateTurn);
    const answers = candidateTurns.map((turn) => String(turn.text || ""));
    const allAnswers = answers.join(" ").toLowerCase();
    const normalizedAnswers = normalizeSearch(answers.join(" "));
    const totalWords = answers.reduce((sum, answer) => sum + words(answer).length, 0);
    const averageWords = candidateTurns.length ? totalWords / candidateTurns.length : 0;
    const vagueFlags = flags.filter((flag) => flag.type === "vague").length;
    const contradictionFlags = flags.filter((flag) => flag.type === "contradiction").length;
    const technologyTerms = resumeSignals.technologies || [];
    const mentionedTechnologies = technologyTerms.filter((term) => normalizedAnswers.includes(normalizeSearch(term)));
    const technologyEvidence = technologyTerms.map((technology) => {
      const answerMatches = candidateTurns
        .filter((turn) => normalizeSearch(turn.text).includes(normalizeSearch(technology)))
        .map((turn) => turn.text);
      return { technology, mentioned: answerMatches.length > 0, answerMatches };
    });
    const projectEvidence = (resumeSignals.projectSignals || []).map((project) => {
      const terms = meaningfulTerms(project).filter((term) => term.length >= 5);
      const answerMatches = candidateTurns
        .filter((turn) => {
          const answer = normalizeSearch(turn.text);
          const overlap = terms.filter((term) => answer.includes(normalizeSearch(term)));
          return overlap.length >= (terms.length > 6 ? 2 : 1);
        })
        .map((turn) => turn.text);
      return { resumeClaim: project, supportedInInterview: answerMatches.length > 0, answerMatches };
    });
    const technicalTerms = /\b(api|database|sql|cache|redis|latency|scale|testing|architecture|trade.?off|deploy|algorithm|complexity|security|monitoring|react|node|python|java|cloud)\b/i;
    const behaviouralTerms = /\b(team|conflict|feedback|led|owned|failed|learned|communicat|collaborat|deadline|stakeholder|result|impact)\b/i;
    const roleText = `${candidateProfile.role || ""} ${candidateProfile.level || ""}`.toLowerCase();
    const technicalAnswers = answers.filter((answer) => technicalTerms.test(answer)).length;
    const behaviouralAnswers = answers.filter((answer) => behaviouralTerms.test(answer)).length;
    const enoughForGeneralScore = candidateTurns.length >= 2 && totalWords >= 50;
    const technical = technicalAnswers > 0 && candidateTurns.length >= 2
      ? clamp(42 + Math.min(32, averageWords / 3) + technicalAnswers * 7 - vagueFlags * 7)
      : null;
    const communication = candidateTurns.length >= 2
      ? clamp(48 + Math.min(34, averageWords / 3) + candidateTurns.length * 3 - vagueFlags * 8)
      : null;
    const behavioural = behaviouralAnswers > 0 && candidateTurns.length >= 3
      ? clamp(45 + behaviouralAnswers * 12 + Math.min(20, averageWords / 6) - vagueFlags * 4)
      : null;
    const resumeAlignment = technologyTerms.length && candidateTurns.length >= 2
      ? clamp(45 + (mentionedTechnologies.length / technologyTerms.length) * 45 - contradictionFlags * 12)
      : null;
    const roleAlignment = enoughForGeneralScore && technical !== null && communication !== null
      ? (roleText.includes("engineer") || roleText.includes("developer")
        ? technical * 0.55 + communication * 0.25 + (resumeAlignment ?? communication) * 0.2
        : communication * 0.45 + (behavioural ?? communication) * 0.35 + (resumeAlignment ?? communication) * 0.2)
      : null;
    const availableScores = [technical, communication, behavioural, resumeAlignment, roleAlignment].filter((score) => score !== null);
    const overall = enoughForGeneralScore && availableScores.length >= 3
      ? clamp(availableScores.reduce((sum, score) => sum + score, 0) / availableScores.length)
      : null;
    const recommendation = overall === null
      ? "Insufficient evidence"
      : overall >= 75
        ? "Strong evidence"
        : overall >= 60
          ? "Proceed with targeted follow-up"
          : "More evidence required";

    return {
      sessionId,
      summary: {
        totalExchanges: candidateTurns.length,
        totalCandidateWords: totalWords,
        finalDifficulty,
        flaggedMoments: flags.length,
        overallScore: overall,
        recommendation,
        evidenceStatus: overall === null ? "insufficient" : "sufficient",
        minimumEvidence: "At least 2 substantive candidate answers and 50 total words are required for a complete assessment.",
        scores: [
          { label: "Technical Depth", score: technical, color: "text-indigo-400" },
          { label: "Communication Clarity", score: communication, color: "text-emerald-400" },
          { label: "Behavioural Evidence", score: behavioural, color: "text-amber-400" },
          { label: "Resume Alignment", score: resumeAlignment, color: "text-blue-400" },
          { label: "Role Alignment", score: clamp(roleAlignment), color: "text-purple-400" },
        ],
      },
      evidence: {
        technologiesFound: technologyTerms,
        technologiesMentioned: mentionedTechnologies,
        projectSignals: resumeSignals.projectSignals || [],
        technologyEvidence,
        projectEvidence,
      },
      flags,
      transcript,
      personasInvolved: [...new Set(transcript.filter((turn) => turn.speaker !== "candidate").map((turn) => turn.personaId).filter(Boolean))],
      generatedAt: new Date().toISOString(),
    };
  }
}

export const assessmentService = new AssessmentService();



