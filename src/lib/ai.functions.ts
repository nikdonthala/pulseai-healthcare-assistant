import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callGatewayChat } from "./ai-gateway.server";

/* ---------- Clinical Co-Pilot ---------- */

const ChatInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      }),
    )
    .min(1),
  ehr: z
    .object({
      name: z.string().optional(),
      age: z.number().optional(),
      sex: z.string().optional(),
      vitals: z.string().optional(),
      history: z.string().optional(),
      medications: z.string().optional(),
      labs: z.string().optional(),
      chief_complaint: z.string().optional(),
    })
    .optional(),
});

const COPILOT_SYSTEM = `You are PulseAI, an evidence-based clinical co-pilot assisting general physicians.
You synthesize multi-modal EHR data (vitals, history, meds, labs, chief complaint) and produce concise,
structured guidance.

Always respond in this format using markdown:

**Clinical Impression** — 2–3 sentences.
**Differential** — bulleted list with probability qualifiers (likely / possible / less likely).
**Recommended Workup** — labs, imaging, bedside tests.
**Evidence-Based Treatment** — first-line, alternatives, contraindications; cite guideline names (e.g. NICE, AHA/ACC, IDSA, GOLD, ADA) when applicable.
**Red Flags / Safety Netting** — when to escalate.
**Follow-up** — timeline and monitoring.

End every response with:
> ⚕️ Decision support only. The treating physician is responsible for the final clinical decision.`;

export const chatCopilot = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => ChatInput.parse(v))
  .handler(async ({ data }) => {
    const ehrBlock = data.ehr
      ? `\n\n[PATIENT EHR CONTEXT]\n${Object.entries(data.ehr)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => `- ${k}: ${v}`)
          .join("\n")}`
      : "";

    const res = await callGatewayChat({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: COPILOT_SYSTEM + ehrBlock },
        ...data.messages,
      ],
    });
    const json = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    return { content: json.choices[0]?.message?.content ?? "" };
  });

/* ---------- Radiology Summarizer ---------- */

const RadiologyInput = z.object({
  imageDataUrl: z.string().min(20), // data:image/...;base64,....
  modality: z.string().optional(),
  clinical_context: z.string().optional(),
});

const RAD_SYSTEM = `You are a radiology report summarizer. Given a medical image (X-ray, CT slice, MRI slice,
ultrasound), produce two clearly-separated outputs.

Use this exact markdown structure:

## 🩻 Clinical Findings (for physicians)
- Bullet list of key radiological observations using standard terminology.
- Note anatomical location, laterality, size estimates when visible.
- Impression: 1–2 line synthesis.

## 💬 Plain-Language Summary (for the patient)
Write 3–5 short, warm sentences at a 6th-grade reading level. Avoid jargon.
Explain what was looked at, what was seen, and what it generally means.
End with: "Please discuss these results with your doctor — they know your full history."

## ⚠️ Limitations
One short paragraph noting this is an AI-assisted preliminary read and requires
confirmation by a board-certified radiologist.`;

export const summarizeRadiology = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => RadiologyInput.parse(v))
  .handler(async ({ data }) => {
    const context = [
      data.modality ? `Modality: ${data.modality}` : "",
      data.clinical_context ? `Clinical context: ${data.clinical_context}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await callGatewayChat({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: RAD_SYSTEM },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                (context ? context + "\n\n" : "") +
                "Please analyze this medical image and produce the two summaries.",
            },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ],
        },
      ],
    });
    const json = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    return { content: json.choices[0]?.message?.content ?? "" };
  });
