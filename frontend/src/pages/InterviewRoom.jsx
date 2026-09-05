



import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  Captions,
  Clock,
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  Video,
  VideoOff,
  Volume2,
  PenLine,
} from "lucide-react";
import { useAgoraClient } from "../hooks/useAgoraClient.js";
import { useAuth } from "../context/AuthContext.jsx";
import Whiteboard from "../components/Whiteboard.jsx";

const DEFAULT_PANEL_PERSONAS = [
  {
    id: "technical",
    name: "Technical Lead",
    initials: "TL",
    role: "Architecture & Systems",
    color: "from-blue-600 to-indigo-700",
  },
  {
    id: "hiring_manager",
    name: "Hiring Manager",
    initials: "HM",
    role: "Leadership & Strategy",
    color: "from-emerald-600 to-teal-700",
  },
  {
    id: "product",
    name: "Product Lead",
    initials: "PL",
    role: "Product Thinking & Roadmaps",
    color: "from-amber-600 to-orange-700",
  },
  {
    id: "behavioral",
    name: "Behavioural Lead",
    initials: "BL",
    role: "Culture & Team Fit",
    color: "from-purple-600 to-pink-700",
  },
  {
    id: "customer",
    name: "Customer Advocate",
    initials: "CA",
    role: "User Empathy & Impact",
    color: "from-cyan-600 to-blue-700",
  },
];

// Maps the [Persona: XX] tag the LLM prepends to each response (see
// agora.service.js's system_messages) to this app's real persona ids.
const PERSONA_TAG_TO_ID = {
  TL: "technical",
  HM: "hiring_manager",
  PL: "product",
  BL: "behavioral",
  CA: "customer",
};

function detectPersonaIdFromText(text) {
  const match = /\[Persona:\s*(TL|HM|PL|BL|CA)\]/i.exec(text || "");
  if (!match) return null;
  return PERSONA_TAG_TO_ID[match[1].toUpperCase()] || null;
}


