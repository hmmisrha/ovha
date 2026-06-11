import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const SYSTEM = `You are OVHA AI, an on-road vehicle help assistant. Help drivers with quick, safe, step-by-step roadside guidance for issues like flat tyre, engine overheat, dead battery, brake failure, or no fuel.
Rules:
- Be concise, numbered steps when possible.
- Always start with a safety check (hazard lights, pull over, passengers safe).
- If the issue is dangerous (brake failure, fire, smoke, accident), tell the user to call emergency 112 immediately.
- Do not give advice beyond a layperson roadside fix; recommend a mechanic when needed.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages: UIMessage[] };
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const provider = createOpenAICompatible({
          name: "lovable",
          baseURL: "https://ai.gateway.lovable.dev/v1",
          headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
        });

        const result = streamText({
          model: provider("google/gemini-3-flash-preview"),
          system: SYSTEM,
          messages: await convertToModelMessages(messages),
        });
        return result.toUIMessageStreamResponse();
      },
    },
  },
});
