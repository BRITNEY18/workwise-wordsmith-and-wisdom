import { useState, type ReactNode } from "react";
import { Check, Copy, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageHeader({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={!text}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {done ? "Copied" : label}
    </Button>
  );
}

export function LoadingLine({ text = "Generating with AI…" }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-primary">
      <Loader2 className="h-4 w-4 animate-spin" /> {text}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{message}</span>
    </div>
  );
}

export function Disclaimer() {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p>
        <strong className="text-foreground">Responsible AI:</strong> Content is AI-generated and may be inaccurate or
        incomplete. Review and verify before use, and avoid sharing confidential or personal data.
      </p>
    </div>
  );
}
