export type AiPayload =
  | { task: "email"; instruction: string; tone: string; recipient?: string }
  | { task: "research"; content: string; focus?: string }
  | { task: "chat"; messages: { role: "user" | "assistant"; content: string }[] };

/** Streams AI text from the app's AI endpoint. Throws with a readable message on failure. */
export async function streamAi(
  payload: AiPayload,
  onChunk: (fullText: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok || !res.body) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    onChunk(text);
  }
  if (!text.trim()) throw new Error("The AI returned an empty response. Please try again.");
  return text;
}
