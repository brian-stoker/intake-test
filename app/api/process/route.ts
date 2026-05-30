import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import { buildTool, leadSchema } from "@/lib/schema";
import { deliver } from "@/lib/deliver";

export const runtime = "nodejs";

const MODEL = process.env.MODEL ?? "us.anthropic.claude-sonnet-4-5-20250929-v1:0";

// Reads AWS_BEARER_TOKEN_BEDROCK from the environment automatically.
const client = new AnthropicBedrock({
  awsRegion: process.env.AWS_REGION ?? "us-east-1",
});

export async function POST(req: Request) {
  try {
    const { input } = await req.json();
    const tool = buildTool();

    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      tools: [tool],
      tool_choice: { type: "tool", name: leadSchema.toolName }, // force JSON
      messages: [
        {
          role: "user",
          content: `Extract the lead from this inbound message:\n\n${String(
            input ?? "",
          ).slice(0, 8000)}`,
        },
      ],
    });

    const block = msg.content.find((b) => b.type === "tool_use");
    const lead = (block?.type === "tool_use" ? block.input : {}) as Record<
      string,
      string
    >;

    const delivery = await deliver(lead); // reads DESTINATION env
    return Response.json({ lead, delivery });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
