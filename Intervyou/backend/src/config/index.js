import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",

  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/intervyou",

  jwtSecret: process.env.JWT_SECRET || "dev_secret_change_me",

  agora: {
  appId: process.env.AGORA_APP_ID || "",
  appCertificate: process.env.AGORA_APP_CERTIFICATE || "",

  customerId: process.env.AGORA_CUSTOMER_ID || "",
  customerSecret: process.env.AGORA_CUSTOMER_SECRET || "",

  pipelineId: process.env.AGORA_PIPELINE_ID || "",

  agentName: process.env.AGORA_AGENT_NAME || "intervyou_panel",
  },

  llm: {
    provider: process.env.LLM_PROVIDER || "mock",
    apiKey: process.env.LLM_API_KEY || "",
    model: process.env.LLM_MODEL || "openai/gpt-oss-120b",
    baseUrl: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
  },

  aws: {
    region: process.env.AWS_REGION || "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    s3Bucket: process.env.AWS_S3_BUCKET || "intervyou-resumes",
  },
};
