import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic, MicOff, Volume2, Sparkles, Activity, ShieldCheck,
  PhoneOff, RotateCcw, Hand, ArrowLeft, LogOut, Clock
} from 'lucide-react';

import LandingPage from './pages/LandingPage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import LexisApp from './pages/LexisApp.jsx';

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

  
