// import { useCallback, useEffect, useRef, useState } from "react";
// import AgoraRTC from "agora-rtc-sdk-ng";
// import AgoraRTM from "agora-rtm";
// import { AgoraVoiceAI, AgoraVoiceAIEvents, TranscriptHelperMode } from "agora-agent-client-toolkit";

// export function useAgoraClient() {
//   const [joined, setJoined] = useState(false);
//   const [isMuted, setIsMuted] = useState(false);
//   const [audioVolume, setAudioVolume] = useState(0);
//   const [remoteSpeaking, setRemoteSpeaking] = useState(false);
//   const [remoteUsers, setRemoteUsers] = useState([]);

//   // Real transcript + agent activity state, delivered over Signaling (RTM)
//   // by Agora's managed Conversational AI agent.
//   const [transcript, setTranscript] = useState([]);
//   const [agentSpeaking, setAgentSpeaking] = useState(false);
//   const [agentThinking, setAgentThinking] = useState(false);
//   const [dataMessages, setDataMessages] = useState([]);

//   const clientRef = useRef(null);
//   const micRef = useRef(null);
//   const joiningRef = useRef(null);
//   const mountedRef = useRef(false);
//   const rtmClientRef = useRef(null);
//   const voiceAIRef = useRef(null);
//   const dataStreamIdRef = useRef(null);

//   if (!clientRef.current) {
//     AgoraRTC.setParameter("ENABLE_AUDIO_PTS_METADATA", true);
//     clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
//   }

//   useEffect(() => {
//     mountedRef.current = true;
//     const client = clientRef.current;

//     const onVolume = (volumes = []) => {
//       const local = volumes.find((item) => item.uid === client.uid);
//       const remote = volumes.find(
//         (item) => item.uid !== client.uid && (item.level || 0) > 5
//       );
//       if (mountedRef.current) {
//         setAudioVolume(local?.level || 0);
//         setRemoteSpeaking(Boolean(remote));
//       }
//     };

//     const onPublished = async (user, mediaType) => {
//       try {
//         await client.subscribe(user, mediaType);
//         if (mediaType === "audio" && user.audioTrack) {
//           user.audioTrack.play();
//           console.log("[AgoraRTC] Playing remote audio from UID:", user.uid);
//         }
//         if (mountedRef.current) {
//           setRemoteUsers((old) => [
//             ...old.filter((item) => item.uid !== user.uid),
//             user,
//           ]);
//         }
//       } catch (error) {
//         console.error("[AgoraRTC] Subscribe failed:", error);
//       }
//     };

//     const onUnpublished = (user) => {
//       if (mountedRef.current) {
//         setRemoteUsers((old) => old.filter((item) => item.uid !== user.uid));
//       }
//     };

//     const onLeft = (user) => {
//       if (mountedRef.current) {
//         setRemoteUsers((old) => old.filter((item) => item.uid !== user.uid));
//       }
//     };

//     const onJoined = (user) => {
//       console.log("[AgoraRTC] Remote user joined:", user.uid);
//     };

//     const onConnection = (current, previous, reason) => {
//       console.log("[AgoraRTC] Connection state:", {
//         current,
//         previous,
//         reason,
//       });
//     };

//     const onStreamMessage = (uid, stream) => {
//       try {
//         const text = typeof stream === "string"
//           ? stream
//           : new TextDecoder().decode(stream);
//         const message = JSON.parse(text);
//         if (mountedRef.current) {
//           setDataMessages((current) => [
//             ...current.slice(-199),
//             { ...message, uid, receivedAt: Date.now() },
//           ]);
//         }
//       } catch (error) {
//         console.warn("[AgoraRTC] Ignoring invalid data-stream message:", error);
//       }
//     };

//     client.enableAudioVolumeIndicator();
//     client.on("volume-indicator", onVolume);
//     client.on("user-published", onPublished);
//     client.on("user-unpublished", onUnpublished);
//     client.on("user-left", onLeft);
//     client.on("user-joined", onJoined);
//     client.on("connection-state-change", onConnection);
//     client.on("stream-message", onStreamMessage);

