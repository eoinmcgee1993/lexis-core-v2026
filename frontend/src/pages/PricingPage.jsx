import React, { useMemo, useState } from 'react';
import { Sparkles, ArrowLeft, Check, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { buildOffersJsonLd, SITE_URL } from '../data/structuredData';
import { useSeo } from '../lib/useSeo';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Stripe recurring Price IDs — live mode, Clearmark account (acct_1T1zS9F1FdEsYK5E).
const STRIPE_PRICES = {
  weekly: 'price_1U1hdLF1FdEsYK5EOSheNGGS',   // LEXIS Weekly Pass — ฿199.00/week
  monthly: 'price_1U1hdOF1FdEsYK5Ec6DgUlil'   // LEXIS Monthly Immersion — ฿599.00/month
};

export default function PricingPage({ navigateTo }) {
  const { session } = useAuth();
  const [loadingTier, setLoadingTier] = useState(null); // 'weekly' | 'monthly' | null
  const [error, setError] = useState('');

  const cancelled = new URLSearchParams(window.location.search).get('payment') === 'cancelled';

  const offersJsonLd = useMemo(() => buildOffersJsonLd(), []);
  useSeo({
    title: 'Pricing | LEXIS',
    description: 'LEXIS pricing: a free 30-minute trial, then ฿199/week or ฿599/month for unlimited voice practice in English or Thai. No VAT, cancel anytime.',
    canonical: `${SITE_URL}/pricing`,
    jsonLd: { 'jsonld-offers': offersJsonLd }
  });

  const startCheckout = async (planTier, priceId) => {
    setError('');

    if (!session) {
      navigateTo('/auth');
      return;
    }
    if (!priceId || priceId.includes('xxxxxxxxxxxxx')) {
      setError(`Missing Stripe price ID for the ${planTier} plan — set STRIPE_PRICES.${planTier} in PricingPage.jsx to your real Stripe price_... ID.`);
      return;
    }

    setLoadingTier(planTier);
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ priceId, planTier })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Checkout error: ${res.status}`);
      if (!data.url) throw new Error('Checkout session did not return a redirect URL.');
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || 'Could not start checkout. Please try again.');
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen lexis-canvas-gradient text-lexis-ink font-sans flex flex-col">
      <header className="w-full max-w-6xl mx-auto p-6 flex items-center justify-between border-b border-lexis-ink/10">
        <button
          onClick={() => navigateTo('/')}
          className="flex items-center space-x-2 text-sm text-lexis-ink/50 hover:text-lexis-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </button>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-600/10 border border-teal-600/20 rounded-xl text-teal-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-lg font-display font-semibold text-lexis-ink">
            LEXIS
          </span>
        </div>
        <div className="w-16" />
      </header>

      <section className="flex-1 w-full max-w-5xl mx-auto px-6 py-12">
        <h1 className="font-display font-semibold text-2xl text-center mb-2 text-lexis-ink">Simple, Transparent Pricing</h1>
        <p className="text-center text-sm text-lexis-ink/50">Cancel anytime. Prices in Thai Baht.</p>
        <p className="text-center text-xs text-lexis-ink/30 mb-10">No VAT applies — not a VAT-registered business.</p>

        {cancelled && (
          <div className="mb-6 px-4 py-3 bg-lexis-action/10 border border-lexis-action/30 rounded-xl text-lexis-action-dark text-sm text-center">
            Checkout was cancelled — no charge was made.
          </div>
        )}
        {error && (
          <div className="mb-6 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Tier */}
          <div className="bg-white border border-lexis-ink/10 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-teal-700 mb-2">Free Trial</h3>
              <p className="text-xs text-lexis-ink/50 mb-4">30 Minutes of Free Practice</p>
              <div className="text-3xl font-extrabold text-lexis-ink mb-6">฿0</div>
              <ul className="text-xs space-y-3 text-lexis-ink/70 mb-6">
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-teal-600" /><span>30 minutes of practice time</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-teal-600" /><span>Real-time feedback as you speak</span></li>
              </ul>
            </div>
            <button onClick={() => navigateTo('/app')} className="w-full py-3 bg-lexis-canvas hover:bg-lexis-ink/5 border border-lexis-ink/10 text-lexis-ink font-bold rounded-xl text-xs transition-all">
              Try Free
            </button>
          </div>

          {/* Weekly Pass (Featured) */}
          <div className="bg-white border-2 border-lexis-action p-6 rounded-2xl flex flex-col justify-between relative shadow-2xl shadow-lexis-action/10">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lexis-action text-white font-bold text-[10px] uppercase px-3 py-0.5 rounded-full">
              Most Popular
            </span>
            <div>
              <h3 className="text-lg font-bold text-lexis-action-dark mb-2">Weekly Pass</h3>
              <p className="text-xs text-lexis-ink/50 mb-4">Unlimited Practice for 7 Days</p>
              <div className="text-3xl font-extrabold text-lexis-ink mb-6">฿199 <span className="text-xs font-normal text-lexis-ink/40">/ week</span></div>
              <ul className="text-xs space-y-3 text-lexis-ink/70 mb-6">
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-teal-600" /><span>Talk as much as you want</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-teal-600" /><span>Full conversation history</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-teal-600" /><span>LEXIS adjusts to your level as you go</span></li>
              </ul>
            </div>
            <button
              onClick={() => startCheckout('weekly', STRIPE_PRICES.weekly)}
              disabled={loadingTier === 'weekly'}
              className="w-full py-3 bg-lexis-action hover:bg-lexis-action-dark disabled:opacity-60 text-white font-bold rounded-xl text-xs text-center transition-all flex items-center justify-center space-x-2"
            >
              {loadingTier === 'weekly' ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Get Started Now</span>}
            </button>
          </div>

          {/* Monthly Pass */}
          <div className="bg-white border border-lexis-ink/10 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-teal-700 mb-2">Monthly Immersion</h3>
              <p className="text-xs text-lexis-ink/50 mb-4">Unlimited Practice for 30 Days</p>
              <div className="text-3xl font-extrabold text-lexis-ink mb-6">฿599 <span className="text-xs font-normal text-lexis-ink/40">/ month</span></div>
              <ul className="text-xs space-y-3 text-lexis-ink/70 mb-6">
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-teal-600" /><span>Best value — about 25% less than 4 weeks at the weekly rate</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-teal-600" /><span>Talk as much as you want</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-teal-600" /><span>Great for building a daily habit</span></li>
              </ul>
            </div>
            <button
              onClick={() => startCheckout('monthly', STRIPE_PRICES.monthly)}
              disabled={loadingTier === 'monthly'}
              className="w-full py-3 bg-lexis-canvas hover:bg-lexis-ink/5 disabled:opacity-60 border border-lexis-ink/10 text-lexis-ink font-bold rounded-xl text-xs text-center transition-all flex items-center justify-center space-x-2"
            >
              {loadingTier === 'monthly' ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Get Started Now</span>}
            </button>
          </div>
        </div>

        {!session && (
          <p className="text-center text-xs text-lexis-ink/40 mt-8">
            You'll be asked to sign in before checkout.
          </p>
        )}
      </section>

      <footer className="w-full max-w-6xl mx-auto p-6 border-t border-lexis-ink/10 flex items-center justify-between text-xs text-lexis-ink/40">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Private &amp; secure • Payments handled by Stripe</span>
        </div>
        <div>© 2026 LEXIS</div>
      </footer>
    </div>
  );
}
