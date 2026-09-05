

import { llmService } from "./llm.service.js";

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function words(text = "") {
  return String(text).trim().split(/\s+/).filter(Boolean);
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
    const candidateTurns = transcript.filter((turn) => turn.speaker === "candidate");
    const answers = candidateTurns.map((turn) => String(turn.text || ""));
    const allAnswers = answers.join(" ").toLowerCase();
    const totalWords = answers.reduce((sum, answer) => sum + words(answer).length, 0);
    const averageWords = candidateTurns.length ? totalWords / candidateTurns.length : 0;
    const vagueFlags = flags.filter((flag) => flag.type === "vague").length;
    const contradictionFlags = flags.filter((flag) => flag.type === "contradiction").length;
    const technologyTerms = resumeSignals.technologies || [];
    const mentionedTechnologies = technologyTerms.filter((term) => allAnswers.includes(term.toLowerCase()));
    const technicalTerms = /\b(api|database|sql|cache|redis|latency|scale|testing|architecture|trade.?off|deploy|algorithm|complexity|security|monitoring|react|node|python|java|cloud)\b/i;
    const behaviouralTerms = /\b(team|conflict|feedback|led|owned|failed|learned|communicat|collaborat|deadline|stakeholder|result|impact)\b/i;
    const roleText = `${candidateProfile.role || ""} ${candidateProfile.level || ""}`.toLowerCase();

    const technical = clamp(42 + Math.min(32, averageWords / 3) + (answers.filter((answer) => technicalTerms.test(answer)).length * 7) - vagueFlags * 7);
    const communication = clamp(48 + Math.min(34, averageWords / 3) + (candidateTurns.length * 3) - vagueFlags * 8);
    const behavioural = clamp(45 + (answers.filter((answer) => behaviouralTerms.test(answer)).length * 12) + Math.min(20, averageWords / 6) - vagueFlags * 4);
    const resumeAlignment = technologyTerms.length
      ? clamp(45 + (mentionedTechnologies.length / technologyTerms.length) * 45 - contradictionFlags * 12)
      : clamp(65 - contradictionFlags * 12);
    const roleAlignment = roleText.includes("engineer") || roleText.includes("developer")
      ? technical * 0.55 + communication * 0.25 + resumeAlignment * 0.2
      : communication * 0.45 + behavioural * 0.35 + resumeAlignment * 0.2;
    const overall = clamp(technical * 0.3 + communication * 0.2 + behavioural * 0.2 + resumeAlignment * 0.15 + roleAlignment * 0.15);
    const recommendation = overall >= 75 ? "Strong evidence" : overall >= 60 ? "Proceed with targeted follow-up" : "More evidence required";

    return {
      sessionId,
      summary: {
        totalExchanges: candidateTurns.length,
        totalCandidateWords: totalWords,
        finalDifficulty,
        flaggedMoments: flags.length,
        overallScore: overall,
        recommendation,
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
      },
      flags,
      transcript,
      personasInvolved: [...new Set(transcript.filter((turn) => turn.speaker !== "candidate").map((turn) => turn.personaId).filter(Boolean))],
      generatedAt: new Date().toISOString(),
    };
  }
}

export const assessmentService = new AssessmentService();