import { Router } from "express";

const router = Router();

// TODO: accept a resume file upload (multer), extract text, summarize via LLM,
// store the file in S3 (config.aws.s3Bucket), and save resumeSummary/resumeUrl on User.
router.post("/upload", (req, res) => {
  res.status(501).json({ error: "Not implemented yet" });
});

export default router;
