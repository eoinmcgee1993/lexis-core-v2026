// frontend/src/pages/StudioPage.jsx
//
// /studio — text-to-video through Higgsfield (Seedance 2.0), for the
// accounts on the backend's HIGGSFIELD_ALLOWED_EMAILS list. Built 23 Sep
// 2026 so marketing video can be made from inside the product rather than
// in a separate console. Anyone else who opens /studio is told it is not
// enabled for their account; the backend is what enforces that, this page
// only reports it.
//
// The browser never talks to Higgsfield. It talks to our backend, which
// holds the API key, owns the request lifecycle and records each render
// against the signed-in user (backend/app.mjs, "HIGGSFIELD GENERATION").
// What this page does with that:
//
//   - Submit is disabled from click until the server answers, and while a
//     render is in flight. The server enforces one-at-a-time anyway (409);
//     this just stops the double-click from being a visible error.
//   - Polling starts at 2s and backs off by 1.5x to 10s, with jitter —
//     Higgsfield's own documented schedule. It stops on a terminal status,
//     pauses while the tab is hidden, and gives up after CLIENT_TIMEOUT_MS
//     with a "check again" button rather than polling a stuck render
//     forever. The server keeps the truth either way: reopen the page and
//     an unfinished render picks up where it was.
//   - Output URLs are Higgsfield's, kept for at least seven days (their
//     docs). The copy says so, so nobody treats this list as an archive.
//
// Parameter options mirror the model's published JSON schema, same as the
// backend validator. They are repeated here only to build the form; the
// backend is the one that refuses anything outside them.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Clapperboard, Download, Loader2, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useSeo } from '../lib/useSeo';
import LexisMark from '../components/LexisMark';
import AppLink from '../components/AppLink';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const MODEL = 'bytedance/seedance-2.0/text-to-video';
const RESOLUTIONS = ['480p', '720p', '1080p', '4k'];
const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'];
const POLL_START_MS = 2_000;
const POLL_MAX_MS = 10_000;
const CLIENT_TIMEOUT_MS = 20 * 60_000;

const TERMINAL_COPY = {
  completed: 'Done',
  failed: 'Failed',
  nsfw: 'Blocked by moderation',
  canceled: 'Cancelled',
  submit_failed: 'Not started',
  timed_out: 'Taking longer than expected'
};
const STEPS = [
  { key: 'queued', label: 'Queued' },
  { key: 'in_progress', label: 'Rendering' },
  { key: 'completed', label: 'Ready' }
];

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Your session has ended. Sign in again.');
  return { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' };
}

async function api(path, options = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, { ...options, headers: await authHeaders() });
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, ok: res.ok, body };
}

