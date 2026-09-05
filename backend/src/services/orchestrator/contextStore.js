


/**
 * ContextStore
 * Holds the shared state every persona reads from: resume, transcript,
 * difficulty, and flags raised by the assessment engine (vague/contradictory answers).
 * One instance per active interview session (keyed by sessionId in OrchestratorService).
 */

const TECHNOLOGY_TERMS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express",
  "Python", "Java", "Go", "C++", "SQL", "MongoDB", "PostgreSQL", "Redis",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "GraphQL", "REST", "Kafka",
  "Terraform", "GitHub Actions", "PyTorch", "TensorFlow", "Figma",
];

function extractResumeSignals(resumeText = "") {
  const normalized = String(resumeText).replace(/\s+/g, " ").trim();
  const lower = normalized.toLowerCase();
  const technologies = TECHNOLOGY_TERMS.filter((term) =>
    lower.includes(term.toLowerCase())
  );

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const projectSignals = sentences
    .filter((sentence) =>
      /\b(project|built|developed|implemented|designed|architected|led|deployed|platform|application|system)\b/i.test(sentence)
    )
    .slice(0, 6)
    .map((sentence) => sentence.slice(0, 220));

  return { technologies, projectSignals };
}

export class ContextStore {
  constructor({ sessionId, resumeSummary = "", candidateProfile = {} }) {
    this.sessionId = sessionId;
    this.resumeSummary = resumeSummary;
    this.resumeSignals = extractResumeSignals(resumeSummary);
    this.candidateProfile = candidateProfile;
    this.transcript = []; // { speaker, text, timestamp, personaId? }
    this.difficulty = "medium"; // easy | medium | hard
    this.flags = []; // { type: 'vague' | 'contradiction', turnIndex, note }
    this.currentPersonaId = null;
  }

  addTurn({ speaker, text, personaId = null }) {
    const turn = { speaker, text, personaId, timestamp: new Date().toISOString() };
    this.transcript.push(turn);
    return turn;
  }

  raiseFlag(flag) {
    this.flags.push({ ...flag, timestamp: new Date().toISOString() });
  }

  adjustDifficulty(direction) {
    const order = ["easy", "medium", "hard"];
    const idx = order.indexOf(this.difficulty);
    if (direction === "up" && idx < order.length - 1) this.difficulty = order[idx + 1];
    if (direction === "down" && idx > 0) this.difficulty = order[idx - 1];
  }

  toContext() {
    return {
      resumeSummary: this.resumeSummary,
      resumeSignals: this.resumeSignals,
      candidateProfile: this.candidateProfile,
      transcript: this.transcript,
      difficulty: this.difficulty,
      flags: this.flags,
    };
  }

  toReport() {
    return {
      sessionId: this.sessionId,
      transcript: this.transcript,
      flags: this.flags,
      finalDifficulty: this.difficulty,
      candidateProfile: this.candidateProfile,
      resumeSignals: this.resumeSignals,
    };
  }
}