//     return () => {
//       mountedRef.current = false;
//       client.off("volume-indicator", onVolume);
//       client.off("user-published", onPublished);
//       client.off("user-unpublished", onUnpublished);
//       client.off("user-left", onLeft);
//       client.off("user-joined", onJoined);
//       client.off("connection-state-change", onConnection);
//       client.off("stream-message", onStreamMessage);
//     };
//   }, []);

//   const joinSession = useCallback(async (params) => {
//     const client = clientRef.current;
//     const { appId, channel, token, uid, rtmUid, rtmToken } = params || {};

//     if (!appId || !channel || !token || uid === undefined || uid === null) {
//       throw new Error("appId, channel, token, and uid are required");
//     }

//     if (client.connectionState === "CONNECTED") {
//       return { uid: client.uid, alreadyJoined: true };
//     }

//     if (joiningRef.current) return joiningRef.current;

//     joiningRef.current = (async () => {
//       try {
//         if (client.connectionState !== "DISCONNECTED") {
//           await client.leave().catch(() => {});
//         }

//         const assignedUid = await client.join(
//           String(appId),
//           String(channel),
//           String(token),
//           Number(uid)
//         );

//         const mic = await AgoraRTC.createMicrophoneAudioTrack({
//           AEC: true,
//           ANS: true,
//         });

//         micRef.current = mic;
//         await client.publish([mic]);

//         try {
//           if (typeof client.createDataStream === "function") {
//             dataStreamIdRef.current = await client.createDataStream({
//               reliable: true,
//               ordered: true,
//             });
//             console.log("[AgoraRTC] Data stream ready:", dataStreamIdRef.current);
//           }
//         } catch (dataError) {
//           console.warn("[AgoraRTC] Data stream unavailable; voice is unaffected:", dataError);
//         }

//         if (mountedRef.current) {
//           setJoined(true);
//           setIsMuted(false);
//         }

//         console.log("[AgoraRTC] Joined and published microphone:", {
//           assignedUid,
//           remoteUsers: client.remoteUsers.map((user) => user.uid),
//         });

//         // Log into RTM (Signaling) and subscribe for live transcripts.
//         // Voice already works without this — a transcript failure here
//         // must never take down the call.
//         if (rtmUid && rtmToken) {
//           try {
//             const rtm = new AgoraRTM.RTM(String(appId), String(rtmUid));
//             await rtm.login({ token: rtmToken });
//             rtmClientRef.current = rtm;

//             const voiceAI = await AgoraVoiceAI.init({
//               rtcEngine: client,
//               rtmEngine: rtm,
//               renderMode: TranscriptHelperMode.TEXT,
//               enableLog: true,
//             });
//             voiceAIRef.current = voiceAI;

//             voiceAI.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, (items) => {
//               if (!mountedRef.current) return;
//               setTranscript(
//                 (items || []).map((item) => ({
//                   id: `${item.uid}-${item.turn_id}`,
//                   speaker: item.uid,
//                   text: item.text,
//                   status: item.status,
//                   timestamp: item._time,
//                 }))
//               );
//             });

//             voiceAI.on(AgoraVoiceAIEvents.AGENT_SPEAKING_CHANGED, (agentUserId, speaking) => {
//               if (mountedRef.current) setAgentSpeaking(Boolean(speaking));
//             });

//             voiceAI.on(AgoraVoiceAIEvents.AGENT_THINKING_CHANGED, (agentUserId, thinking) => {
//               if (mountedRef.current) setAgentThinking(Boolean(thinking));
//             });

//             voiceAI.subscribeMessage(String(channel));
//             console.log("[AgoraVoiceAI] Subscribed for live transcripts");
//           } catch (rtmError) {
//             console.error("[AgoraVoiceAI] RTM/transcript setup failed:", rtmError);
//           }
//         } else {
//           console.warn("[AgoraVoiceAI] No rtmUid/rtmToken provided — transcripts disabled");
//         }

//         return { uid: assignedUid };
//       } catch (error) {
//         console.error("[AgoraRTC] Join/publish failed:", error);
//         throw error;
//       } finally {
//         joiningRef.current = null;
//       }
//     })();

//     return joiningRef.current;
//   }, []);

