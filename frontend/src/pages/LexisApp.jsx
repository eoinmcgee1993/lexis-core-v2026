// frontend/src/pages/LexisApp.jsx — Reconciled Commercial WebRTC Client
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import {
  Mic, MicOff, Volume2, VolumeX, Sparkles, ShieldCheck,
  AlertCircle, PhoneOff, RotateCcw, Hand, LogOut, CreditCard, Clock
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// The tutor's face. A live avatar was the actual point of the product —
// an abstract pulsing ring never was. Mouth height is driven by tutorLevel
// (LEXIS's own voice energy specifically, not the combined mic+AI level
// used for the ambient ring/waveform), so it opens when LEXIS talks and
// stays shut while the student is the one speaking. No lip-sync vendor,
// no new cost — same live analyser data the app was already computing.
function TutorAvatar({ isConnected, isConnecting, tutorLevel }) {
  const mouthHeight = 4 + Math.min(18, (tutorLevel / 100) * 18);
  const active = isConnected || isConnecting;
  return (
    <svg viewBox="0 0 100 100" className="w-20 h-20 md:w-28 md:h-28" role="img" aria-label="LEXIS tutor avatar">
      <defs>
        <radialGradient id="lexisFaceGradient" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={active ? '#0e7490' : '#1e293b'} />
          <stop offset="100%" stopColor={active ? '#083344' : '#0f172a'} />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#lexisFaceGradient)" stroke={isConnected ? '#22d3ee' : '#475569'} strokeWidth="2" />
      <ellipse cx="34" cy="42" rx="5" ry="6" className="lexis-avatar-eye" fill={active ? '#5eead4' : '#475569'} />
      <ellipse cx="66" cy="42" rx="5" ry="6" className="lexis-avatar-eye" fill={active ? '#5eead4' : '#475569'} />
      <rect
        x="35"
        y={62 - mouthHeight / 2}
        width="30"
        height={mouthHeight}
        rx={mouthHeight / 2}
        fill={isConnected ? '#34eba0' : '#334155'}
        style={{ transition: 'height 60ms ease-out, y 60ms ease-out' }}
      />
    </svg>
  );
}

function formatUsageLabel(profile) {
  if (profile.subscription_status === 'active') {
    return `${profile.subscription_tier} plan — unlimited`;
  }
  const remaining = Math.max(0, (profile.max_allowed_seconds || 0) - (profile.seconds_used || 0));
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return `${mins}m ${secs}s left in trial`;
}

export default function LexisApp({ navigateTo }) {
  // App.jsx's router already redirects to /auth before this component ever
  // mounts when there's no session, so `session` is guaranteed here.
  const { session, profile, refreshProfile, signOut } = useAuth();

  const justPaid = new URLSearchParams(window.location.search).get('payment') === 'success';

  // State Management
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [transcripts, setTranscripts] = useState([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [tutorLevel, setTutorLevel] = useState(0); // LEXIS's own voice energy, drives the avatar's mouth
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  // References
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const localAnalyserRef = useRef(null);
  const remoteAnalyserRef = useRef(null);
  const localAudioContextRef = useRef(null);
  const remoteAudioContextRef = useRef(null);
  const animFrameRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const canvasRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const isAssistantSpeakingRef = useRef(false);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Drop ?payment=success from the URL once shown, so refreshing this page
  // later doesn't keep re-showing "payment confirmed" indefinitely.
  useEffect(() => {
    if (justPaid) {
      window.history.replaceState({}, '', '/app');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Spacebar toggles session start/end, but only when focus is on the page
  // body (not while typing in a field elsewhere — not that this page has
  // any text inputs today, but the guard costs nothing).
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        if (isConnected) {
          endSession();
        } else if (!isConnecting) {
          startSession();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, isConnecting]);

  useEffect(() => {
    return () => endSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendClientEvent = (eventObj) => {
    if (dcRef.current && dcRef.current.readyState === 'open') {
      dcRef.current.send(JSON.stringify(eventObj));
    }
  };

  const appendTranscript = useCallback((speaker, text) => {
    if (!text) return;
    setTranscripts((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.speaker === speaker && speaker === 'lexis') {
        return [...prev.slice(0, -1), { speaker, text: last.text + text }];
      }
      return [...prev, { speaker, text }];
    });
  }, []);

  const setupDualVisualizers = (localStream, remoteStream) => {
    try {
      // Local Mic Analyser
      const localCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (localCtx.state === 'suspended') localCtx.resume();
      const localAnalyser = localCtx.createAnalyser();
      localAnalyser.fftSize = 512;
      localCtx.createMediaStreamSource(localStream).connect(localAnalyser);
      localAudioContextRef.current = localCtx;
      localAnalyserRef.current = localAnalyser;

      // Remote AI Analyser
      if (remoteStream) {
        const remoteCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (remoteCtx.state === 'suspended') remoteCtx.resume();
        const remoteAnalyser = remoteCtx.createAnalyser();
        remoteAnalyser.fftSize = 512;
        remoteCtx.createMediaStreamSource(remoteStream).connect(remoteAnalyser);
        remoteAudioContextRef.current = remoteCtx;
        remoteAnalyserRef.current = remoteAnalyser;
      }

      const localData = new Uint8Array(localAnalyser.frequencyBinCount);
      const remoteData = remoteAnalyserRef.current ? new Uint8Array(remoteAnalyserRef.current.frequencyBinCount) : null;

      const renderFrame = () => {
        if (!localAnalyserRef.current) return;

        localAnalyser.getByteFrequencyData(localData);
        let localSum = 0;
        for (let i = 0; i < localData.length; i++) localSum += localData[i];
        const localLevel = localSum / localData.length;

        let remoteLevel = 0;
        if (remoteAnalyserRef.current && remoteData) {
          remoteAnalyserRef.current.getByteFrequencyData(remoteData);
          let remoteSum = 0;
          for (let i = 0; i < remoteData.length; i++) remoteSum += remoteData[i];
          const rawRemote = remoteSum / remoteData.length;
          remoteLevel = rawRemote > 8 ? rawRemote : 0; // Noise-floor gate
        }

        const effectiveLevel = Math.max(localLevel, remoteLevel * 0.9);
        setAudioLevel(Math.min(100, Math.round((effectiveLevel / 128) * 100)));
        setTutorLevel(Math.min(100, Math.round((remoteLevel / 128) * 100)));

        // Render Canvas Waveform Ring
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const width = canvas.width;
          const height = canvas.height;
          const centerX = width / 2;
          const centerY = height / 2;
          const baseRadius = 80;

          ctx.clearRect(0, 0, width, height);
          ctx.beginPath();

          const activeData = remoteLevel > localLevel + 8 ? remoteData : localData;
          const strokeColor = remoteLevel > localLevel + 8 ? '#34eba0' : '#22d3ee'; // Emerald for LEXIS, Cyan for Student

          if (activeData) {
            const points = 64;
            for (let i = 0; i < points; i++) {
              const angle = (i / points) * Math.PI * 2;
              const value = activeData[i % activeData.length] / 255;
              const radius = baseRadius + value * 35;
              const x = centerX + Math.cos(angle) * radius;
              const y = centerY + Math.sin(angle) * radius;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
          }
          ctx.closePath();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 3;
          ctx.shadowBlur = 15;
          ctx.shadowColor = strokeColor;
          ctx.stroke();
        }

        animFrameRef.current = requestAnimationFrame(renderFrame);
      };
      renderFrame();

    } catch (err) {
      console.warn('[LEXIS Visualizer Warning]', err);
    }
  };

  const startSession = async () => {
    if (isConnecting || isConnected) return;

    if (!session) {
      navigateTo('/auth');
      return;
    }

    setIsConnecting(true);
    setStatus('Authenticating & Fetching Token...');
    setUpgradeRequired(false);

    try {
      // 1. Fetch Ephemeral Token with User JWT
      const tokenRes = await fetch(`${BACKEND_URL}/api/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        if (tokenRes.status === 403 && err.error === 'TRIAL_EXHAUSTED') {
          setUpgradeRequired(true);
          setUpgradeMessage(err.message || 'Free trial limit reached. Please upgrade your pass.');
          throw new Error(err.message || 'Free trial limit reached. Please upgrade your pass.');
        }
        throw new Error(err.error || `Broker error status: ${tokenRes.status}`);
      }

      const data = await tokenRes.json();
      const clientSecret = data.client_secret;
      if (!clientSecret) throw new Error('Received invalid client secret from token broker.');

      setStatus('Establishing Sub-300ms WebRTC Stream...');

      // 2. Instantiate PeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setStatus('LEXIS Active (Sub-300ms WebRTC)');
          setIsConnected(true);
          setIsConnecting(false);

          // Trigger 30-second Telemetry Heartbeat. Re-fetch the session on
          // every tick rather than closing over the token from session
          // start — supabase-js auto-rotates the JWT roughly hourly, and a
          // long practice session would otherwise start sending a stale
          // token, fail every heartbeat with 401, and silently stop
          // recording usage with no error surfaced to the user.
          if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = setInterval(async () => {
            try {
              const { data: { session: freshSession } } = await supabase.auth.getSession();
              if (!freshSession) {
                endSession();
                return;
              }
              const res = await fetch(`${BACKEND_URL}/api/heartbeat`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${freshSession.access_token}`
                }
              });
              if (res.status === 403) {
                const err = await res.json().catch(() => ({}));
                setUpgradeRequired(true);
                setUpgradeMessage(err.message || 'Usage limit reached. Please upgrade your pass.');
                endSession();
              } else if (res.ok) {
                refreshProfile(); // keeps the header's remaining-time display live
              }
            } catch (e) {
              console.warn('[LEXIS Telemetry Warning]', e);
            }
          }, 30000);

        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setStatus('Connection lost. Cleaning up...');
          endSession();
        }
      };

      // 3. Audio Output Setup
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioEl.playsInline = true;
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);
      remoteAudioRef.current = audioEl;

      pc.ontrack = (e) => {
        if (e.streams && e.streams[0]) {
          audioEl.srcObject = e.streams[0];
          setupDualVisualizers(mediaStreamRef.current, e.streams[0]);
        }
      };

      // 4. Microphone Capture with Hardware AEC Flags
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
            googEchoCancellation: { ideal: true },
            googNoiseSuppression: { ideal: true }
          }
        });
      } catch (mediaErr) {
        if (mediaErr.name === 'OverconstrainedError') {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          });
        } else {
          throw mediaErr;
        }
      }

      mediaStreamRef.current = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // 5. DataChannel & Synchronized Barge-In Handlers
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);

          if (event.type === 'response.created') {
            isAssistantSpeakingRef.current = true;
            setStatus('LEXIS is speaking...');
          } else if (event.type === 'response.audio_transcript.delta' || event.type === 'response.output_audio_transcript.delta') {
            appendTranscript('lexis', event.delta);
          } else if (event.type === 'conversation.item.input_audio_transcription.completed') {
            appendTranscript('user', event.transcript);
          } else if (event.type === 'input_audio_buffer.speech_started') {
            // Synchronized Client Barge-In
            if (isAssistantSpeakingRef.current) {
              if (remoteAudioRef.current) {
                remoteAudioRef.current.pause();
                remoteAudioRef.current.currentTime = 0;
              }
              sendClientEvent({ type: 'response.cancel' });
              sendClientEvent({ type: 'output_audio_buffer.clear' });
              isAssistantSpeakingRef.current = false;
            }
            setStatus('Listening...');
          } else if (event.type === 'response.done') {
            isAssistantSpeakingRef.current = false;
            setStatus('LEXIS Active (Sub-300ms WebRTC)');
          }
        } catch (err) {
          console.error('[LEXIS Event Error]', err);
        }
      };

      // 6. SDP Exchange with OpenAI Calls Gateway
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

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
        throw new Error(`SDP exchange failed with status ${sdpResponse.status}`);
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

    } catch (err) {
      console.error('[LEXIS Session Error]', err);
      setStatus(`Error: ${err.message}`);
      setIsConnecting(false);
      endSession();
    }
  };

  const forceInterrupt = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.currentTime = 0;
    }
    sendClientEvent({ type: 'response.cancel' });
    sendClientEvent({ type: 'output_audio_buffer.clear' });
    isAssistantSpeakingRef.current = false;
  };

  const toggleMute = () => {
    if (mediaStreamRef.current) {
      const track = mediaStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      }
    }
  };

  const toggleSpeakerMute = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
      setIsSpeakerMuted(remoteAudioRef.current.muted);
    }
  };

  const endSession = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (localAudioContextRef.current) localAudioContextRef.current.close().catch(() => {});
    if (remoteAudioContextRef.current) remoteAudioContextRef.current.close().catch(() => {});
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    if (dcRef.current) dcRef.current.close();
    if (pcRef.current) pcRef.current.close();
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.remove();
    }

    pcRef.current = null;
    mediaStreamRef.current = null;
    dcRef.current = null;
    localAudioContextRef.current = null;
    remoteAudioContextRef.current = null;
    localAnalyserRef.current = null;
    remoteAnalyserRef.current = null;
    remoteAudioRef.current = null;
    setIsConnected(false);
    setIsConnecting(false);
    setStatus('Disconnected');
    setAudioLevel(0);
    setTutorLevel(0);
  };

  // Defensive fallback only — App.jsx's router guarantees a session exists
  // before this component ever mounts.
  if (!session) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-between p-4 md:p-8">
      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigateTo('/')}>
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              LEXIS Voice OS
            </h1>
            <p className="text-[10px] text-slate-400">Authenticated Voice Immersion Session</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {profile && (
            <span className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatUsageLabel(profile)}</span>
            </span>
          )}
          <button onClick={() => navigateTo('/pricing')} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs hover:bg-cyan-500/20">
            Upgrade Pass
          </button>
          <button onClick={() => { endSession(); signOut(); }} className="p-2 text-slate-400 hover:text-slate-200" title="Sign Out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {justPaid && (
        <div className="w-full max-w-4xl mt-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs text-center">
          Payment confirmed — your pass is now active. Thank you!
        </div>
      )}

      {/* Upgrade Notice */}
      {upgradeRequired && (
        <div className="w-full max-w-4xl my-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3 text-amber-400 text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{upgradeMessage || 'Free trial limit reached. Upgrade your pass to continue practicing.'}</span>
          </div>
          <button onClick={() => navigateTo('/pricing')} className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1">
            <CreditCard className="w-4 h-4" />
            <span>View Pricing</span>
          </button>
        </div>
      )}

      {/* Visualizer */}
      <main className="w-full max-w-4xl my-auto py-8 flex flex-col items-center">
        <div className="relative flex items-center justify-center my-6">
          <canvas ref={canvasRef} width={320} height={320} className="absolute pointer-events-none" />
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
              <TutorAvatar isConnected={isConnected} isConnecting={isConnecting} tutorLevel={tutorLevel} />
            </div>
          </div>
          <div className="absolute -bottom-8 text-center">
            <p className="text-xs font-mono uppercase tracking-widest text-cyan-400/80">{status}</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center space-x-4 mt-8">
          {!isConnected ? (
            <button
              onClick={startSession}
              disabled={isConnecting}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-base rounded-2xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95 flex items-center space-x-3"
            >
              {isConnecting ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
              <span>{isConnecting ? 'CONNECTING...' : 'INITIATE LEXIS'}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-3 bg-slate-900/80 border border-slate-800 p-2 rounded-2xl shadow-xl">
              <button onClick={toggleMute} className={`p-3.5 rounded-xl border ${isMuted ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-200'}`}>
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button onClick={toggleSpeakerMute} className={`p-3.5 rounded-xl border ${isSpeakerMuted ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-200'}`}>
                {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button onClick={forceInterrupt} className="p-3.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl hover:bg-slate-700" title="Manual Interrupt">
                <Hand className="w-5 h-5 text-amber-400" />
              </button>
              <button onClick={endSession} className="px-6 py-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold rounded-xl flex items-center space-x-2">
                <PhoneOff className="w-5 h-5" />
                <span>TERMINATE</span>
              </button>
            </div>
          )}
        </div>

        {/* Transcripts */}
        {transcripts.length > 0 && (
          <div className="w-full mt-10 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-3">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Speech Transcripts</div>
            {transcripts.map((item, idx) => (
              <div key={idx} className={`text-xs p-3 rounded-xl ${item.speaker === 'lexis' ? 'bg-cyan-950/30 border border-cyan-800/30 text-cyan-200 ml-4' : 'bg-slate-800/50 border border-slate-700 text-slate-300 mr-4'}`}>
                <span className="font-bold uppercase mr-2 opacity-60">{item.speaker === 'lexis' ? 'LEXIS:' : 'You:'}</span>
                {item.text}
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        )}
      </main>

      <footer className="w-full max-w-4xl flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sub-300ms WebRTC Stream • Authenticated Session</span>
        </div>
        <div>Digital Renaissance System Architecture © 2026</div>
      </footer>
    </div>
  );
}
