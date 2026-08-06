import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic, MicOff, Volume2, Sparkles, Activity, ShieldCheck,
  PhoneOff, RotateCcw, Hand, ArrowLeft, LogOut, Clock
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const HEARTBEAT_INTERVAL_MS = 30000;

export default function LexisTutor({ session, profile, onProfileRefresh, onLogout, onBackToHome }) {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [transcripts, setTranscripts] = useState([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [isConnecting, setIsConnecting] = useState(false);
  const [billingNotice, setBillingNotice] = useState('');

  const accessToken = session?.access_token;

  // System References
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnects = 3;
  const transcriptEndRef = useRef(null);
  const visualizerCanvasRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);

  // Remote audio analysis
  const remoteAnalyserRef = useRef(null);
  const remoteAudioContextRef = useRef(null);
  const remoteLevelRef = useRef(0);

  // Barge-in tracking
  const currentAssistantItemIdRef = useRef(null);
  const isAssistantSpeakingRef = useRef(false);

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => endSession();
  }, []);

  // Keyboard shortcut: Space to toggle
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        isConnected ? endSession() : startSession();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isConnected]);

  const appendTranscript = useCallback((speaker, text) => {
    if (!text) return;
    setTranscripts((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.speaker === speaker && speaker === 'lexis' && !last.final) {
        return [...prev.slice(0, -1), { speaker, text: last.text + text, final: false }];
      }
      return [...prev, { speaker, text, final: speaker === 'user' }];
    });
  }, []);

  const finalizeTranscript = useCallback((speaker, text) => {
    setTranscripts((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.speaker === speaker && !last.final) {
        return [...prev.slice(0, -1), { speaker, text: text || last.text, final: true }];
      }
      return [...prev, { speaker, text: text || '', final: true }];
    });
  }, []);

  const setupAudioVisualizer = (stream) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      // iOS Safari safeguard: Resume suspended context on user-initiated action
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.65;
      analyser.minDecibels = -70;
      analyser.maxDecibels = -20;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const localData = new Uint8Array(256);
      const remoteData = new Uint8Array(256);
      const canvas = visualizerCanvasRef.current;
      const ctx = canvas?.getContext('2d');

      const computeRMS = (dataArray) => {
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        return Math.sqrt(sum / dataArray.length);
      };

      const draw = () => {
        let localLevel = 0;
        let remoteLevel = 0;

        if (analyserRef.current) {
          analyserRef.current.getByteTimeDomainData(localData);
          localLevel = Math.min(100, Math.round(computeRMS(localData) * 160));
        }

        if (remoteAnalyserRef.current) {
          remoteAnalyserRef.current.getByteTimeDomainData(remoteData);
          const rawRemote = Math.min(100, Math.round(computeRMS(remoteData) * 140));
          remoteLevel = rawRemote > 8 ? rawRemote : 0;
          remoteLevelRef.current = remoteLevel;
        }

        const blended = Math.max(localLevel, remoteLevel * 0.9);
        setAudioLevel(blended);

        if (ctx && canvas) {
          const sourceData = remoteLevel > localLevel + 8 ? remoteData : localData;
          const level = blended;
          const { width, height } = canvas;
          const centerX = width / 2;
          const centerY = height / 2;
          const baseRadius = Math.min(width, height) * 0.38;

          const isRemoteDominant = remoteLevel > localLevel + 8;
          const glowR = isRemoteDominant ? 52 : 34;
          const glowG = isRemoteDominant ? 235 : 211;
          const glowB = isRemoteDominant ? 160 : 238;

          ctx.clearRect(0, 0, width, height);

          ctx.beginPath();
          ctx.arc(centerX, centerY, baseRadius + level * 0.15, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${glowR}, ${glowG}, ${glowB}, ${0.12 + level / 350})`;
          ctx.lineWidth = 5 + level / 18;
          ctx.stroke();

          ctx.beginPath();
          for (let i = 0; i < sourceData.length; i++) {
            const angle = (i / sourceData.length) * Math.PI * 2 - Math.PI / 2;
            const amp = (sourceData[i] - 128) / 128;
            const r = baseRadius + amp * (16 + level * 0.14);
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.strokeStyle = `rgba(${glowR}, ${glowG}, ${glowB}, ${0.5 + level / 220})`;
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }

        animFrameRef.current = requestAnimationFrame(draw);
      };

      draw();
    } catch (err) {
      console.warn('[LEXIS] Audio visualizer init failed:', err);
    }
  };

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/heartbeat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        });
        if (res.status === 402) {
          const err = await res.json().catch(() => ({}));
          setBillingNotice(err.error || 'Usage limit reached. Please upgrade to continue.');
          endSession();
          return;
        }
        if (res.ok) {
          onProfileRefresh?.();
        }
      } catch (e) {
        console.warn('[LEXIS] Heartbeat update failed:', e);
      }
    }, HEARTBEAT_INTERVAL_MS);
  }, [accessToken, stopHeartbeat, onProfileRefresh]);

  const startSession = async () => {
    if (isConnecting || isConnected) return;
    if (!accessToken) {
      setStatus('Error: No active session. Please sign in again.');
      return;
    }
    setIsConnecting(true);
    setConnectionState('connecting');
    setStatus('Fetching ephemeral secret...');
    setBillingNotice('');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('WebRTC is not supported in this browser. Use Chrome, Edge, or Safari.');
      }

      // 1. Fetch Ephemeral Token
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      };

      const tokenRes = await fetch(`${BACKEND_URL}/api/session`, { method: 'POST', headers });
      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        if (tokenRes.status === 402) {
          setBillingNotice(err.error || 'Usage limit reached. Please upgrade to continue.');
        }
        throw new Error(err.error || `Token broker error: ${tokenRes.status}`);
      }
      const data = await tokenRes.json();
      const clientSecret = data.client_secret;
      if (!clientSecret) throw new Error('Received invalid client secret from token broker.');

      setStatus('Establishing WebRTC Peer Connection...');

      // 2. RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
          // TURN fallback for strict NAT / school networks:
          // { urls: 'turn:your-turn-server.com:443', username: '...', credential: '...' }
        ]
      });
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log('[LEXIS Peer Connection State]:', state);
        setConnectionState(state);
        if (state === 'connected') {
          setIsConnected(true);
          setIsConnecting(false);
          reconnectAttempts.current = 0;
          startHeartbeat();
        } else if (state === 'failed' || state === 'disconnected') {
          setStatus('Network dropped. Cleaning up...');
          if (reconnectAttempts.current < maxReconnects) {
            reconnectAttempts.current++;
            const delay = 2000 * reconnectAttempts.current;
            setStatus(`Reconnecting ${reconnectAttempts.current}/${maxReconnects}...`);
            setTimeout(() => { endSession(false); startSession(); }, delay);
          } else {
            setStatus('Connection failed. Please restart.');
            endSession();
          }
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[LEXIS ICE State]:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') setStatus('ICE connection failed. Check firewall/NAT.');
      };

      // 3. Remote audio output — keep in DOM for AEC reference
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioEl.playsInline = true;
      audioEl.volume = 1.0;
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);
      remoteAudioRef.current = audioEl;

      pc.ontrack = (e) => {
        if (e.streams && e.streams[0]) {
          const remoteStream = e.streams[0];
          audioEl.srcObject = remoteStream;
          console.log('[LEXIS] Remote audio track received');

          // Analyse remote (LEXIS) audio
          try {
            if (remoteAudioContextRef.current) {
              remoteAudioContextRef.current.close().catch(() => {});
            }
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.7;
            const source = audioCtx.createMediaStreamSource(remoteStream);
            source.connect(analyser);
            remoteAudioContextRef.current = audioCtx;
            remoteAnalyserRef.current = analyser;
            console.log('[LEXIS] Remote analyser ready');
          } catch (err) {
            console.warn('[LEXIS] Remote analyser init failed:', err);
          }
        }
      };

      // 4. Capture User Microphone Stream (AEC-hardened)
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },
            echoCancellationType: { ideal: 'system' },
            channelCount: { ideal: 1 },
            sampleRate: { ideal: 48000 },
            sampleSize: { ideal: 16 },
            googEchoCancellation: { ideal: true },
            googExperimentalEchoCancellation: { ideal: true },
            googAutoGainControl: { ideal: true },
            googNoiseSuppression: { ideal: true },
            googHighpassFilter: { ideal: true },
            googTypingNoiseDetection: { ideal: true },
          },
        });
      } catch (mediaErr) {
        if (mediaErr.name === 'NotAllowedError') {
          throw new Error('Microphone permission denied. Please allow access and try again.');
        }
        if (mediaErr.name === 'NotFoundError') {
          throw new Error('No microphone found. Please connect a microphone and try again.');
        }
        if (mediaErr.name === 'OverconstrainedError') {
          console.warn('[LEXIS] Ideal AEC constraints rejected — falling back to basic set');
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
            });
          } catch (fallbackErr) {
            throw new Error(`Microphone error: ${fallbackErr.message}`);
          }
        } else {
          throw new Error(`Microphone error: ${mediaErr.message}`);
        }
      }

      mediaStreamRef.current = stream;

      // Verify AEC actually engaged
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const settings = audioTrack.getSettings();
        console.log('[LEXIS] Mic track settings:', {
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
          autoGainControl: settings.autoGainControl,
          channelCount: settings.channelCount,
          sampleRate: settings.sampleRate,
          label: audioTrack.label,
        });
        if (settings.echoCancellation === false) {
          console.warn('[LEXIS] Echo cancellation OFF on this device/browser. Prefer headphones.');
        }
      }

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      setupAudioVisualizer(stream);

      // 5. DataChannel
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.onopen = () => console.log('[LEXIS DataChannel] Opened');
      dc.onerror = (err) => console.error('[LEXIS DataChannel Error]', err);
      dc.onclose = () => console.log('[LEXIS DataChannel] Closed');

      const sendClientEvent = (event) => {
        if (dc.readyState === 'open') {
          try {
            dc.send(JSON.stringify(event));
          } catch (err) {
            console.warn('[LEXIS] Failed to send client event:', event.type, err);
          }
        }
      };

      dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);

          if (event.type === 'response.created') {
            isAssistantSpeakingRef.current = true;
            setStatus('LEXIS is responding...');
          }
          else if (event.type === 'response.output_item.added') {
            if (event.item?.role === 'assistant' || event.item?.type === 'message') {
              currentAssistantItemIdRef.current = event.item.id;
            }
          }
          else if (event.type === 'conversation.item.created') {
            if (event.item?.role === 'assistant') {
              currentAssistantItemIdRef.current = event.item.id;
            }
          }
          else if (event.type === 'response.output_audio_transcript.delta') {
            appendTranscript('lexis', event.delta);
          }
          else if (event.type === 'response.output_audio_transcript.done') {
            finalizeTranscript('lexis', event.transcript);
          }
          else if (event.type === 'response.done') {
            isAssistantSpeakingRef.current = false;
            currentAssistantItemIdRef.current = null;
            if (event.response?.status === 'cancelled') {
              setStatus('Interrupted. Listening...');
            } else {
              setStatus('LEXIS Active (Sub-300ms WebRTC Stream)');
            }
          }
          else if (event.type === 'conversation.item.input_audio_transcription.completed') {
            appendTranscript('user', event.transcript);
          }
          else if (event.type === 'input_audio_buffer.speech_started') {
            setStatus('Listening...');
            if (isAssistantSpeakingRef.current || remoteAudioRef.current) {
              if (remoteAudioRef.current) {
                remoteAudioRef.current.pause();
                remoteAudioRef.current.currentTime = 0;
              }
              sendClientEvent({ type: 'response.cancel' });
              sendClientEvent({ type: 'output_audio_buffer.clear' });
              setTranscripts((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.speaker === 'lexis' && !last.final) {
                  return prev.slice(0, -1);
                }
                return prev;
              });
              isAssistantSpeakingRef.current = false;
              console.log('[LEXIS] Barge-in executed');
            }
          }
          else if (event.type === 'input_audio_buffer.speech_stopped') {
            setStatus('Processing...');
          }
          else if (event.type === 'input_audio_buffer.committed') {
            console.log('[LEXIS] Input audio buffer committed');
          }
          else if (event.type === 'session.created') {
            console.log('[LEXIS] Session created:', event.session?.id);
          }
          else if (event.type === 'rate_limits.updated') {
            const limits = event.rate_limits || [];
            limits.forEach(l => {
              if (l.remaining < l.limit * 0.2) {
                console.warn(`[LEXIS] Rate limit low: ${l.name} — ${l.remaining}/${l.limit} remaining`);
              }
            });
          }
          else if (event.type === 'error') {
            console.error('[LEXIS OpenAI Error]', event.error);
            setStatus(`Error: ${event.error?.message || 'Unknown'}`);
          }
        } catch (err) {
          console.error('[LEXIS Event Parse Error]', err);
        }
      };

      // 6. SDP Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 7. SDP Exchange (GA endpoint)
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      const sdpResponse = await fetch(`${baseUrl}/calls?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${clientSecret}`,
          'Content-Type': 'application/sdp'
        }
      });
      if (!sdpResponse.ok) {
        const errText = await sdpResponse.text();
        throw new Error(`OpenAI WebRTC SDP exchange failed: ${sdpResponse.status} — ${errText}`);
      }
      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

    } catch (err) {
      console.error('[LEXIS Session Launch Error]', err);
      setStatus(`Error: ${err.message}`);
      setIsConnecting(false);
      setConnectionState('failed');
      endSession();
    }
  };

  const forceInterrupt = useCallback(() => {
    if (!isConnected) return;
    const dc = dcRef.current;
    if (dc && dc.readyState === 'open') {
      try {
        dc.send(JSON.stringify({ type: 'response.cancel' }));
        dc.send(JSON.stringify({ type: 'output_audio_buffer.clear' }));
      } catch (err) {
        console.warn('[LEXIS] Manual interrupt failed:', err);
      }
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.currentTime = 0;
    }
    setTranscripts((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.speaker === 'lexis' && !last.final) {
        return prev.slice(0, -1);
      }
      return prev;
    });
    isAssistantSpeakingRef.current = false;
    setStatus('Interrupted');
  }, [isConnected]);

  const toggleMute = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const endSession = (fullReset = true) => {
    stopHeartbeat();
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close().catch(() => {}); audioContextRef.current = null; }
    if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()); mediaStreamRef.current = null; }
    if (dcRef.current) { dcRef.current.close(); dcRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.remove();
      remoteAudioRef.current = null;
    }

    currentAssistantItemIdRef.current = null;
    isAssistantSpeakingRef.current = false;
    analyserRef.current = null;
    if (remoteAudioContextRef.current) {
      remoteAudioContextRef.current.close().catch(() => {});
      remoteAudioContextRef.current = null;
    }
    remoteAnalyserRef.current = null;
    remoteLevelRef.current = 0;
    setAudioLevel(0);
    setIsMuted(false);

    if (fullReset) {
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionState('disconnected');
      setStatus('Disconnected');
      reconnectAttempts.current = 0;
    }
  };

  const getStateColor = () => {
    switch (connectionState) {
      case 'connected': return 'bg-emerald-400';
      case 'connecting': return 'bg-amber-400';
      case 'failed': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  };

  const getStateText = () => {
    if (isConnecting) return 'CONNECTING...';
    if (isConnected) return 'LIVE WEBRTC';
    return 'STANDBY';
  };

  const remainingSeconds = profile
    ? Math.max(0, profile.max_allowed_seconds - profile.seconds_used)
    : null;
  const isUnlimited = profile && profile.subscription_status === 'active';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-4xl flex items-center justify-between text-xs text-slate-500 pb-3">
        <button
          onClick={onBackToHome}
          className="flex items-center space-x-1.5 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        <div className="flex items-center space-x-4">
          {profile && (
            <span className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isUnlimited
                  ? `${profile.subscription_tier} plan — unlimited`
                  : `${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s left in trial`}
              </span>
            </span>
          )}
          {session?.user?.email && <span className="hidden sm:inline">{session.user.email}</span>}
          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {billingNotice && (
        <div className="w-full max-w-4xl mb-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm flex items-center justify-between">
          <span>{billingNotice}</span>
          <button onClick={onBackToHome} className="font-bold underline underline-offset-2 hover:text-amber-200">
            View plans
          </button>
        </div>
      )}

      <header className="w-full max-w-4xl flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              LEXIS OS v2026.3
            </h1>
            <p className="text-xs text-slate-400">Language Engine & eXecutive Intelligence System</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
            isConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : isConnecting ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${getStateColor()} ${isConnected ? 'animate-ping' : ''}`} />
            {getStateText()}
          </span>
        </div>
      </header>

      <main className="w-full max-w-4xl my-auto py-8 flex flex-col items-center">
        <div className="relative flex items-center justify-center my-8">
          <canvas
            ref={visualizerCanvasRef}
            width={320}
            height={320}
            className="absolute inset-0 m-auto pointer-events-none z-10"
            style={{ width: '16rem', height: '16rem' }}
          />
          <div
            className={`w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center transition-all duration-300 ${
              isConnected
                ? 'bg-gradient-to-tr from-cyan-600/20 via-teal-500/10 to-emerald-500/20 border border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900 border border-slate-800'
            }`}
            style={{ transform: isConnected ? `scale(${1 + audioLevel / 350})` : 'scale(1)' }}
          >
            <div className={`w-32 h-32 md:w-44 md:h-44 rounded-full flex items-center justify-center border ${
              isConnected ? 'bg-cyan-950/40 border-cyan-400/50 shadow-inner' : 'bg-slate-800/50 border-slate-700'
            }`}>
              <Activity className={`w-12 h-12 ${isConnected ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`} />
            </div>
          </div>
          <div className="absolute -bottom-8 text-center">
            <p className="text-xs font-mono uppercase tracking-widest text-cyan-400/80">{status}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 mt-8">
          {!isConnected ? (
            <button
              onClick={startSession}
              disabled={isConnecting}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-lg rounded-2xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95 flex items-center space-x-3"
            >
              {isConnecting ? (
                <><RotateCcw className="w-5 h-5 animate-spin" /><span>CONNECTING...</span></>
              ) : (
                <><Mic className="w-5 h-5" /><span>INITIATE LEXIS</span></>
              )}
            </button>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleMute}
                className={`p-4 rounded-2xl border transition-all ${
                  isMuted ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <button
                onClick={forceInterrupt}
                className="p-4 rounded-2xl border bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20 transition-all"
                title="Interrupt LEXIS"
              >
                <Hand className="w-6 h-6" />
              </button>
              <button
                onClick={() => endSession()}
                className="px-6 py-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-semibold rounded-2xl transition-all flex items-center space-x-2"
              >
                <PhoneOff className="w-5 h-5" />
                <span>TERMINATE SESSION</span>
              </button>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-600 font-mono">Press [Space] to toggle session</p>

        {transcripts.length > 0 && (
          <div className="w-full mt-12 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-3 scrollbar-thin">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2 flex items-center space-x-2">
              <Volume2 className="w-3 h-3" />
              <span>Speech Transcripts</span>
            </div>
            {transcripts.map((item, idx) => (
              <div
                key={idx}
                className={`text-sm p-3 rounded-xl ${
                  item.speaker === 'lexis'
                    ? 'bg-cyan-950/30 border border-cyan-800/30 text-cyan-200 ml-4'
                    : 'bg-slate-800/50 border border-slate-700 text-slate-300 mr-4'
                }`}
              >
                <span className="text-xs font-bold uppercase mr-2 opacity-60">
                  {item.speaker === 'lexis' ? 'LEXIS:' : 'You:'}
                </span>
                {item.text}
                {item.speaker === 'lexis' && !item.final && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-cyan-400/60 animate-pulse align-middle" />
                )}
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        )}
      </main>

      <footer className="w-full max-w-4xl flex items-center justify-between border-t border-slate-800 pt-4 mt-4">
        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <ShieldCheck className="w-3 h-3" />
          <span>Secured via ephemeral client secrets</span>
        </div>
        <div className="flex items-center space-x-4 text-xs text-slate-600">
          <span className="font-mono">LEXIS v2026.3</span>
          <span>•</span>
          <span>Digital Renaissance</span>
        </div>
      </footer>
    </div>
  );
}
