// frontend/src/pages/LexisApp.jsx — Reconciled Commercial WebRTC Client
import React, { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import {
  Mic, MicOff, Volume2, VolumeX, Sparkles, ShieldCheck,
  AlertCircle, PhoneOff, RotateCcw, Hand, LogOut, CreditCard, Clock
} from 'lucide-react';
import TutorAvatarPhoto from '../components/TutorAvatarPhoto';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Which language the student is learning ('en' = Thai speaker learning
// English, the original product; 'th' = English speaker learning Thai).
// Persisted locally (not in the Supabase profile — this is a per-device
// practice preference, not account state) so returning on the same device
// doesn't reset it every session. backend/app.mjs defaults to 'en' for any
// missing/unrecognized value, matching this key's absence on first visit.
const TARGET_LANGUAGE_STORAGE_KEY = 'lexis_target_language';

// Avatar priority: photo (best quality, cheapest — a real portrait, no
// three.js) > 3D model (VITE_AVATAR_GLB_URL) > SVG placeholder. Each tier
// only costs anything when its env var is actually set.
const AVATAR_PHOTO_URL = import.meta.env.VITE_AVATAR_PHOTO_URL;

// Optional 3D avatar model (MetaPerson / Ready Player Me .glb export). When
// set, LEXIS renders a modeled 3D face instead of the SVG placeholder below,
// still driven by the exact same tutorLevel data — see TutorAvatar3D.jsx.
// Lazy-loaded (and three.js/@react-three only pulled into the bundle at all)
// when this is actually configured, so an unset/still-being-made avatar
// asset costs nothing and never blocks a session.
const AVATAR_GLB_URL = import.meta.env.VITE_AVATAR_GLB_URL;
const TutorAvatar3D = AVATAR_GLB_URL ? React.lazy(() => import('../components/TutorAvatar3D')) : null;

// The tutor's face. A live avatar was the actual point of the product —
// an abstract pulsing ring never was. Mouth height is driven by tutorLevel
// (LEXIS's own voice energy specifically, not the combined mic+AI level
// used for the ambient ring/waveform), so it opens when LEXIS talks and
// stays shut while the student is the one speaking. No lip-sync vendor,
// no new cost — same live analyser data the app was already computing.
//
// This is the fallback face, always available with zero extra deps. When
// VITE_AVATAR_GLB_URL is set, the TutorAvatar wrapper below swaps in the
// modeled 3D version instead (same tutorLevel signal, richer face).
function TutorAvatarSVG({ isConnected, isConnecting, tutorLevel }) {
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

// Suspense only covers the *pending* state (the lazy import / useGLTF load
// in flight) — it does nothing for a load that actually fails (404, CORS,
// a corrupt/invalid .glb). Without this, a bad VITE_AVATAR_GLB_URL throws
// past Suspense and, with no boundary to catch it, takes down the whole
// LexisApp tree instead of just falling back to the SVG face. Caught during
// PR review — see https://github.com/eoinmcgee1993/lexis-core-v2026/pull/13.
class AvatarErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.warn('[LEXIS Avatar] 3D model failed to load — falling back to the SVG face.', error);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function TutorAvatar({ isConnected, isConnecting, tutorLevel }) {
  const svgFallback = <TutorAvatarSVG isConnected={isConnected} isConnecting={isConnecting} tutorLevel={tutorLevel} />;
  const [photoFailed, setPhotoFailed] = useState(false);

  if (AVATAR_PHOTO_URL && !photoFailed) {
    return (
      <TutorAvatarPhoto
        photoUrl={AVATAR_PHOTO_URL}
        isConnected={isConnected}
        isConnecting={isConnecting}
        tutorLevel={tutorLevel}
        onError={() => setPhotoFailed(true)}
      />
    );
  }
  if (!TutorAvatar3D) {
    return svgFallback;
  }
  return (
    <AvatarErrorBoundary fallback={svgFallback}>
      <Suspense fallback={svgFallback}>
        <TutorAvatar3D url={AVATAR_GLB_URL} isConnected={isConnected} isConnecting={isConnecting} tutorLevel={tutorLevel} />
      </Suspense>
    </AvatarErrorBoundary>
  );
}

// Translates getUserMedia's raw DOMException names into wording a student
// can actually act on, instead of browser-internal phrasing like "Requested
// device not found". Falls back to the browser's own message for anything
// not recognized, so a genuinely new failure mode isn't silently hidden.
function describeMicError(err) {
  switch (err.name) {
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No microphone detected. Please connect a microphone and try again.';
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Microphone access denied. Please allow microphone access in your browser settings and try again.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Could not access your microphone — it may be in use by another application.';
    case 'SecurityError':
      return "Microphone access is blocked by your browser's security settings.";
    default:
      return err.message || 'Microphone access failed.';
  }
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
  const [targetLanguage, setTargetLanguage] = useState(() => {
    try {
      return localStorage.getItem(TARGET_LANGUAGE_STORAGE_KEY) === 'th' ? 'th' : 'en';
    } catch {
      return 'en'; // localStorage can throw in some privacy modes — default, don't crash the page over a preference.
    }
  });
  // Live-verified this was easy to miss: the header toggle below was
  // 'hidden sm:flex', invisible on phone-width screens, so on mobile the
  // direction was effectively whatever localStorage already had (silently
  // defaulting to 'en') with no visible way to check or change it before
  // starting. Now INITIATE LEXIS always asks explicitly first via this
  // modal, so the choice is unmissable regardless of screen size.
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  // Mobile browsers can silently block autoplay on the remote <audio>
  // element — its srcObject is set inside pc.ontrack, which fires
  // asynchronously well after the click that started the session, outside
  // the window some browsers associate with that user gesture. Input (mic)
  // keeps working fine either way, since that's a separate permission; only
  // LEXIS's own voice goes silent, with no error — just a transcript with
  // nothing audible behind it. See the button below driven by this flag.
  const [audioBlocked, setAudioBlocked] = useState(false);

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
          setShowLanguagePicker(true);
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

  // directionOverride lets the language-picker modal start a session with
  // the language the user just tapped, without a stale-closure bug: calling
  // setTargetLanguage(lang) then startSession() in the same handler would
  // still read the *previous* render's targetLanguage below (React batches
  // the state update), so the picker passes the freshly-picked value in
  // directly instead of relying on state having already re-rendered.
  const startSession = async (directionOverride) => {
    if (isConnecting || isConnected) return;

    if (!session) {
      navigateTo('/auth');
      return;
    }

    const direction = directionOverride ?? targetLanguage;

    setIsConnecting(true);
    setStatus('Authenticating & Fetching Token...');
    setUpgradeRequired(false);
    setAudioBlocked(false);

    try {
      // 1. Fetch Ephemeral Token with User JWT
      const tokenRes = await fetch(`${BACKEND_URL}/api/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ direction })
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
                endSession('Session expired. Please sign in again.');
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
                endSession('Usage limit reached.');
              } else if (res.ok) {
                refreshProfile(); // keeps the header's remaining-time display live
              }
            } catch (e) {
              console.warn('[LEXIS Telemetry Warning]', e);
            }
          }, 30000);

        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          endSession('Connection lost. Cleaning up...');
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
          // `autoplay` alone doesn't guarantee playback starts — some mobile
          // browsers block it here since this callback fires async, outside
          // the gesture window. Explicitly attempt play() and surface a
          // "tap to enable audio" prompt on rejection instead of failing
          // silently (see the audioBlocked banner below).
          audioEl.play().then(() => setAudioBlocked(false)).catch((playErr) => {
            console.warn('[LEXIS Audio] Autoplay blocked, prompting for a tap:', playErr);
            setAudioBlocked(true);
          });
          setupDualVisualizers(mediaStreamRef.current, e.streams[0]);
        }
      };

      // 4. Microphone Capture with Hardware AEC Flags
      let stream;
      try {
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
      } catch (mediaErr) {
        // Translate the raw DOMException into something a student (not a
        // web dev) can act on. Both the strict attempt above and its
        // OverconstrainedError fallback land here on final failure, so this
        // is the one place that needs to know the friendly wording.
        throw new Error(describeMicError(mediaErr));
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
      // Must match the model backend/app.mjs's /api/session uses to mint
      // the client_secret — the SDP exchange 404s otherwise (this exact
      // dated snapshot has 404'd before; see the comment on the backend's
      // OPENAI_MODEL default). These are two independent hardcoded strings,
      // not shared config, so keep them in sync by hand.
      const model = 'gpt-realtime';

      const sdpResponse = await fetch(`${baseUrl}/calls?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${clientSecret}`,
          'Content-Type': 'application/sdp'
        }
      });

      if (!sdpResponse.ok) {
        // A persistent 429 that survives several minutes and a page reload
        // isn't a normal per-minute rate limit — likely a concurrent-session
        // cap or quota issue on the OpenAI account/tier. Reading the body is
        // the only way to tell those apart instead of guessing from the
        // status code alone; OpenAI returns a JSON {error:{message,...}}
        // body even for the SDP-exchange endpoint.
        const errorBody = await sdpResponse.text().catch(() => '');
        throw new Error(`SDP exchange failed with status ${sdpResponse.status}${errorBody ? `: ${errorBody.slice(0, 300)}` : ''}`);
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

    } catch (err) {
      console.error('[LEXIS Session Error]', err);
      endSession(`Error: ${err.message}`);
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

  // Only meaningful before a session starts — the running session's system
  // prompt was already picked when it connected, so this only affects the
  // *next* "INITIATE LEXIS" click. Disabled in the UI while connected for
  // exactly that reason, rather than implying a live language switch.
  const selectTargetLanguage = (lang) => {
    setTargetLanguage(lang);
    try {
      localStorage.setItem(TARGET_LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Privacy-mode localStorage throw — the choice just won't persist
      // across visits; not worth surfacing an error for.
    }
  };

  // Handles the language-picker modal shown on every INITIATE LEXIS tap.
  // Persists the choice for next time (selectTargetLanguage) and starts the
  // session with it immediately via startSession's directionOverride, so
  // this doesn't need to wait a render for state to catch up.
  const confirmLanguageAndStart = (lang) => {
    selectTargetLanguage(lang);
    setShowLanguagePicker(false);
    startSession(lang);
  };

  // finalStatus lets a caller that already knows *why* the session is
  // ending say so — endSession used to unconditionally stamp 'Disconnected'
  // over whatever specific status a caller had just set (e.g. a real error
  // message, or 'Connection lost'), silently discarding it before the user
  // ever saw it. Every failure mode collapsed to the same uninformative
  // "Disconnected", which is exactly what was reported live.
  const endSession = (finalStatus = 'Disconnected') => {
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
    setStatus(finalStatus);
    setAudioLevel(0);
    setTutorLevel(0);
    setAudioBlocked(false);
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
          {/* Which language to practice next session. Locked once connected
              — the running session's persona was already picked when it
              started, so changing this mid-call wouldn't do anything, and
              showing it as live-editable would be misleading. Visible on
              all screen sizes (was 'hidden sm:flex' — invisible on phones,
              which meant mobile users had no visible way to check or set
              this before INITIATE LEXIS now also asks explicitly). */}
          {!isConnected && !isConnecting && (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs" title="Language to practice">
              <button
                onClick={() => selectTargetLanguage('en')}
                className={`px-2.5 py-1 rounded-md transition-colors ${targetLanguage === 'en' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Learn English
              </button>
              <button
                onClick={() => selectTargetLanguage('th')}
                className={`px-2.5 py-1 rounded-md transition-colors ${targetLanguage === 'th' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                เรียนไทย
              </button>
            </div>
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

      {/* Audio Blocked Notice — mobile browsers can silently block the
          remote <audio> element's autoplay; this is a real click, so
          play() from here isn't subject to the same restriction. */}
      {audioBlocked && (
        <div className="w-full max-w-4xl my-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3 text-amber-400 text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>LEXIS is talking, but your browser blocked the audio. Tap to enable it.</span>
          </div>
          <button
            onClick={() => {
              remoteAudioRef.current?.play().then(() => setAudioBlocked(false)).catch((err) => {
                console.warn('[LEXIS Audio] Manual play still failed:', err);
              });
            }}
            className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1"
          >
            <Volume2 className="w-4 h-4" />
            <span>Enable Audio</span>
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
            <div className={`w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden flex items-center justify-center border ${
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
              onClick={() => setShowLanguagePicker(true)}
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
              <button onClick={() => endSession()} className="px-6 py-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold rounded-xl flex items-center space-x-2">
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

      {/* Language picker — asked explicitly on every INITIATE LEXIS tap
          rather than silently reusing whatever was last stored. The tutor
          was live-verified drifting between teaching English and Thai
          mid-session when the target wasn't pinned down clearly, and the
          old header toggle this replaced as the primary path was hidden on
          phone-width screens — so this is now the one unmissable, always-
          asked choice, on every device, before every session. */}
      {showLanguagePicker && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-100 mb-1">What do you want to practice?</h2>
            <p className="text-xs text-slate-400 mb-6">Choose a language to start this session.</p>
            <div className="space-y-3">
              <button
                onClick={() => confirmLanguageAndStart('en')}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold rounded-xl text-sm hover:scale-[1.02] transition-transform"
              >
                Learn English
              </button>
              <button
                onClick={() => confirmLanguageAndStart('th')}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold rounded-xl text-sm hover:scale-[1.02] transition-transform"
              >
                เรียนภาษาไทย
              </button>
            </div>
            <button
              onClick={() => setShowLanguagePicker(false)}
              className="w-full mt-4 py-2 text-xs text-slate-500 hover:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
