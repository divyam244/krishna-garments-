"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Emblem } from "@/components/layout/SiteHeader";
import { brand } from "@/lib/brand";

export default function OwnerLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Sign in failed.");

      // mustChangePassword lands the owner on Settings rather than the dashboard.
      router.replace(data.mustChangePassword ? "/owner/settings#password" : "/owner");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-charcoal px-5 py-10">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-espresso/45 blur-[120px]" />
        <div className="absolute -right-24 bottom-8 h-[360px] w-[360px] rounded-full border border-copper/15" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-champagne/40 to-transparent" />
      </div>

      <div className="relative w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Emblem size={62} />
          <div>
            <h1 className="font-display text-[26px] tracking-[0.14em] text-ivory">KRISHNA GARMENTS</h1>
            <p className="mt-1.5 text-[10px] uppercase tracking-[0.38em] text-champagne">Owner Panel</p>
          </div>
        </div>

        <form onSubmit={submit} className="card flex flex-col gap-5 p-7" noValidate>
          <div className="flex items-center gap-2 text-champagne">
            <Lock size={15} />
            <span className="text-[11px] uppercase tracking-[0.22em]">Restricted area</span>
          </div>

          <label className="block">
            <span className="label">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="field"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
            />
          </label>

          <label className="block">
            <span className="label">Password</span>
            <span className="relative block">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field pr-11"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded text-ivory/40 hover:text-champagne"
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </span>
          </label>

          {error && (
            <p role="alert" className="rounded border border-danger/45 bg-danger/10 px-3 py-2.5 text-[12.5px] leading-relaxed text-danger">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-solid sheen w-full">
            {busy ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Verifying…
              </>
            ) : (
              "Sign in"
            )}
          </button>

          <p className="text-center text-[11px] leading-relaxed text-ivory/35">
            Sessions are HTTP-only and expire after 8 hours. Five wrong attempts locks the account for 15 minutes.
          </p>
        </form>

        <Link href="/" className="mt-6 block text-center text-[11px] uppercase tracking-[0.2em] text-ivory/40 hover:text-champagne">
          ← Back to {brand.short}
        </Link>
      </div>
    </div>
  );
}
