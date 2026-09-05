




import {
  DEFAULT_PANEL_ID,
  INTERVIEW_PANELS,
} from "../config/interviewPanel.js";



import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import mammoth from "mammoth";
import { Interview } from "../models/Interview.js";
import { agoraService } from "../services/agora.service.js";
import { orchestratorService } from "../services/orchestrator/OrchestratorService.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
const MAX_RESUME_CHARS = 30_000;

function errorResponse(res, error, status = 500) {
  console.error("[Interview API]", error?.stack || error);
  return res.status(status).json({
    success: false,
    message: error?.message || String(error),
  });
}

function createCandidateUid(value) {
  const uid = Number(value || Math.floor(100000 + Math.random() * 899998));
  if (!Number.isInteger(uid) || uid <= 0 || uid === 9999) {
    throw new Error("candidateUid must be a positive integer other than 9999");
  }
  return uid;
}

async function extractResumeText(file) {
  if (!file?.path) {
    throw new Error("Resume file is required in the 'resume' field");
  }

  const extension = path.extname(file.originalname || "").toLowerCase();
  const buffer = await fs.readFile(file.path);
  let text;

  if (extension === ".pdf" || file.mimetype === "application/pdf") {
    const result = await pdfParse(buffer);
    text = result.text;
  } else if (extension === ".docx") {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else if (extension === ".txt") {
    text = buffer.toString("utf8");
  } else {
    throw new Error("Only PDF, DOCX, and TXT resumes are supported");
  }

  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) throw new Error("No readable text was found in the resume");
  return cleaned.slice(0, MAX_RESUME_CHARS);
}

async function removeUpload(file) {
  if (file?.path) await fs.unlink(file.path).catch(() => {});
}

export async function startInterview(req, res) {
  let interview;
  let orchestratorStarted = false;

  try {
    if (!req.file) {
      return errorResponse(res, new Error("Upload a resume using field 'resume'"), 400);
    }

    const body = req.body || {};
    const sessionId = String(body.sessionId || `session_${Date.now()}`);
    const role = String(body.role || "Candidate");
    const level = String(body.level || "Mid-Senior");
    const candidateUid = createCandidateUid(body.candidateUid);
    const channelName = String(
      body.channelName || `interview_${sessionId}_${Date.now()}`
    );
    const resumeText = await extractResumeText(req.file);
    
    interview = await Interview.create({
  userId: req.user?._id || req.user?.id,
  sessionId,
  status: "active",
  role,
  level,
  resumeText,
  resumeOriginalName: req.file.originalname,
  candidateUid,
  channelName,

  panel: {
    activePersonaId: DEFAULT_PANEL_ID,
    handoffCount: 0,
    completedPersonaIds: [],
  },
});


    const rtc = agoraService.createCandidateRtcCredentials(
      channelName,
      candidateUid
    );

    const agent = await agoraService.startAgoraAgent({
      channelName,
      candidateUid,
      name: `interview_agent_${sessionId}`,
    });

    await Interview.updateOne(
      { _id: interview._id },
      { $set: { agentId: agent.agentId, agentUid: agent.agentUid } }
    );

    orchestratorService.startSession({
      sessionId,
      resumeSummary: resumeText,
      candidateProfile: { role, level },
      agoraAgentId: agent.agentId,
    });
    orchestratorStarted = true;

      return res.status(201).json({
  success: true,
  sessionId,
  rtc,
  agentId: agent.agentId,
  agentUid: agent.agentUid,
  channelName,

  panel: {
    activePersonaId: DEFAULT_PANEL_ID,
    personas: INTERVIEW_PANELS,
  },
});

  
  } catch (error) {
    if (orchestratorStarted) {
      orchestratorService.endSession(String(interview?.sessionId || ""));
    }
    if (interview?._id) {
      await Interview.deleteOne({ _id: interview._id }).catch(() => {});
    }
    return errorResponse(res, error);
  } finally {
    await removeUpload(req.file);
  }
}

export async function getInterviewHistory(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    const filter = { status: "completed", ...(userId ? { userId } : {}) };
    const interviews = await Interview.find(filter)
      .select("sessionId role level status resumeOriginalName startTime endTime durationSeconds completionReason createdAt updatedAt finalDifficulty")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({ success: true, interviews, items: interviews });
  } catch (error) {
    return errorResponse(res, error);
  }
}

