
// import { allPersonas, personaById } from "./personas/index.js";
// import { ContextStore } from "./contextStore.js";
// import { llmService } from "../llm.service.js";
// import { agoraService } from "../agora.service.js";
// import { assessmentService } from "../assessment.service.js";
// import { logger } from "../../utils/logger.js";

// class OrchestratorService {
//   constructor() {
//     this.sessions = new Map();
//   }

//   startSession({
//     sessionId,
//     resumeSummary = "",
//     candidateProfile = {},
//     agoraAgentId = null,
//   }) {
//     const contextStore = new ContextStore({
//       sessionId,
//       resumeSummary,
//       candidateProfile,
//     });

//     const personaOrder = allPersonas.map((p) => p.id);
//     const turnCounts = {};

//     for (const persona of allPersonas) {
//       turnCounts[persona.id] = 0;
//     }

//     this.sessions.set(sessionId, {
//       contextStore,
//       personaOrder,
//       currentPersonaId: null,
//       consecutiveTurns: 0,
//       turnCounts,
//       maxConsecutiveTurns: 3,
//       maxTotalTurns: 5,
//       agoraAgentId,
//     });

//     logger.info(`Session started: ${sessionId}`);

//     if (agoraAgentId) {
//       logger.info(`Agora agent attached to session: ${agoraAgentId}`);
//     }

//     return contextStore;
//   }

//   setAgoraAgent(sessionId, agoraAgentId) {
//     const session = this.getSession(sessionId);
//     if (!session) {
//       logger.warn(`Cannot attach Agora agent. Unknown session: ${sessionId}`);
//       return false;
//     }

//     session.agoraAgentId = agoraAgentId;
//     logger.info(`Agora agent ${agoraAgentId} attached to session ${sessionId}`);
//     return true;
//   }

//   endSession(sessionId) {
//     const session = this.sessions.get(sessionId);
//     if (!session) return null;

//     const report = session.contextStore.toReport();
//     this.sessions.delete(sessionId);
//     logger.info(`Session ended: ${sessionId}`);
//     return report;
//   }

//   getSession(sessionId) {
//     return this.sessions.get(sessionId);
//   }

//   isClarificationRequest(text) {
//     const normalized = text.toLowerCase().trim();
//     const clarificationPatterns = [
//       "i don't get it",
//       "i dont get it",
//       "i didn't get it",
//       "i didnt get it",
//       "don't understand",
//       "dont understand",
//       "didn't understand",
//       "didnt understand",
//       "not understand",
//       "can you repeat",
//       "please repeat",
//       "repeat the question",
//       "say that again",
//       "what do you mean",
//       "i need some time",
//       "give me some time",
//       "give me a moment",
//       "one moment",
//       "let me think",
//       "wait",
//       "hmm",
//       "hm",
//     ];

//     return clarificationPatterns.some((pattern) => normalized.includes(pattern));
//   }

//   detectTopic(text) {
//     const value = text.toLowerCase();

//     // Technical
//     if (
//       [
//         "frontend",
//         "front-end",
//         "javascript",
//         "typescript",
//         "react",
//         "html",
//         "css",
//         "next.js",
//         "nextjs",
//         "vite",
//         "component",
//         "state management",
//         "redux",
//         "api",
//         "debug",
//         "bug",
//         "code",
//         "coding",
//         "programming",
//         "algorithm",
//         "function",
//         "database",
//         "sql",
//         "mongodb",
//         "node",
//         "express",
//       ].some((keyword) => value.includes(keyword))
//     ) {
//       return "technical";
//     }

//     // System design / architecture / cloud
//     if (
//       [
//         "system design",
//         "architecture",
//         "architect",
//         "scalability",
//         "scale",
//         "distributed",
//         "microservice",
//         "microservices",
//         "load balancer",
//         "caching",
//         "aws",
//         "azure",
//         "gcp",
//         "cloud",
//         "docker",
//         "kubernetes",
//         "deployment",
//         "server",
//         "infrastructure",
//       ].some((keyword) => value.includes(keyword))
//     ) {
//       return "system-design";
//     }

//     // Product
//     if (
//       [
//         "product",
//         "roadmap",
//         "prioritiz",
//         "prioritis",
//         "user story",
//         "user stories",
//         "metrics",
//         "trade-off",
//         "tradeoff",
//         "mvp",
//         "feature",
//         "launch",
//       ].some((keyword) => value.includes(keyword))
//     ) {
//       return "product";
//     }

