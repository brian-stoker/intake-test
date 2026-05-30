# intake-test.stokd.cloud

A simple lead capture tool that takes messy input and turns it into a structured lead, then delivers it to an external destination.

---

## Local values


slack hook endpoint: https://hooks.slack.com/services/REDACTED/REDACTED/REDACTED
vercel token available in env vars
aws for stokd.cloud is in the stokd-cloud aws profile


**Messy input → structured lead → delivered, in one paste.**
*A.I. Guys "Vibe Check" — 60-Minute Headache Sprint*

---

| | |
|---|---|
| **Author** | Stoked Consulting |
| **Status** | Build-ready |
| **Build budget** | 60 minutes, hard cap |
| **Deliverable** | Deployed Vercel app + 2-min Loom |
| **Stack** | Next.js (App Router) · TypeScript · Anthropic SDK · Vercel |
| **Demo vertical** | Inbound lead intake for a local service business |

---

## 1. TL;DR

LeadDrop takes any messy inbound — a forwarded inquiry email, a rambling voicemail transcript, or a malformed CSV row — and uses Claude to extract a clean, structured lead (who, how to reach them, what they want, how urgent, budget signal, and a ready-to-send reply). The result renders on screen and is simultaneously pushed to a Slack/Discord channel so a human sees it land in real time.

The task as written by A.I. Guys is generic ("messy input → LLM → structured summary → webhook"). This PRD intentionally **specializes that task into the actual job they hire for**: field automation for local SMBs, where pay is per *converted* project. The build is the artifact; the strategy is the point.

## 2. Why this build wins the Vibe Check

Read the email like a spec and three things fall out:

1. **It's a sales/positioning test, not a coding test.** "$600 per converted project," "we book you visits," "Shadow Session in the Orlando Metro." They send engineers to client sites to build and *close*. A build that visibly understands their business beats a cleverer build that doesn't.
2. **The scope-creep question is the whole game.** They explicitly ask how you handle a client saying *"can it also do [X]?"* mid-build. The winning answer is not a sentence — it's an architecture where adding a field or changing the destination is a config edit you perform **live, on camera**. Answer with code.
3. **Speed and "no manager holding your hand" are table stakes.** Deploying to Vercel in minute five and demoing a working pipeline proves both.

The single design decision that carries the whole demo: **the extraction schema is the one source of truth.** One file defines the fields; from it we generate both the LLM's tool schema and the UI. That is what makes "can it also do X?" a 15-second move instead of a rewrite.

## 3. Goals

- **G1** — Paste any of three messy input shapes (free text / transcript / broken CSV) and get a correct structured lead back in under ~5 seconds.
- **G2** — Push the structured result to an external destination (Slack or Discord webhook) visibly, in real time.
- **G3** — Demonstrate **two axes of extensibility live**: (a) add a new extracted field, (b) swap the delivery destination — both as config, no logic rewrite.
- **G4** — Ship it deployed (public Vercel URL) and recorded (2-min Loom) inside 60 minutes.

## 4. Non-Goals (scope discipline — protect the clock)

