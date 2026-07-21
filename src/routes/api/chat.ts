import { createFileRoute } from "@tanstack/react-router";
import { aiHeaders, AI_GATEWAY_URL } from "@/lib/ai-gateway.server";

type Msg = { role: "user" | "assistant" | "system"; content: string };

const LANG_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  te: "Telugu",
  ta: "Tamil",
  mr: "Marathi",
  ur: "Urdu",
  es: "Spanish",
  fr: "French",
  it: "Italian",
  ru: "Russian",
};

function systemPrompt(lang: string) {
  const name = LANG_NAMES[lang] ?? "English";
  return `You are PulseAI, a multilingual clinical AI co-pilot embedded in the PulseAI hospital platform.

SCOPE — you ONLY answer questions related to:
- Clinical medicine (anatomy, physiology, cardiology, radiology, pharmacology, ICU care)
- Patient monitoring (ECG, heart rate, SpO2, blood pressure, temperature, respiration)
- Radiology summaries, medical reports, SOAP notes, discharge summaries
- Risk prediction, differentials, evidence-based treatment reasoning
- The PulseAI platform itself (dashboard, patients, alerts, timeline, reports, AI Assistant, EHR Co-pilot, Radiology summarizer, voice navigation)

If a user asks something clearly OUTSIDE this scope (movies, sports, politics, unrelated coding, general chit-chat), politely reply exactly:
"I'm PulseAI, your clinical AI assistant. I can help with patient monitoring, clinical decision support, radiology summaries, reports, and PulseAI platform features."

STYLE:
- Be concise, medically accurate, and easy to understand.
- Use short paragraphs and markdown bullet lists where helpful.
- Prefer plain language; add technical terms in parentheses.

LANGUAGE:
- Respond in ${name}. If the user's most recent message is clearly in a different supported language, mirror that language instead.
- Preserve standard medical terminology (Latin/English drug names, ECG lead names, units) where appropriate.

SAFETY:
- Whenever you give any treatment, dosing, or diagnostic recommendation, append this line verbatim at the end:
"AI recommendations are intended to assist healthcare professionals. Final diagnosis and treatment decisions remain the responsibility of the physician."`;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { messages?: Msg[]; language?: string };
        try {
          body = (await request.json()) as { messages?: Msg[]; language?: string };
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const messages = Array.isArray(body.messages) ? body.messages : [];
        const language = typeof body.language === "string" ? body.language : "en";
        if (messages.length === 0) return new Response("messages required", { status: 400 });

        let upstream: Response;
        try {
          upstream = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
            method: "POST",
            headers: aiHeaders(),
            body: JSON.stringify({
              model: "google/gemini-3.5-flash",
              stream: true,
              messages: [
                { role: "system", content: systemPrompt(language) },
                ...messages,
              ],
            }),
          });
        } catch (e) {
          return new Response(`Upstream unreachable: ${(e as Error).message}`, { status: 502 });
        }

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          return new Response(text || `AI gateway error ${upstream.status}`, {
            status: upstream.status || 502,
          });
        }

        // Transform OpenAI-style SSE into a plain text stream of assistant deltas.
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const reader = upstream.body!.getReader();
            let buf = "";
            try {
              while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split("\n");
                buf = lines.pop() ?? "";
                for (const raw of lines) {
                  const line = raw.trim();
                  if (!line.startsWith("data:")) continue;
                  const data = line.slice(5).trim();
                  if (!data || data === "[DONE]") continue;
                  try {
                    const json = JSON.parse(data);
                    const delta = json.choices?.[0]?.delta?.content;
                    if (typeof delta === "string" && delta.length) {
                      controller.enqueue(encoder.encode(delta));
                    }
                  } catch {
                    /* ignore keep-alive / partial */
                  }
                }
              }
            } catch (e) {
              controller.enqueue(encoder.encode(`\n\n_[stream error: ${(e as Error).message}]_`));
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-cache",
          },
        });
      },
    },
  },
});