//     // Behavioral / communication
//     if (
//       [
//         "team",
//         "teammate",
//         "leadership",
//         "conflict",
//         "communication",
//         "deadline",
//         "failure",
//         "mistake",
//         "challenge",
//         "strength",
//         "weakness",
//         "feedback",
//         "collaborate",
//         "collaboration",
//         "pressure",
//       ].some((keyword) => value.includes(keyword))
//     ) {
//       return "behavioral";
//     }

//     // Customer
//     if (
//       [
//         "customer",
//         "client",
//         "complaint",
//         "support",
//         "stakeholder",
//         "role play",
//         "roleplay",
//       ].some((keyword) => value.includes(keyword))
//     ) {
//       return "customer";
//     }

//     // Hiring / career
//     if (
//       [
//         "salary",
//         "career",
//         "company",
//         "why should",
//         "why do you want",
//         "introduce yourself",
//         "about yourself",
//         "location",
//         "relocation",
//         "future",
//         "goal",
//         "motivation",
//       ].some((keyword) => value.includes(keyword))
//     ) {
//       return "hiring";
//     }

//     return "general";
//   }

//   getPersonaSpecialty(persona) {
//     const identity = `${persona.id} ${persona.name} ${persona.role}`
//       .toLowerCase()
//       .replace(/[-_]/g, " ");

//     if (identity.includes("alex") || identity.includes("technical")) return "technical";
//     if (identity.includes("jordan") || identity.includes("product")) return "product";
//     if (identity.includes("priya") || identity.includes("hiring manager")) return "hiring";
//     if (identity.includes("maria") || identity.includes("behavioural") || identity.includes("behavioral")) return "behavioral";
//     if (identity.includes("sam") || identity.includes("customer")) return "customer";

//     return "general";
//   }

//   findBestPersona(session, topic) {
//     const candidates = allPersonas.filter((persona) => {
//       const totalTurns = session.turnCounts[persona.id] || 0;
//       return totalTurns < session.maxTotalTurns;
//     });

//     if (candidates.length === 0) {
//       return allPersonas
//         .slice()
//         .sort((a, b) => (session.turnCounts[a.id] || 0) - (session.turnCounts[b.id] || 0))[0];
//     }

//     const scored = candidates.map((persona) => {
//       const specialty = this.getPersonaSpecialty(persona);
//       let score = 0;

//       if (specialty === topic) score += 100;
//       if (topic === "general" && specialty === "general") score += 50;

//       score += Math.max(0, 10 - (session.turnCounts[persona.id] || 0));
//       if (persona.id === session.currentPersonaId) score -= 5;

//       return { persona, score };
//     });

//     scored.sort((a, b) => b.score - a.score);
//     return scored[0].persona;
//   }

//   pickNextPersona(session, candidateText) {
//     const currentPersona = session.currentPersonaId
//       ? personaById[session.currentPersonaId]
//       : null;

//     if (!currentPersona) {
//       const firstPersona = allPersonas[0];
//       session.currentPersonaId = firstPersona.id;
//       session.consecutiveTurns = 0;
//       return firstPersona;
//     }

//     const askingForClarification = this.isClarificationRequest(candidateText);
//     if (
//       askingForClarification &&
//       session.consecutiveTurns < session.maxConsecutiveTurns &&
//       (session.turnCounts[currentPersona.id] || 0) < session.maxTotalTurns
//     ) {
//       return currentPersona;
//     }

//     if (session.consecutiveTurns >= session.maxConsecutiveTurns) {
//       const topic = this.detectTopic(candidateText);
//       const nextPersona = this.findBestPersona(session, topic);
//       logger.info(`Mandatory handoff: ${currentPersona.name} -> ${nextPersona.name}`);
//       return nextPersona;
//     }

//     const topic = this.detectTopic(candidateText);
//     const currentSpecialty = this.getPersonaSpecialty(currentPersona);

//     if (
//       currentSpecialty === topic &&
//       (session.turnCounts[currentPersona.id] || 0) < session.maxTotalTurns
//     ) {
//       return currentPersona;
//     }

//     return this.findBestPersona(session, topic);
//   }

//   async handleCandidateTurn(sessionId, candidateText, emitSocketEvent = null) {
//     const session = this.getSession(sessionId);
//     if (!session) {
//       throw new Error(`Unknown session: ${sessionId}`);
//     }

//     if (!candidateText?.trim()) {
//       throw new Error("Candidate transcript is empty");
//     }

//     const { contextStore } = session;

//     // 1. Store candidate turn
//     contextStore.addTurn({
//       speaker: "candidate",
//       text: candidateText,
//     });

