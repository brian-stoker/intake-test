import { leadSchema } from "@/lib/schema";

export type Delivery = {
  dest: string;
  status: number;
  error?: string;
};

export async function deliver(lead: Record<string, string>): Promise<Delivery> {
  const lines = leadSchema.fields.map(
    (f) => `*${f.label}:* ${lead[f.key] || "—"}`,
  );
  const text = `🆕 New lead\n${lines.join("\n")}`;
  const dest = process.env.DESTINATION ?? "slack";

  try {
    if (dest === "slack") {
      const r = await fetch(process.env.SLACK_WEBHOOK_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      return { dest, status: r.status };
    }
    if (dest === "discord") {
      const r = await fetch(process.env.DISCORD_WEBHOOK_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      return { dest, status: r.status };
    }
    if (dest === "email") {
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
  } catch (e) {
    return { dest, status: 0, error: e instanceof Error ? e.message : String(e) };
  }
  return { dest, status: 0, error: "no destination configured" };
}
