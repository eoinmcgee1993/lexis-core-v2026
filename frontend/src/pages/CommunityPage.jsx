import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  Globe2,
  Heart,
  Loader2,
  Mail,
  MessageCircle,
  Users,
  WalletCards
} from 'lucide-react';
import LexisMark from '../components/LexisMark';
import { useSeo } from '../lib/useSeo';
import { SITE_URL } from '../data/structuredData';
import { SPONSOR_ADDON_THB } from '../content/facts';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const API_BASE = `${BACKEND_URL}/api/v1/community`;

const EMPTY_TELEMETRY = {
  studentsSupported: 0,
  practiceHours: 0,
  communityPartners: 0,
  fundsDeployedThb: 0
};

const DOOR_CARDS = [
  {
    icon: BookOpen,
    eyebrow: 'Education',
    title: 'Prepare for the next room.',
    body: 'Practise university interviews, presentations, academic conversations and international applications before the real moment arrives.'
  },
  {
    icon: BriefcaseBusiness,
    eyebrow: 'Employment',
    title: 'Walk into the interview ready.',
    body: 'Build the confidence to communicate with employers, clients and remote teams when the conversation actually matters.'
  },
  {
    icon: WalletCards,
    eyebrow: 'Business',
    title: 'Take the conversation further.',
    body: 'Practise communicating with international customers, vendors and cross-border partners without waiting for the perfect words.'
  },
  {
    icon: Globe2,
    eyebrow: 'Mobility',
    title: 'Move through the world with confidence.',
    body: 'Rehearse travel, everyday interactions and practical situations so language becomes something you use, not something you fear.'
  }
];

const PARTNER_TYPES = [
  ['school', 'Public school'],
  ['nonprofit', 'Non-profit'],
  ['youth_center', 'Youth center']
];

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value) || 0);
}

function formatThb(value) {
  return `฿${formatNumber(value)}`;
}