//     // 2. Real-time assessment check (vagueness & contradiction)
//     try {
//       if (typeof assessmentService?.evaluateTurn === "function") {
//         const evaluation = await assessmentService.evaluateTurn({
//           candidateText,
//           resumeSummary: contextStore.resumeSummary,
//           recentTranscript: contextStore.transcript,
//         });

//         if (evaluation?.isVague || evaluation?.isContradictory) {
//           const flagType = evaluation.isContradictory ? "contradiction" : "vague";
//           contextStore.raiseFlag({
//             type: flagType,
//             turnIndex: contextStore.transcript.length - 1,
//             note: evaluation.note,
//           });

//           if (typeof emitSocketEvent === "function") {
//             emitSocketEvent("assessment_flag", {
//               flagType,
//               note: evaluation.note,
//             });
//           }
//         }
//       }
//     } catch (evalErr) {
//       logger.warn(`Turn evaluation notice: ${evalErr.message}`);
//     }

//     // 3. Pick persona
//     const persona = this.pickNextPersona(session, candidateText);
//     const previousPersonaId = session.currentPersonaId;
//     const isSamePersona = previousPersonaId === persona.id;

//     if (isSamePersona) {
//       session.consecutiveTurns += 1;
//     } else {
//       session.consecutiveTurns = 1;
//       logger.info(
//         `Interviewer handoff: ${
//           previousPersonaId ? personaById[previousPersonaId]?.name : "none"
//         } -> ${persona.name}`
//       );
//     }

//     session.turnCounts[persona.id] = (session.turnCounts[persona.id] || 0) + 1;
//     session.currentPersonaId = persona.id;
//     contextStore.currentPersonaId = persona.id;

//     // 4. Generate response from persona LLM
//     const context = {
//       ...contextStore.toContext(),
//       isContinuing: isSamePersona,
//     };

//     const { text } = await persona.respond(context, llmService);

//     contextStore.addTurn({
//       speaker: persona.name,
//       text,
//       personaId: persona.id,
//     });

//     logger.info(
//       `Persona ${persona.name}: consecutive=${session.consecutiveTurns}, total=${session.turnCounts[persona.id]}`
//     );

//     // 5. Send speech synthesis to Agora agent if attached
//     if (session.agoraAgentId && typeof agoraService.speak === "function") {
//       try {
//         await agoraService.speak({
//           agentId: session.agoraAgentId,
//           text,
//           personaId: persona.id,
//         });
//         logger.info(`Agora interviewer speech triggered for ${persona.name}`);
//       } catch (err) {
//         logger.error(`Agora interviewer speech failed: ${err.message || err}`);
//       }
//     }

//     return {
//       personaId: persona.id,
//       personaName: persona.name,
//       role: persona.role,
//       text,
//     };
//   }
// }

// export const orchestratorService = new OrchestratorService();
// export default orchestratorService;


import { allPersonas, personaById } from "./personas/index.js";
import { ContextStore } from "./contextStore.js";
import { llmService } from "../llm.service.js";
import { agoraService } from "../agora.service.js";
import { assessmentService } from "../assessment.service.js";
import { logger } from "../../utils/logger.js";

class OrchestratorService {
  constructor() {
    this.sessions = new Map();
  }

  startSession({
    sessionId,
    resumeSummary = "",
    candidateProfile = {},
    agoraAgentId = null,
  }) {
    const contextStore = new ContextStore({
      sessionId,
      resumeSummary,
      candidateProfile,
    });

    const personaOrder = allPersonas.map((p) => p.id);
    const turnCounts = {};

    for (const persona of allPersonas) {
      turnCounts[persona.id] = 0;
    }

    this.sessions.set(sessionId, {
      contextStore,
      personaOrder,
      currentPersonaId: null,
      consecutiveTurns: 0,
      turnCounts,
      maxConsecutiveTurns: 3,
      maxTotalTurns: 5,
      agoraAgentId,
    });

    logger.info(`Session started: ${sessionId}`);

    if (agoraAgentId) {
      logger.info(`Agora agent attached to session: ${agoraAgentId}`);
    }

    return contextStore;
  }

  setAgoraAgent(sessionId, agoraAgentId) {
    const session = this.getSession(sessionId);
    if (!session) {
      logger.warn(`Cannot attach Agora agent. Unknown session: ${sessionId}`);
      return false;
    }

    session.agoraAgentId = agoraAgentId;
    logger.info(`Agora agent ${agoraAgentId} attached to session ${sessionId}`);
    return true;
  }

  endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const rawReport = session.contextStore.toReport();
    const report = typeof assessmentService.buildFinalReport === "function"
      ? assessmentService.buildFinalReport(rawReport)
      : rawReport;
    this.sessions.delete(sessionId);
    logger.info(`Session ended: ${sessionId}`);
    return report;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  isClarificationRequest(text) {
    const normalized = text.toLowerCase().trim();
    const clarificationPatterns = [
      "i don't get it",
      "i dont get it",
      "i didn't get it",
      "i didnt get it",
      "don't understand",
      "dont understand",
      "didn't understand",
      "didnt understand",
      "not understand",
      "can you repeat",
      "please repeat",
      "repeat the question",
      "say that again",
      "what do you mean",
      "i need some time",
      "give me some time",
      "give me a moment",
      "one moment",
      "let me think",
      "wait",
      "hmm",
      "hm",
    ];

    return clarificationPatterns.some((pattern) => normalized.includes(pattern));
  }

  detectTopic(text) {
    const value = text.toLowerCase();

    // Technical
    if (
      [
        "frontend",
        "front-end",
        "javascript",
        "typescript",
        "react",
        "html",
        "css",
        "next.js",
        "nextjs",
        "vite",
        "component",
        "state management",
        "redux",
        "api",
        "debug",
        "bug",
        "code",
        "coding",
        "programming",
        "algorithm",
        "function",
        "database",
        "sql",
        "mongodb",
        "node",
        "express",
      ].some((keyword) => value.includes(keyword))
    ) {
      return "technical";
    }

    // System design / architecture / cloud
    if (
      [
        "system design",
        "architecture",
        "architect",
        "scalability",
        "scale",
        "distributed",
        "microservice",
        "microservices",
        "load balancer",
        "caching",
        "aws",
        "azure",
        "gcp",
        "cloud",
        "docker",
        "kubernetes",
        "deployment",
        "server",
        "infrastructure",
      ].some((keyword) => value.includes(keyword))
    ) {
      return "system-design";
    }

    // Product
    if (
      [
        "product",
        "roadmap",
        "prioritiz",
        "prioritis",
        "user story",
        "user stories",
        "metrics",
        "trade-off",
        "tradeoff",
        "mvp",
        "feature",
        "launch",
      ].some((keyword) => value.includes(keyword))
    ) {
      return "product";
    }

    // Behavioral / communication
    if (
      [
        "team",
        "teammate",
        "leadership",
        "conflict",
        "communication",
        "deadline",
        "failure",
        "mistake",
        "challenge",
        "strength",
        "weakness",
        "feedback",
        "collaborate",
        "collaboration",
        "pressure",
      ].some((keyword) => value.includes(keyword))
    ) {
      return "behavioral";
    }

    // Customer
    if (
      [
        "customer",
        "client",
        "complaint",
        "support",
        "stakeholder",
        "role play",
        "roleplay",
      ].some((keyword) => value.includes(keyword))
    ) {
      return "customer";
    }

    // Hiring / career
    if (
      [
        "salary",
        "career",
        "company",
        "why should",
        "why do you want",
        "introduce yourself",
        "about yourself",
        "location",
        "relocation",
        "future",
        "goal",
        "motivation",
      ].some((keyword) => value.includes(keyword))
    ) {
      return "hiring";
    }

    return "general";
  }

  getPersonaSpecialty(persona) {
    const identity = `${persona.id} ${persona.name} ${persona.role}`
      .toLowerCase()
      .replace(/[-_]/g, " ");

    if (identity.includes("alex") || identity.includes("technical")) return "technical";
    if (identity.includes("jordan") || identity.includes("product")) return "product";
    if (identity.includes("priya") || identity.includes("hiring manager")) return "hiring";
    if (identity.includes("maria") || identity.includes("behavioural") || identity.includes("behavioral")) return "behavioral";
    if (identity.includes("sam") || identity.includes("customer")) return "customer";

    return "general";
  }

