// frontend/src/pages/TravelEnglishPage.jsx
//
// Third of the "practice/" long-tail pages — see EverydayEnglishPage.jsx's
// header comment for why this is one honest hub page per real topic
// (matching TopicStage.jsx's exact three selectable topics) rather than
// stretching to the audit's "8-10 pages" by splitting one curriculum's
// bullet list into several thin pages.
//
// TOPIC_CURRICULA.travel in backend/app.mjs: 'travel — hotels, asking for
// directions, ordering food, getting help, airports and transport'.
// PRACTICE_PROMPTS below are drawn directly from that list.
import React from 'react';
import { ArrowLeft, Mic, Plane, TrendingUp } from 'lucide-react';
import LexisMark from '../components/LexisMark';
import { useSeo } from '../lib/useSeo';
import { SITE_URL, buildBreadcrumbJsonLd, buildTopicFaqJsonLd } from '../data/structuredData';
import { TRIAL } from '../content/facts';

const PRACTICE_PROMPTS = [
  '"I\'d like to check in, please. I have a reservation."',
  '"Could you tell me how to get to the train station from here?"',
  '"Could I see the menu, please? What would you recommend?"',
  '"Excuse me, I think I\'m lost, could you help me?"',
  '"What gate does this flight leave from?"'
];

const FAQ = [
  {
    q: 'What can I practice on this page?',
    a: 'Real travel English: hotels, asking for directions, ordering food, getting help when something goes wrong, and airports and transport, the same "Travel & Culture" topic available in the app itself.'
  },
  {
    q: 'Is travel English practice free?',
    a: `Yes. LEXIS gives every new user a free ${TRIAL.minutes} minute trial with no card required, which you can use for travel practice or any other topic.`
  },
  {
    q: 'How is this different from a phrasebook or a translation app?',
    a: "A phrasebook gives you a script to read from someone else's mouth. LEXIS gives you a real back-and-forth: you speak, LEXIS replies out loud in real time, and corrects gently mid conversation, so you're actually practicing the exchange, not just memorizing lines."
  }
];

export default function TravelEnglishPage({ navigateTo }) {
  const pageUrl = `${SITE_URL}/practice/travel-english`;

  useSeo({
    title: 'Practice Travel English Out Loud | LEXIS',
    description: `Practice travel English out loud, hotels, directions, ordering food, and airports, with gentle real-time corrections. Free ${TRIAL.minutes}-minute trial, no card required.`,
    canonical: pageUrl,
    jsonLd: {
      'jsonld-faq': buildTopicFaqJsonLd(FAQ),
      'jsonld-breadcrumb': buildBreadcrumbJsonLd('Travel English Practice', pageUrl)
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
          Practice travel English, out loud.
        </h1>
        <p className="text-sm md:text-base text-lexis-ink/60 mb-10 leading-relaxed">
          Checking into a hotel, asking for directions, ordering food somewhere new,
          all of it happens fast, out loud, with a stranger, and no time to look
          anything up. LEXIS gives you that exact practice ahead of time: a real
          spoken exchange, gentle correction, so the real version doesn't catch
          you off guard.
        </p>

        <div className="space-y-8 text-sm text-lexis-ink/80 leading-relaxed">
          <div>
            <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2 flex items-center gap-2">
              <Mic className="w-4 h-4 text-teal-600" />
              Why spoken practice, specifically
            </h2>
            <p className="mt-2">
              Reading a list of useful travel phrases doesn't train the thing travel
              actually tests: understanding a reply you didn't expect and responding
              on the spot. LEXIS's Travel &amp; Culture topic is built around that gap.
              You talk, LEXIS replies out loud in real time and corrects grammar or
              word choice gently mid conversation, the same way a patient local would.
            </p>
          </div>

          <div>
            <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2 flex items-center gap-2">
              <Plane className="w-4 h-4 text-teal-600" />
              The kind of conversation you'll practice
            </h2>
            <p className="mt-2">
              Common, real travel situations, the ones that come up regardless of
              destination:
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
