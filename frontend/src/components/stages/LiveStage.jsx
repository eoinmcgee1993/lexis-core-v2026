// frontend/src/components/stages/LiveStage.jsx
//
// State 03 of the LEXIS session flow (see scripts/design/lexis-visual-system.md)
// — the one screen that stays on the dark lexis-navy canvas. Everything
// else (Welcome, Topics, Feedback) is warm/light. Owns none of the WebRTC
// session lifecycle itself — LexisApp.jsx still does all of that — this is
// purely presentation plus the translation-subtitle fetch, which is scoped
// here (rather than in LexisApp.jsx) because it's a live-stage-only concern.
import React, { Suspense, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Hand, PhoneOff, RotateCcw, X, AlertCircle } from 'lucide-react';
import TutorAvatarPhoto from '../TutorAvatarPhoto';

const AVATAR_PHOTO_URL = import.meta.env.VITE_AVATAR_PHOTO_URL;
const AVATAR_GLB_URL = import.meta.env.VITE_AVATAR_GLB_URL;
const TutorAvatar3D = AVATAR_GLB_URL ? React.lazy(() => import('../TutorAvatar3D')) : null;

// The tutor's face. A live avatar was the actual point of the product — an
// abstract pulsing ring never was. Mouth height is driven by tutorLevel
// (LEXIS's own voice energy specifically), so it opens when LEXIS talks and
// stays shut while the student is the one speaking.
//
// This is the fallback face, always available with zero extra deps. When
// VITE_AVATAR_GLB_URL is set, the TutorAvatar wrapper below swaps in the
// modeled 3D version instead (same tutorLevel signal, richer face). Colors
// here follow the v2026.4 "live" accent (teal) rather than the old
// cyan/emerald pair, for consistency with everything else on this screen —
// this is a fallback path (AVATAR_PHOTO_URL is set in production), so it's
// a lower-traffic surface, but still worth keeping in the same system.
function TutorAvatarSVG({ isConnected, isConnecting, tutorLevel }) {
  const mouthHeight = 4 + Math.min(18, (tutorLevel / 100) * 18);
  const active = isConnected || isConnecting;
  return (
    <svg viewBox="0 0 100 100" className="w-20 h-20 md:w-28 md:h-28" role="img" aria-label="LEXIS tutor avatar">
      <defs>
        <radialGradient id="lexisFaceGradient" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={active ? '#0f766e' : '#1e293b'} />
          <stop offset="100%" stopColor={active ? '#042f2e' : '#0f172a'} />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#lexisFaceGradient)" stroke={isConnected ? '#2dd4bf' : '#475569'} strokeWidth="2" />
      <ellipse cx="34" cy="42" rx="5" ry="6" className="lexis-avatar-eye" fill={active ? '#5eead4' : '#475569'} />
      <ellipse cx="66" cy="42" rx="5" ry="6" className="lexis-avatar-eye" fill={active ? '#5eead4' : '#475569'} />
      <rect
        x="35"
        y={62 - mouthHeight / 2}
        width="30"
        height={mouthHeight}
        rx={mouthHeight / 2}
        fill={isConnected ? '#FF9E00' : '#334155'}
        style={{ transition: 'height 60ms ease-out, y 60ms ease-out' }}
      />
    </svg>
  );
}

// Suspense only covers the *pending* state — a bad VITE_AVATAR_GLB_URL
// throws past it with no boundary to catch it. See PR #13.
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

// Status text color per voiceState — see LexisApp.jsx's voiceState doc for
// what each value means. isConnected/isConnecting (still passed
// separately) already gate the avatar's binary active/inactive look;
// this is the finer-grained per-state color on top of that.
const STATUS_COLOR = {
  idle: 'text-slate-400',
  connecting: 'text-lexis-action',
  listening: 'text-teal-300/90',
  processing: 'text-lexis-action',
  speaking: 'text-teal-100',
  interrupted: 'text-teal-300/90',
  reconnecting: 'text-lexis-action',
  error: 'text-rose-400'
};

