/**
 * ContextStore
 * Holds the shared state every persona reads from: resume, transcript,
 * difficulty, and flags raised by the assessment engine (vague/contradictory answers).
 * One instance per active interview session (keyed by sessionId in OrchestratorService).
 */
export class ContextStore {
  constructor({ sessionId, resumeSummary = "", candidateProfile = {} }) {
    this.sessionId = sessionId;
    this.resumeSummary = resumeSummary;
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
    };
  }
}
