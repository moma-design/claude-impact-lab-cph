import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { PERSON_KINDS, type LevelUpStory } from "@/lib/flow/types";
import { toEmbedUrl } from "@/lib/flow/video";
import { describeError, getClient, MODEL } from "@/lib/server/claude";
import { ROLE_VIDEO_SYSTEM_PROMPT, roleVideoUserPrompt } from "@/lib/server/flow-prompts";
import {
  collectSourceUrls,
  collectStrictUrls,
  extractJson,
  normaliseUrl,
  strictUrlKey,
  WEB_SEARCH_TOOL,
} from "@/lib/server/search";
import savedExample from "@/lib/level-up-example.json";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PAUSE_RESUMES = 2;

const RoleVideoSchema = z.object({
  kind: z.enum(PERSON_KINDS),
  title: z.string(),
  why_watch: z.string(),
  source_url: z.string(),
});

interface RoleVideoRequest {
  roleTitle?: string;
  isExample?: boolean;
}

/** Finds a story for one role. Called per card and cached by the browser. */
export async function POST(request: Request) {
  let body: RoleVideoRequest;
  try {
    body = (await request.json()) as RoleVideoRequest;
  } catch {
    return Response.json({ error: "Could not read the request." }, { status: 400 });
  }

  const roleTitle = (body.roleTitle ?? "").trim();
  if (!roleTitle) {
    return Response.json({ error: "There is no role to look up." }, { status: 400 });
  }

  const fallback = () => {
    if (body.isExample) {
      const saved = savedExample.decks
        .flatMap((deck) => deck.stories)
        .find((story) => story.embed_url);
      if (saved) return Response.json({ story: saved, savedExample: true });
    }
    // No story is a normal outcome, not an error: the card just omits it.
    return Response.json({ story: null, savedExample: false });
  };

  try {
    const client = getClient();
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: roleVideoUserPrompt(roleTitle) },
    ];
    const lenient = new Map<string, string>();
    const strict = new Set<string>();
    let text = "";

    for (let resume = 0; resume <= MAX_PAUSE_RESUMES; resume += 1) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4000,
        output_config: { effort: "low" },
        system: ROLE_VIDEO_SYSTEM_PROMPT,
        tools: [{ ...WEB_SEARCH_TOOL, max_uses: 4 }],
        messages,
      });

      for (const [url, title] of collectSourceUrls(response.content)) lenient.set(url, title);
      for (const url of collectStrictUrls(response.content)) strict.add(url);
      text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      if (response.stop_reason === "refusal") return fallback();
      if (response.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: response.content });
    }

    const parsed = RoleVideoSchema.safeParse(extractJson(text));
    if (!parsed.success || !parsed.data.source_url.trim()) return fallback();

    const item = parsed.data;
    const embed = toEmbedUrl(item.source_url);
    // A video must match the result exactly: the id lives in the query string.
    const seen = embed
      ? strict.has(strictUrlKey(item.source_url))
      : lenient.has(normaliseUrl(item.source_url));
    if (!seen) return fallback();

    const story: LevelUpStory = {
      kind: embed ? "video" : item.kind === "video" ? "article" : item.kind,
      title: item.title,
      why_watch: item.why_watch,
      source_url: item.source_url,
      embed_url: embed,
    };
    return Response.json({ story, savedExample: false });
  } catch (error) {
    const { status } = describeError(error);
    if (status === 503) {
      return Response.json({ error: "No API key found." }, { status });
    }
    return fallback();
  }
}