  findBestPersona(session, topic) {
    const candidates = allPersonas.filter((persona) => {
      const totalTurns = session.turnCounts[persona.id] || 0;
      return totalTurns < session.maxTotalTurns;
    });

    if (candidates.length === 0) {
      return allPersonas
        .slice()
        .sort((a, b) => (session.turnCounts[a.id] || 0) - (session.turnCounts[b.id] || 0))[0];
    }

    const scored = candidates.map((persona) => {
      const specialty = this.getPersonaSpecialty(persona);
      let score = 0;

      if (specialty === topic) score += 100;
      if (topic === "general" && specialty === "general") score += 50;

      score += Math.max(0, 10 - (session.turnCounts[persona.id] || 0));
      if (persona.id === session.currentPersonaId) score -= 5;

      return { persona, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].persona;
  }

  pickNextPersona(session, candidateText) {
    const currentPersona = session.currentPersonaId
      ? personaById[session.currentPersonaId]
      : null;

    if (!currentPersona) {
      const firstPersona = allPersonas[0];
      session.currentPersonaId = firstPersona.id;
      session.consecutiveTurns = 0;
      return firstPersona;
    }

    const askingForClarification = this.isClarificationRequest(candidateText);
    if (
      askingForClarification &&
      session.consecutiveTurns < session.maxConsecutiveTurns &&
      (session.turnCounts[currentPersona.id] || 0) < session.maxTotalTurns
    ) {
      return currentPersona;
    }

    if (session.consecutiveTurns >= session.maxConsecutiveTurns) {
      const topic = this.detectTopic(candidateText);
      const nextPersona = this.findBestPersona(session, topic);
      logger.info(`Mandatory handoff: ${currentPersona.name} -> ${nextPersona.name}`);
      return nextPersona;
    }

    const topic = this.detectTopic(candidateText);
    const currentSpecialty = this.getPersonaSpecialty(currentPersona);

    if (
      currentSpecialty === topic &&
      (session.turnCounts[currentPersona.id] || 0) < session.maxTotalTurns
    ) {
      return currentPersona;
    }

    return this.findBestPersona(session, topic);
  }

  async handleCandidateTurn(sessionId, candidateText, emitSocketEvent = null) {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Unknown session: ${sessionId}`);
    }

    if (!candidateText?.trim()) {
      throw new Error("Candidate transcript is empty");
    }

    const { contextStore } = session;

    // 1. Store candidate turn
    contextStore.addTurn({
      speaker: "candidate",
      text: candidateText,
    });

    // 2. Real-time assessment check (vagueness & contradiction)
    try {
      if (typeof assessmentService?.evaluateTurn === "function") {
        const evaluation = await assessmentService.evaluateTurn({
          candidateText,
          resumeSummary: contextStore.resumeSummary,
          recentTranscript: contextStore.transcript,
        });

        if (evaluation?.isVague || evaluation?.isContradictory) {
          const flagType = evaluation.isContradictory ? "contradiction" : "vague";
          contextStore.raiseFlag({
            type: flagType,
            turnIndex: contextStore.transcript.length - 1,
            note: evaluation.note,
          });

          if (typeof emitSocketEvent === "function") {
            emitSocketEvent("assessment_flag", {
              flagType,
              note: evaluation.note,
            });
          }
        }
      }
    } catch (evalErr) {
      logger.warn(`Turn evaluation notice: ${evalErr.message}`);
    }

    // 3. Pick persona
    const persona = this.pickNextPersona(session, candidateText);
    const previousPersonaId = session.currentPersonaId;
    const isSamePersona = previousPersonaId === persona.id;

    if (isSamePersona) {
      session.consecutiveTurns += 1;
    } else {
      session.consecutiveTurns = 1;
      logger.info(
        `Interviewer handoff: ${
          previousPersonaId ? personaById[previousPersonaId]?.name : "none"
        } -> ${persona.name}`
      );
    }

    session.turnCounts[persona.id] = (session.turnCounts[persona.id] || 0) + 1;
    session.currentPersonaId = persona.id;
    contextStore.currentPersonaId = persona.id;

    // 4. Generate response from persona LLM
    const context = {
      ...contextStore.toContext(),
      isContinuing: isSamePersona,
    };

    const { text } = await persona.respond(context, llmService);

    contextStore.addTurn({
      speaker: persona.name,
      text,
      personaId: persona.id,
    });

    logger.info(
      `Persona ${persona.name}: consecutive=${session.consecutiveTurns}, total=${session.turnCounts[persona.id]}`
    );

    // 5. Send speech synthesis to Agora agent if attached
    if (session.agoraAgentId && typeof agoraService.speak === "function") {
      try {
        await agoraService.speak({
          agentId: session.agoraAgentId,
          text,
          personaId: persona.id,
        });
        logger.info(`Agora interviewer speech triggered for ${persona.name}`);
      } catch (err) {
        logger.error(`Agora interviewer speech failed: ${err.message || err}`);
      }
    }

    return {
      personaId: persona.id,
      personaName: persona.name,
      role: persona.role,
      text,
    };
  }
}

export const orchestratorService = new OrchestratorService();
export default orchestratorService;
