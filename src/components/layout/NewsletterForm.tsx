"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Subscription failed.");
      setState("done");
      setMessage(data.message ?? "You're on the list.");
      setEmail("");
    } catch (err) {
      setState("error");
      setMessage((err as Error).message);
    }
  }

  if (state === "done") {
    return (
      <p className="flex items-center gap-2 rounded border border-ok/40 bg-ok/10 px-4 py-3 text-sm text-ok">
        <CheckCircle2 size={16} /> {message}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          placeholder="your@email.com"
          aria-label="Email address for newsletter"
          className="field rounded-r-none"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          aria-label="Subscribe to newsletter"
          className="shrink-0 rounded-r-sm border border-l-0 border-copper bg-gradient-to-br from-copper to-champagne px-4 text-charcoal transition-all hover:brightness-110 disabled:opacity-60"
        >
          <ArrowRight size={18} />
        </button>
      </div>
      {state === "error" && <p className="text-xs text-danger">{message}</p>}
      {state === "sending" && <p className="text-xs text-ivory/45">Subscribing…</p>}
    </form>
  );
}
