import type Anthropic from "@anthropic-ai/sdk";

import type { ChatMessage, Profile } from "@/lib/app-config";
import { describeError, getClient, MODEL } from "@/lib/server/claude";
import { profileBlocks } from "@/lib/server/profile";
import { interviewSystemPrompt } from "@/lib/server/prompts";

export const runtime = "nodejs";
export const maxDuration = 120;

interface ChatRequest {
  messages?: ChatMessage[];
  profile?: Profile | null;
  feeling?: number | null;
}

export async function POST(request: Request) {
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return Response.json({ error: "Could not read the request." }, { status: 400 });
  }

  const history: Anthropic.MessageParam[] = (body.messages ?? [])
    .filter((m) => typeof m.content === "string" && m.content.trim().length > 0)
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

  // The profile travels in the opening user turn, so Claude has read it before
  // the first question. The browser keeps it; the server never stores it.
  const opening: Anthropic.MessageParam = {
    role: "user",
    content: [
      ...profileBlocks(body.profile),
      { type: "text", text: "I am ready. Please start." },
    ],
  };

  try {
    const client = getClient();
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 1024,
      output_config: { effort: "low" },
      system: interviewSystemPrompt(body.feeling ?? null),
      messages: [opening, ...history],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          const final = await stream.finalMessage();
          if (final.stop_reason === "refusal") {
            controller.enqueue(
              encoder.encode("\n\nI cannot continue with that. Try starting again."),
            );
          }
        } catch (error) {
          const { message } = describeError(error);
          controller.enqueue(encoder.encode(`\n\n${message}`));
        } finally {
          controller.close();
        }
      },
      cancel() {
        stream.abort();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    const { status, message } = describeError(error);
    return Response.json({ error: message }, { status });
  }
}