export default function LiveStage({
  voiceState,
  isConnected,
  isConnecting,
  status,
  tutorLevel,
  audioLevel,
  canvasRef,
  transcripts,
  transcriptContainerRef,
  isMuted,
  onToggleMute,
  isSpeakerMuted,
  onToggleSpeakerMute,
  onInterrupt,
  onEndCall,
  audioBlocked,
  onEnableAudio
}) {
  return (
    <div className="relative min-h-[100dvh] bg-lexis-navy text-white font-sans flex flex-col items-center p-4 md:p-8 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-[max(2rem,env(safe-area-inset-bottom))] overflow-hidden">
      {/* Ambient life for the dark canvas — before the mic/analyser data
          exists to drive the canvas waveform (canvasRef below), a plain
          lexis-navy fill reads as a dead black screen, especially through
          "Getting things ready..." while still connecting. This is a
          large, slow-pulsing teal glow centered behind everything, always
          present at low opacity and independent of isConnected — it gets
          brighter once the ring's own gradient kicks in, but the room
          never goes fully flat before that. Two small floating dots use
          the .animate-float keyframe (defined in tailwind.config.js,
          previously unused anywhere) for a touch of ambient motion. */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[28rem] h-[28rem] bg-teal-500/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>
      <div className="absolute top-1/4 left-1/5 w-3 h-3 bg-teal-400/30 rounded-full blur-sm pointer-events-none animate-float" />
      <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-lexis-action/30 rounded-full blur-sm pointer-events-none animate-float" style={{ animationDelay: '2s' }} />

      {/* Minimal top bar — per the v2026.4 design review, Live Conversation
          should stay out of the way: no logo, no nav, just a way out.
          Mirrors the "End Session" control in the action bar below (kept
          for its visible label / mute-adjacent grouping) so there are two
          equally obvious ways to leave, matching common chat-app patterns. */}
      <div className="relative z-10 w-full max-w-4xl flex justify-end">
        <button
          onClick={onEndCall}
          title="End session"
          className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {audioBlocked && (
        <div className="relative z-10 w-full max-w-4xl mt-2 p-4 bg-lexis-action/10 border border-lexis-action/30 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-lexis-action text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>LEXIS is talking, but your browser blocked the audio. Tap to enable it.</span>
          </div>
          <button
            onClick={onEnableAudio}
            className="px-4 py-1.5 bg-lexis-action text-lexis-navy font-bold text-xs rounded-xl flex items-center space-x-1 flex-shrink-0"
          >
            <Volume2 className="w-4 h-4" />
            <span>Enable Audio</span>
          </button>
        </div>
      )}

      <main className="relative z-10 w-full max-w-4xl my-auto py-8 flex flex-col items-center">
        <div className="relative flex items-center justify-center my-6">
          <canvas ref={canvasRef} width={320} height={320} className="absolute pointer-events-none" />
          <div
            className={`w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center transition-all duration-300 ${
              isConnected
                ? 'bg-gradient-to-tr from-teal-600/20 via-teal-500/10 to-teal-400/20 border border-teal-400/40 shadow-[0_0_60px_rgba(45,212,191,0.25)]'
                : isConnecting
                ? 'bg-gradient-to-tr from-teal-600/10 via-teal-500/5 to-transparent border border-teal-400/20 motion-safe:animate-pulse-slow'
                : 'bg-lexis-navy-2 border border-white/10'
            } ${voiceState === 'reconnecting' ? 'border-lexis-action/50 motion-safe:animate-pulse' : ''}`}
            style={{ transform: isConnected ? `scale(${1 + audioLevel / 350})` : 'scale(1)' }}
          >
            <div className={`w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden flex items-center justify-center border ${
              isConnected ? 'bg-teal-950/40 border-teal-400/50 shadow-inner' : 'bg-white/5 border-white/10'
            }`}>
              <TutorAvatar isConnected={isConnected} isConnecting={isConnecting} tutorLevel={tutorLevel} />
            </div>
          </div>
          <div className="absolute -bottom-8 text-center">
            <p className={`text-sm ${STATUS_COLOR[voiceState] || 'text-teal-300/90'}`}>{status}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 mt-8 bg-white/5 border border-white/10 p-2 rounded-2xl shadow-xl">
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute your mic' : 'Mute your mic'}
            className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border text-[10px] font-medium ${isMuted ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-white/5 border-white/10 text-slate-200'}`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span>{isMuted ? 'Muted' : 'Mic on'}</span>
          </button>
          <button
            onClick={onToggleSpeakerMute}
            title={isSpeakerMuted ? 'Unmute LEXIS' : 'Mute LEXIS'}
            className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border text-[10px] font-medium ${isSpeakerMuted ? 'bg-lexis-action/20 border-lexis-action/50 text-lexis-action' : 'bg-white/5 border-white/10 text-slate-200'}`}
          >
            {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            <span>{isSpeakerMuted ? 'Silenced' : 'Sound on'}</span>
          </button>
          <button
            onClick={onInterrupt}
            disabled={voiceState !== 'speaking'}
            title={voiceState === 'speaking' ? 'Jump in and interrupt LEXIS' : 'Nothing to interrupt right now'}
            className="flex flex-col items-center gap-1 px-3 py-2.5 bg-white/5 border border-white/10 text-slate-200 rounded-xl hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none text-[10px] font-medium transition-opacity"
          >
            <Hand className="w-5 h-5 text-lexis-action" />
            <span>Interrupt</span>
          </button>
          <button
            onClick={onEndCall}
            className="flex flex-col items-center gap-1 px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold rounded-xl text-[10px]"
          >
            {isConnecting ? <RotateCcw className="w-5 h-5 animate-spin" /> : <PhoneOff className="w-5 h-5" />}
            <span>End Session</span>
          </button>
        </div>

        {/* Transcript — each LEXIS line shows the actual English/Thai text
            it spoke, plus a second, muted translation line once
            /api/translate resolves for that turn (see requestTranslation
            in LexisApp.jsx). Translation is per-entry and async, so a line
            can render with no translation yet for a moment — that's
            expected, not a bug, and mirrors how real closed captions lag
            slightly behind speech. */}
        {transcripts.length > 0 && (
          <div ref={transcriptContainerRef} className="w-full mt-10 bg-white/5 border border-white/10 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-3">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Conversation</div>
            {transcripts.map((item, idx) => (
              <div key={idx} className={`text-xs p-3 rounded-xl ${item.speaker === 'lexis' ? 'bg-teal-950/30 border border-teal-800/30 text-teal-100 ml-4' : 'bg-white/5 border border-white/10 text-slate-300 mr-4'}`}>
                <span className="font-bold uppercase mr-2 opacity-60">{item.speaker === 'lexis' ? 'LEXIS:' : 'You:'}</span>
                {item.text}
                {item.speaker === 'lexis' && item.translation && (
                  <div className="mt-1.5 pt-1.5 border-t border-teal-800/30 text-teal-300/70 italic">
                    {item.translation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
