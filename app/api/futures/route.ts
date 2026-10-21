import type Anthropic from "@anthropic-ai/sdk";

import { FuturesSchema } from "@/lib/futures-schema";
import { describeError, getClient, MODEL } from "@/lib/server/claude";
import { FUTURES_SYSTEM_PROMPT, futuresUserPrompt } from "@/lib/server/prompts";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PAUSE_RESUMES = 3;

/** Every URL the search actually returned, so no invented source can survive. */
function collectSourceUrls(content: Anthropic.ContentBlock[]): Map<string, string> {
  const found = new Map<string, string>();
  for (const block of content) {
    if (block.type !== "web_search_tool_result") continue;
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
  let body: { flowMarkdown?: string };
  try {
    body = (await request.json()) as { flowMarkdown?: string };
  } catch {
    return Response.json({ error: "Could not read the request." }, { status: 400 });
  }

  const flowMarkdown = (body.flowMarkdown ?? "").trim();
  if (flowMarkdown.length < 80) {
    return Response.json({ error: "There is no flow.md to research against yet." }, { status: 400 });
  }

  try {
    const client = getClient();
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: futuresUserPrompt(flowMarkdown) },
    ];
    const sources = new Map<string, string>();
    let text = "";

    for (let resume = 0; resume <= MAX_PAUSE_RESUMES; resume += 1) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 8000,
        output_config: { effort: "medium" },
        system: FUTURES_SYSTEM_PROMPT,
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }],
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
        return Response.json({ error: "Claude declined that research." }, { status: 502 });
      }
      if (response.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: response.content });
    }

    const parsed = FuturesSchema.safeParse(extractJson(text));
    if (!parsed.success) {
      return Response.json(
        { error: "The research came back in an unexpected shape." },
        { status: 502 },
      );
    }

    // Keep only futures whose source really appeared in the search results.
    const futures = parsed.data.futures
      .filter((future) => sources.has(normaliseUrl(future.source_url)))
      .map((future) => ({
        ...future,
        source_title: future.source_title || sources.get(normaliseUrl(future.source_url))!,
      }))
      .slice(0, 6);

    if (futures.length === 0) {
      return Response.json(
        { error: "No future came back with a source that checks out." },
        { status: 502 },
      );
    }

    return Response.json({ futures });
  } catch (error) {
    const { status, message } = describeError(error);
    return Response.json({ error: message }, { status });
  }
}
