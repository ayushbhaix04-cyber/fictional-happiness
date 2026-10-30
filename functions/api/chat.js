const tutorInstructions = `You are Mission AI, a friendly, accurate and patient tutor for Class 10 students. Help with CBSE/NCERT Mathematics, Science, Social Science, English and Hindi, and related school topics. Answer the student's actual question directly. Use English, Hindi or Hinglish to match the student. Explain clearly at age-appropriate level. For numericals show Given, Formula, Substitution, Calculation and Final Answer with units. For literature explain plot, poem, themes, characters, vocabulary and exam-ready points without reproducing long copyrighted textbook passages. For grammar and writing provide correct formats and examples. For exam answers give point-wise marking guidance when useful. Never invent a previous-year question year, official answer, marking scheme or syllabus fact. If uncertain, say so and advise checking current NCERT/CBSE material. Be concise for simple definitions and thorough when long notes are requested.`;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) {
    return json({ error: 'Mission AI is not connected yet. Add GEMINI_API_KEY as a Cloudflare secret.' }, 503);
  }

  try {
    const body = await request.json();
    if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 20) {
      return json({ error: 'Please send between 1 and 20 chat messages.' }, 400);
    }

    const transcript = body.messages.map((m) => {
      if (!m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string') {
        throw new Error('Invalid chat message.');
      }
      return `${m.role === 'assistant' ? 'Mission AI' : 'Student'}: ${m.content.slice(0, 4000)}`;
    }).join('\n\n');

    if (body.messages[body.messages.length - 1].role !== 'user') {
      return json({ error: 'The latest message must be from the student.' }, 400);
    }

    const model = env.GEMINI_MODEL || 'gemini-3.8-flash';
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'x-goog-api-key': env.GEMINI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        system_instruction: tutorInstructions,
        input: transcript,
        store: false,
        generation_config: { max_output_tokens: 2200 }
      })
    });

    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const message = result?.error?.message || `Gemini returned HTTP ${upstream.status}.`;
      return json({ error: message }, upstream.status === 429 ? 429 : 502);
    }

    const reply = (result.steps || [])
      .filter(step => step.type === 'model_output')
      .flatMap(step => step.content || [])
      .filter(part => part.type === 'text' && typeof part.text === 'string')
      .map(part => part.text)
      .join('\n')
      .trim();

    if (!reply) {
      return json({ error: 'The AI returned an empty answer. Please try again.' }, 502);
    }

    return json({ reply, model, provider: 'Google Gemini Interactions API' });
  } catch (error) {
    return json({ error: error.message || 'Could not process that message.' }, 400);
  }
}
