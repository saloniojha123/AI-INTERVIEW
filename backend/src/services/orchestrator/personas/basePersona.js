


/**
 * BasePersona
 * Every interviewer persona (Technical, Hiring Manager, Product, Behavioural, Customer)
 * extends this. A persona knows:
 *  - who it is (system prompt / role identity)
 *  - what it cares about evaluating
 *  - how to turn shared context + latest candidate answer into its next question
 *
 * Turn-taking (who speaks next, when to hand off) is decided entirely by
 * OrchestratorService's topic/keyword routing — personas just answer.
 */
export class BasePersona {
  constructor({ id, name, role, focusAreas = [], systemPrompt = "" }) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.focusAreas = focusAreas;
    this.systemPrompt = systemPrompt;
  }

  /**
   * Build the prompt this persona would send to the LLM given shared context.
   * Kept separate from the actual LLM call so it's easy to unit test / log.
   */
  buildPrompt(context) {
    const {
      resumeSummary = "",
      resumeSignals = {},
      transcript = [],
      difficulty = "medium",
      isContinuing = false,
    } = context;

    const recentTurns = transcript
      .slice(-8)
      .map((t) => `${t.speaker}: ${t.text}`)
      .join("\n");

    const lastCandidateTurn = [...transcript].reverse().find((t) => t.speaker === "candidate");
    const lastAnswer = lastCandidateTurn?.text || "";
    const technologies = resumeSignals.technologies?.join(", ") || "none extracted";
    const projects = resumeSignals.projectSignals?.join(" | ") || "none extracted";

    const continuityInstruction = isContinuing
      ? `You are CONTINUING your line of questioning from your previous turn — dig deeper into what they just said, don't start a new topic.`
      : `You are NEWLY taking over the conversation from a different interviewer. Briefly acknowledge the topic that was just discussed before pivoting to your own area of focus, so the transition feels natural rather than abrupt.`;

    return [
      this.systemPrompt,
      `Candidate resume summary: ${resumeSummary || "N/A"}`,
      `Resume technologies detected: ${technologies}`,
      `Resume project evidence: ${projects}`,
      `Current difficulty level: ${difficulty}`,
      `Recent conversation:\n${recentTurns || "(interview just started)"}`,
      `The candidate's MOST RECENT answer, word for word, was: "${lastAnswer}"`,
      continuityInstruction,
      `As the ${this.role}, respond specifically to what they just said — reference a detail from their actual answer — then ask ONE focused follow-up question or make ONE evaluative remark. When relevant, connect the question to one detected resume technology or project, but never claim the candidate did something the resume does not support. Keep it natural and conversational, as if speaking aloud. Do not ignore their answer or ask something generic and disconnected from it.`,
    ].join("\n\n");
  }

  /**
   * Ask the LLM service for this persona's next line.
   * llmService is injected so personas stay provider-agnostic.
   */
  async respond(context, llmService) {
    const prompt = this.buildPrompt(context);
    const text = await llmService.generate({
      systemPrompt: this.systemPrompt,
      prompt,
    });
    return {
      personaId: this.id,
      personaName: this.name,
      role: this.role,
      text: text.trim(),
    };
  }
}
