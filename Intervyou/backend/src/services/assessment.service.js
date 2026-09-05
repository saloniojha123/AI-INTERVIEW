
import { llmService } from "./llm.service.js";

class AssessmentService {
  /**
   * Evaluates candidate responses for vague claims, evasions, or resume contradictions.
   */
  async evaluateTurn({ candidateText, resumeSummary = "", recentTranscript = [] }) {
    const words = candidateText.trim().split(/\s+/).filter(Boolean);
    if (words.length < 5) {
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
${recentTranscript.slice(-4).map((t) => `${t.speaker}: ${t.text}`).join("\n")}

Latest Candidate Response: "${candidateText}"`;

    try {
      const result = await llmService.generate({ systemPrompt, prompt });
      const cleanJson = result.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      return {
        isVague: words.length < 8,
        isContradictory: false,
        note: words.length < 8 ? "Answer lacks technical elaboration." : null,
      };
    }
  }

  buildFinalReport(contextStoreReport) {
    const { sessionId, transcript, flags, finalDifficulty } = contextStoreReport;

    const candidateTurns = transcript.filter((t) => t.speaker === "candidate");
    const personaTurns = transcript.filter((t) => t.speaker !== "candidate");

    // Dynamic category score calculation based on flags and engagement
    const totalFlags = flags.length;
    const technicalDepth = Math.max(50, Math.min(95, 88 - totalFlags * 4));
    const clarityScore = Math.max(45, Math.min(95, 90 - flags.filter((f) => f.type === "vague").length * 6));
    const alignmentScore = Math.max(50, Math.min(95, 92 - flags.filter((f) => f.type === "contradiction").length * 8));

    return {
      sessionId,
      summary: {
        totalExchanges: candidateTurns.length,
        finalDifficulty,
        flaggedMoments: totalFlags,
        scores: [
          { label: "Technical Depth", score: technicalDepth, color: "text-indigo-400" },
          { label: "Communication Clarity", score: clarityScore, color: "text-emerald-400" },
          { label: "Resume & Claim Consistency", score: alignmentScore, color: "text-blue-400" },
          { label: "Role Alignment", score: 85, color: "text-purple-400" },
        ],
      },
      flags,
      transcript,
      personasInvolved: [...new Set(personaTurns.map((t) => t.personaId).filter(Boolean))],
      generatedAt: new Date().toISOString(),
    };
  }
}

export const assessmentService = new AssessmentService();