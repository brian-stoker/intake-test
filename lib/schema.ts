export type Field = {
  key: string;
  label: string;
  type: "string" | "enum";
  description: string; // becomes the LLM's instruction for this field
  options?: string[]; // for enum
};

export const leadSchema = {
  toolName: "extract_lead",
  toolDescription:
    "Extract a structured sales lead from messy inbound text. " +
    "If a value is genuinely absent, return an empty string — never invent one.",
  fields: [
    {
      key: "contact_name",
      label: "Name",
      type: "string",
      description: "Full name of the person inquiring.",
    },
    {
      key: "contact_method",
      label: "Contact",
      type: "string",
      description: "Best phone number or email to reach them.",
    },
    {
      key: "service_requested",
      label: "Service",
      type: "string",
      description: "What service or work they are asking about.",
    },
    {
      key: "urgency",
      label: "Urgency",
      type: "enum",
      options: ["low", "medium", "high", "emergency"],
      description: "How soon they need it, inferred from tone and wording.",
    },
    {
      key: "budget_signal",
      label: "Budget",
      type: "string",
      description: "Any mention of budget, price sensitivity, or 'how much'.",
    },
    {
      key: "suggested_reply",
      label: "Reply",
      type: "string",
      description: "A warm, professional 2-3 sentence reply to send back.",
    },
  ] as Field[],
};

// Generate the Claude tool input_schema from the field list.
export function buildTool() {
  const properties: Record<string, unknown> = {};
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
      type: "object" as const,
      properties,
      required: leadSchema.fields.map((f) => f.key),
    },
  };
}
