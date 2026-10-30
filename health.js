export async function onRequestGet({env}) {
  return new Response(JSON.stringify({ok:true,configured:Boolean(env.GEMINI_API_KEY),provider:'Google Gemini',model:env.GEMINI_MODEL||'gemini-2.5-flash'}),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
}
