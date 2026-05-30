# LeadDrop

**Messy input → structured lead → delivered, in one paste.**

Paste any messy inbound — a forwarded email, a voicemail transcript, or a broken
CSV row — and Claude (via AWS Bedrock, with **forced tool use**) extracts a clean,
structured lead. The result renders on screen *and* is POSTed to Slack in real time.

## The one idea

[`lib/schema.ts`](lib/schema.ts) is the **single source of truth**. It generates
both the LLM's tool `input_schema` *and* the UI rows. That makes the two kinds of
"can it also do X?" scope creep into config edits, not rewrites:

- **Extract one more thing** → add an object to `leadSchema.fields`. The model
  extracts it and the UI shows it automatically. No other file touched.
- **Send it somewhere else** → change `DESTINATION` (slack | discord | email)
  plus its URL/key. Zero logic change.

## Stack

Next.js (App Router) · TypeScript · `@anthropic-ai/bedrock-sdk` · Tailwind · Vercel.

## Run locally

```bash
pnpm install
cp .env.example .env.local   # fill in the values
pnpm dev
```

Then open http://localhost:3000, hit a "Load" sample button, and Process.

## Environment variables

| Var | Required | Purpose |
|---|---|---|
| `AWS_BEARER_TOKEN_BEDROCK` | ✅ | Bedrock API bearer token (SDK reads it automatically) |
| `AWS_REGION` | optional | Defaults to `us-east-1` |
| `MODEL` | optional | Bedrock model id. Default `us.anthropic.claude-sonnet-4-5-20250929-v1:0` |
| `DESTINATION` | ✅ | `slack` \| `discord` \| `email` — the live-swappable axis |
| `SLACK_WEBHOOK_URL` | if slack | Incoming webhook |
| `DISCORD_WEBHOOK_URL` | if discord | Channel webhook |
| `RESEND_API_KEY` + `TO_EMAIL` | if email | Email delivery via Resend |

## Architecture

```
Browser (app/page.tsx)  →  POST /api/process { input }
  ├─ buildTool(leadSchema)              ← schema.ts is the single source of truth
  ├─ Bedrock Messages API, forced tool_choice → guaranteed-valid JSON
  ├─ deliver(lead)                      ← reads DESTINATION, POSTs to webhook
  └─ return { lead, delivery }
Browser renders fields (from schema.ts) + delivery status chip
```

Stateless: one request, no database, zero manual parsing.

## Roadmap

Per-client schema/destination (multi-tenant), real CRM sinks (GoHighLevel/HubSpot),
persistence + dedupe, delivery retry/queue, voice-in transcription, conversion tracking.
