import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const plans = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    yearly: 0,
    credits: 5,
    features: [
      '1 AI extract/day',
      'ATS check (1/day)',
      'No PDF export',
      'No A/B rewrites or cover letters',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 39,
    yearly: 349,
    credits: 80,
    features: [
      'Unlimited AI extracts',
      '80 AI credits/month',
      'PDF export',
      'Cover letters + LinkedIn rewrites',
      'Interview script generator',
      'Version history + resume vault',
    ],
  },
  {
    id: 'team',
    name: 'Team / Coach',
    monthly: 149,
    yearly: 1299,
    credits: 200,
    features: [
      'Coach collaboration seats',
      'Inline annotations on resume preview',
      'Client management + white-label PDFs',
      'Shared interview scripts',
      '200 AI credits/month per seat pack',
    ],
  },
];

export default function BillingPage({ user }) {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState(false);

  const subscribe = async (plan) => {
    if (!user) {
      alert('Please sign in before upgrading');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
        },
        body: JSON.stringify({ plan, userEmail: user.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(data);
        alert(data.error || 'Subscription error');
        return;
      }
      if (data.razorpay_key && data.subscription) {
        loadRazorpay(data);
      } else {
        window.location.reload();
      }
    } catch (e) {
      console.error('subscribe error', e);
      alert('Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpay = (data) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      const rz = window.Razorpay;
      rz.open({
        key: data.razorpay_key,
        subscription_id: data.subscription.id,
        name: 'VeriResume',
        description: `${data.subscription.plan} subscription`,
        image: '/logo192.png',
        prefill: { email: user.email },
        handler: (response) => {
          alert('Payment authorized. You will be upgraded shortly.');
          window.location.reload();
        },
        modal: { ondismiss: () => {} },
      });
    };
    document.body.appendChild(script);
  };

  return (
    <div className="billing-page">
      <h2>Choose your plan</h2>
      <p>PayPal is available at checkout through Razorpay where supported.</p>
      <div className="toggle-row">
        <button className={!annual ? 'selected' : ''} onClick={() => setAnnual(false)}>Monthly</button>
        <button className={annual ? 'selected' : ''} onClick={() => setAnnual(true)}>Yearly</button>
      </div>
      <div className="plans">
        {plans.map((plan) => (
          <div key={plan.id} className="plan">
            <h3>{plan.name}</h3>
            <div>
              {plan.monthly === 0 ? (
                <div className="price">Free</div>
              ) : (
                <div className="price">
                  ${annual ? Math.round(plan.yearly / 12) : plan.monthly}
                  <span>/mo</span>
                </div>
              )}
              {annual && plan.yearly ? (
                <div className="yearly">${plan.yearly}/yr</div>
              ) : null}
            </div>
            <div className="credits">{plan.credits} credits/mo</div>
            <ul>
              {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
            <button
              onClick={() => subscribe(plan.id === 'free' ? 'free' : (annual ? `${plan.id}_yearly` : plan.id))}
              disabled={loading}
            >
              {plan.id === 'free' ? 'Downgrade to Free' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
