import React, { useState } from 'react';
import { Sparkles, ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Stripe recurring Price IDs — set these after creating the Weekly/Monthly
// products in the Stripe Dashboard (Products → Add product → copy the
// "price_..." ID, not the product ID). See DEPLOY.md Step 2.
const STRIPE_PRICES = {
  weekly: 'price_xxxxxxxxxxxxx',   // Your real ID
  monthly: 'price_xxxxxxxxxxxxx'   // Your real ID
};

export default function PricingPage({ navigateTo }) {
  const { session } = useAuth();
  const [loadingTier, setLoadingTier] = useState(null); // 'weekly' | 'monthly' | null
  const [error, setError] = useState('');

  const cancelled = new URLSearchParams(window.location.search).get('payment') === 'cancelled';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="w-full max-w-6xl mx-auto p-6 flex items-center justify-between border-b border-slate-800/80">
        <button
          onClick={() => navigateTo('/')}
          className="flex items-center space-x-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </button>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-lg font-extrabold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            LEXIS OS
          </span>
        </div>
        <div className="w-16" />
      </header>

      <section className="w-full max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-center mb-2 text-slate-100">Simple, Transparent Pricing</h1>
        <p className="text-center text-sm text-slate-500 mb-10">Cancel anytime. Prices in Thai Baht.</p>

        {cancelled && (
          <div className="mb-6 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm text-center">
            Checkout was cancelled — no charge was made.
          </div>
        )}
        {error && (
          <div className="mb-6 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center justify-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Tier */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-cyan-400 mb-2">Free Trial</h3>
              <p className="text-xs text-slate-400 mb-4">3 Practice Sessions (30 Mins)</p>
              <div className="text-3xl font-extrabold text-slate-100 mb-6">฿0</div>
              <ul className="text-xs space-y-3 text-slate-300 mb-6">
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /><span>30 Total Mins Usage</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /><span>Real-Time Feedback</span></li>
              </ul>
            </div>
            <button onClick={() => navigateTo('/app')} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all">
              Try Free
            </button>
          </div>

          {/* Weekly Pass (Featured) */}
          <div className="bg-slate-900 border-2 border-cyan-500 p-6 rounded-2xl flex flex-col justify-between relative shadow-2xl shadow-cyan-500/10">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-[10px] uppercase px-3 py-0.5 rounded-full">
              Most Popular
            </span>
            <div>
              <h3 className="text-lg font-bold text-cyan-300 mb-2">Weekly Pass</h3>
              <p className="text-xs text-slate-400 mb-4">Unlimited Practice for 7 Days</p>
              <div className="text-3xl font-extrabold text-slate-100 mb-6">฿199 <span className="text-xs font-normal text-slate-500">/ week</span></div>
              <ul className="text-xs space-y-3 text-slate-300 mb-6">
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /><span>Unlimited Speaking Time</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /><span>Full Transcript History</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /><span>Thai ESL Tuning Active</span></li>
              </ul>
            </div>
            <button
              onClick={() => startCheckout('weekly', STRIPE_PRICES.weekly)}
              disabled={loadingTier === 'weekly'}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-950 font-bold rounded-xl text-xs text-center transition-all flex items-center justify-center space-x-2"
            >
              {loadingTier === 'weekly' ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Get Started Now</span>}
            </button>
          </div>

          {/* Monthly Pass */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-emerald-400 mb-2">Monthly Immersion</h3>
              <p className="text-xs text-slate-400 mb-4">Unlimited Practice for 30 Days</p>
              <div className="text-3xl font-extrabold text-slate-100 mb-6">฿599 <span className="text-xs font-normal text-slate-500">/ month</span></div>
              <ul className="text-xs space-y-3 text-slate-300 mb-6">
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /><span>Best Value (Save 25%)</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /><span>Unlimited Speaking Time</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /><span>Priority Server Queue</span></li>
              </ul>
            </div>
            <button
              onClick={() => startCheckout('monthly', STRIPE_PRICES.monthly)}
              disabled={loadingTier === 'monthly'}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 font-bold rounded-xl text-xs text-center transition-all flex items-center justify-center space-x-2"
            >
              {loadingTier === 'monthly' ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Get Started Now</span>}
            </button>
          </div>
        </div>

        {!session && (
          <p className="text-center text-xs text-slate-500 mt-8">
            You'll be asked to sign in before checkout.
          </p>
        )}
      </section>
    </div>
  );
}