- ❌ Auth, login, multi-user, or accounts.
- ❌ Database / persistence. Stateless request → response → webhook.
- ❌ Polished design system. Clean and legible is enough; functional beats pretty here.
- ❌ Real CRM integration. A webhook *stands in* for the CRM and is more visually convincing in a demo anyway.
- ❌ Handling files >~8KB or batch CSVs. Single paste, single lead (mention batch as a roadmap item, don't build it).
- ❌ Streaming the model response. A spinner + a fast model is enough.

## 5. Success Metrics

| Metric | Target |
|---|---|
| Cold-paste → rendered result | ≤ 5 s |
| Distinct input shapes handled by one code path | 3 (text, transcript, CSV) |
| Live config changes shown in Loom | 2 (add field, swap destination) |
| Loom length | ≤ 2:00 |
| Manual parsing code written | 0 lines (the model normalizes everything) |
| Time to first successful Vercel deploy | ≤ minute 5 |

## 6. Personas

- **Chris / the A.I. Guys reviewer** — the real audience for the Loom. Wants to see speed, judgment, business sense, and grace under a curveball. Skims; decides in 2 minutes.
- **The simulated end client** ("the SMB owner") — the persona you role-play when answering the scope-creep question. A plumber, med-spa, or roofing-company owner who blurts *"can it also grab their budget and text it to me?"* mid-build. Your demo speaks to them.

## 7. Functional Requirements

### 7.1 Input
- A single `<textarea>` accepting arbitrary text up to ~8KB.
- Three "Load sample" buttons that prefill the box with (1) a messy forwarded email, (2) a voicemail transcript, (3) a malformed CSV row. This removes typing from the live demo and lets you fire all three shapes through the *same* button.
- A "Process" button. Disabled while in flight.

### 7.2 Extraction engine
- Single API route `POST /api/process`, body `{ input: string }`.
- Calls Claude with **forced tool use** (`tool_choice`) so output is guaranteed-valid structured JSON — no string parsing, no regex, no "please respond only in JSON" prompt-praying.
- The tool's `input_schema` is **generated from `lib/schema.ts`** at call time.
- Truncate `input` to a max length before sending (token + latency control).

### 7.3 Output / delivery
- The route returns the structured lead to the browser for rendering.
- The route also POSTs a formatted message to the destination configured by env (`slack` | `discord` | `email`).
- The UI renders one card with a row per schema field (also generated from `schema.ts`), plus a "✅ Sent to #leads" confirmation showing the webhook's HTTP status.

### 7.4 The extensibility surface (the differentiator)
Two kinds of "X" show up in the field. Build for both:

- **"Extract one more thing"** → add a single object to the `fields` array in `schema.ts`. The tool schema and the UI both pick it up automatically. *This is the on-camera move.*
- **"Send it somewhere else"** → change one env var (`DESTINATION`) + its URL/key. Slack ↔ Discord ↔ email with zero logic change.

## 8. Architecture

```
Browser (app/page.tsx)
  └─ textarea + samples + Process
        │  POST { input }
        ▼
/api/process (route.ts)
  ├─ buildTool(leadSchema)         ← schema.ts is the single source of truth
  ├─ Anthropic Messages API
  │     tools:[tool], tool_choice:{type:"tool", name:"extract_lead"}
  │     → content block type "tool_use" → .input  (valid JSON, guaranteed)
  ├─ deliver(lead)                  ← reads DESTINATION env, POSTs to webhook/email
  └─ return { lead, delivery }
        │
        ▼
Browser renders fields (from schema.ts) + delivery status
```

**Data flow is one-way and stateless.** Everything the reviewer needs to see happens in a single request, which keeps the demo legible and the code small.

## 9. Technical Specification

### 9.1 The schema — single source of truth (`lib/schema.ts`)

```ts
export type Field = {
  key: string;
  label: string;
  type: "string" | "enum";
  description: string;     // becomes the LLM's instruction for this field
  options?: string[];      // for enum
};

export const leadSchema = {
  toolName: "extract_lead",
  toolDescription:
    "Extract a structured sales lead from messy inbound text. " +
    "If a value is genuinely absent, return an empty string — never invent one.",
  fields: [
    { key: "contact_name",     label: "Name",        type: "string",
      description: "Full name of the person inquiring." },
    { key: "contact_method",   label: "Contact",     type: "string",
      description: "Best phone number or email to reach them." },
    { key: "service_requested",label: "Service",     type: "string",
      description: "What service or work they are asking about." },
    { key: "urgency",          label: "Urgency",     type: "enum",
      options: ["low", "medium", "high", "emergency"],
      description: "How soon they need it, inferred from tone and wording." },
    { key: "budget_signal",    label: "Budget",      type: "string",
      description: "Any mention of budget, price sensitivity, or 'how much'." },
    { key: "suggested_reply",  label: "Reply",       type: "string",
      description: "A warm, professional 2-3 sentence reply to send back." },
  ] as Field[],
};

// Generate the Claude tool input_schema from the field list.
export function buildTool() {
  const properties: Record<string, any> = {};
  for (const f of leadSchema.fields) {
    properties[f.key] =
      f.type === "enum"
        ? { type: "string", enum: f.options, description: f.description }
        : { type: "string", description: f.description };
  }
  return {
    name: leadSchema.toolName,
    description: leadSchema.toolDescription,
    input_schema: {
      type: "object",
      properties,
      required: leadSchema.fields.map((f) => f.key),
    },
  };
}
```

> **The whole "can it also do X?" demo lives here.** Adding `{ key: "address", label: "Address", type: "string", description: "Service address if mentioned." }` to `fields` makes the model extract it *and* the UI show it — no other file touched.

### 9.2 API route (`app/api/process/route.ts`)

```ts
import Anthropic from "@anthropic-ai/sdk";
import { buildTool, leadSchema } from "@/lib/schema";
import { deliver } from "@/lib/deliver";

const MODEL = process.env.MODEL ?? "claude-sonnet-4-6";
const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

export async function POST(req: Request) {
  try {
    const { input } = await req.json();
    const tool = buildTool();

    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      tools: [tool],
      tool_choice: { type: "tool", name: leadSchema.toolName }, // force JSON
      messages: [{
        role: "user",
        content: `Extract the lead from this inbound message:\n\n${String(input).slice(0, 8000)}`,
      }],
    });

    const block = msg.content.find((b) => b.type === "tool_use");
    const lead = block ? (block as any).input : {};

    const delivery = await deliver(lead); // reads DESTINATION env
    return Response.json({ lead, delivery });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "failed" }, { status: 500 });
  }
}
```

### 9.3 Delivery (`lib/deliver.ts`)

```ts
import { leadSchema } from "@/lib/schema";

export async function deliver(lead: Record<string, string>) {
  const lines = leadSchema.fields.map((f) => `*${f.label}:* ${lead[f.key] || "—"}`);
  const text = `🆕 New lead\n${lines.join("\n")}`;
  const dest = process.env.DESTINATION ?? "slack";

  try {
    if (dest === "slack") {
      const r = await fetch(process.env.SLACK_WEBHOOK_URL!, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      return { dest, status: r.status };
    }
    if (dest === "discord") {
      const r = await fetch(process.env.DISCORD_WEBHOOK_URL!, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      return { dest, status: r.status };
    }
    if (dest === "email") {
      // Resend: POST https://api.resend.com/emails with bearer RESEND_API_KEY
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "LeadDrop <onboarding@resend.dev>",
          to: process.env.TO_EMAIL,
          subject: `New lead: ${lead.contact_name || "Unknown"}`,
          text: text.replace(/\*/g, ""),
        }),
      });
      return { dest, status: r.status };
    }
  } catch (e: any) {
    return { dest, status: 0, error: e?.message };
  }
  return { dest, status: 0, error: "no destination configured" };
}
```

### 9.4 Front end (`app/page.tsx`) — behavior, not pixels
- Controlled `textarea`, three sample-loader buttons, a Process button with a loading state.
- On success, map over `leadSchema.fields` and render `label: value` rows (UI auto-extends when schema grows).
- Show the delivery status chip: `Sent to {dest} · HTTP {status}`.
- Minimal Tailwind: a centered column, a card, readable spacing. No more.

### 9.5 Environment variables

| Var | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Auth for the Messages API |
| `DESTINATION` | ✅ | `slack` \| `discord` \| `email` — the live-swappable axis |
| `SLACK_WEBHOOK_URL` | if slack | Incoming webhook |
| `DISCORD_WEBHOOK_URL` | if discord | Channel webhook |
| `RESEND_API_KEY` + `TO_EMAIL` | if email | Email delivery |
| `MODEL` | optional | Defaults to `claude-sonnet-4-6` |

### 9.6 Model choice
Use **`claude-sonnet-4-6`** — current, fast, strong at structured extraction, $3/$15 per M tokens. It's the right balance for a latency-sensitive field tool. Once it's working you can mention `claude-haiku-4-5-20251001` as the cheaper/faster lever at scale — a good throwaway line in the Loom that shows you think about unit economics (which is literally how A.I. Guys gets paid). Avoid the retired `claude-sonnet-4-20250514` string.

## 10. Build Plan — 60 minutes

| Min | Task | Why this order |
|---|---|---|
| 0–5 | `create-next-app`, push to GitHub, deploy to Vercel, add `ANTHROPIC_API_KEY` + `DESTINATION` + webhook URL | **Prove the pipeline first.** If deploy works at minute 5, nothing else can ambush you later. |
| 5–20 | `lib/schema.ts` + `/api/process`. Test with `curl` until it returns clean JSON | Lock the core before touching UI. |
| 20–32 | `lib/deliver.ts` + wire the Slack/Discord webhook. Confirm a message lands in-channel | Get the *visible* win working early — it's the demo's money shot. |
| 32–45 | `app/page.tsx`: textarea, 3 sample buttons, results card, status chip | UI last; it's the thinnest-risk part. |
| 45–55 | Fire all three samples (text, transcript, broken CSV). Rehearse adding `address` to the schema and the env swap | Dress rehearsal. Find breakage now, not on camera. |
| 55–60 | Final `git push` → Vercel redeploy → grab the URL | Ship. |

**If behind:** cut the email destination first (Slack alone proves the axis), then cut sample buttons (paste manually). Never cut the live schema edit — it's the differentiator.

## 11. The 2-Minute Loom (the actual deliverable)

| Time | Beat |
|---|---|
| 0:00–0:20 | "This is live on Vercel. The job: messy in, structured out, delivered somewhere a human acts on it. Use case — inbound leads for a local service business." Paste the messy email. |
| 0:20–0:45 | Hit Process → fields populate → message pops into Slack in ~3s. "No database, no manual parsing. Forced tool use means the model returns guaranteed-valid JSON." |
| 0:45–1:05 | Paste the **broken CSV** into the *same* box. Same clean output. "Same code path — the model normalizes any shape, so I never write a parser per format." |
| 1:05–1:40 | **The X answer, performed live:** "Mid-build a client says *'can it also grab their address and email it to me instead of Slack?'* Watch." Add `address` to `schema.ts` → it appears. Flip `DESTINATION=email`. "Both kinds of scope creep — new field, new destination — are config, not a rewrite. That's how I keep a client unblocked without breaking the build." |
| 1:40–2:00 | 15-second code tour: "`schema.ts` is the single source of truth — it drives the model *and* the UI. One route. On Vercel. That's it." |

**Reply email contents:** Loom link + GitHub repo link (push it public) + one line: *"Specialized the task into your actual job — local-business lead intake — and made the 'can it also do X?' question a config change I do on camera. Ready for the Shadow Session."*

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Vercel env vars not picked up | Deploy + smoke-test at minute 5, before building anything real. |
| Model returns malformed / partial data | `tool_choice` forces a valid `tool_use` block; `required` in schema forces all keys; try/catch returns a 500 you can see. |
| Webhook fails silently | Return and display the HTTP status in the UI; you'll *see* a non-200. |
| Huge paste blows latency/tokens | `.slice(0, 8000)` on input. |
| Demo feels slow on camera | Sonnet 4.6 is fast; keep sample inputs modest; spinner covers the wait. |
| Clock overrun | Cut list in §10; the schema-edit demo is protected. |
| API key leak | Key lives only in Vercel env + local `.env.local` (gitignored). Never in client code, never committed. |

## 13. Out of Scope Today → "Real Gig" Roadmap

Worth *naming* in the Loom or reply to show you see past the demo — these are exactly what the paid field work needs:

- **Per-client config** — each SMB gets its own schema + destination (multi-tenant `schema.ts`).
- **Real CRM sink** — GoHighLevel / HubSpot instead of a webhook (the SMB-automation standard).
- **Persistence + dedupe** — store leads, avoid double-sends.
- **Retry/queue** — deliveries shouldn't drop if a webhook is down.
- **Voice-in** — accept the actual voicemail audio, transcribe, then run the same pipeline.
- **Conversion tracking** — tag which leads convert (directly tied to the $600-per-converted-project model).

## 14. Appendix — Sample Inputs

**A. Messy forwarded email**
```
Fwd: hey saw your truck — got a leak under the kitchen sink thats been
dripping all weekend, getting worse. can someone come thurs or fri? not
trying to spend a fortune lol. call me 407-555-0148 -mike
```

**B. Voicemail transcript**
```
uh yeah hi this is uh Denise um I think my AC unit just died it's like
90 degrees in here and I've got my kids home so this is kind of an
emergency um you can reach me at denise dot r at gmail whenever thanks bye
```

**C. Malformed CSV row**
```
name,phone,notes
"Carlos R.",,"wants quote for driveway resurfacing ~600 sq ft, flexible
on timing, asked if we do payment plans"
```

Each should normalize through the *same* endpoint into the same six-field lead — that sameness is the point you're selling.
