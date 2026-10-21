import type Anthropic from "@anthropic-ai/sdk";

import { OpenRolesSchema, type OpenRole } from "@/lib/flow/types";
import { describeError, getClient, MODEL } from "@/lib/server/claude";
import { clampWords } from "@/lib/server/clamp";
import { OPEN_ROLES_SYSTEM_PROMPT, openRolesUserPrompt } from "@/lib/server/flow-prompts";
import {
  collectSourceUrls,
  extractJson,
  normaliseUrl,
  WEB_SEARCH_TOOL,
} from "@/lib/server/search";
import savedExample from "@/lib/open-roles-example.json";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PAUSE_RESUMES = 2;

interface OpenRolesRequest {
  dreamJobTitle?: string;
  whereIComeFrom?: string;
  isExample?: boolean;
}

export async function POST(request: Request) {
  let body: OpenRolesRequest;
  try {
    body = (await request.json()) as OpenRolesRequest;
  } catch {
    return Response.json({ error: "Could not read the request." }, { status: 400 });
  }

  const dreamJobTitle = (body.dreamJobTitle ?? "").trim();
  if (!dreamJobTitle) {
    return Response.json({ error: "There is no dream job to search against." }, { status: 400 });
  }

  const fallback = (message: string, status: number) => {
    if (body.isExample && savedExample.roles.length > 0) {
      return Response.json({ roles: savedExample.roles as OpenRole[], savedExample: true });
    }
    return Response.json({ error: message }, { status });
  };

  try {
    const client = getClient();
    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: openRolesUserPrompt(dreamJobTitle, body.whereIComeFrom ?? ""),
      },
    ];
    const sources = new Map<string, string>();
    let text = "";

    for (let resume = 0; resume <= MAX_PAUSE_RESUMES; resume += 1) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 8000,
        output_config: { effort: "low" },
        system: OPEN_ROLES_SYSTEM_PROMPT,
        tools: [{ ...WEB_SEARCH_TOOL, max_uses: 6 }],
        messages,
      });

      for (const [url, title] of collectSourceUrls(response.content)) sources.set(url, title);
      text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      if (response.stop_reason === "refusal") return fallback("Claude declined that search.", 502);
      if (response.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: response.content });
    }

    const parsed = OpenRolesSchema.safeParse(extractJson(text));
    if (!parsed.success) {
      return fallback("The search came back in an unexpected shape.", 502);
    }

    // Only postings whose link really appeared in the search results.
    const roles = parsed.data.roles
      .filter((role) => role.title.trim() && sources.has(normaliseUrl(role.url)))
      .map((role) => ({ ...role, why_close: clampWords(role.why_close, 16) }))
      .slice(0, 5);

    if (roles.length === 0) {
      return fallback("No current posting came back with a link that checks out.", 502);
    }

    return Response.json({ roles, savedExample: false });
  } catch (error) {
    const { status, message } = describeError(error);
    return fallback(message, status);
  }
}
