import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, BookOpenText, MessagesSquare, ArrowRight } from "lucide-react";
import { Disclaimer } from "@/components/shared";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Workplace Productivity Assistant" },
      { name: "description", content: "Write emails, research topics and chat with an AI workplace assistant." },
      { property: "og:title", content: "AI Workplace Productivity Assistant" },
      { property: "og:description", content: "Write emails, research topics and chat with an AI workplace assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const tools = [
  { to: "/email", icon: Mail, title: "Smart Email Generator", desc: "Turn quick notes into polished emails in a Formal, Friendly or Persuasive tone." },
  { to: "/research", icon: BookOpenText, title: "AI Research Assistant", desc: "Summarise articles or topics into findings, insights and recommendations." },
  { to: "/chat", icon: MessagesSquare, title: "Workplace Chatbot", desc: "Ask workplace questions and get help with tasks in a context-aware chat." },
] as const;

function Index() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-hero p-8 shadow-card md:p-10">
        <p className="text-sm font-medium text-primary">Welcome back</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Get more done at work with your AI assistant
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">Pick a tool to start. Everything the AI writes can be edited and copied.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {tools.map((t) => (
          <Link key={t.to} to={t.to} className="group rounded-2xl border bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <t.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-semibold text-foreground">{t.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
      <Disclaimer />
    </div>
  );
}