export default function InterviewRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth() || {};
  const { authFetch } = auth;
  const user = auth.user || null;

  const {
    connectionStatus = "disconnected",
    isMuted = false,
    audioVolume = 0,
    remoteSpeaking = false,
    remoteUsers = [],
    transcript = [],
    agentSpeaking = false,
    dataMessages = [],
    sendDataMessage,
    joinSession,
    reconnectSession,
    toggleMic,
    leaveSession,
  } = useAgoraClient() || {};

  const [activeSpeakerId, setActiveSpeakerId] = useState(
  location.state?.panel?.activePersonaId || "technical"
  );
  const [camOn, setCamOn] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [assessmentFlags, setAssessmentFlags] = useState([]);
  const [orchestrationTranscript, setOrchestrationTranscript] = useState([]);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [socketAttempt, setSocketAttempt] = useState(0);


  const localVideoRef = useRef(null);
  const streamRef = useRef(null);
  const transcriptBottomRef = useRef(null);
  const joinStartedRef = useRef(false);
  const endingRef = useRef(false);
  const socketRef = useRef(null);
  const pendingSocketMessagesRef = useRef([]);
  const sentTranscriptIdsRef = useRef(new Set());
  const socketRetryRef = useRef(null);

  const rtc = location.state?.rtc;
  const rtcAppId = rtc?.appId;
  const rtcChannel = rtc?.channel || rtc?.channelName;
  const rtcToken = rtc?.token;
  const rtcUid = rtc?.uid;
  const rtcRtmUid = rtc?.rtmUid;
  const rtcRtmToken = rtc?.rtmToken;

  const sendSocketMessage = (message) => {
    const serialized = JSON.stringify(message);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(serialized);
    } else {
      pendingSocketMessagesRef.current.push(serialized);
    }
  };

  useEffect(() => {
    const configuredUrl = import.meta.env.VITE_WS_URL;
    const fallbackUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:5000/ws/session`;
    const socket = new WebSocket(configuredUrl || fallbackUrl);
    socketRef.current = socket;
    setSocketStatus("connecting");

    socket.onopen = () => {
      setSocketStatus("connected");
      sendSocketMessage({ type: "join", sessionId });
      for (const queued of pendingSocketMessagesRef.current.splice(0)) {
        socket.send(queued);
      }
    };

    socket.onmessage = (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }

      if (message.type === "persona_response") {
        if (message.personaId) setActiveSpeakerId(message.personaId);
        setOrchestrationTranscript((current) => [
          ...current,
          {
            id: `orchestrator-${message.timestamp || Date.now()}`,
            speaker: message.personaId,
            speakerName: message.personaName || "AI Panel",
            role: message.role,
            text: message.text,
            timestamp: message.timestamp || new Date().toISOString(),
          },
        ]);
      }

      if (message.type === "candidate_utterance") {
        setOrchestrationTranscript((current) => [
          ...current,
          {
            id: `candidate-${message.timestamp || Date.now()}`,
            speaker: message.speaker ?? rtcUid,
            speakerName: user?.name || "You",
            role: "Candidate",
            source: "candidate_utterance",
            text: message.text,
            timestamp: message.timestamp || new Date().toISOString(),
          },
        ]);
      }

      if (message.type === "assessment_flag") {
        setAssessmentFlags((current) => [
          ...current,
          { flagType: message.flagType, note: message.note },
        ]);
      }
    };

    socket.onerror = () => setSocketStatus("error");
    socket.onclose = () => {
      setSocketStatus("closed");
      if (socketRetryRef.current) window.clearTimeout(socketRetryRef.current);
      socketRetryRef.current = window.setTimeout(() => {
        if (socketRef.current === socket && socket.readyState === WebSocket.CLOSED) {
          setSocketStatus("reconnecting");
          setSocketAttempt((attempt) => attempt + 1);
        }
      }, 5000);
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
      if (socketRef.current === socket) socketRef.current = null;
      if (socketRetryRef.current) window.clearTimeout(socketRetryRef.current);
    };
  }, [sessionId, socketAttempt]);

  const reconnectInterview = async () => {
    if (reconnecting) return;
    setReconnecting(true);
    try {
      if (typeof reconnectSession === "function") {
        await reconnectSession({
          appId: String(rtcAppId),
          channel: String(rtcChannel),
          token: String(rtcToken),
          uid: rtcUid,
          rtmUid: rtcRtmUid,
          rtmToken: rtcRtmToken,
        });
      }
      if (socketRef.current) socketRef.current.close();
      setSocketStatus("reconnecting");
      setSocketAttempt((attempt) => attempt + 1);
      setReconnecting(false);
    } catch (error) {
      console.error("[InterviewRoom] Reconnect failed:", error);
      setSocketStatus("error");
      setReconnecting(false);
    }
  };

  // Forward finalized candidate speech to the backend orchestrator. Agora's
  // VoiceAI transcript remains the source of truth for the visible captions.
  useEffect(() => {
    const latest = transcript[transcript.length - 1];
    if (
      !latest ||
      !["final", "completed"].includes(String(latest.status).toLowerCase()) ||
      String(latest.speaker) !== String(rtcUid)
    ) return;
    if (sentTranscriptIdsRef.current.has(latest.id)) return;
    sentTranscriptIdsRef.current.add(latest.id);
    sendSocketMessage({
      type: "candidate_final_transcript",
      sessionId,
      text: latest.text,
    });
  }, [transcript, rtcUid, sessionId]);

  // Join Agora exactly once for this room.
  // Do not call leaveSession from this effect's cleanup. In React 18
  // development mode, effect cleanup can run while client.join() is pending.
  useEffect(() => {
    if (typeof joinSession !== "function") {
      console.error("[InterviewRoom] joinSession is unavailable");
      return undefined;
    }

    if (
      !rtcAppId ||
      !rtcChannel ||
      !rtcToken ||
      rtcUid === undefined ||
      rtcUid === null
    ) {
      console.warn("[InterviewRoom] RTC credentials are incomplete", {
        hasAppId: Boolean(rtcAppId),
        hasChannel: Boolean(rtcChannel),
        hasToken: Boolean(rtcToken),
        uid: rtcUid,
      });
      return undefined;
    }

    if (joinStartedRef.current) {
      return undefined;
    }

    joinStartedRef.current = true;
    let active = true;

    const connectToAgora = async () => {
      try {
        console.log("[InterviewRoom] Starting Agora join", {
          appId: rtcAppId,
          channel: rtcChannel,
          uid: rtcUid,
          tokenAvailable: Boolean(rtcToken),
        });

        await joinSession({
          appId: String(rtcAppId),
          channel: String(rtcChannel),
          token: String(rtcToken),
          uid: rtcUid,
          rtmUid: rtcRtmUid,
          rtmToken: rtcRtmToken,
        });

        if (active) {
          console.log("[InterviewRoom] Agora joined successfully");
        }
      } catch (error) {
        joinStartedRef.current = false;
        if (active) {
          console.error("[InterviewRoom] Agora join error:", error);
        }
      }
    };

    connectToAgora();

    return () => {
      active = false;
      // Intentionally no leaveSession() here; it can cancel an active join.
    };
  }, [rtcAppId, rtcChannel, rtcToken, rtcUid, rtcRtmUid, rtcRtmToken, joinSession]);

  // Start the webcam without opening a second microphone stream.
  useEffect(() => {
    let active = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.warn(
          "[InterviewRoom] Webcam initialization notice:",
          error?.message || error
        );
        setCamOn(false);
      }
    };

    startCamera();
    const timer = window.setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);

    return () => {
      active = false;
      window.clearInterval(timer);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Auto-switch the highlighted persona card based on the [Persona: XX]
  // tag in the most recent transcript line, instead of relying only on
  // manual clicks.
  useEffect(() => {
    if (!transcript.length) return;
    const last = transcript[transcript.length - 1];
    const detectedId = detectPersonaIdFromText(last?.text);
    if (detectedId) {
      setActiveSpeakerId(detectedId);
    }
  }, [transcript]);

  const formatTimer = (value) => {
    const mins = String(Math.floor(value / 60)).padStart(2, "0");
    const secs = String(value % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleEndInterview = async () => {
  if (endingRef.current) return;
  endingRef.current = true;
  let finalTranscript = transcript;
  let finalReport = null;

  try {
    console.log("[InterviewRoom] Ending interview");

    if (typeof authFetch === "function") {
      const response = await authFetch("/api/interview/end", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          agentId: location.state?.agentId,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.warn(
          "[InterviewRoom] Backend end warning:",
          data.message || data.error || response.status
        );
      } else {
        const data = await response.json().catch(() => ({}));
        finalReport = data.report || null;
        if (Array.isArray(data.report?.transcript) && data.report.transcript.length) {
          finalTranscript = data.report.transcript.map((turn, index) => ({
            id: `report-${index}`,
            speakerName: turn.speaker === "candidate" ? (user?.name || "You") : turn.speaker,
            role: turn.speaker === "candidate" ? "Candidate" : "AI Panel",
            text: turn.text,
            timestamp: turn.timestamp,
          }));
        }
      }
    }
  } catch (error) {
    // Do not block the candidate from leaving the Agora room.
    console.warn("[InterviewRoom] Backend end warning:", error);
  } finally {
    try {
      if (typeof leaveSession === "function") {
        await leaveSession();
      }
    } catch (error) {
      console.warn("[InterviewRoom] Agora leave warning:", error);
    }

    navigate(`/report/${sessionId}`, {
      state: {
        transcript: finalTranscript,
        report: finalReport,
        role: location.state?.role,
        level: location.state?.level,
      },
    });
  }
};

    
  const toggleCam = () => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  };

  const panelPersonas = Array.isArray(location.state?.panel?.personas)
  ? location.state.panel.personas.map((persona) => ({
      id: persona.id,
      name: persona.name,
      initials: persona.shortName || persona.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2),
      role: persona.role,
      color:
        DEFAULT_PANEL_PERSONAS.find((item) => item.id === persona.id)?.color ||
        "from-slate-600 to-slate-800",
    }))
  : DEFAULT_PANEL_PERSONAS;

const activeSpeaker =
  panelPersonas.find((persona) => persona.id === activeSpeakerId) ||
  panelPersonas[0];

  const hasRemoteUsers = Array.isArray(remoteUsers) && remoteUsers.length > 0;
  const safeTranscript = [...transcript, ...orchestrationTranscript].filter((item, index, items) => {
    const key = item.id || `${item.speaker}-${item.timestamp}-${item.text}`;
    return items.findIndex((candidate) => (candidate.id || `${candidate.speaker}-${candidate.timestamp}-${candidate.text}`) === key) === index;
  });
  const latestMessage =
    safeTranscript.length > 0
      ? safeTranscript[safeTranscript.length - 1]?.text || ""
      : "";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0f172a] font-sans text-slate-100 select-none">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400">
            <Radio size={13} className="animate-pulse" /> Live Panel
          </span>
          <span className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300">
            Speaking: <strong className="text-blue-400">{activeSpeaker.name}</strong>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`rounded-lg border px-3 py-1 text-xs ${
              socketStatus === "connected" && connectionStatus === "connected"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300"
            }`}>
              Live: {socketStatus} / Agora {connectionStatus}
            </span>
            {(socketStatus !== "connected" || connectionStatus !== "connected") && (
              <button type="button" onClick={reconnectInterview} disabled={reconnecting} className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950 disabled:opacity-60">
                {reconnecting ? "Reconnecting..." : "Reconnect"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
            <AlertCircle size={13} />
            <span>AI Evaluation Session: Automated Turn-Taking Active</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 font-mono text-xs text-slate-300">
            <Clock size={13} className="text-slate-500" />
            <span>{formatTimer(seconds)}</span>
          </div>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden p-6 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-950/50 p-6 backdrop-blur-xl lg:col-span-8">
          <div className="relative my-auto min-h-0 flex-1">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="relative flex aspect-[4/3] flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
              <div className={`flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-tr ${activeSpeaker.color} text-3xl font-extrabold text-white shadow-2xl transition-all duration-300 ${agentSpeaking ? "ring-4 ring-emerald-400/50" : ""}`}>
                {activeSpeaker.initials}
              </div>
              <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                <Volume2 size={12} className={agentSpeaking || remoteSpeaking ? "animate-pulse" : ""} />
                {agentSpeaking || remoteSpeaking ? "Speaking" : hasRemoteUsers ? "Connected" : "Agent Ready"}
              </div>
              <div className="absolute bottom-3 left-3 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-1 text-xs font-semibold text-slate-200">
                {activeSpeaker.name} ({activeSpeaker.role})
              </div>
            </div>

            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover -scale-x-100"
              />
              {!camOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-xs text-slate-500">
                  <VideoOff size={24} className="mb-2" /> Camera is off
                </div>
              )}
              <div className="absolute bottom-3 left-3 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-1 text-xs font-semibold text-slate-200">
                You ({user?.name || "Candidate"})
              </div>
            </div>
          </div>
          {whiteboardOpen && (
            <Whiteboard
              sendDataMessage={sendDataMessage}
              dataMessages={dataMessages}
              onClose={() => setWhiteboardOpen(false)}
            />
          )}
          </div>

          {captionsOn && (
            <div className="mx-auto my-2 max-w-xl rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-center text-xs text-slate-300 shadow backdrop-blur">
              &quot;{latestMessage || "Listening for candidate response..."}&quot;
            </div>
          )}

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-6 items-center gap-1">
                {[6, 12, 18, 14, 8, 16, 20, 10, 14, 22, 16].map((height, index) => (
                  <span
                    key={index}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      !isMuted && audioVolume > 5 ? "bg-blue-400" : "bg-slate-700"
                    }`}
                    style={{
                      height: !isMuted
                        ? `${Math.max(4, (height * (audioVolume || 10)) / 30)}px`
                        : "4px",
                    }}
                  />
                ))}
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                {isMuted ? "Mic Muted" : "Agora SDRTN® Active"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={typeof toggleMic === "function" ? toggleMic : undefined}
                className={`rounded-xl border p-2.5 transition ${
                  isMuted
                    ? "border-red-500/30 bg-red-500/10 text-red-400"
                    : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <button
                type="button"
                onClick={toggleCam}
                className={`rounded-xl border p-2.5 transition ${
                  !camOn
                    ? "border-red-500/30 bg-red-500/10 text-red-400"
                    : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
                title={camOn ? "Turn Camera Off" : "Turn Camera On"}
              >
                {!camOn ? <VideoOff size={16} /> : <Video size={16} />}
              </button>

              <button
                type="button"
                onClick={() => setCaptionsOn((current) => !current)}
                className={`rounded-xl border p-2.5 transition ${
                  captionsOn
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                    : "border-slate-700 bg-slate-800 text-slate-500"
                }`}
                title={captionsOn ? "Hide Captions" : "Show Captions"}
              >
                <Captions size={16} />
              </button>

              <button
                type="button"
                onClick={() => setWhiteboardOpen((current) => !current)}
                className={`rounded-xl border p-2.5 transition ${
                  whiteboardOpen
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                    : "border-slate-700 bg-slate-800 text-slate-500"
                }`}
                title={whiteboardOpen ? "Close Whiteboard" : "Open System Design Whiteboard"}
              >
                <PenLine size={16} />
                <span className="hidden text-xs font-semibold sm:inline">Whiteboard</span>
              </button>

              <button
                type="button"
                onClick={handleEndInterview}
                disabled={endingRef.current}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PhoneOff size={15} /> End Interview
              </button>
            </div>
          </div>

        </div>

        <div className="flex flex-col gap-4 overflow-hidden lg:col-span-4">
          <div className="shrink-0 rounded-3xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between border-b border-slate-800/80 px-1 pb-2 text-xs font-bold uppercase text-slate-400">
              <span>Coordinated Panel (5)</span>
              <span>Status</span>
            </div>

            <div className="space-y-2">
              {panelPersonas.map((persona) => {
                const isCurrent = activeSpeakerId === persona.id;
                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => setActiveSpeakerId(persona.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-2.5 text-left transition ${
                      isCurrent
                        ? "border-blue-500/50 bg-blue-600/10 text-blue-400 shadow"
                        : "border-slate-800/80 bg-slate-950/40 text-slate-400 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${persona.color} text-[10px] font-bold text-white`}>
                        {persona.initials}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{persona.name}</p>
                        <p className="text-[10px] leading-none text-slate-500">{persona.role}</p>
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                        <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" /> Live
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-600">Idle</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/50 p-4 backdrop-blur-xl">
          <div className="mb-3 border-b border-slate-800/80 px-1 pb-2 text-xs font-bold uppercase text-slate-400">
              Live Transcript
            </div>

            {assessmentFlags.length > 0 && (
              <div className="mb-3 space-y-2">
                {assessmentFlags.slice(-3).map((flag, index) => (
                  <div key={`${flag.flagType}-${index}`} className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-[11px] text-amber-200">
                    <strong className="capitalize">{flag.flagType} answer:</strong> {flag.note}
                  </div>
                ))}
              </div>
            )}

            <div className="flex-1 space-y-3 overflow-y-auto pr-1 text-xs">
              {safeTranscript.length === 0 && (
                <p className="py-8 text-center text-slate-500">
                  The transcript will appear here as the interview progresses.
                </p>
              )}
              {safeTranscript.map((item) => {
                // item.speaker is a raw Agora UID (candidate's numeric
                // uid, or the agent's fixed uid 9999) — map it to a
                // readable name instead of showing the raw number.
                const numericSpeaker = /^\d+$/.test(String(item.speaker ?? item.uid ?? ""));
                const normalizedRole = String(item.role || item.type || "").toLowerCase();
                const normalizedSpeaker = String(item.speaker || item.uid || "").toLowerCase();
                const isCandidate = normalizedRole === "candidate"
                  || normalizedRole === "candidate_utterance"
                  || item.source === "candidate_utterance"
                  || ["candidate", "user", "local", "you", "human"].includes(normalizedSpeaker)
                  || String(item.speaker) === String(rtcUid)
                  || String(item.uid) === String(rtcUid)
                  || (numericSpeaker && !["9999", "99999"].includes(String(item.speaker ?? item.uid)));
                let speakerLabel;
                if (isCandidate) {
                  speakerLabel = user?.name || "You";
                } else {
                  const personaId = detectPersonaIdFromText(item.text);
                  const persona = personaId && panelPersonas.find((p) => p.id === personaId);
                  speakerLabel = persona?.name || "AI Panel";
                }

                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`font-semibold ${isCandidate ? "text-emerald-400" : "text-blue-400"}`}>
                        {speakerLabel}
                      </span>
                      {item.timestamp && (
                        <span className="font-mono text-slate-500">
                          {new Date(item.timestamp).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-3 leading-relaxed text-slate-200">
                      {item.text}
                    </div>
                  </div>
                );
              })}
              <div ref={transcriptBottomRef} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}


