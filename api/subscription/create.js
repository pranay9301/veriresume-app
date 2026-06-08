export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { plan, userEmail } = req.body;
  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.NEXT_RAZORPAY_SECRET_KEY;

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ error: 'Payment provider not configured on server.' });
  }

  const plans = {
    free: { amount: 0, interval: 'month', credits: 5 },
    pro: { amount: 3900, interval: 'month', credits: 80 },
    team: { amount: 14900, interval: 'month', credits: 200 },
    pro_yearly: { amount: 34900, interval: 'year', credits: 80 },
    team_yearly: { amount: 149900, interval: 'year', credits: 200 },
  };

  const selected = plans[plan];
  if (!selected) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  if (selected.amount === 0) {
    return res.status(200).json({ ok: true, plan: 'free', credits: selected.credits });
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(RAZORPAY_KEY_ID + ':' + RAZORPAY_KEY_SECRET).toString('base64');
    const razorpayRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        plan_id: `plan_${plan}_${Date.now()}`,
        customer_email: userEmail || null,
        total_count: selected.interval === 'month' ? 12 : 1,
        quantity: 1,
        notes: { plan },
      }),
    });

    const data = await razorpayRes.json();
    if (!razorpayRes.ok) {
      console.error('Razorpay subscription error', data);
      return res.status(502).json({ error: 'Payment provider error' });
    }

    return res.status(200).json({
      ok: true,
      subscription: {
        id: data.id,
        customer_id: data.customer_id,
        plan,
        amount: selected.amount,
        credits: selected.credits,
        start_at: data.start_at,
        status: data.status,
      },
      razorpay_key: RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('subscription/create error', err);
    return res.status(500).json({ error: 'Failed to create subscription' });
  }
}
