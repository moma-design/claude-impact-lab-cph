import type Anthropic from "@anthropic-ai/sdk";

import { SignalsSchema, type Signal } from "@/lib/signals-schema";
import { describeError, getClient, MODEL } from "@/lib/server/claude";
import { SIGNALS_SYSTEM_PROMPT, signalsUserPrompt } from "@/lib/server/prompts";
import savedExampleSignals from "@/lib/signals-example.json";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PAUSE_RESUMES = 3;

interface SignalsRequest {
  flowMarkdown?: string;
  isExample?: boolean;
}

/** Every URL the search actually returned, so no invented source can survive. */
function collectSourceUrls(content: Anthropic.ContentBlock[]): Map<string, string> {
  const found = new Map<string, string>();
  for (const block of content) {
    if (block.type !== "web_search_tool_result") continue;
    // An error result is an object, a success result is a list.
    if (!Array.isArray(block.content)) continue;
    for (const result of block.content) {
      if (result.type === "web_search_result" && result.url) {
        found.set(normaliseUrl(result.url), result.title || result.url);
      }
    }
  }
  return found;
}

function normaliseUrl(url: string): string {
  return url.trim().replace(/[#?].*$/, "").replace(/\/+$/, "").toLowerCase();
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  if (!candidate.trim()) return null;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: SignalsRequest;
  try {
    body = (await request.json()) as SignalsRequest;
  } catch {
    return Response.json({ error: "Could not read the request." }, { status: 400 });
  }

  const flowMarkdown = (body.flowMarkdown ?? "").trim();
  if (flowMarkdown.length < 80) {
    return Response.json(
      { error: "There is no flow.md to check against yet." },
      { status: 400 },
    );
  }

  const fallback = (message: string, status: number) => {
    if (body.isExample && savedExampleSignals.signals.length > 0) {
      return Response.json({
        signals: savedExampleSignals.signals as Signal[],
        savedExample: true,
      });
    }
    return Response.json({ error: message }, { status });
  };

  try {
    const client = getClient();
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: signalsUserPrompt(flowMarkdown) },
    ];
    const sources = new Map<string, string>();
    let text = "";

    for (let resume = 0; resume <= MAX_PAUSE_RESUMES; resume += 1) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 8000,
        output_config: { effort: "medium" },
        system: SIGNALS_SYSTEM_PROMPT,
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }],
        messages,
      });

      for (const [url, title] of collectSourceUrls(response.content)) {
        sources.set(url, title);
      }
      text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      if (response.stop_reason === "refusal") {
        return fallback("Claude declined that market check.", 502);
      }
      if (response.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: response.content });
    }

    const parsed = SignalsSchema.safeParse(extractJson(text));
    if (!parsed.success) {
      return fallback("The market check came back in an unexpected shape.", 502);
    }

    // Keep only signals whose source really appeared in the search results.
    const signals = parsed.data.signals
      .filter((signal) => sources.has(normaliseUrl(signal.source_url)))
      .map((signal) => ({
        ...signal,
        source_title: signal.source_title || sources.get(normaliseUrl(signal.source_url))!,
      }))
      .slice(0, 5);

    if (signals.length === 0) {
      return fallback("No signal came back with a source that checks out.", 502);
    }

    return Response.json({ signals, savedExample: false });
  } catch (error) {
    const { status, message } = describeError(error);
    return fallback(message, status);
  }
}
