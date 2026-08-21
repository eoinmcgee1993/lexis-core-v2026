// frontend/src/pages/BusinessEnglishPage.jsx
//
// Fourth of the "practice/" long-tail pages — see EverydayEnglishPage.jsx's
// header comment for why this is one honest hub page per real topic
// rather than stretching to the audit's "8-10 pages" figure.
//
// TOPIC_CURRICULA.work in backend/app.mjs: 'work and business — meetings,
// emails, small talk with colleagues, describing your job, job
// interviews'. This page deliberately covers the non-interview parts of
// that same curriculum, meetings, emails, colleague small talk,
// describing your job, since job interviews already has its own page
// (InterviewEnglishPage.jsx, /practice/interview-english). Splitting the
// same curriculum's content across two overlapping pages would be the
// exact thin/duplicate-content problem this whole batch is trying to
// avoid, so the two pages are kept deliberately non-overlapping instead.
import React from 'react';
import { ArrowLeft, Mic, Briefcase, TrendingUp } from 'lucide-react';
import LexisMark from '../components/LexisMark';
import { useSeo } from '../lib/useSeo';
import { SITE_URL, buildBreadcrumbJsonLd, buildTopicFaqJsonLd } from '../data/structuredData';
import { TRIAL } from '../content/facts';

const PRACTICE_PROMPTS = [
  '"Can you give me a quick update on where the project stands?"',
  '"I wanted to follow up on the email I sent yesterday."',
  '"How was your weekend? Anything interesting happen?"',
  '"So, what do you do for work?"',
  '"Sorry I\'m running a couple of minutes behind, shall we get started?"'
];

const FAQ = [
  {
    q: 'What can I practice on this page?',
    a: 'Everyday workplace English: meetings, emails, small talk with colleagues, and describing your job, part of the same "Work & Business" topic available in the app itself. Job interview practice specifically has its own dedicated page.'
  },
  {
    q: 'Is business English practice free?',
    a: `Yes. LEXIS gives every new user a free ${TRIAL.minutes} minute trial with no card required, which you can use for workplace practice or any other topic.`
  },
  {
    q: 'Is this the same as the interview practice page?',
    a: "No. This page covers the rest of workplace English, meetings, emails, small talk, and describing your job. Interview-specific practice (\"Tell me about yourself,\" strengths and weaknesses, and similar prompts) has its own page at /practice/interview-english."
  }
];

export default function BusinessEnglishPage({ navigateTo }) {
  const pageUrl = `${SITE_URL}/practice/business-english`;

  useSeo({
    title: 'Practice Business English Out Loud | LEXIS',
    description: `Practice workplace English out loud, meetings, emails, and small talk with colleagues, with gentle real-time corrections. Free ${TRIAL.minutes}-minute trial, no card required.`,
    canonical: pageUrl,
    jsonLd: {
      'jsonld-faq': buildTopicFaqJsonLd(FAQ),
      'jsonld-breadcrumb': buildBreadcrumbJsonLd('Business English Practice', pageUrl)
    }
  });

  return (
    <div className="min-h-screen lexis-canvas-gradient text-lexis-ink font-sans flex flex-col">
      <header className="w-full max-w-3xl mx-auto p-6 flex items-center justify-between border-b border-lexis-ink/10">
        <button
          onClick={() => navigateTo('/')}
          className="flex items-center space-x-2 text-sm text-lexis-ink/50 hover:text-lexis-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </button>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-600/10 border border-teal-600/20 rounded-xl text-teal-700">
            <LexisMark className="w-5 h-5" />
          </div>
          <span className="text-lg font-display font-semibold text-lexis-ink">LEXIS</span>
        </div>
        <div className="w-16" />
      </header>

      <section className="flex-1 w-full max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display font-semibold text-3xl md:text-4xl mb-3 text-lexis-ink leading-tight">
          Practice business English, out loud.
        </h1>
        <p className="text-sm md:text-base text-lexis-ink/60 mb-10 leading-relaxed">
          Most workplace English isn't a big presentation, it's a quick update in a
          meeting, a follow-up email you'd rather say out loud first, small talk
          before things start. LEXIS gives you real practice at exactly that: a real
          spoken exchange, gentle correction on the words that got in the way.
        </p>

        <div className="space-y-8 text-sm text-lexis-ink/80 leading-relaxed">
          <div>
            <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2 flex items-center gap-2">
              <Mic className="w-4 h-4 text-teal-600" />
              Why spoken practice, specifically
            </h2>
            <p className="mt-2">
              A meeting or a colleague's question doesn't wait for you to draft the
              perfect sentence. LEXIS's Work &amp; Business topic is built around that:
              you talk, LEXIS replies out loud in real time and corrects grammar or
              word choice gently mid conversation, the same way a patient colleague
              would.
            </p>
          </div>

          <div>
            <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-teal-600" />
              The kind of conversation you'll practice
            </h2>
            <p className="mt-2">
              Common workplace situations, the ones that come up regardless of
              industry:
            </p>
            <ul className="mt-3 space-y-1.5 list-disc pl-5 marker:text-teal-600">
              {PRACTICE_PROMPTS.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              What you get after each session
            </h2>
            <p className="mt-2">
              A plain-language summary of what you did well and what to work on next,
              grounded in what you actually said, not a generic score. Practice
              again as many times as you want; there's no limit on repeat sessions.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => navigateTo('/app')}
            className="inline-flex items-center gap-2 bg-lexis-action hover:bg-lexis-action-dark text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-all"
          >
            <Mic className="w-4 h-4" />
            <span>Start practicing free</span>
          </button>
          <p className="mt-3 text-xs text-lexis-ink/50">
            Free {TRIAL.minutes}-minute trial. No card required.
          </p>
        </div>
      </section>

      <footer className="w-full max-w-3xl mx-auto p-6 border-t border-lexis-ink/10 flex items-center justify-between text-xs text-lexis-ink/40">
        <div>© 2026 LEXIS</div>
        <button onClick={() => navigateTo('/pricing')} className="hover:text-lexis-ink transition-colors">
          View pricing
        </button>
      </footer>
    </div>
  );
}