export async function deleteInterview(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    const sessionId = String(req.params.sessionId || "");
    if (!sessionId) return errorResponse(res, new Error("sessionId is required"), 400);

    const deleted = await Interview.findOneAndDelete({
      sessionId,
      ...(userId ? { userId } : {}),
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Interview session not found" });
    }

    return res.status(200).json({ success: true, sessionId });
  } catch (error) {
    return errorResponse(res, error);
  }
}

export async function getInterviewReport(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    const interview = await Interview.findOne({
      sessionId: String(req.params.sessionId),
      ...(userId ? { userId } : {}),
    })
      .select("sessionId role level status transcript flags finalDifficulty report startTime endTime durationSeconds completionReason createdAt updatedAt")
      .lean();

    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview report not found" });
    }

    return res.status(200).json({
      success: true,
      interview,
      report: interview.report || {
        sessionId: interview.sessionId,
        transcript: interview.transcript || [],
        flags: interview.flags || [],
        finalDifficulty: interview.finalDifficulty || "medium",
      },
    });
  } catch (error) {
    return errorResponse(res, error);
  }
}

export async function endInterview(req, res) {
  try {
    const { sessionId, agentId, completionReason = "normal" } = req.body || {};
    if (agentId) {
      try {
        await agoraService.stopAgent(agentId);
      } catch (agentError) {
        // The agent may have already stopped because of Agora idle timeout,
        // a browser disconnect, or a previous end request. That should not
        // prevent the interview report from being finalized.
        console.warn(
          "[Interview API] Agora agent cleanup notice:",
          agentError?.message || agentError
        );
      }
    }
    const interviewRecord = sessionId
      ? await Interview.findOne({ sessionId: String(sessionId) }).select("startTime createdAt")
      : null;
    const endTime = new Date();
    const startTime = interviewRecord?.startTime || interviewRecord?.createdAt || endTime;
    const durationSeconds = Math.max(0, Math.round((endTime.getTime() - new Date(startTime).getTime()) / 1000));
    const safeCompletionReason = ["normal", "interrupted", "unknown"].includes(completionReason)
      ? completionReason
      : "unknown";
    const rawReport = sessionId
      ? orchestratorService.endSession(String(sessionId))
      : null;
    const report = rawReport
      ? {
          ...rawReport,
          metadata: {
            startTime,
            endTime,
            durationSeconds,
            completionReason: safeCompletionReason,
          },
        }
      : null;
    if (sessionId) {
      await Interview.updateOne(
        { sessionId: String(sessionId) },
        {
          $set: {
            status: "completed",
            startTime,
            endTime,
            durationSeconds,
            completionReason: safeCompletionReason,
            ...(report
              ? {
                  transcript: report.transcript,
                  flags: report.flags,
                  finalDifficulty: report.finalDifficulty,
                  report,
                }
              : {}),
          },
        }
      );
    }
    return res.status(200).json({ success: true, report });
  } catch (error) {
    return errorResponse(res, error);
  }
}

export async function readyInterview(req, res) {
  try {
    const { sessionId, agentId } = req.body || {};
    if (!sessionId || !agentId) {
      return errorResponse(res, new Error("sessionId and agentId are required"), 400);
    }

    const interview = await Interview.findOne({ sessionId: String(sessionId) });
    if (!interview) {
      return errorResponse(res, new Error("Interview session not found"), 404);
    }

    await agoraService.thinkAgent(
      String(agentId),
      [
        `Resume evidence to use for targeted questions: ${String(interview.resumeText || "").slice(0, 280)}`,
        `Target role: ${interview.role || "Candidate"}. Candidate level: ${interview.level || "Mid-Senior"}.`,
        "Start now as the Technical Lead. Ask one short question about a specific resume project or technology. Do not invent facts or ask multiple questions.",
      ].join("\n\n")
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    return errorResponse(res, error);
  }
}

export async function speakInterviewAgent(req, res) {
  try {
    const { agentId, text } = req.body || {};
    if (!agentId || !text) {
      return errorResponse(res, new Error("agentId and text are required"), 400);
    }
    const result = await agoraService.speakAgent(agentId, text);
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return errorResponse(res, error);
  }
}

export const stopInterview = endInterview;

export default {
  startInterview,
  readyInterview,
  getInterviewHistory,
  getInterviewReport,
  endInterview,
  stopInterview,
  speakInterviewAgent,
};
