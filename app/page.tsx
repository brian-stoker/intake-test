"use client";

import React, { useCallback, useRef, useState } from "react";
import {
  FileTextIcon,
  XIcon,
  UploadIcon,
  CommandIcon,
  CornerDownLeftIcon,
} from "lucide-react";
import { leadSchema } from "@/lib/schema";
import { samples } from "@/lib/samples";
import { LottieLogo } from "./LottieLogo";

type LoadedFile = { id: string; name: string; content: string };
type Delivery = { dest: string; status: number; error?: string };
type Result = {
  lead?: Record<string, string>;
  delivery?: Delivery;
  error?: string;
};

const uid = () => Math.random().toString(36).slice(2, 9);
const sampleFileName: Record<string, string> = {
  "Messy email": "Messy email.txt",
  "Voicemail transcript": "Voicemail transcript.txt",
  "Broken CSV row": "Broken CSV row.txt",
};

export default function Home() {
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const dragDepth = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeFile = files.find((f) => f.id === activeId) ?? null;
  const currentContent = activeFile ? activeFile.content : draft;
  const hasContent = currentContent.trim().length > 0;
  const charCount = currentContent.length;

  const addFiles = useCallback((incoming: LoadedFile[]) => {
    if (incoming.length === 0) return;
    setFiles((prev) => [...prev, ...incoming]);
    setActiveId(incoming[incoming.length - 1].id);
  }, []);

  const handleFileList = useCallback(
    async (list: FileList | File[]) => {
      const arr = Array.from(list).filter((f) => /\.(md|txt)$/i.test(f.name));
      const loaded = await Promise.all(
        arr.map(async (f) => ({
          id: uid(),
          name: f.name,
          content: await f.text(),
        })),
      );
      addFiles(loaded);
    },
    [addFiles],
  );

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current += 1;
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setIsDragging(false);
    }
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files?.length) handleFileList(e.dataTransfer.files);
  };

  const loadSample = (s: { label: string; value: string }) => {
    addFiles([
      { id: uid(), name: sampleFileName[s.label] ?? `${s.label}.txt`, content: s.value },
    ]);
  };

  const updateContent = (val: string) => {
    if (activeFile) {
      setFiles((prev) =>
        prev.map((f) => (f.id === activeFile.id ? { ...f, content: val } : f)),
      );
    } else {
      setDraft(val);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (id === activeId) setActiveId(next.length ? next[next.length - 1].id : null);
      return next;
    });
  };

  async function process() {
    if (!hasContent || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: currentContent }),
      });
      setResult(await res.json());
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "request failed" });
    } finally {
      setLoading(false);
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      process();
    }
  };

  const fileExt = (name: string) => {
    const m = name.match(/\.([^.]+)$/);
    return m ? m[1].toLowerCase() : "txt";
  };

  const delivery = result?.delivery;
  const sent = delivery && delivery.status >= 200 && delivery.status < 300;

  return (
    <div
      className="relative min-h-screen w-full bg-[#07080a] text-[#e8eaed] flex justify-center py-16 px-4 overflow-hidden"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="absolute inset-0 bg-ambient pointer-events-none" />
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-40" />
      <div className="absolute inset-x-0 top-0 h-px bg-[#1f2329] pointer-events-none" />

      <main className="relative w-[820px] max-w-full">
        {/* Header */}
        <header className="mb-8 flex items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-3 px-2.5 py-1 rounded-full border border-[#1f2329] bg-[#0d0f12]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#a3e635] opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#a3e635]" />
              </span>
              <span className="text-[11px] tracking-wider uppercase text-neutral-400 font-medium">
                Intake · Live
              </span>
            </div>
            <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight leading-tight">
              <LottieLogo className="h-12 w-12 shrink-0" />
              <span className="text-neutral-500">Intake</span>
            </h1>
            <p className="mt-2 text-neutral-400 max-w-md">
              Messy input → structured lead → delivered, in one paste.
            </p>
          </div>
        </header>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[11px] tracking-wider uppercase text-neutral-500 font-medium mr-1">
            Samples
          </span>
          {samples.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => loadSample(s)}
              className="btn-ghost"
            >
              {s.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="ml-auto btn-ghost inline-flex items-center gap-1.5"
          >
            <UploadIcon className="w-3.5 h-3.5" />
            Upload .md / .txt
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".md,.txt,text/markdown,text/plain"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFileList(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {/* File chips */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3 p-2 rounded-lg border border-[#1f2329] bg-[#0a0c0e]">
            {files.map((f) => {
              const active = f.id === activeId;
              return (
                <div
                  key={f.id}
                  onClick={() => setActiveId(f.id)}
                  className={[
                    "group inline-flex items-center gap-2 pl-2 pr-1 py-1 rounded-md text-sm border transition-all cursor-pointer",
                    active
                      ? "bg-[#a3e635] text-black border-[#a3e635] shadow-[0_0_0_3px_rgba(163,230,53,0.15)]"
                      : "bg-[#0d0f12] text-neutral-300 border-[#1f2329] hover:border-[#2a2f37] hover:bg-[#141821]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-mono-display font-semibold uppercase",
                      active ? "bg-black/20 text-black" : "bg-[#1a1d22] text-neutral-400",
                    ].join(" ")}
                  >
                    {fileExt(f.name)}
                  </span>
                  <span className="max-w-[200px] truncate font-medium">{f.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(f.id);
                    }}
                    className={[
                      "p-0.5 rounded transition-colors",
                      active ? "hover:bg-black/15" : "hover:bg-[#1f2329]",
                    ].join(" ")}
                    aria-label={`Remove ${f.name}`}
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Editor card */}
        <div
          className={[
            "relative rounded-xl border transition-colors shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_20px_60px_-20px_rgba(0,0,0,0.8)] overflow-hidden",
            isDragging ? "border-[#a3e635] border-dashed bg-editor" : "border-[#2a2f37] bg-editor",
          ].join(" ")}
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2f37] bg-editor-header">
            <div className="flex items-center gap-2 min-w-0">
              <FileTextIcon className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <span className="text-xs text-neutral-400 truncate font-medium">
                {activeFile ? activeFile.name : "Untitled draft"}
              </span>
            </div>
            <span className="text-[11px] text-neutral-500 font-mono-display shrink-0">
              {charCount.toLocaleString()} / 8,000
            </span>
          </div>

          <textarea
            value={currentContent}
            onChange={(e) => updateContent(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Paste a forwarded email, a voicemail transcript, or a broken CSV row… ⌘ + Return to process."
            rows={10}
            maxLength={8000}
            className="w-full bg-transparent resize-none p-4 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none font-mono-display leading-relaxed"
          />

          {isDragging && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#07080a]/80 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-[#a3e635]/40 bg-[#0d0f12] text-sm text-[#a3e635] font-medium">
                <UploadIcon className="w-4 h-4" />
                Drop .md or .txt files to add
              </div>
            </div>
          )}
        </div>

        {/* Footer / actions */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span>
              {files.length > 0
                ? `${files.length} file${files.length === 1 ? "" : "s"} loaded`
                : "No files loaded"}
              {activeFile && (
                <>
                  {" · "}
                  <span className="text-neutral-400">{activeFile.name}</span>
                </>
              )}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-neutral-600">
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-[#1f2329] bg-[#0d0f12] font-mono-display text-[10px]">
                <CommandIcon className="w-2.5 h-2.5" />
                <CornerDownLeftIcon className="w-2.5 h-2.5" />
              </kbd>
              to process
            </span>
          </div>
          <button
            type="button"
            onClick={process}
            disabled={!hasContent || loading}
            className="px-4 py-2 rounded-md bg-[#a3e635] text-black text-sm font-semibold hover:bg-[#bef264] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#a3e635] shadow-[0_0_0_3px_rgba(163,230,53,0.12)]"
          >
            {loading ? "Processing…" : "Process"}
          </button>
        </div>

        {/* Error */}
        {result?.error && (
          <div className="mt-6 rounded-xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-300">
            Error: {result.error}
          </div>
        )}

        {/* Result card */}
        {result?.lead && (
          <div className="mt-6 overflow-hidden rounded-xl border border-[#2a2f37] bg-editor shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#2a2f37] bg-editor-header">
              <span className="text-[11px] tracking-wider uppercase text-neutral-400 font-medium">
                Structured lead
              </span>
            </div>
            <div className="divide-y divide-[#1f2329]">
              {leadSchema.fields.map((f) => (
                <div key={f.key} className="flex gap-4 px-4 py-3">
                  <span className="w-24 shrink-0 text-[11px] tracking-wider uppercase text-neutral-500 font-medium pt-0.5">
                    {f.label}
                  </span>
                  <span className="text-sm text-neutral-100 break-words whitespace-pre-wrap">
                    {result.lead?.[f.key] || "—"}
                  </span>
                </div>
              ))}
            </div>
            {delivery && (
              <div
                className={[
                  "px-4 py-3 text-sm font-medium border-t",
                  sent
                    ? "border-[#a3e635]/30 bg-[#a3e635]/10 text-[#a3e635]"
                    : "border-amber-700/40 bg-amber-950/40 text-amber-300",
                ].join(" ")}
              >
                {sent ? "✅ Sent" : "⚠️ Delivery issue"} to #{delivery.dest} · HTTP{" "}
                {delivery.status}
                {delivery.error ? ` · ${delivery.error}` : ""}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
