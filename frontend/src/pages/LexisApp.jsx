// frontend/src/pages/LexisApp.jsx — Reconciled Commercial WebRTC Client
//
// v2026.4: restructured from one always-rendered screen into an explicit
// four-stage flow — welcome → topics → live → feedback — per
// scripts/design/lexis-visual-system.md. This file keeps owning the WebRTC
// session lifecycle end to end (unchanged in substance from v2026.3) and
// the `stage` state machine that decides which of the four stage
// components (frontend/src/components/stages/) is on screen; the stage
// components themselves are pure presentation.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import WelcomeStage from '../components/stages/WelcomeStage';
import TopicStage from '../components/stages/TopicStage';
import LiveStage from '../components/stages/LiveStage';
import FeedbackStage from '../components/stages/FeedbackStage';
import HistoryStage from '../components/stages/HistoryStage';
import { useSeo } from '../lib/useSeo';
import { trackEvent } from '../lib/analytics';
import { reportError } from '../lib/errorReporting';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Which language the student is learning ('en' = Thai speaker learning
// English, the original product; 'th' = English speaker learning Thai).
// Persisted locally (not in the Supabase profile — this is a per-device
// practice preference, not account state) so returning on the same device
// doesn't reset it every session. backend/app.mjs defaults to 'en' for any
// missing/unrecognized value, matching this key's absence on first visit.
const TARGET_LANGUAGE_STORAGE_KEY = 'lexis_target_language';

// A dropped WebRTC connection reports connectionState 'disconnected' before
// (if ever) reaching 'failed' — and 'disconnected' is often transient, a
// few seconds of a wifi handoff or a cell tower switch that recovers on its
// own with the *same* peer connection and the *same* OpenAI realtime
// session still intact. Previously any 'disconnected' immediately tore the
// whole session down — but ending the session means the next attempt mints
// a brand new OpenAI realtime session with zero memory of the conversation
// so far (LEXIS would restart onboarding mid-conversation), which reads as
// far more broken than a few seconds of "Reconnecting...". This grace
// window lets a real recovery happen quietly; only if the connection is
// still down when it expires does this become a real, user-visible failure.
const RECONNECT_GRACE_MS = 8000;

// The single source of truth for what the live session is doing right now
// — see scripts/design/lexis-visual-system.md's Live Conversation section.
// Previously `isConnected`/`isConnecting` were independent booleans that
// had to be kept in sync by hand at every call site; a state this file
// forgot to flip in lockstep would leave e.g. the avatar showing "active"
// while the action bar still showed "not connected". Replacing both with
// one enum removes that whole class of drift — everything UI-facing
// (avatar activity, status color, button enabled-state) derives from this
// one value instead of from multiple flags that could disagree.
//
//   idle          — no session, nothing in flight
//   connecting    — token fetch / WebRTC handshake in progress
//   listening     — connected, it's the student's turn (or a lull between turns)
//   processing    — student just stopped talking; waiting on LEXIS's reply
//   speaking      — LEXIS's response is playing
//   interrupted   — brief flash right after a barge-in, before settling to 'listening'
//   reconnecting  — connectionState dropped to 'disconnected'; inside the grace window above
//   error         — a real, terminal failure (see sessionError for the message)

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
      return 'Could not access your microphone: it may be in use by another application.';
    case 'SecurityError':
      return "Microphone access is blocked by your browser's security settings.";
    default:
      return err.message || 'Microphone access failed.';
  }
}

