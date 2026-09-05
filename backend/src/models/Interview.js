


import mongoose from "mongoose";

const turnSchema = new mongoose.Schema(
  {
    speaker: { type: String, trim: true },
    personaId: { type: String, trim: true },
    text: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const flagSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["vague", "contradiction"] },
    note: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    sessionId: { type: String, required: true, unique: true, index: true, trim: true },
    status: { type: String, enum: ["active", "completed"], default: "active", index: true },
    startTime: { type: Date, default: Date.now, index: true },
    endTime: { type: Date },
    durationSeconds: { type: Number, min: 0 },
    completionReason: { type: String, enum: ["normal", "interrupted", "unknown"], default: "unknown" },
    role: { type: String, trim: true },
    level: { type: String, trim: true },
    resumeText: { type: String, default: "" },
    resumeOriginalName: { type: String, trim: true },
    candidateUid: { type: Number },
    agentId: { type: String, trim: true },
    agentUid: { type: Number, default: 9999 },
    channelName: { type: String, trim: true },
    panel: {
  activePersonaId: {
    type: String,
    default: "technical",
    trim: true,
  },
  handoffCount: {
    type: Number,
    default: 0,
  },
  lastHandoffAt: {
    type: Date,
  },
  completedPersonaIds: {
    type: [String],
    default: [],
  },
},
    transcript: { type: [turnSchema], default: [] },
    flags: { type: [flagSchema], default: [] },
    finalDifficulty: { type: String, trim: true },
    report: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const Interview = mongoose.model("Interview", interviewSchema);
