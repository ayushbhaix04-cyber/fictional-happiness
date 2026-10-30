export async function onRequestGet({ env }) {
  return new Response(JSON.stringify({
    ok: true,
    configured: Boolean(env.GEMINI_API_KEY),
    provider: 'Google Gemini Interactions API',
    model: env.GEMINI_MODEL || 'gemini-3.8-flash'
  }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
