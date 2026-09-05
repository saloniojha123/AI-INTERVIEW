# Intervyou — EchoSphere 🎙️

**Adaptive Multi-Agent AI Voice Interview Platform**
Built for Agora Hackathon 2026 · Round II · Track: Coordinated AI Interview Panel

Powered by ◆ Knotic

---

## What is this?

Traditional mock interviews use fixed question banks and give generic, non-actionable feedback. They evaluate one dimension at a time and are limited by the availability of skilled human interviewers.

**Intervyou** fixes this with a **Coordinated AI Interview Panel** — a real-time, voice-based mock interview where multiple AI personas (Technical Interviewer, Hiring Manager, Product Manager, Behavioural Interviewer, Customer) jointly and adaptively assess a candidate, share context, and hand off turns to each other like a real panel would.

## Key Features

- 🎤 Real-time, **interruptible** voice interviews (not turn-based chat)
- 👥 Multiple interviewer personas with distinct roles & personalities
- 🧠 Shared candidate context (resume, profile, prior answers, live transcript) across all personas
- 🔄 Dynamic, adaptive follow-up questions based on what the candidate actually says
- 🎭 Scenario-based & role-play questions
- 📈 Difficulty adjustment based on live performance
- 🚩 Detection of vague or contradictory answers
- 📝 Evidence-based feedback linked directly to the transcript
- 📊 Structured final assessment report
- ⚠️ Persistent, explicit disclosure that the candidate is speaking with an AI

## Architecture

```
Candidate (Mic Input)
      │
      ▼
Agora RTC SDK / SDRTN®  ──────────────► Speaker Output (back to Candidate)
      │                                          ▲
      ▼                                          │
   ASR (Speech → Text)                    TTS (Text → Speech)
      │                                          ▲
      ▼                                          │
      └──────────► Multi-Agent Orchestrator ─────┘
                          │        │
                 ┌────────┘        └────────┐
                 ▼                          ▼
        Shared Context Store        Persona Panel
   (resume, profile, prior       (Technical · Hiring Mgr ·
    answers, live transcript)     Product · Behavioural ·
                                   Customer — role prompts
                                   + turn-taking logic)
                 │                          │
                 └────────────┬─────────────┘
                               ▼
                      Assessment Engine
            (flags vague/contradictory answers,
             builds transcript-linked structured report)
```

**Pipeline flow:** Mic → Agora RTC → ASR → Multi-Agent Orchestrator (LLM persona response) → TTS → Speaker, with the Agora Conversational AI Engine abstracting the end-to-end audio pipeline so the orchestrator can focus purely on persona logic and session state.

## Tech Stack

| Layer | Technologies | Capability Delivered |
|---|---|---|
| Voice & RTC | Agora Web SDK, Agora Conversational AI Engine | Sub-second audio streaming, interruption handling, ASR/TTS sync |
| Frontend | React, Tailwind CSS, Lucide Icons | Responsive UI, live waveform visualizer, active-speaker badges |
| Backend | Node.js, Express.js, WebSockets | Session handling, turn coordination, REST API gateway |
| Multi-Agent AI | Amazon Bedrock / GenAI APIs, LangChain | Role-specific persona prompt graphs, real-time response evaluation |
| Database & Cloud | MongoDB, AWS S3, Docker, AWS EC2 | User history, resume parsing, containerized deployment |

## Project Structure

```
Intervyou/
├── backend/                    # Node.js + Express + WebSocket API
│   ├── src/
│   │   ├── config/              # env-driven config
│   │   ├── routes/               # REST endpoints
│   │   ├── controllers/         # request handlers
│   │   ├── models/               # MongoDB schemas
│   │   ├── services/
│   │   │   ├── orchestrator/     # multi-agent orchestrator + personas
│   │   │   ├── agora.service.js  # Agora token & session mgmt
│   │   │   ├── llm.service.js    # LLM provider wrapper
│   │   │   └── assessment.service.js
│   │   ├── sockets/              # WebSocket session handling
│   │   └── utils/
│   └── Dockerfile
├── frontend/                   # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/                 # Home, InterviewRoom, Report
│   │   ├── components/           # PersonaPanel, Waveform, Transcript, Disclosure
│   │   └── hooks/                 # useAgoraClient
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)
- An [Agora](https://www.agora.io/) account with an App ID + App Certificate
- An LLM provider key (Amazon Bedrock credentials, or any OpenAI-compatible key — see `backend/.env.example`)

### 1. Clone & install

```bash
git clone <your-repo-url> Intervyou
cd Intervyou

# backend
cd backend && npm install

# frontend
cd ../frontend && npm install
```

### 2. Configure environment variables

Copy the example env files and fill in your keys:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

| Variable | Where | Description |
|---|---|---|
| `PORT` | backend | API server port (default `5000`) |
| `MONGO_URI` | backend | MongoDB connection string |
| `AGORA_APP_ID` | backend + frontend | Your Agora project App ID |
| `AGORA_APP_CERTIFICATE` | backend | Used to mint RTC tokens (server-side only) |
| `LLM_PROVIDER` | backend | `bedrock` or `openai-compatible` |
| `LLM_API_KEY` | backend | Provider API key |
| `JWT_SECRET` | backend | Auth token signing secret |
| `VITE_API_BASE_URL` | frontend | Backend API URL (default `http://localhost:5000`) |

### 3. Run in development

```bash
# terminal 1 — backend
cd backend && npm run dev

# terminal 2 — frontend
cd frontend && npm run dev
```

Frontend: http://localhost:5173
Backend health check: http://localhost:5000/api/health

### 4. Run with Docker (optional)

```bash
docker-compose up --build
```

## Roadmap / TODO

This scaffold ships with working boilerplate (server, sockets, routes, persona structure, UI shell) and **mocked LLM responses** so the app runs end-to-end without any API keys. Next steps to make it real:

- [ ] Wire `llm.service.js` to Amazon Bedrock / your chosen LLM provider
- [ ] Wire `agora.service.js` token generation to a real Agora project + integrate the Conversational AI Engine for ASR/TTS
- [ ] Implement resume parsing → shared context store
- [ ] Implement persona turn-taking logic in `OrchestratorService.js`
- [ ] Implement contradiction/vagueness detection in `assessment.service.js`
- [ ] Build out the structured final report UI (`Report.jsx`)
- [ ] Add auth (signup/login) and interview history

## Team

| Name | Role | Email |
|---|---|---|
| Saumya Tiwari | Frontend Developer | saumya10816@gmail.com |
| Saloni Kumari | Backend Developer | 2004ojhasaloni@gmail.com |

---

*Built with Agora RTC / SDRTN® and the Agora Conversational AI Engine.*
