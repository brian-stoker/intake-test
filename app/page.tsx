"use client";

import { useState } from "react";
import { leadSchema } from "@/lib/schema";
import { samples } from "@/lib/samples";

type Delivery = { dest: string; status: number; error?: string };
type Result = { lead?: Record<string, string>; delivery?: Delivery; error?: string };

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function process() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      setResult(await res.json());
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "request failed" });
    } finally {
      setLoading(false);
    }
  }

  const delivery = result?.delivery;
  const sent = delivery && delivery.status >= 200 && delivery.status < 300;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">LeadDrop</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Messy input → structured lead → delivered, in one paste.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {samples.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setInput(s.value)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Load: {s.label}
          </button>
        ))}
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste a forwarded email, a voicemail transcript, or a broken CSV row…"
        rows={8}
        maxLength={8000}
        className="w-full resize-y rounded-lg border border-neutral-300 bg-white p-3 font-mono text-sm shadow-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"
      />

      <button
        type="button"
        onClick={process}
        disabled={loading || input.trim().length === 0}
        className="self-start rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition enabled:hover:bg-neutral-700 disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:enabled:hover:bg-neutral-200"
      >
        {loading ? "Processing…" : "Process"}
      </button>

      {result?.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          Error: {result.error}
        </div>
      )}

      {result?.lead && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {leadSchema.fields.map((f) => (
              <div key={f.key} className="flex gap-4 px-4 py-3">
                <span className="w-24 shrink-0 text-sm font-medium text-neutral-500">
                  {f.label}
                </span>
                <span className="text-sm break-words whitespace-pre-wrap">
                  {result.lead?.[f.key] || "—"}
                </span>
              </div>
            ))}
          </div>

          {delivery && (
            <div
              className={`px-4 py-3 text-sm font-medium ${
                sent
                  ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {sent ? "✅ Sent" : "⚠️ Delivery issue"} to {delivery.dest} · HTTP{" "}
              {delivery.status}
              {delivery.error ? ` · ${delivery.error}` : ""}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