//   const toggleMic = useCallback(async () => {
//     if (!micRef.current) return;
//     const nextMuted = !isMuted;
//     await micRef.current.setMuted(nextMuted);
//     setIsMuted(nextMuted);
//   }, [isMuted]);

//   const leaveSession = useCallback(async () => {
//     const mic = micRef.current;
//     micRef.current = null;
//     if (mic) {
//       mic.stop();
//       mic.close();
//     }

//     if (voiceAIRef.current) {
//       try {
//         voiceAIRef.current.unsubscribe();
//         voiceAIRef.current.destroy();
//       } catch {
//         /* ignore cleanup errors */
//       }
//       voiceAIRef.current = null;
//     }

//     if (rtmClientRef.current) {
//       await rtmClientRef.current.logout().catch(() => {});
//       rtmClientRef.current = null;
//     }

//     const client = clientRef.current;
//     dataStreamIdRef.current = null;
//     if (client.connectionState !== "DISCONNECTED") {
//       await client.leave().catch((error) => {
//         console.warn("[AgoraRTC] Leave warning:", error);
//       });
//     }

//     joiningRef.current = null;
//     if (mountedRef.current) {
//       setJoined(false);
//       setRemoteUsers([]);
//       setRemoteSpeaking(false);
//       setAudioVolume(0);
//       setIsMuted(false);
//       setTranscript([]);
//       setAgentSpeaking(false);
//       setAgentThinking(false);
//       setDataMessages([]);
//     }
//   }, []);

//   const sendDataMessage = useCallback(async (message) => {
//     const client = clientRef.current;
//     const streamId = dataStreamIdRef.current;
//     if (!streamId || typeof client.sendStreamMessage !== "function") return false;

//     const payload = typeof message === "string" ? message : JSON.stringify(message);
//     try {
//       await client.sendStreamMessage(streamId, payload);
//       return true;
//     } catch (error) {
//       console.warn("[AgoraRTC] Data-stream send failed:", error);
//       return false;
//     }
//   }, []);

//   return {
//     joined,
//     isMuted,
//     audioVolume,
//     remoteSpeaking,
//     remoteUsers,
//     transcript,
//     agentSpeaking,
//     agentThinking,
//     dataMessages,
//     sendDataMessage,
//     joinSession,
//     toggleMic,
//     leaveSession,
//   };
// }

// export default useAgoraClient;



