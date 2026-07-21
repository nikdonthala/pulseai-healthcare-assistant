// Server-only helper for Lovable AI Gateway (raw fetch, streaming supported).
export const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";

export function aiHeaders() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return {
    "Content-Type": "application/json",
    "Lovable-API-Key": key,
  };
}

export async function callGatewayChat(body: Record<string, unknown>) {
  const res = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
    method: "POST",
    headers: aiHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway ${res.status}: ${text}`);
  }
  return res;
}