export default function CommunityPage({ navigateTo }) {
  const [contributors, setContributors] = useState(2500);
  const [telemetry, setTelemetry] = useState(EMPTY_TELEMETRY);
  const [telemetryLoading, setTelemetryLoading] = useState(true);
  const [telemetryError, setTelemetryError] = useState(false);
  const [form, setForm] = useState({
    organizationName: '',
    organizationType: 'school',
    locationRegion: '',
    contactEmail: '',
    overview: ''
  });
  const [submitState, setSubmitState] = useState('idle');
  const [submitError, setSubmitError] = useState('');

  useSeo({
    title: 'LEXIS Community | Speaking opens doors',
    description: 'LEXIS Community is building a new model for language access, where everyday speaking practice can help create access for students and youth organisations.',
    canonical: `${SITE_URL}/community`
  });

  useEffect(() => {
    let cancelled = false;

    async function loadTelemetry() {
      setTelemetryLoading(true);
      setTelemetryError(false);
      try {
        const response = await fetch(`${API_BASE}/telemetry`, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`Telemetry request failed: ${response.status}`);
        const data = await response.json();
        if (!cancelled) {
          setTelemetry({
            studentsSupported: Number(data.studentsSupported) || 0,
            practiceHours: Number(data.practiceHours) || 0,
            communityPartners: Number(data.communityPartners) || 0,
            fundsDeployedThb: Number(data.fundsDeployedThb) || 0
          });
        }
      } catch {
        if (!cancelled) {
          setTelemetryError(true);
          setTelemetry(EMPTY_TELEMETRY);
        }
      } finally {
        if (!cancelled) setTelemetryLoading(false);
      }
    }

    loadTelemetry();
    return () => { cancelled = true; };
  }, []);

  const calculatedFund = useMemo(() => contributors * SPONSOR_ADDON_THB, [contributors]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitPartnerApplication = async (event) => {
    event.preventDefault();
    setSubmitState('submitting');
    setSubmitError('');

    try {
      const response = await fetch(`${API_BASE}/partner-apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'We couldn’t submit the application. Please try again.');
      setSubmitState('success');
      setForm({ organizationName: '', organizationType: 'school', locationRegion: '', contactEmail: '', overview: '' });
    } catch (error) {
      setSubmitState('error');
      setSubmitError(error.message || 'We couldn’t submit the application. Please try again.');
    }
  };

  return (
    <div className="min-h-screen lexis-canvas-gradient text-lexis-ink font-sans">
      <header className="sticky top-0 z-30 border-b border-lexis-ink/10 bg-lexis-canvas/90 backdrop-blur-md">
        <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => navigateTo('/')}
            className="inline-flex items-center gap-2 text-sm text-lexis-ink/55 hover:text-lexis-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-600/10 border border-teal-600/20 rounded-xl text-teal-700">
              <LexisMark className="w-5 h-5" />
            </div>
            <span className="text-lg font-display font-semibold">LEXIS</span>
          </div>
          <button
            onClick={() => navigateTo('/pricing')}
            className="text-xs sm:text-sm font-semibold text-teal-700 hover:text-teal-800 transition-colors"
          >
            Try LEXIS
          </button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_15%,rgba(15,118,110,0.12),transparent_42%)]" />
          <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 pb-24 sm:pb-32 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-700/15 bg-white/60 text-[11px] font-semibold tracking-[0.16em] uppercase text-teal-800 mb-7">
              <Heart className="w-3.5 h-3.5" /> LEXIS Community
            </div>
            <h1 className="font-display font-semibold tracking-tight text-5xl sm:text-7xl lg:text-8xl leading-[0.95] max-w-5xl mx-auto">
              Speaking opens doors.
            </h1>
            <p className="mt-8 text-lg sm:text-xl leading-relaxed text-lexis-ink/65 max-w-3xl mx-auto">
              A language isn’t just something you learn. It’s something you use to enter the world. A confident conversation can lead to an interview. An interview can lead to a job. A job can lead to independence.
            </p>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-lexis-ink/80 max-w-2xl mx-auto">
              LEXIS Community exists to ensure that access to that opportunity isn’t limited to the people who can afford it.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <button
                onClick={() => navigateTo('/pricing')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-lexis-action text-white font-semibold text-sm hover:bg-lexis-action-dark transition-colors shadow-lg shadow-lexis-action/15"
              >
                Subscribe & Add ฿{SPONSOR_ADDON_THB}
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#partner"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/80 border border-lexis-ink/10 text-lexis-ink font-semibold text-sm hover:border-teal-700/30 transition-colors"
              >
                Partner With LEXIS
                <ArrowRight className="w-4 h-4 text-teal-700" />
              </a>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-20 items-start">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-teal-700">The opportunity gap</p>
              <h2 className="mt-4 font-display font-semibold text-4xl sm:text-5xl leading-tight">The world doesn’t give everyone the same starting line.</h2>
            </div>
            <div className="space-y-7 text-base sm:text-lg leading-relaxed text-lexis-ink/65">
              <p>For many students, especially young people growing up with limited access to spoken English education, the barrier isn’t intelligence. It isn’t ambition. It isn’t potential.</p>
              <p className="text-2xl sm:text-3xl font-display font-semibold text-lexis-ink">It’s opportunity.</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  ['The practice paradox', 'Knowing grammar and vocabulary doesn’t automatically make a live conversation feel easy.'],
                  ['The confidence bottleneck', 'Grades don’t always show how ready someone feels when an interviewer asks the first question.'],
                  ['The resource barrier', 'Consistent conversation practice can depend on tutors, time, money and geography.']
                ].map(([title, body]) => (
                  <article key={title} className="bg-white/75 border border-lexis-ink/10 rounded-2xl p-5">
                    <h3 className="font-display font-semibold text-base text-lexis-ink">{title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-lexis-ink/60">{body}</p>
                  </article>
                ))}
              </div>
              <p>Our core belief is simple: speaking requires something even more basic than a formal lesson. It requires someone, or something, willing to listen.</p>
            </div>
          </div>
        </section>

        <section className="bg-lexis-ink text-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28 text-center">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-teal-300">The core idea</p>
            <h2 className="mt-5 font-display font-semibold text-4xl sm:text-6xl lg:text-7xl leading-tight max-w-5xl mx-auto">Your practice can create someone else’s opportunity.</h2>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-teal-700">The LEXIS Community Loop</p>
            <h2 className="mt-4 font-display font-semibold text-4xl sm:text-5xl leading-tight">How one subscription creates access for someone else.</h2>
          </div>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              ['01', 'Practice', 'You subscribe to LEXIS for your own speaking practice.'],
              ['02', 'Support', `You opt to add ฿${SPONSOR_ADDON_THB} to your billing cycle.`],
              ['03', 'Fund', 'Contributions are pooled into the LEXIS Community Fund.'],
              ['04', 'Access', 'Community access is provided to eligible partner organisations.'],
              ['05', 'Opportunity', 'Students build confidence for real-world interviews and study.'],
              ['06', 'Repeat', 'As those students grow, the network expands.']
            ].map(([number, title, body]) => (
              <article key={number} className="bg-white border border-lexis-ink/10 rounded-2xl p-6 min-h-[190px] flex flex-col">
                <span className="text-xs font-semibold text-teal-700">{number}</span>
                <h3 className="mt-5 font-display font-semibold text-2xl">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-lexis-ink/60">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-20 sm:pb-28">
          <div className="rounded-3xl bg-white border border-lexis-ink/10 p-7 sm:p-10 lg:p-14 shadow-sm">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-teal-700">Why ฿{SPONSOR_ADDON_THB}?</p>
                <h2 className="mt-4 font-display font-semibold text-4xl sm:text-5xl leading-tight">Small actions. Collective scale.</h2>
                <p className="mt-6 text-base leading-relaxed text-lexis-ink/65">Participation shouldn’t require generosity to become a burden. We didn’t want Community to depend on a handful of large donors. We wanted everyday people using LEXIS to be able to participate.</p>
                <p className="mt-4 text-base leading-relaxed text-lexis-ink/65">฿{SPONSOR_ADDON_THB} isn’t supposed to change the world on its own. But thousands of people doing something small can create something surprisingly large.</p>
                <p className="mt-6 font-display font-semibold text-xl">Learn something yourself. Help someone else access it.</p>
              </div>
              <div className="rounded-2xl bg-lexis-canvas border border-lexis-ink/10 p-6 sm:p-8">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.14em] uppercase text-lexis-ink/45">Contributing subscribers</p>
                    <p className="mt-2 font-display font-semibold text-5xl sm:text-6xl">{formatNumber(contributors)}</p>
                  </div>
                  <p className="text-sm text-lexis-ink/45">per billing cycle</p>
                </div>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={contributors}
                  onChange={(event) => setContributors(Number(event.target.value))}
                  aria-label="Number of contributing subscribers"
                  className="w-full mt-8 accent-teal-700"
                />
                <div className="flex justify-between text-[11px] text-lexis-ink/35 mt-2">
                  <span>100</span><span>10,000</span>
                </div>
                <div className="mt-8 pt-7 border-t border-lexis-ink/10">
                  <p className="text-xs uppercase tracking-[0.14em] font-semibold text-lexis-ink/45">Community Fund contribution</p>
                  <p className="mt-2 font-display font-semibold text-4xl sm:text-5xl text-teal-800">{formatThb(calculatedFund)}</p>
                  <p className="mt-3 text-xs leading-relaxed text-lexis-ink/50">{formatNumber(contributors)} subscribers × ฿{SPONSOR_ADDON_THB} per billing cycle.</p>
                </div>
                <p className="mt-7 text-[11px] leading-relaxed text-lexis-ink/40">Contributions are pooled into the LEXIS Community Fund to support free and discounted access for eligible schools, youth groups, and non-profits, subject to partner eligibility, programme costs, and available capacity.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-teal-700">Where the doors lead</p>
            <h2 className="mt-4 font-display font-semibold text-4xl sm:text-5xl leading-tight">From practice to real-world possibility.</h2>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            {DOOR_CARDS.map(({ icon: Icon, eyebrow, title, body }) => (
              <article key={eyebrow} className="group bg-white border border-lexis-ink/10 rounded-3xl p-7 sm:p-8 hover:border-teal-700/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="w-11 h-11 rounded-xl bg-teal-700/10 text-teal-800 flex items-center justify-center"><Icon className="w-5 h-5" /></div>
                  <ChevronRight className="w-5 h-5 text-lexis-ink/20 group-hover:text-teal-700 transition-colors" />
                </div>
                <p className="mt-7 text-xs uppercase tracking-[0.14em] font-semibold text-teal-700">{eyebrow}</p>
                <h3 className="mt-2 font-display font-semibold text-2xl sm:text-3xl">{title}</h3>
                <p className="mt-4 text-sm sm:text-base leading-relaxed text-lexis-ink/60">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-white border-y border-lexis-ink/10">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-teal-700">Live impact</p>
              <h2 className="mt-4 font-display font-semibold text-4xl sm:text-5xl leading-tight">Real impact. Verified in real time.</h2>
              <p className="mt-5 text-base leading-relaxed text-lexis-ink/60">We’re starting from zero, and we’re going to show you exactly what happens next.</p>
            </div>
            <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                ['Students supported', telemetry.studentsSupported, ''],
                ['Practice hours', telemetry.practiceHours, ''],
                ['Community partners', telemetry.communityPartners, ''],
                ['Funds deployed', telemetry.fundsDeployedThb, '฿']
              ].map(([label, value, prefix]) => (
                <div key={label} className="rounded-2xl bg-lexis-canvas border border-lexis-ink/10 p-5 sm:p-7 min-h-[145px]">
                  <p className="text-3xl sm:text-4xl font-display font-semibold text-lexis-ink">{telemetryLoading ? '…' : `${prefix}${formatNumber(value)}`}</p>
                  <p className="mt-3 text-xs sm:text-sm uppercase tracking-[0.1em] font-semibold text-lexis-ink/45">{label}</p>
                </div>
              ))}
            </div>
            {telemetryError && (
              <p className="mt-4 text-xs text-lexis-ink/40">Impact data is temporarily unavailable. The figures above are showing the verified zero-state rather than inventing a value.</p>
            )}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-teal-700">Who it’s for</p>
            <h2 className="mt-4 font-display font-semibold text-4xl sm:text-5xl leading-tight">Access built around real people.</h2>
          </div>
          <div className="mt-10 grid lg:grid-cols-3 gap-4">
            {[
              [Users, 'For students', 'Practice without judgment, fear of making mistakes, or expensive hourly fees. Speak when you’re ready, as often as you need.'],
              [Building2, 'For schools & youth groups', 'Bring group practice access directly to classrooms and youth programmes without requiring every student to purchase an individual plan.'],
              [Heart, 'For sponsors & businesses', 'Support local access through the Community Fund and help create more opportunities for students to practise speaking.']
            ].map(([Icon, title, body]) => (
              <article key={title} className="rounded-3xl border border-lexis-ink/10 bg-white p-7 sm:p-8">
                <Icon className="w-6 h-6 text-teal-700" />
                <h3 className="mt-6 font-display font-semibold text-2xl">{title}</h3>
                <p className="mt-4 text-sm sm:text-base leading-relaxed text-lexis-ink/60">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="partner" className="bg-lexis-canvas border-y border-lexis-ink/10">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-20 items-start">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-teal-700">Community partnership</p>
                <h2 className="mt-4 font-display font-semibold text-4xl sm:text-5xl leading-tight">Apply for Community Access.</h2>
                <p className="mt-6 text-base leading-relaxed text-lexis-ink/60">We’re starting with schools, youth centres and community organisations in Thailand. Tell us who you are, where you are, and what your students need. We’ll review the application and follow up directly.</p>
                <div className="mt-8 space-y-3 text-sm text-lexis-ink/60">
                  {['Public schools', 'Non-profit organisations', 'Youth centres and community groups'].map((item) => (
                    <div key={item} className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-teal-700" />{item}</div>
                  ))}
                </div>
              </div>

              <form onSubmit={submitPartnerApplication} className="bg-white rounded-3xl border border-lexis-ink/10 p-6 sm:p-8 shadow-sm">
                <div className="grid sm:grid-cols-2 gap-5">
                  <label className="sm:col-span-2 text-sm font-semibold">
                    Organization Name
                    <input required value={form.organizationName} onChange={(e) => updateForm('organizationName', e.target.value)} className="mt-2 w-full rounded-xl border border-lexis-ink/10 bg-lexis-canvas px-4 py-3 font-normal outline-none focus:border-teal-700/50" />
                  </label>
                  <label className="text-sm font-semibold">
                    Organization Type
                    <select value={form.organizationType} onChange={(e) => updateForm('organizationType', e.target.value)} className="mt-2 w-full rounded-xl border border-lexis-ink/10 bg-lexis-canvas px-4 py-3 font-normal outline-none focus:border-teal-700/50">
                      {PARTNER_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    Location / Region
                    <input required value={form.locationRegion} onChange={(e) => updateForm('locationRegion', e.target.value)} className="mt-2 w-full rounded-xl border border-lexis-ink/10 bg-lexis-canvas px-4 py-3 font-normal outline-none focus:border-teal-700/50" />
                  </label>
                  <label className="sm:col-span-2 text-sm font-semibold">
                    Primary Contact Email
                    <input required type="email" value={form.contactEmail} onChange={(e) => updateForm('contactEmail', e.target.value)} className="mt-2 w-full rounded-xl border border-lexis-ink/10 bg-lexis-canvas px-4 py-3 font-normal outline-none focus:border-teal-700/50" />
                  </label>
                  <label className="sm:col-span-2 text-sm font-semibold">
                    Brief Overview of Student Needs
                    <textarea required minLength={20} rows={5} value={form.overview} onChange={(e) => updateForm('overview', e.target.value)} className="mt-2 w-full rounded-xl border border-lexis-ink/10 bg-lexis-canvas px-4 py-3 font-normal outline-none focus:border-teal-700/50 resize-y" />
                  </label>
                </div>

                {submitState === 'success' && <div className="mt-5 rounded-xl bg-teal-50 border border-teal-700/15 px-4 py-3 text-sm text-teal-900">Application received. We’ll review it and get back to you directly.</div>}
                {submitState === 'error' && <div className="mt-5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{submitError}</div>}

                <button disabled={submitState === 'submitting'} className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-lexis-action text-white px-5 py-3.5 font-semibold text-sm hover:bg-lexis-action-dark disabled:opacity-60 transition-colors">
                  {submitState === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Submit Partner Application
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-teal-700">Coming to LEXIS Community</p>
            <h2 className="mt-4 font-display font-semibold text-4xl sm:text-5xl leading-tight">What we’re building next.</h2>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-lexis-ink/60">These initiatives are deliberately labelled as in development. We won’t present them as live until they actually are.</p>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            {[
              ['Group onboarding roster management', 'In development', 'Streamlined roster management for teachers and youth leaders.'],
              ['Curriculum-aligned scenario builders', 'In development', 'Conversation templates tailored to vocational and academic tracks.'],
              ['Anonymized engagement & practice analytics', 'In development', 'High-level group practice metrics without exposing student transcripts.'],
              ['Enterprise regional sponsorship portals', 'In development', 'Dedicated funding pathways for companies supporting community access.']
            ].map(([title, status, body]) => (
              <article key={title} className="rounded-2xl border border-dashed border-lexis-ink/15 bg-white/60 p-6">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-display font-semibold text-xl">{title}</h3>
                  <span className="shrink-0 rounded-full bg-lexis-ink/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-lexis-ink/45">{status}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-lexis-ink/55">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-lexis-ink text-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
            <div className="grid lg:grid-cols-[1fr_0.9fr] gap-10 items-end">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-teal-300">The vision</p>
                <h2 className="mt-4 font-display font-semibold text-4xl sm:text-6xl leading-tight">Starting in Thailand. Built for everywhere.</h2>
              </div>
              <div>
                <p className="text-base sm:text-lg leading-relaxed text-white/65">Millions of people around the world understand English, but lack regular, affordable opportunities to speak it out loud. LEXIS Community begins in Thailand, but the ambition is global: to build a network where access to spoken practice isn’t determined entirely by what someone can afford.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-5 sm:px-8 py-24 sm:py-32 text-center">
          <MessageCircle className="w-8 h-8 mx-auto text-teal-700" />
          <h2 className="mt-6 font-display font-semibold text-5xl sm:text-7xl leading-[0.95]">Speak for yourself.<br />Help someone else speak too.</h2>
          <p className="mt-7 text-base sm:text-lg leading-relaxed text-lexis-ink/60 max-w-2xl mx-auto">LEXIS is building a different model for language access, one where daily practice creates opportunity for someone else.</p>
          <div className="mt-9 flex flex-col sm:flex-row justify-center gap-3">
            <button onClick={() => navigateTo('/pricing')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-lexis-action text-white px-6 py-3.5 font-semibold text-sm hover:bg-lexis-action-dark transition-colors">Try LEXIS <ArrowRight className="w-4 h-4" /></button>
            <a href="#partner" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-lexis-ink/10 px-6 py-3.5 font-semibold text-sm hover:border-teal-700/30 transition-colors">Partner With Us <ArrowRight className="w-4 h-4 text-teal-700" /></a>
          </div>
        </section>
      </main>

      <footer className="border-t border-lexis-ink/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-lexis-ink/40">
          <span>© 2026 LEXIS</span>
          <div className="flex items-center gap-5">
            <button onClick={() => navigateTo('/pricing')} className="hover:text-lexis-ink transition-colors">Pricing</button>
            <button onClick={() => navigateTo('/privacy')} className="hover:text-lexis-ink transition-colors">Privacy</button>
            <button onClick={() => navigateTo('/terms')} className="hover:text-lexis-ink transition-colors">Terms</button>
            <button onClick={() => navigateTo('/refund')} className="hover:text-lexis-ink transition-colors">Refunds</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
