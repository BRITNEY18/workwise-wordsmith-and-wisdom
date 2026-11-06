import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Mail, Wand2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton, Disclaimer, ErrorBox, LoadingLine, PageHeader, Panel } from "@/components/shared";
import { streamAi } from "@/lib/ai-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator · Workplace AI" },
      { name: "description", content: "Generate professional emails in Formal, Friendly or Persuasive tones." },
      { property: "og:title", content: "Smart Email Generator · Workplace AI" },
      { property: "og:description", content: "Generate professional emails in Formal, Friendly or Persuasive tones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmailPage,
});

const tones = ["Formal", "Friendly", "Persuasive"] as const;

function EmailPage() {
  const [instruction, setInstruction] = useState("");
  const [recipient, setRecipient] = useState("");
  const [tone, setTone] = useState<(typeof tones)[number]>("Formal");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ctrl = useRef<AbortController | null>(null);

  async function generate() {
    setError("");
    setOutput("");
    setLoading(true);
    ctrl.current = new AbortController();
    try {
      await streamAi({ task: "email", instruction, tone, recipient: recipient || undefined }, setOutput, ctrl.current.signal);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader icon={<Mail className="h-6 w-6" />} title="Smart Email Generator" description="Describe what you need and choose a tone." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Instructions">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ins">What should the email say?</Label>
              <Textarea id="ins" rows={7} value={instruction} onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g. Ask the finance team to approve the Q3 marketing budget by Friday and offer a quick call." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rec">Recipient (optional)</Label>
              <Input id="rec" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. Sarah, Head of Finance" />
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <div className="grid grid-cols-3 gap-2">
                {tones.map((t) => (
                  <button key={t} type="button" onClick={() => setTone(t)}
                    className={cn("rounded-xl border px-3 py-2 text-sm font-medium transition",
                      tone === t ? "border-primary bg-primary/10 text-primary" : "bg-background text-muted-foreground hover:bg-muted")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <Button variant="outline" className="w-full" onClick={() => ctrl.current?.abort()}><Square className="h-4 w-4" /> Stop</Button>
            ) : (
              <Button className="w-full" disabled={!instruction.trim()} onClick={generate}><Wand2 className="h-4 w-4" /> Generate email</Button>
            )}
          </div>
        </Panel>
        <Panel title="Generated email (editable)" action={<CopyButton text={output} />}>
          <div className="space-y-3">
            {loading && <LoadingLine />}
            {error && <ErrorBox message={error} />}
            <Textarea rows={16} value={output} onChange={(e) => setOutput(e.target.value)}
              placeholder="Your AI-generated email will appear here. You can edit it before copying." className="font-mono text-sm" />
          </div>
        </Panel>
      </div>
      <div className="mt-6"><Disclaimer /></div>
    </div>
  );
}
