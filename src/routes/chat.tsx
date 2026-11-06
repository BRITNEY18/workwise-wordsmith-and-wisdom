import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { MessagesSquare, SendHorizontal, Square, Trash2, Bot, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton, Disclaimer, ErrorBox, LoadingLine, PageHeader } from "@/components/shared";
import { streamAi } from "@/lib/ai-client";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Workplace Chatbot · Workplace AI" },
      { name: "description", content: "Chat with an AI assistant for workplace questions and tasks." },
      { property: "og:title", content: "Workplace Chatbot · Workplace AI" },
      { property: "og:description", content: "Chat with an AI assistant for workplace questions and tasks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string };
const starters = ["Help me plan my week", "How do I give constructive feedback?", "Draft an agenda for a 30-min team meeting"];

function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const ctrl = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setError("");
    const history: Msg[] = [...messages, { role: "user", content: text.trim() }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);
    ctrl.current = new AbortController();
    try {
      await streamAi({ task: "chat", messages: history }, (t) =>
        setMessages([...history, { role: "assistant", content: t }]), ctrl.current.signal);
    } catch (e) {
      setMessages((m) => (m[m.length - 1]?.content ? m : m.slice(0, -1)));
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-7rem)] flex-col">
      <div className="flex items-start justify-between gap-2">
        <PageHeader icon={<MessagesSquare className="h-6 w-6" />} title="Workplace Chatbot" description="Ask anything about work — the assistant remembers this conversation." />
        <Button variant="ghost" size="sm" disabled={!messages.length || loading} onClick={() => setMessages([])}><Trash2 className="h-4 w-4" /> Clear</Button>
      </div>
      <div className="flex-1 overflow-y-auto rounded-2xl border bg-card p-4 shadow-card md:p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bot className="h-7 w-7" /></div>
            <p className="text-sm text-muted-foreground">How can I help you today?</p>
            <div className="flex flex-wrap justify-center gap-2">
              {starters.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border bg-background px-3 py-1.5 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-primary">{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.content}</div>
                </div>
              ) : (
                <div key={i} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Bot className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    {editIdx === i ? (
                      <Textarea rows={8} value={m.content} className="text-sm"
                        onChange={(e) => setMessages((ms) => ms.map((x, j) => (j === i ? { ...x, content: e.target.value } : x)))} />
                    ) : m.content ? (
                      <div className="prose-ai"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                    ) : (
                      <LoadingLine text="Thinking…" />
                    )}
                    {m.content && !(loading && i === messages.length - 1) && (
                      <div className="mt-2 flex gap-2">
                        <CopyButton text={m.content} />
                        <Button variant="ghost" size="sm" onClick={() => setEditIdx(editIdx === i ? null : i)}>
                          {editIdx === i ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />} {editIdx === i ? "Done" : "Edit"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>
      {error && <div className="mt-3"><ErrorBox message={error} /></div>}
      <form className="mt-3 flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-card"
        onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <Textarea rows={1} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a workplace question…"
          className="max-h-40 min-h-10 resize-none border-0 shadow-none focus-visible:ring-0"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} />
        {loading ? (
          <Button type="button" size="icon" variant="outline" onClick={() => ctrl.current?.abort()} aria-label="Stop"><Square className="h-4 w-4" /></Button>
        ) : (
          <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send"><SendHorizontal className="h-4 w-4" /></Button>
        )}
      </form>
      <div className="mt-3"><Disclaimer /></div>
    </div>
  );
}
