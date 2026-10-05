import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  me: z.string().max(40),
  partner: z.string().max(40),
  games: z
    .array(
      z.object({
        title: z.string().max(60),
        summary: z.string().max(120),
        result: z.string().max(20),
      }),
    )
    .max(10),
});

/** Generates personalised conversation prompts from recent One Phone results. */
export const generateConversationPrompts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<{ prompts: string[]; error?: string }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { prompts: [], error: "AI prompts aren't available right now." };
    const [{ createOpenAI }, { streamText }] = await Promise.all([
      import("@ai-sdk/openai"),
      import("ai"),
    ]);
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    const history = data.games
      .map((g) => `- ${g.title}: ${g.summary} (${g.result} for ${data.me})`)
      .join("\n");
    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        system:
          "You write warm, playful conversation starters for a couple who just played games together. " +
          "Write exactly 4 prompts, one per line, no numbering, no quotes, each under 140 characters. " +
          "Reference specific games or results lightly. Keep it kind and PG — no teasing about losing.",
        prompt: `Players: ${data.me} and ${data.partner || "their partner"}.\nRecent games:\n${history}`,
        maxRetries: 0,
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      const text = await result.text;
      const prompts = text
        .split("\n")
        .map((l) => l.replace(/^[\s\-*\d.)"]+|"$/g, "").trim())
        .filter(Boolean)
        .slice(0, 4);
      return prompts.length ? { prompts } : { prompts: [], error: "No prompts this time — try again." };
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      console.error("conversation prompts failed", status, e);
      if (status === 429) return { prompts: [], error: "Too many requests — try again in a minute." };
      if (status === 402) return { prompts: [], error: "AI credits have run out for this app." };
      return { prompts: [], error: "Couldn't create prompts right now." };
    }
  });
