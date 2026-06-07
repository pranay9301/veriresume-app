export default function handler(req, res) {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  const hasSupabase = Boolean(supabaseUrl && supabaseKey);

  res.status(200).json({
    ok: true,
    ts: new Date().toISOString(),
    url: 'https://veriresume.vercel.app',
    checks: {
      frontend: { ok: true },
      core: {
        geminiConfigured: hasGemini,
        supabaseConfigured: hasSupabase,
      },
    },
  });
}
