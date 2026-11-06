import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

const DISCLAIMER_RULES =
  "Never invent facts, statistics or sources. If information is uncertain, say so. Do not give legal, medical or financial advice as definitive.";

export type AiTask =
  | { task: "email"; instruction: string; tone: "Formal" | "Friendly" | "Persuasive"; recipient?: string }
  | { task: "research"; content: string; focus?: string }
  | { task: "chat"; messages: { role: "user" | "assistant"; content: string }[] };

function build(body: AiTask): { instructions: string; messages: ModelMessage[] } {
  if (body.task === "email") {
    return {
      instructions: `You are an expert business communication writer.
Write ONE complete professional email based on the user's instruction.
Tone: ${body.tone}.
- Formal: polished, respectful, concise, no slang.
- Friendly: warm, approachable, conversational but professional.
- Persuasive: benefit-led, confident, clear call to action.
Output format (plain text, no markdown):
Subject: <subject line>

<greeting>,

<body paragraphs>

<sign-off>,
[Your Name]
Use placeholders in [square brackets] for unknown specifics. ${DISCLAIMER_RULES}`,
      messages: [
        {
          role: "user",
          content: `Instruction: ${body.instruction}${body.recipient ? `\nRecipient: ${body.recipient}` : ""}`,
        },
      ],
    };
  }
  if (body.task === "research") {
    return {
      instructions: `You are a senior research analyst supporting workplace decision-making.
Analyse the topic or article provided by the user. Respond in Markdown with exactly these sections:
## Summary
(3-5 sentence overview)
## Key Findings
(4-6 bullet points)
## Insights
(2-4 bullets on implications, patterns or trade-offs)
## Recommendations
(3-5 numbered, actionable steps)
## Limitations
(1-3 bullets noting gaps, assumptions or what to verify)
If only a topic is given, rely on well-established general knowledge and flag anything that should be verified. ${DISCLAIMER_RULES}`,
      messages: [
        {
          role: "user",
          content: `${body.focus ? `Focus area: ${body.focus}\n\n` : ""}Material:\n${body.content}`,
        },
      ],
    };
  }
  return {
    instructions: `You are a helpful, context-aware workplace assistant. You help with productivity, communication, planning, meetings, HR-style policy questions (general guidance only), writing and problem solving.
Use earlier messages in the conversation as context. Be concise and practical; use Markdown lists or short headings when helpful. Ask a clarifying question if the request is ambiguous. ${DISCLAIMER_RULES}`,
    messages: body.messages.slice(-30).map((m) => ({ role: m.role, content: m.content })),
  };
}

export async function handleAi(request: Request): Promise<Response> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return Response.json({ error: "AI is not configured: LOVABLE_API_KEY is missing." }, { status: 500 });

  let body: AiTask;
  try {
    body = (await request.json()) as AiTask;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const valid =
    (body?.task === "email" && body.instruction?.trim()) ||
    (body?.task === "research" && body.content?.trim()) ||
    (body?.task === "chat" && Array.isArray(body.messages) && body.messages.length > 0);
  if (!valid) return Response.json({ error: "Please provide some input first." }, { status: 400 });

  const { instructions, messages } = build(body);

  // Probe the upstream status before streaming so errors (402/429) surface cleanly.
  let upstreamStatus = 200;
  let upstreamMessage = "";
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const res = await fetch(input, init);
      if (!res.ok) {
        upstreamStatus = res.status;
        try {
          const j = (await res.clone().json()) as { error?: { message?: string }; message?: string };
          upstreamMessage = j?.error?.message || j?.message || "";
        } catch {
          /* ignore */
        }
      }
      return res;
    },
  });

  const result = streamText({
    model: provider.responses(MODEL),
    instructions,
    messages,
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  const encoder = new TextEncoder();
  const iterator = result.textStream[Symbol.asyncIterator]();
  let first: IteratorResult<string>;
  try {
    first = await iterator.next();
  } catch (e) {
    const status = upstreamStatus !== 200 ? upstreamStatus : 500;
    const msg =
      status === 429
        ? "Too many requests right now. Please wait a moment and try again."
        : status === 402
          ? upstreamMessage || "AI credits are exhausted. Add credits in your workspace to continue."
          : upstreamMessage || (e instanceof Error ? e.message : "AI request failed.");
    return Response.json({ error: msg }, { status });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!first.done) controller.enqueue(encoder.encode(first.value));
        while (true) {
          const { value, done } = await iterator.next();
          if (done) break;
          controller.enqueue(encoder.encode(value));
        }
      } catch {
        controller.enqueue(encoder.encode("\n\n[Response interrupted — please try again.]"));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
