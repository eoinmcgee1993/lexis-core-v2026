// frontend/src/pages/EverydayEnglishPage.jsx
//
// Second of the "practice/" long-tail pages, added 21 Aug 2026 alongside
// TravelEnglishPage.jsx and BusinessEnglishPage.jsx (Digital Renaissance
// re-audit, L10: "8-10 more topic pages"). The audit's number doesn't
// match what the product actually differentiates: TopicStage.jsx offers
// exactly three selectable topics ('everyday', 'work', 'travel', each
// steering backend/app.mjs's buildTutorInstructions via TOPIC_CURRICULA),
// plus interview-english already carved out of 'work'. Splitting each
// curriculum's five-item bullet list into its own thin page (a page for
// "ordering food," a separate page for "asking directions," etc.) would
// be duplicate/thin content competing with itself, not real long-tail
// value — so this ships one honest hub page per real topic instead of
// stretching to a number the product doesn't support without inventing
// content. See PARTNER-CODES.md/InterviewEnglishPage.jsx's own comment
// for the same "one real page over a batch of thin ones" reasoning.
//
// TOPIC_CURRICULA.everyday in backend/app.mjs: 'everyday conversation —
// daily routine, family and friends, hobbies and interests, food,
// weather and plans'. PRACTICE_PROMPTS below are drawn directly from
// that list, not invented for this page.
import React from 'react';
import { ArrowLeft, Mic, MessageCircle, TrendingUp } from 'lucide-react';
import LexisMark from '../components/LexisMark';
import { useSeo } from '../lib/useSeo';
import { SITE_URL, buildBreadcrumbJsonLd, buildTopicFaqJsonLd } from '../data/structuredData';
import { TRIAL } from '../content/facts';

const PRACTICE_PROMPTS = [
  '"Tell me about your day so far."',
  '"What do you usually do on the weekend?"',
  '"Tell me about someone close to you."',
  '"What\'s a hobby you enjoy, and how did you get into it?"',
  '"What\'s the weather like where you are today?"'
];

const FAQ = [
  {
    q: 'What can I practice on this page?',
    a: 'Real everyday conversation: daily routine, family and friends, hobbies and interests, food, and weather and plans, the same "Everyday Talk" topic available in the app itself.'
  },
  {
    q: 'Is everyday conversation practice free?',
    a: `Yes. LEXIS gives every new user a free ${TRIAL.minutes} minute trial with no card required, which you can use for everyday conversation practice or any other topic.`
  },
  {
    q: 'Do I need to already speak well to start?',
    a: "No. LEXIS meets you at whatever level you're at, from single words and short phrases up to full natural conversation, and adjusts as you go."
  }
];

export default function EverydayEnglishPage({ navigateTo }) {
  const pageUrl = `${SITE_URL}/practice/everyday-english`;

  useSeo({
    title: 'Practice Everyday English Conversation Out Loud | LEXIS',
    description: `Practice everyday English conversation out loud, daily routine, family, hobbies, food, and weather, with gentle real-time corrections. Free ${TRIAL.minutes}-minute trial, no card required.`,
    canonical: pageUrl,
    jsonLd: {
      'jsonld-faq': buildTopicFaqJsonLd(FAQ),
      'jsonld-breadcrumb': buildBreadcrumbJsonLd('Everyday English Practice', pageUrl)
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
          Practice everyday English, out loud.
        </h1>
        <p className="text-sm md:text-base text-lexis-ink/60 mb-10 leading-relaxed">
          Most spoken English you'll actually use isn't a job interview or a big
          presentation, it's the ordinary stuff: catching up with someone, describing
          your day, talking about what you like. LEXIS gives you real practice at
          exactly that: a real spoken exchange, gentle correction, at whatever pace
          you're actually at.
        </p>

        <div className="space-y-8 text-sm text-lexis-ink/80 leading-relaxed">
          <div>
            <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2 flex items-center gap-2">
              <Mic className="w-4 h-4 text-teal-600" />
              Why spoken practice, specifically
            </h2>
            <p className="mt-2">
              Everyday conversation moves fast and doesn't wait for you to think of the
              perfect sentence. LEXIS's Everyday Talk topic is built around that: you
              talk, LEXIS replies out loud in real time and corrects grammar or word
              choice gently mid conversation, the same way a patient friend would.
            </p>
          </div>

          <div>
            <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-teal-600" />
              The kind of conversation you'll practice
            </h2>
            <p className="mt-2">
              Real everyday topics, the ones that come up constantly regardless of
              where you are:
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
