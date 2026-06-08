export default async function handler(req, res) {
  if (req.method !== 'GET') {
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
    // fallback: unauthenticated -> treat as free/inactive
  }

  if (!userId) {
    return res.status(200).json({ plan: 'free', status: 'inactive' });
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data || data.status !== 'active') {
    return res.status(200).json({ plan: 'free', status: 'inactive' });
  }

  return res.status(200).json({
    plan: data.plan,
    status: data.status,
    current_period_end: data.current_period_end,
    credits: data.credits ?? 5,
  });
}