export default function LexisApp({ navigateTo }) {
  // App.jsx's router already redirects to /auth before this component ever
  // mounts when there's no session, so `session` is guaranteed here.
  const { session, profile, refreshProfile, signOut } = useAuth();

  // Authenticated session UI, not marketing content — same noindex
  // treatment as AuthPage.jsx, both belonging to /app.
  useSeo({
    title: 'LEXIS',
    robots: 'noindex, nofollow'
  });

  const justPaid = new URLSearchParams(window.location.search).get('payment') === 'success';
  // LEXIS Community pay-it-forward add-on (PricingPage.jsx) — only
  // meaningful alongside justPaid, never read on its own.
  const justSponsored = justPaid && new URLSearchParams(window.location.search).get('sponsor') === '1';

  // Stage machine — see the file header. 'welcome' is always the entry
  // point; nothing auto-advances past it.
  const [stage, setStage] = useState('welcome');

  // Feedback (State 04) — result of one POST /api/feedback call, fired by
  // the effect below whenever `stage` becomes 'feedback'. `feedback` can be
  // { confidence, strengths, improvements } or { insufficient: true, message }
  // — see backend/app.mjs's /api/feedback for what decides which shape.
  const [feedback, setFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState(false);

  // History screen (reachable from Welcome, not one of the four core
  // session-flow stages — see HistoryStage.jsx's own header comment).
  // Fetched fresh from GET /api/history every time `stage` becomes
  // 'history', same pattern as the feedback effect below.
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);

  // State Management
  const [voiceState, setVoiceState] = useState('idle'); // see VOICE_STATES doc above
  const [status, setStatus] = useState('Ready when you are'); // human-readable line shown in LiveStage, updated in lockstep with voiceState
  // Surfaces a session that failed before ever connecting (mic denied, SDP
  // exchange failure, token broker error, etc.) — set in startSession's
  // catch block, shown as a banner on WelcomeStage since that's exactly
  // where endSession() routes a never-connected attempt back to. Distinct
  // from `upgradeMessage` below (a specific, expected 403 case with its own
  // "View Pricing" CTA) — this is the generic catch-all. Cleared at the
  // start of every new attempt.
  const [sessionError, setSessionError] = useState('');
  const [transcripts, setTranscripts] = useState([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [tutorLevel, setTutorLevel] = useState(0); // LEXIS's own voice energy, drives the avatar's mouth
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  // True when the 403 was a paying subscriber's fair-use ceiling rather
  // than an exhausted trial — WelcomeStage drops the pricing CTA for it.
  const [upgradeIsFairUse, setUpgradeIsFairUse] = useState(false);
  // Cancel Plan (WelcomeStage's header control, per RefundPage.jsx's
  // "Cancelling a plan" section) — POST /api/stripe/cancel sets Stripe's
  // cancel_at_period_end flag, which leaves profile.subscription_status as
  // 'active' until the period actually ends (the webhook only flips it to
  // 'canceled' once Stripe fires customer.subscription.deleted). So the
  // "won't renew" state has to be tracked locally here rather than read
  // off `profile`, which won't reflect it until the period is over.
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [cancelPeriodEnd, setCancelPeriodEnd] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState(() => {
    try {
      return localStorage.getItem(TARGET_LANGUAGE_STORAGE_KEY) === 'th' ? 'th' : 'en';
    } catch {
      return 'en'; // localStorage can throw in some privacy modes — default, don't crash the page over a preference.
    }
  });
  // Mobile browsers can silently block autoplay on the remote <audio>
  // element — its srcObject is set inside pc.ontrack, which fires
  // asynchronously well after the click that started the session, outside
  // the window some browsers associate with that user gesture. Input (mic)
  // keeps working fine either way, since that's a separate permission; only
  // LEXIS's own voice goes silent, with no error — just a transcript with
  // nothing audible behind it. Surfaced inside LiveStage, driven by this flag.
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
  const transcriptContainerRef = useRef(null);
  const isAssistantSpeakingRef = useRef(false);
  // True only once a session actually reaches pc.connectionState ===
  // 'connected' this attempt — endSession() reads this (not `stage`, which
  // would be a stale-closure read here; see the directionOverride comment
  // on startSession below for the same class of bug elsewhere in this
  // file) to decide whether ending the call should route to Feedback (real
  // conversation happened) or back to Welcome (never actually connected —
  // a mic error, an exhausted trial, a failed SDP exchange; nothing to
  // give feedback on).
  const wasConnectedRef = useRef(false);
  // The direction actually used to mint *this* session's token — captured
  // once at session start rather than read from `targetLanguage` later, so
  // feedback/translation stay correct even in the (currently impossible,
  // but cheap to guard) case that targetLanguage state changes between a
  // session starting and it ending.
  const sessionDirectionRef = useRef('en');
  // Pending grace-window timer for a 'disconnected' connectionState — see
  // RECONNECT_GRACE_MS's comment above.
  const reconnectTimeoutRef = useRef(null);

  // Derived, never independently settable — see voiceState's own comment
  // above for why this replaced two separate booleans that used to have
  // to be kept in sync by hand at every call site.
  const isConnected = ['listening', 'processing', 'speaking', 'interrupted'].includes(voiceState);
  const isConnecting = voiceState === 'connecting' || voiceState === 'reconnecting';

  // Reported: while LEXIS is speaking, the page kept auto-scrolling down
  // to the transcript, dragging the avatar out of view right when you'd
  // want to watch it — every streamed transcript chunk (very frequent,
  // word-by-word while she talks) re-triggered the scroll. Root cause:
  // scrollIntoView() on a sentinel element defaults to block:'start',
  // which scrolls *every* scrollable ancestor needed to satisfy that
  // alignment — including the whole page, not just this bounded transcript
  // box, whenever the box itself isn't fully within the viewport (routine
  // on a phone). Setting scrollTop directly on the transcript container
  // only ever scrolls that one element, never the page around it.
  useEffect(() => {
    const el = transcriptContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcripts]);

  // Drop ?payment=success from the URL once shown, so refreshing this page
  // later doesn't keep re-showing "payment confirmed" indefinitely.
  useEffect(() => {
    if (justPaid) {
      trackEvent('checkout_completed', { metadata: { planTier: profile?.subscription_tier, sponsorAdd: justSponsored } });
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
        } else if (!isConnecting && stage === 'welcome') {
          setStage('topics');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, isConnecting, stage, voiceState]);

  useEffect(() => {
    return () => endSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fires once whenever a just-ended session lands on the Feedback stage —
  // see endSession() below for what puts `stage` here. Reads `transcripts`
  // via closure rather than as a dependency deliberately: the session has
  // already fully ended by the time this runs (no more events can append
  // to it), so it's frozen, and depending on it would just needlessly
  // re-fire this effect on every transcript update during the call.
  useEffect(() => {
    if (stage !== 'feedback') return;
    let cancelled = false;
    setFeedbackLoading(true);
    setFeedbackError(false);
    setFeedback(null);

    (async () => {
      try {
        const { data: { session: freshSession } } = await supabase.auth.getSession();
        if (!freshSession) throw new Error('Not signed in.');
        const res = await fetch(`${BACKEND_URL}/api/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${freshSession.access_token}`
          },
          body: JSON.stringify({ transcripts, direction: sessionDirectionRef.current })
        });
        if (!res.ok) throw new Error(`Feedback request failed: ${res.status}`);
        const data = await res.json();
        if (!cancelled) setFeedback(data);
      } catch (err) {
        console.warn('[LEXIS Feedback Warning]', err);
        if (!cancelled) setFeedbackError(true);
      } finally {
        if (!cancelled) setFeedbackLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Fires whenever `stage` becomes 'history' — always a fresh fetch rather
  // than caching, since a new session's feedback could have just been
  // added since the last visit.
  useEffect(() => {
    if (stage !== 'history') return;
    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError(false);

    (async () => {
      try {
        const { data: { session: freshSession } } = await supabase.auth.getSession();
        if (!freshSession) throw new Error('Not signed in.');
        const res = await fetch(`${BACKEND_URL}/api/history`, {
          headers: { 'Authorization': `Bearer ${freshSession.access_token}` }
        });
        if (!res.ok) throw new Error(`History request failed: ${res.status}`);
        const data = await res.json();
        if (!cancelled) setHistory(Array.isArray(data.history) ? data.history : []);
      } catch (err) {
        console.warn('[LEXIS History Warning]', err);
        if (!cancelled) setHistoryError(true);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

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
        return [...prev.slice(0, -1), { ...last, text: last.text + text }];
      }
      return [...prev, { speaker, text }];
    });
  }, []);

  // Fires once per completed LEXIS turn (see the response.done handler
  // below) — a separate, non-blocking call rather than something the
  // realtime session itself produces inline. See /api/translate's own
  // comment in backend/app.mjs for why. Failures here are deliberately
  // silent: a transcript line just renders without a translation rather
  // than surfacing an error over something as minor as a caption.
  const requestTranslation = useCallback(async (idx, text, direction) => {
    try {
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      if (!freshSession) return;
      const res = await fetch(`${BACKEND_URL}/api/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${freshSession.access_token}`
        },
        body: JSON.stringify({ text, direction })
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.translation) return;
      setTranscripts((prev) => {
        if (idx >= prev.length || prev[idx]?.speaker !== 'lexis') return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], translation: data.translation };
        return next;
      });
    } catch (err) {
      console.warn('[LEXIS Translate Warning]', err);
    }
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
          // Teal for LEXIS, amber for the student — matches the v2026.4
          // semantic palette (teal = "LEXIS is alive", amber = action/self).
          const strokeColor = remoteLevel > localLevel + 8 ? '#2dd4bf' : '#FF9E00';

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

  // directionOverride/topicOverride let the Topics stage start a session
  // with the values just picked, without a stale-closure bug: calling
  // setSelectedTopic(topic) then startSession() in the same handler would
  // still read the *previous* render's selectedTopic below (React batches
  // the state update), so the caller passes the freshly-picked values in
  // directly instead of relying on state having already re-rendered.
  const startSession = async (directionOverride, topicOverride) => {
    if (isConnecting || isConnected) return;

    if (!session) {
      navigateTo('/auth');
      return;
    }

    const direction = directionOverride ?? targetLanguage;
    sessionDirectionRef.current = direction;
    wasConnectedRef.current = false;

    setVoiceState('connecting');
    setStatus('Getting things ready...');
    setUpgradeRequired(false);
    setSessionError('');
    setAudioBlocked(false);

    // Local, not React state: the catch block below needs to know whether
    // *this* attempt already surfaced the trial-exhausted banner (which has
    // its own message + "View Pricing" CTA) so it doesn't also stack the
    // generic sessionError banner on top. Reading the `upgradeRequired`
    // React state there would hit the same stale-closure problem
    // documented on startSession's directionOverride param above —
    // setUpgradeRequired(true) a few lines up doesn't change what
    // `upgradeRequired` evaluates to later in this same synchronous
    // function run, only what it'll be on the *next* render.
    let isUpgradeError = false;

    try {
      // 1. Fetch Ephemeral Token with User JWT
      const tokenRes = await fetch(`${BACKEND_URL}/api/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ direction, topic: topicOverride ?? undefined })
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        // FAIR_USE_REACHED is a paying subscriber hitting their
        // per-period ceiling, not a trial running out — same 403, but
        // answering it with "upgrade your pass" and a pricing link would
        // be telling someone who already pays to pay again.
        if (tokenRes.status === 403 && (err.error === 'TRIAL_EXHAUSTED' || err.error === 'FAIR_USE_REACHED')) {
          const fairUse = err.error === 'FAIR_USE_REACHED';
          const fallback = fairUse
            ? "You've reached this period's fair-use limit. It resets at the start of your next billing period."
            : 'Free trial limit reached. Please upgrade your pass.';
          isUpgradeError = true;
          setUpgradeRequired(true);
          setUpgradeIsFairUse(fairUse);
          setUpgradeMessage(err.message || fallback);
          throw new Error(err.message || fallback);
        }
        throw new Error(err.error || `Broker error status: ${tokenRes.status}`);
      }

      const data = await tokenRes.json();
      const clientSecret = data.client_secret;
      if (!clientSecret) throw new Error('Received invalid client secret from token broker.');

      setStatus('Connecting you to LEXIS...');

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
          // Cancels a pending reconnect-grace timeout if this is a recovery
          // from a 'disconnected' blip, not just the initial connect — a
          // harmless no-op via the ref-null guard when it's the latter.
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
          wasConnectedRef.current = true;
          setStatus('LEXIS is listening');
          setVoiceState('listening');

          // Trigger 30-second Telemetry Heartbeat. Re-fetch the session on
          // every tick rather than closing over the token from session
          // start — supabase-js auto-rotates the JWT roughly hourly, and a
          // long practice session would otherwise start sending a stale
          // token, fail every heartbeat with 401, and silently stop
          // recording usage with no error surfaced to the user. Re-running
          // this on a reconnect recovery too is harmless — it just clears
          // and restarts the same 30s interval.
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
                const fairUse = err.error === 'FAIR_USE_REACHED';
                setUpgradeRequired(true);
                setUpgradeIsFairUse(fairUse);
                setUpgradeMessage(err.message || (fairUse
                  ? "You've reached this period's fair-use limit."
                  : 'Usage limit reached. Please upgrade your pass.'));
                endSession(fairUse ? 'Fair-use limit reached.' : 'Usage limit reached.');
              } else if (res.ok) {
                refreshProfile(); // keeps the header's remaining-time display live
              }
            } catch (e) {
              console.warn('[LEXIS Telemetry Warning]', e);
            }
          }, 30000);

        } else if (pc.connectionState === 'failed') {
          // Unlike 'disconnected' below, the browser only reports 'failed'
          // once it's given up on the ICE negotiation entirely — not
          // something a short grace window can recover from. End for real.
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
          endSession('Connection lost. Tap Start to try again.');

        } else if (pc.connectionState === 'disconnected') {
          // See RECONNECT_GRACE_MS's comment above — give a real recovery a
          // few seconds before treating this as a failure. Only arm one
          // timer at a time (repeated flapping between disconnected states
          // shouldn't stack up timeouts).
          setVoiceState('reconnecting');
          setStatus('Reconnecting...');
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            // Guard against a stale timeout from *this* pc outliving it —
            // if the student already ended this session and started a
            // fresh one in the meantime, pcRef.current now points at that
            // new attempt's connection, not this one, and a still-
            // connecting new session must not get killed by an old timer
            // that was only ever watching the previous one.
            if (pcRef.current === pc && pc.connectionState !== 'connected') {
              endSession('Connection lost. Tap Start to try again.');
            }
          }, RECONNECT_GRACE_MS);
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
          // silently (see the audioBlocked banner in LiveStage).
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
            setVoiceState('speaking');
            setStatus('LEXIS is speaking...');
            // Every barge-in below (auto via VAD, or the manual hand
            // button) explicitly pauses the <audio> element — and pause()
            // doesn't auto-reverse itself just because the same underlying
            // MediaStream keeps producing new frames for the *next*
            // response. Without an explicit play() here, one interruption
            // (even a false one from mic echo picking up LEXIS's own
            // voice) leaves every later reply in the session silent while
            // the transcript keeps working fine, since that's driven by
            // the data channel, not audio element state. Calling play() on
            // an already-playing element is a harmless no-op, so this is
            // safe to run on every response.
            remoteAudioRef.current?.play().catch((playErr) => {
              console.warn('[LEXIS Audio] Resume after barge-in blocked:', playErr);
              setAudioBlocked(true);
            });
          } else if (event.type === 'response.audio_transcript.delta' || event.type === 'response.output_audio_transcript.delta') {
            appendTranscript('lexis', event.delta);
          } else if (event.type === 'conversation.item.input_audio_transcription.completed') {
            appendTranscript('user', event.transcript);
          } else if (event.type === 'input_audio_buffer.speech_started') {
            // Synchronized Client Barge-In
            const wasBargeIn = isAssistantSpeakingRef.current;
            if (wasBargeIn) {
              if (remoteAudioRef.current) {
                remoteAudioRef.current.pause();
                remoteAudioRef.current.currentTime = 0;
              }
              sendClientEvent({ type: 'response.cancel' });
              sendClientEvent({ type: 'output_audio_buffer.clear' });
              isAssistantSpeakingRef.current = false;
            }
            setStatus('Listening...');
            if (wasBargeIn) {
              // A real interruption — flash 'interrupted' briefly ("Your
              // turn") before settling into the ordinary listening state,
              // rather than jumping straight there. Purely a UI moment;
              // the actual barge-in (stopping playback, cancelling the
              // response) already happened synchronously above.
              setVoiceState('interrupted');
              window.setTimeout(() => setVoiceState((current) => (current === 'interrupted' ? 'listening' : current)), 180);
            } else {
              // The student just started talking normally — LEXIS wasn't
              // speaking, so there was nothing to interrupt.
              setVoiceState('listening');
            }
          } else if (event.type === 'input_audio_buffer.speech_stopped') {
            // The student just stopped talking, but LEXIS hasn't started
            // responding yet — server_vad's silence_duration_ms plus
            // whatever the model takes to start generating a reply is a
            // real, sometimes-noticeable gap. Previously the UI just kept
            // saying "Listening..." through that whole gap, which reads as
            // stalled rather than working.
            setVoiceState('processing');
            setStatus('Thinking...');
          } else if (event.type === 'response.done') {
            isAssistantSpeakingRef.current = false;
            setVoiceState('listening');
            setStatus('LEXIS is listening');
            // Kick off the live-translation subtitle for the turn that just
            // finished — see requestTranslation's own comment above for why
            // this is a separate async call rather than blocking anything.
            // translationRequested guards against firing twice for the same
            // entry (response.done can, in principle, land more than once
            // for edge-case turns).
            setTranscripts((prev) => {
              const idx = prev.length - 1;
              const last = prev[idx];
              if (last && last.speaker === 'lexis' && last.text && !last.translationRequested) {
                requestTranslation(idx, last.text, direction);
                return [...prev.slice(0, -1), { ...last, translationRequested: true }];
              }
              return prev;
            });
          }
        } catch (err) {
          console.error('[LEXIS Event Error]', err);
        }
      };

      // 6. SDP Exchange with OpenAI Calls Gateway
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = 'https://api.openai.com/v1/realtime';
      // Must match the model backend/app.mjs's /api/session used to mint
      // this clientSecret — the SDP exchange 404s otherwise (this exact
      // mismatch has broken before; see that endpoint's own comment on
      // OPENAI_MODEL). Previously two independent hardcoded strings kept
      // in sync by hand across two files; now /api/session returns the
      // model it actually used (data.model, above) and this just reads
      // that back, so there's one source of truth instead of two literals
      // that can drift. The 'gpt-realtime' fallback only matters against
      // an old cached backend response shape that predates this field.
      const model = data.model || 'gpt-realtime';

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
      trackEvent('session_connected', { metadata: { direction, subscriptionStatus: profile?.subscription_status } });

    } catch (err) {
      console.error('[LEXIS Session Error]', err);
      // A session that fails before ever connecting routes back to
      // Welcome (see endSession's wasConnectedRef check below) — without
      // this, the error text only ever lived in `status`, which is only
      // rendered inside LiveStage. That's a real bug: any pre-connection
      // failure (mic denied, SDP exchange failure, a generic token-broker
      // error) became completely invisible the moment the student landed
      // back on Welcome, with nothing telling them what went wrong or that
      // anything went wrong at all. upgradeRequired already covers the
      // specific 403 case with its own message/CTA; this is the catch-all
      // for everything else.
      if (!isUpgradeError) {
        setSessionError(err.message);
        reportError('Session Start Failed', err, { direction });
      }
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

  const enableAudio = () => {
    remoteAudioRef.current?.play().then(() => setAudioBlocked(false)).catch((err) => {
      console.warn('[LEXIS Audio] Manual play still failed:', err);
    });
  };

  // Only meaningful before a session starts — the running session's system
  // prompt was already picked when it connected, so this only affects the
  // *next* "Start Talking" tap. Only ever rendered (in WelcomeStage) while
  // not connected/connecting, for exactly that reason.
  const selectTargetLanguage = (lang) => {
    setTargetLanguage(lang);
    try {
      localStorage.setItem(TARGET_LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Privacy-mode localStorage throw — the choice just won't persist
      // across visits; not worth surfacing an error for.
    }
  };

  // WelcomeStage's "Cancel plan" control, after its own two-step confirm.
  // See the cancel* state declarations above for why cancelAtPeriodEnd is
  // tracked here rather than read off `profile`.
  const handleCancelPlan = useCallback(async () => {
    setCancelLoading(true);
    setCancelError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Cancel error: ${res.status}`);
      trackEvent('plan_cancelled', { metadata: { planTier: profile?.subscription_tier } });
      setCancelAtPeriodEnd(true);
      setCancelPeriodEnd(data.currentPeriodEnd || null);
    } catch (err) {
      setCancelError(err.message || 'Could not cancel your plan. Please try again.');
      reportError('Cancel Plan Failed', err);
    } finally {
      setCancelLoading(false);
    }
  }, [session]);

  // Topics stage handler — starts the session immediately with whatever
  // was just tapped (a real topic key, or null for "Just Talk"). Moves to
  // 'live' synchronously so LiveStage's own isConnecting UI (spinner,
  // "Connecting..." status) covers the async gap, rather than showing any
  // connecting state inside TopicStage itself.
  const handlePickTopic = (topicKey) => {
    setStage('live');
    startSession(targetLanguage, topicKey);
  };

  // finalStatus lets a caller that already knows *why* the session is
  // ending say so, instead of this unconditionally stamping over it with a
  // generic message — every failure mode used to collapse into the same
  // uninformative status, which was reported live as a real complaint.
  const endSession = (finalStatus = 'Session ended — see you next time!') => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
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
    isAssistantSpeakingRef.current = false;
    setVoiceState('idle');
    setStatus(finalStatus);
    setAudioLevel(0);
    setTutorLevel(0);
    setAudioBlocked(false);

    // Route to the next stage based on whether a real conversation
    // actually happened this attempt, not on `stage` itself (a stale-
    // closure read here — see wasConnectedRef's own comment above).
    if (wasConnectedRef.current) {
      wasConnectedRef.current = false;
      setStage('feedback');
    } else {
      setStage('welcome');
    }
  };

  // Defensive fallback only — App.jsx's router guarantees a session exists
  // before this component ever mounts.
  if (!session) {
    return <div className="min-h-[100dvh] bg-lexis-navy" />;
  }

  if (stage === 'topics') {
    return <TopicStage onBack={() => setStage('welcome')} onPickTopic={handlePickTopic} />;
  }

  if (stage === 'live') {
    return (
      <LiveStage
        voiceState={voiceState}
        isConnected={isConnected}
        isConnecting={isConnecting}
        status={status}
        tutorLevel={tutorLevel}
        audioLevel={audioLevel}
        canvasRef={canvasRef}
        transcripts={transcripts}
        transcriptContainerRef={transcriptContainerRef}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        isSpeakerMuted={isSpeakerMuted}
        onToggleSpeakerMute={toggleSpeakerMute}
        onInterrupt={forceInterrupt}
        onEndCall={() => endSession()}
        audioBlocked={audioBlocked}
        onEnableAudio={enableAudio}
      />
    );
  }

  if (stage === 'feedback') {
    return (
      <FeedbackStage
        feedback={feedback}
        feedbackLoading={feedbackLoading}
        feedbackError={feedbackError}
        // Safe to read directly here (not via state): frozen at session
        // start and only ever changes on the *next* startSession() call,
        // which can't happen again until this stage is left.
        direction={sessionDirectionRef.current}
        onPracticeAgain={() => setStage('topics')}
        onDone={() => setStage('welcome')}
      />
    );
  }

  if (stage === 'history') {
    return (
      <HistoryStage
        history={history}
        historyLoading={historyLoading}
        historyError={historyError}
        onBack={() => setStage('welcome')}
      />
    );
  }

  // stage === 'welcome'
  return (
    <WelcomeStage
      targetLanguage={targetLanguage}
      onSelectLanguage={selectTargetLanguage}
      onStartTalking={() => setStage('topics')}
      profile={profile}
      justPaid={justPaid}
      justSponsored={justSponsored}
      upgradeRequired={upgradeRequired}
      upgradeMessage={upgradeMessage}
      upgradeIsFairUse={upgradeIsFairUse}
      sessionError={sessionError}
      onDismissSessionError={() => setSessionError('')}
      onViewPricing={() => navigateTo('/pricing')}
      onViewHistory={() => setStage('history')}
      onSignOut={() => { endSession(); signOut(); }}
      onGoHome={() => navigateTo('/')}
      onCancelPlan={handleCancelPlan}
      cancelLoading={cancelLoading}
      cancelError={cancelError}
      cancelAtPeriodEnd={cancelAtPeriodEnd}
      cancelPeriodEnd={cancelPeriodEnd}
    />
  );
}
