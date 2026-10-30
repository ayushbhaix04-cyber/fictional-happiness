
const MODEL = "gemini-3.8-flash";

const SYSTEM_INSTRUCTION = `
You are MISSION AI, a friendly and knowledgeable school tutor.

Help students with CBSE Class 10 NCERT:
- Mathematics
- Science
- Social Science
- English
- Hindi

Answer the student's actual question directly.
Use simple language and explain difficult concepts step by step.
Match the student's language: English, Hindi or Hinglish.

For numerical problems show:
1. Given data
2. Formula
3. Substitution
4. Calculation
5. Final answer with units

For literature explain themes, characters, poems and meanings.
For grammar give rules and examples.
For exam preparation provide point-wise answers.
Never invent official PYQs, exam years or marking schemes.
Be concise for simple questions and detailed when requested.
`;

function response(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) {
    return response({
      error: "Gemini API key is missing. Check Cloudflare Secrets."
    }, 503);
  }

  try {
    const body = await request.json();

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return response({
        error: "Please send a question."
      }, 400);
    }

    if (body.messages.length > 12) {
      return response({
        error: "Please start a new chat. This conversation is too long."
      }, 400);
    }

    const transcript = body.messages.map(message => {
      if (
        !message ||
        !["user", "assistant"].includes(message.role) ||
        typeof message.content !== "string"
      ) {
        throw new Error("Invalid message format.");
      }

      return (
        (message.role === "user" ? "Student" : "Mission AI") +
        ": " +
        message.content.slice(0, 5000)
      );
    }).join("\n\n");

    const lastMessage = body.messages[body.messages.length - 1];

    if (lastMessage.role !== "user") {
      return response({
        error: "Your latest message must be a student question."
      }, 400);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    let upstream;

    try {
      upstream = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            model: MODEL,
            input: transcript,
            system_instruction: SYSTEM_INSTRUCTION,
            generation_config: {
              thinking_level: "low",
              max_output_tokens: 1800
            },
            store: false
          }),
          signal: controller.signal
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    const result = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return response({
        error:
          result.error?.message ||
          "Gemini request failed. Please try again."
      }, upstream.status === 429 ? 429 : 502);
    }

    const reply = (result.steps || [])
      .filter(step => step.type === "model_output")
      .flatMap(step => step.content || [])
      .filter(part => part.type === "text")
      .map(part => part.text || "")
      .join("\n")
      .trim();

    if (!reply) {
      return response({
        error: "Gemini did not return an answer. Please try again."
      }, 502);
    }

    return response({
      reply,
      provider: "Google Gemini",
      model: MODEL
    });

  } catch (error) {
    const timedOut = error.name === "AbortError";

    return response({
      error: timedOut
        ? "Mission AI took too long. Please try again."
        : "Mission AI error: " + error.message
    }, timedOut ? 504 : 500);
  }
}
