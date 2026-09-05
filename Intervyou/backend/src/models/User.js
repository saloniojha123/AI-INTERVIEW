import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    resumeSummary: { type: String, default: "" },
    resumeUrl: { type: String, default: "" }, // S3 URL
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
