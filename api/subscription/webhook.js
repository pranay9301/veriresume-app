export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.headers['x-razorpay-signature'];
  const body = req.body;

  if (!secret) {
    return res.status(400).json({ error: 'Missing signature' });
  }

  let event = null;
  try {
    event = typeof body === 'string' ? JSON.parse(body) : body;
  } catch (e) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const subscriptionId = event.payload?.subscription?.entity?.id
    || event.payload?.subscription_id;
  const customerId = event.payload?.subscription?.entity?.customer_id
    || event.payload?.customer_id;

  if (!subscriptionId) {
    return res.status(200).json({ ignored: true });
  }

  const { data: existing, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('razorpay_subscription_id', subscriptionId)
    .maybeSingle();

  if (error) {
    console.error('webhook lookup error', error);
  }

  const plan = event.payload?.subscription?.entity?.notes?.plan || 'pro';

  if (!existing) {
    const inserted = {
      user_id: event.payload?.subscription?.entity?.notes?.userId || null,
      razorpay_customer_id: customerId,
      razorpay_subscription_id: subscriptionId,
      plan,
      status: 'active',
    };
    const { data: created } = await supabase
      .from('subscriptions')
      .insert(inserted)
      .select('*')
      .single();
    console.log('created subscription', created);
  } else {
    await supabase
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('id', existing.id);
  }

  return res.status(200).json({ ok: true });
}
