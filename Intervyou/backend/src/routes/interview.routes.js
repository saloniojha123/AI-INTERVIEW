

// import express from "express";
// import multer from "multer";
// import path from "node:path";
// import fs from "node:fs";
// import {
//   startInterview,
//   getInterviewHistory,
//   speakInterviewAgent,
//   endInterview,
// } from "../controllers/interview.controller.js";

// const router = express.Router();
// const uploadDirectory = path.resolve("uploads/resumes");
// fs.mkdirSync(uploadDirectory, { recursive: true });

// const upload = multer({
//   dest: uploadDirectory,
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (_req, file, callback) => {
//     const extension = path.extname(file.originalname || "").toLowerCase();
//     if (![".pdf", ".docx", ".txt"].includes(extension)) {
//       return callback(new Error("Only PDF, DOCX, and TXT resumes are supported"));
//     }
//     callback(null, true);
//   },
// });

// router.get("/history", getInterviewHistory);
// router.post("/start", upload.single("resume"), startInterview);
// router.post("/speak", speakInterviewAgent);
// router.post("/end", endInterview);

// export default router;

import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import {
  startInterview,
  getInterviewHistory,
  getInterviewReport,
  speakInterviewAgent,
  endInterview,
} from "../controllers/interview.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

const uploadDirectory = path.resolve("uploads/resumes");
fs.mkdirSync(uploadDirectory, { recursive: true });

const upload = multer({
  dest: uploadDirectory,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();

    if (![".pdf", ".docx", ".txt"].includes(extension)) {
      return callback(
        new Error("Only PDF, DOCX, and TXT resumes are supported")
      );
    }

    callback(null, true);
  },
});

router.get("/history", requireAuth, getInterviewHistory);
router.get("/:sessionId/report", requireAuth, getInterviewReport);

router.post(
  "/start",
  requireAuth,
  upload.single("resume"),
  startInterview
);

router.post("/speak", requireAuth, speakInterviewAgent);

router.post("/end", requireAuth, endInterview);

export default router;