import { useCallback, useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import AgoraRTM from "agora-rtm";
import { AgoraVoiceAI, AgoraVoiceAIEvents, TranscriptHelperMode } from "agora-agent-client-toolkit";

export function useAgoraClient() {
  const [joined, setJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const [remoteSpeaking, setRemoteSpeaking] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  // Real transcript + agent activity state, delivered over Signaling (RTM)
  // by Agora's managed Conversational AI agent.
  const [transcript, setTranscript] = useState([]);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [agentThinking, setAgentThinking] = useState(false);
  const [dataMessages, setDataMessages] = useState([]);

  const clientRef = useRef(null);
  const micRef = useRef(null);
  const joiningRef = useRef(null);
  const mountedRef = useRef(false);
  const rtmClientRef = useRef(null);
  const voiceAIRef = useRef(null);
  const dataStreamIdRef = useRef(null);

  if (!clientRef.current) {
    AgoraRTC.setParameter("ENABLE_AUDIO_PTS_METADATA", true);
    clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  }

  useEffect(() => {
    mountedRef.current = true;
    const client = clientRef.current;

    const onVolume = (volumes = []) => {
      const local = volumes.find((item) => item.uid === client.uid);
      const remote = volumes.find(
        (item) => item.uid !== client.uid && (item.level || 0) > 5
      );
      if (mountedRef.current) {
        setAudioVolume(local?.level || 0);
        setRemoteSpeaking(Boolean(remote));
      }
    };

    const onPublished = async (user, mediaType) => {
      try {
        await client.subscribe(user, mediaType);
        if (mediaType === "audio" && user.audioTrack) {
          user.audioTrack.play();
          console.log("[AgoraRTC] Playing remote audio from UID:", user.uid);
        }
        if (mountedRef.current) {
          setRemoteUsers((old) => [
            ...old.filter((item) => item.uid !== user.uid),
            user,
          ]);
        }
      } catch (error) {
        console.error("[AgoraRTC] Subscribe failed:", error);
      }
    };

    const onUnpublished = (user) => {
      if (mountedRef.current) {
        setRemoteUsers((old) => old.filter((item) => item.uid !== user.uid));
      }
    };

    const onLeft = (user) => {
      if (mountedRef.current) {
        setRemoteUsers((old) => old.filter((item) => item.uid !== user.uid));
      }
    };

    const onJoined = (user) => {
      console.log("[AgoraRTC] Remote user joined:", user.uid);
    };

    const onConnection = (current, previous, reason) => {
      if (mountedRef.current) {
        setConnectionStatus(current === "CONNECTED" ? "connected" : current.toLowerCase());
      }
      console.log("[AgoraRTC] Connection state:", {
        current,
        previous,
        reason,
      });
    };

    const onStreamMessage = (uid, stream) => {
      try {
        const text = typeof stream === "string"
          ? stream
          : new TextDecoder().decode(stream);
        const message = JSON.parse(text);
        if (mountedRef.current) {
          setDataMessages((current) => [
            ...current.slice(-199),
            { ...message, uid, receivedAt: Date.now() },
          ]);
        }
      } catch (error) {
        console.warn("[AgoraRTC] Ignoring invalid data-stream message:", error);
      }
    };

    client.enableAudioVolumeIndicator();
    client.on("volume-indicator", onVolume);
    client.on("user-published", onPublished);
    client.on("user-unpublished", onUnpublished);
    client.on("user-left", onLeft);
    client.on("user-joined", onJoined);
    client.on("connection-state-change", onConnection);
    client.on("stream-message", onStreamMessage);

    return () => {
      mountedRef.current = false;
      client.off("volume-indicator", onVolume);
      client.off("user-published", onPublished);
      client.off("user-unpublished", onUnpublished);
      client.off("user-left", onLeft);
      client.off("user-joined", onJoined);
      client.off("connection-state-change", onConnection);
      client.off("stream-message", onStreamMessage);
    };
  }, []);

  const joinSession = useCallback(async (params) => {
    const client = clientRef.current;
    const { appId, channel, token, uid, rtmUid, rtmToken } = params || {};

    if (!appId || !channel || !token || uid === undefined || uid === null) {
      throw new Error("appId, channel, token, and uid are required");
    }

    if (client.connectionState === "CONNECTED") {
      return { uid: client.uid, alreadyJoined: true };
    }

    if (joiningRef.current) return joiningRef.current;

    joiningRef.current = (async () => {
      try {
        if (client.connectionState !== "DISCONNECTED") {
          await client.leave().catch(() => {});
        }

        const assignedUid = await client.join(
          String(appId),
          String(channel),
          String(token),
          Number(uid)
        );

        const mic = await AgoraRTC.createMicrophoneAudioTrack({
          AEC: true,
          ANS: true,
        });

        micRef.current = mic;
        await client.publish([mic]);

        try {
          if (typeof client.createDataStream === "function") {
            dataStreamIdRef.current = await client.createDataStream({
              reliable: true,
              ordered: true,
            });
            console.log("[AgoraRTC] Data stream ready:", dataStreamIdRef.current);
          }
        } catch (dataError) {
          console.warn("[AgoraRTC] Data stream unavailable; voice is unaffected:", dataError);
        }

        if (mountedRef.current) {
          setJoined(true);
          setIsMuted(false);
          setConnectionStatus("connected");
        }

        console.log("[AgoraRTC] Joined and published microphone:", {
          assignedUid,
          remoteUsers: client.remoteUsers.map((user) => user.uid),
        });

        // Log into RTM (Signaling) and subscribe for live transcripts.
        // Voice already works without this — a transcript failure here
        // must never take down the call.
        if (rtmUid && rtmToken) {
          try {
            const rtm = new AgoraRTM.RTM(String(appId), String(rtmUid));
            await rtm.login({ token: rtmToken });
            rtmClientRef.current = rtm;

            const voiceAI = await AgoraVoiceAI.init({
              rtcEngine: client,
              rtmEngine: rtm,
              renderMode: TranscriptHelperMode.TEXT,
              enableLog: true,
            });
            voiceAIRef.current = voiceAI;

            voiceAI.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, (items) => {
              if (!mountedRef.current) return;
              setTranscript(
                (items || []).map((item) => ({
                  id: `${item.uid}-${item.turn_id}`,
                  speaker: item.uid,
                  text: item.text,
                  status: item.status,
                  timestamp: item._time,
                }))
              );
            });

            voiceAI.on(AgoraVoiceAIEvents.AGENT_SPEAKING_CHANGED, (agentUserId, speaking) => {
              if (mountedRef.current) setAgentSpeaking(Boolean(speaking));
            });

            voiceAI.on(AgoraVoiceAIEvents.AGENT_THINKING_CHANGED, (agentUserId, thinking) => {
              if (mountedRef.current) setAgentThinking(Boolean(thinking));
            });

            voiceAI.subscribeMessage(String(channel));
            console.log("[AgoraVoiceAI] Subscribed for live transcripts");
          } catch (rtmError) {
            console.error("[AgoraVoiceAI] RTM/transcript setup failed:", rtmError);
          }
        } else {
          console.warn("[AgoraVoiceAI] No rtmUid/rtmToken provided — transcripts disabled");
        }

        return { uid: assignedUid };
      } catch (error) {
        console.error("[AgoraRTC] Join/publish failed:", error);
        throw error;
      } finally {
        joiningRef.current = null;
      }
    })();

    return joiningRef.current;
  }, []);

  const toggleMic = useCallback(async () => {
    if (!micRef.current) return;
    const nextMuted = !isMuted;
    await micRef.current.setMuted(nextMuted);
    setIsMuted(nextMuted);
  }, [isMuted]);

  const leaveSession = useCallback(async ({ preserveState = false } = {}) => {
    const mic = micRef.current;
    micRef.current = null;
    if (mic) {
      mic.stop();
      mic.close();
    }

    if (voiceAIRef.current) {
      try {
        voiceAIRef.current.unsubscribe();
        voiceAIRef.current.destroy();
      } catch {
        /* ignore cleanup errors */
      }
      voiceAIRef.current = null;
    }

    if (rtmClientRef.current) {
      await rtmClientRef.current.logout().catch(() => {});
      rtmClientRef.current = null;
    }

    const client = clientRef.current;
    dataStreamIdRef.current = null;
    if (client.connectionState !== "DISCONNECTED") {
      await client.leave().catch((error) => {
        console.warn("[AgoraRTC] Leave warning:", error);
      });
    }

    joiningRef.current = null;
    if (mountedRef.current) {
      setJoined(false);
      setRemoteUsers([]);
      setRemoteSpeaking(false);
      setAudioVolume(0);
      setIsMuted(false);
      if (!preserveState) setTranscript([]);
      setAgentSpeaking(false);
      setAgentThinking(false);
      if (!preserveState) setDataMessages([]);
      setConnectionStatus("disconnected");
    }
  }, []);

  const reconnectSession = useCallback(async (params) => {
    await leaveSession({ preserveState: true });
    return joinSession(params);
  }, [joinSession, leaveSession]);

  const sendDataMessage = useCallback(async (message) => {
    const client = clientRef.current;
    const streamId = dataStreamIdRef.current;
    if (!streamId || typeof client.sendStreamMessage !== "function") return false;

    const payload = typeof message === "string" ? message : JSON.stringify(message);
    try {
      await client.sendStreamMessage(streamId, payload);
      return true;
    } catch (error) {
      console.warn("[AgoraRTC] Data-stream send failed:", error);
      return false;
    }
  }, []);

  return {
    joined,
    connectionStatus,
    isMuted,
    audioVolume,
    remoteSpeaking,
    remoteUsers,
    transcript,
    agentSpeaking,
    agentThinking,
    dataMessages,
    sendDataMessage,
    joinSession,
    reconnectSession,
    toggleMic,
    leaveSession,
  };
}

export default useAgoraClient;

