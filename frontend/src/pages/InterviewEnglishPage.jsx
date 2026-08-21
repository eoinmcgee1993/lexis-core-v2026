// frontend/src/pages/InterviewEnglishPage.jsx
//
// First of the "practice/" pages — long-tail, search-intent-specific
// landing pages that point at the same real product and the same signup
// flow as the homepage, just angled at one concrete use case instead of
// the general pitch. This one: job-interview practice. Not a new feature
// — the 'work' curriculum topic (TopicStage.jsx / backend/app.mjs's
// TOPIC_PROMPTS.work) already explicitly includes "job interviews" today,
// so every claim here describes something the product actually does, not
// something built to justify the page. See PARTNER-CODES.md's sibling
// growth work from the same day for the reasoning behind starting with
// one real page instead of a batch of thin ones.
import React, { useMemo } from 'react';
import { ArrowLeft, Mic, MessageSquare, TrendingUp } from 'lucide-react';
import LexisMark from '../components/LexisMark';
import { useSeo } from '../lib/useSeo';
import { SITE_URL, buildBreadcrumbJsonLd, buildInterviewFaqJsonLd } from '../data/structuredData';
import { TRIAL } from '../content/facts';

const PRACTICE_PROMPTS = [
  '"Tell me about yourself."',
  '"What are your strengths and weaknesses?"',
  '"Why do you want to work here?"',
  '"Describe a time you solved a difficult problem."',
  '"Do you have any questions for me?"'
];

export default function InterviewEnglishPage({ navigateTo }) {
  const pageUrl = `${SITE_URL}/practice/interview-english`;
  // Static (no lang dependency), but built once per mount rather than
  // inline in the useSeo call below to match how LandingPage.jsx/
  // PricingPage.jsx build their own jsonLd objects.
  const faqJsonLd = useMemo(() => buildInterviewFaqJsonLd(), []);
  const breadcrumbJsonLd = useMemo(() => buildBreadcrumbJsonLd('Interview English Practice', pageUrl), [pageUrl]);

  useSeo({
    title: 'Practice English for Job Interviews Out Loud | LEXIS',
    description: `Practice answering real interview questions out loud in English, with gentle real-time corrections. Free ${TRIAL.minutes}-minute trial, no card required.`,
    canonical: pageUrl,
    jsonLd: { 'jsonld-faq': faqJsonLd, 'jsonld-breadcrumb': breadcrumbJsonLd }
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
          Practice interview English, out loud.
        </h1>
        <p className="text-sm md:text-base text-lexis-ink/60 mb-10 leading-relaxed">
          The hardest part of an English job interview usually isn't the vocabulary,
          it's answering out loud, at speed, without a script in front of you. LEXIS
          gives you that exact practice: real spoken questions, a real spoken answer,
          gentle correction on the words and grammar that got in the way.
        </p>

        <div className="space-y-8 text-sm text-lexis-ink/80 leading-relaxed">
          <div>
            <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2 flex items-center gap-2">
              <Mic className="w-4 h-4 text-teal-600" />
              Why spoken practice, specifically
            </h2>
            <p className="mt-2">
              Reading interview questions and typing out answers doesn't train the
              thing an interview actually tests: thinking and speaking at the same
              time, in a second language, under a little pressure. LEXIS's Work &amp;
              Career topic is built around that gap. You talk, LEXIS replies out
              loud in real time and corrects grammar or word choice gently
              mid-conversation, the same way a patient interviewer's follow-up
              question would.
            </p>
          </div>

          <div>
            <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-600" />
              The kind of questions you'll practice
            </h2>
            <p className="mt-2">
              Common, real interview prompts, the ones that come up regardless of
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