function elapsed(from) {
  const s = Math.max(0, Math.round((Date.now() - Date.parse(from)) / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
}

export default function StudioPage({ navigateTo }) {
  useSeo({ title: 'Studio | LEXIS', robots: 'noindex, nofollow' });
  const { user } = useAuth();

  const [access, setAccess] = useState('loading'); // loading | ok | not_enabled | not_configured | error
  const [limits, setLimits] = useState({ daily: null, promptMaxChars: 2000 });
  const [history, setHistory] = useState([]);
  const [current, setCurrent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [pollStalled, setPollStalled] = useState(false);
  const [, setTick] = useState(0);

  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState('720p');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [generateAudio, setGenerateAudio] = useState(true);

  const pollRef = useRef({ timer: null, delay: POLL_START_MS, startedAt: 0, id: null });

  const stopPolling = useCallback(() => {
    clearTimeout(pollRef.current.timer);
    pollRef.current.timer = null;
    pollRef.current.id = null;
  }, []);

  const mergeIntoHistory = useCallback((g) => {
    setHistory((h) => [g, ...h.filter((x) => x.id !== g.id)].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
  }, []);

  const pollOnce = useCallback(async (id) => {
    if (pollRef.current.id !== id) return;
    if (document.hidden) {
      // Resumed by the visibilitychange listener below.
      pollRef.current.timer = null;
      return;
    }
    if (Date.now() - pollRef.current.startedAt > CLIENT_TIMEOUT_MS) {
      setPollStalled(true);
      stopPolling();
      return;
    }
    try {
      const { status, body } = await api(`/api/generations/${id}`);
      if (pollRef.current.id !== id) return;
      if (status === 200 && body?.generation) {
        setCurrent(body.generation);
        mergeIntoHistory(body.generation);
        if (!body.generation.active) { stopPolling(); return; }
      }
      // Anything else (429, 5xx, offline) is transient here: keep going,
      // just slower.
    } catch { /* network — retried on the next tick */ }
    const p = pollRef.current;
    p.delay = Math.min(p.delay * 1.5, POLL_MAX_MS);
    p.timer = setTimeout(() => pollOnce(id), p.delay + Math.random() * 500);
  }, [mergeIntoHistory, stopPolling]);

  const startPolling = useCallback((id) => {
    stopPolling();
    setPollStalled(false);
    pollRef.current = { timer: null, delay: POLL_START_MS, startedAt: Date.now(), id };
    pollRef.current.timer = setTimeout(() => pollOnce(id), POLL_START_MS);
  }, [pollOnce, stopPolling]);

  // Initial load: access check, limits, history, and resuming anything
  // still running from a previous visit.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status, body } = await api('/api/generations');
        if (cancelled) return;
        if (status === 403) return setAccess('not_enabled');
        if (status === 503) return setAccess('not_configured');
        if (status !== 200) return setAccess('error');
        setAccess('ok');
        setLimits(body.limits || limits);
        setHistory(body.generations || []);
        const running = (body.generations || []).find((g) => g.active);
        if (running) { setCurrent(running); startPolling(running.id); }
        else if (body.generations?.[0]) setCurrent(body.generations[0]);
      } catch {
        if (!cancelled) setAccess('error');
      }
    })();
    return () => { cancelled = true; stopPolling(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onVisible = () => {
      const p = pollRef.current;
      if (!document.hidden && p.id && !p.timer) {
        p.delay = POLL_START_MS;
        p.timer = setTimeout(() => pollOnce(p.id), 0);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [pollOnce]);

  // Re-render once a second while something is running, for the elapsed clock.
  const running = Boolean(current?.active);
  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const promptTrimmed = prompt.trim();
  const canSubmit = access === 'ok' && !submitting && !running && promptTrimmed.length > 0 && promptTrimmed.length <= limits.promptMaxChars;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setFormError('');
    try {
      const { status, body } = await api('/api/generations', {
        method: 'POST',
        body: JSON.stringify({
          model: MODEL,
          input: { prompt: promptTrimmed, duration, resolution, aspect_ratio: aspectRatio, generate_audio: generateAudio }
        })
      });
      if (status === 202 && body?.generation) {
        setCurrent(body.generation);
        mergeIntoHistory(body.generation);
        startPolling(body.generation.id);
      } else {
        setFormError(body?.error || `Something went wrong (${status}).`);
        if (status === 409) {
          // Already running elsewhere (another tab): find it and follow it.
          const list = await api('/api/generations');
          const active = list.body?.generations?.find((g) => g.active);
          if (active) { setCurrent(active); startPolling(active.id); }
        }
      }
    } catch (err) {
      setFormError(err.message || 'Could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async () => {
    if (!current) return;
    const { body } = await api(`/api/generations/${current.id}/cancel`, { method: 'POST' });
    if (body?.generation) { setCurrent(body.generation); mergeIntoHistory(body.generation); }
    if (body?.error) setFormError(body.error);
  };

  const checkAgain = () => { if (current) startPolling(current.id); };

  const stepIndex = current ? STEPS.findIndex((s) => s.key === current.status) : -1;

  return (
    <div className="min-h-[100dvh] lexis-canvas-gradient text-lexis-ink font-sans">
      <header className="w-full max-w-4xl mx-auto p-4 sm:p-6 flex items-center justify-between border-b border-lexis-ink/10">
        <AppLink to="/app" navigateTo={navigateTo} className="flex items-center space-x-2 text-sm text-lexis-ink/70 hover:text-lexis-ink transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>App</span>
        </AppLink>
        <div className="flex items-center space-x-3">
          <LexisMark className="w-9 h-9" />
          <span className="text-lg font-display font-semibold">LEXIS Studio</span>
        </div>
        <span className="hidden sm:inline text-xs text-lexis-ink/60 truncate max-w-[30%]" title={user?.email}>{user?.email}</span>
        <span className="w-12 sm:hidden" aria-hidden="true" />
      </header>

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {access === 'loading' && (
          <p className="flex items-center gap-2 text-sm text-lexis-ink/70"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading…</p>
        )}
        {access === 'not_enabled' && (
          <Notice title="Studio is not enabled for this account">
            Video generation is billed per render, so it is switched on per account. Ask the LEXIS owner to add your email.
          </Notice>
        )}
        {access === 'not_configured' && (
          <Notice title="Studio is not configured yet">
            The server has no Higgsfield credentials. See backend/.env.example for HF_API_KEY_ID and HF_API_KEY_SECRET.
          </Notice>
        )}
        {access === 'error' && (
          <Notice title="Could not load Studio">Check your connection and reload the page.</Notice>
        )}

        {access === 'ok' && (
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <form onSubmit={submit} className="space-y-5" aria-describedby="studio-cost-note">
              <div>
                <h1 className="font-display font-semibold text-2xl sm:text-3xl">Text to video</h1>
                <p id="studio-cost-note" className="mt-1 text-sm text-lexis-ink/70">
                  Seedance 2.0 via Higgsfield. Each render uses account credits
                  {limits.daily ? `; up to ${limits.daily} per 24 hours` : ''}. One at a time.
                </p>
              </div>

              <label className="block">
                <span className="text-sm font-semibold">Prompt</span>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={5}
                  maxLength={limits.promptMaxChars}
                  placeholder="A cinematic tracking shot along a sunlit coastal road"
                  className="mt-1 w-full rounded-xl border border-lexis-ink/15 bg-white/80 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                <span className="text-xs text-lexis-ink/60">{prompt.length} / {limits.promptMaxChars}</span>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-semibold">Duration: {duration}s</span>
                  <input type="range" min={4} max={15} step={1} value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="mt-3 w-full accent-teal-600" />
                </label>
                <Select label="Resolution" value={resolution} onChange={setResolution} options={RESOLUTIONS} />
                <Select label="Aspect ratio" value={aspectRatio} onChange={setAspectRatio} options={ASPECT_RATIOS} />
                <label className="flex items-center gap-2 mt-6 text-sm font-semibold">
                  <input type="checkbox" checked={generateAudio} onChange={(e) => setGenerateAudio(e.target.checked)} className="w-4 h-4 accent-teal-600" />
                  Generate audio
                </label>
              </div>

              {formError && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{formError}</p>}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-lexis-action px-5 py-3 font-semibold text-lexis-ink shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed motion-safe:active:scale-[0.98]"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Clapperboard className="w-4 h-4" aria-hidden="true" />}
                {submitting ? 'Starting…' : running ? 'A video is rendering…' : 'Generate video'}
              </button>
            </form>

            <section aria-live="polite" className="space-y-4">
              {!current && (
                <div className="rounded-3xl border border-dashed border-lexis-ink/20 p-8 text-center text-sm text-lexis-ink/60">
                  Your video appears here.
                </div>
              )}
              {current && (
                <div className="rounded-3xl bg-white/80 border border-lexis-ink/10 p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">
                      {current.active ? 'Working' : TERMINAL_COPY[current.status]}
                    </span>
                    <span className="text-xs text-lexis-ink/60">{running ? elapsed(current.createdAt) : new Date(current.createdAt).toLocaleString()}</span>
                  </div>

                  {current.active && (
                    <ol className="flex items-center gap-2 text-xs">
                      {STEPS.map((s, i) => (
                        <li key={s.key} className={`flex-1 rounded-full px-3 py-1.5 text-center ${i <= stepIndex ? 'bg-teal-600 text-white' : 'bg-lexis-ink/5 text-lexis-ink/60'} ${i === stepIndex ? 'motion-safe:animate-pulse' : ''}`}>
                          {s.label}
                        </li>
                      ))}
                    </ol>
                  )}

                  <p className="text-sm text-lexis-ink/80 line-clamp-3">{current.input?.prompt}</p>
                  <p className="text-xs text-lexis-ink/60">
                    {current.input?.duration}s · {current.input?.resolution} · {current.input?.aspect_ratio}{current.input?.generate_audio ? ' · audio' : ''}
                  </p>

                  {current.status === 'completed' && current.outputUrl && (
                    <>
                      <video src={current.outputUrl} controls playsInline className="w-full rounded-2xl bg-lexis-navy" />
                      <a href={current.outputUrl} target="_blank" rel="noopener noreferrer" download
                        className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:underline">
                        <Download className="w-4 h-4" aria-hidden="true" /> Download
                      </a>
                      <p className="text-xs text-lexis-ink/60">Higgsfield keeps files for at least seven days. Download anything you want to keep.</p>
                    </>
                  )}
                  {current.error && current.status !== 'completed' && (
                    <p className="text-sm text-red-700">{current.error}</p>
                  )}

                  <div className="flex gap-3">
                    {current.status === 'queued' && (
                      <button type="button" onClick={cancel} className="inline-flex items-center gap-1.5 text-sm text-lexis-ink/70 hover:text-lexis-ink">
                        <X className="w-4 h-4" aria-hidden="true" /> Cancel
                      </button>
                    )}
                    {(pollStalled || current.status === 'timed_out') && (
                      <button type="button" onClick={checkAgain} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700">
                        <RefreshCw className="w-4 h-4" aria-hidden="true" /> Check again
                      </button>
                    )}
                  </div>
                  {pollStalled && (
                    <p className="text-xs text-lexis-ink/60">Stopped checking automatically after 20 minutes. The render is still tracked; check again any time.</p>
                  )}
                </div>
              )}

              {history.length > 1 && (
                <div>
                  <h2 className="text-sm font-semibold mb-2">Recent</h2>
                  <ul className="space-y-1.5">
                    {history.filter((g) => g.id !== current?.id).slice(0, 10).map((g) => (
                      <li key={g.id}>
                        <button type="button"
                          onClick={() => { setCurrent(g); if (g.active) startPolling(g.id); }}
                          className="w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-white/70">
                          <span className="truncate">{g.input?.prompt}</span>
                          <span className="text-xs text-lexis-ink/60 flex-shrink-0">{g.active ? 'Working' : TERMINAL_COPY[g.status]}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-lexis-ink/15 bg-white/80 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Notice({ title, children }) {
  return (
    <div className="max-w-xl rounded-3xl bg-white/80 border border-lexis-ink/10 p-6">
      <h1 className="font-display font-semibold text-xl mb-2">{title}</h1>
      <p className="text-sm text-lexis-ink/75">{children}</p>
    </div>
  );
}
