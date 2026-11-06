import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { BookOpenText, Sparkle, Square, Pencil, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton, Disclaimer, ErrorBox, LoadingLine, PageHeader, Panel } from "@/components/shared";
import { streamAi } from "@/lib/ai-client";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant · Workplace AI" },
      { name: "description", content: "Summarise topics or articles into key findings, insights and recommendations." },
      { property: "og:title", content: "AI Research Assistant · Workplace AI" },
      { property: "og:description", content: "Summarise topics or articles into key findings, insights and recommendations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  const [content, setContent] = useState("");
  const [focus, setFocus] = useState("");
  const [output, setOutput] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ctrl = useRef<AbortController | null>(null);

  async function analyse() {
    setError("");
    setOutput("");
    setEditing(false);
    setLoading(true);
    ctrl.current = new AbortController();
    try {
      await streamAi({ task: "research", content, focus: focus || undefined }, setOutput, ctrl.current.signal);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader icon={<BookOpenText className="h-6 w-6" />} title="AI Research Assistant" description="Paste an article or enter a topic to get a structured analysis." />
      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <Panel title="Source material">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c">Topic or article text</Label>
              <Textarea id="c" rows={12} value={content} onChange={(e) => setContent(e.target.value)}
                placeholder="e.g. The impact of hybrid work on team collaboration — or paste a full article here." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="f">Focus (optional)</Label>
              <Input id="f" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. implications for a 50-person startup" />
            </div>
            {loading ? (
              <Button variant="outline" className="w-full" onClick={() => ctrl.current?.abort()}><Square className="h-4 w-4" /> Stop</Button>
            ) : (
              <Button className="w-full" disabled={!content.trim()} onClick={analyse}><Sparkle className="h-4 w-4" /> Analyse</Button>
            )}
          </div>
        </Panel>
        <Panel title="Analysis" action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!output || loading} onClick={() => setEditing((v) => !v)}>
              {editing ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />} {editing ? "Preview" : "Edit"}
            </Button>
            <CopyButton text={output} />
          </div>
        }>
          <div className="space-y-3">
            {loading && <LoadingLine text="Analysing…" />}
            {error && <ErrorBox message={error} />}
            {editing ? (
              <Textarea rows={20} value={output} onChange={(e) => setOutput(e.target.value)} className="font-mono text-sm" />
            ) : output ? (
              <div className="prose-ai"><ReactMarkdown>{output}</ReactMarkdown></div>
            ) : (
              !loading && <p className="text-sm text-muted-foreground">Summary, key findings, insights and recommendations will appear here.</p>
            )}
          </div>
        </Panel>
      </div>
      <div className="mt-6"><Disclaimer /></div>
    </div>
  );
}
