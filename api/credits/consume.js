import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let userId = null;
  try {
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '').trim();
    if (token) {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1] || '', 'base64').toString('utf8')
      );
      userId = payload?.sub || null;
    }
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('credits, plan')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !subscription) {
    return res.status(200).json({ success: false, credits: 0, plan: 'free' });
  }

  const credits = subscription.credits ?? 5;
  if (credits <= 0) {
    return res.status(200).json({ success: false, credits: 0, plan: subscription.plan });
  }

  const { data: updated, error: updateError } = await supabase
    .from('subscriptions')
    .update({ credits: credits - 1 })
    .eq('user_id', userId)
    .select('credits')
    .single();

  if (updateError) {
    return res.status(500).json({ error: 'Failed to consume credit' });
  }

  return res.status(200).json({ success: true, credits: updated.credits, plan: subscription.plan });
}
