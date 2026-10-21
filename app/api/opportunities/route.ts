import type Anthropic from "@anthropic-ai/sdk";

import { OpportunitiesSchema, type Opportunity, type Skill } from "@/lib/flow/types";
import { describeError, getClient, MODEL } from "@/lib/server/claude";
import {
  OPPORTUNITIES_SYSTEM_PROMPT,
  opportunitiesUserPrompt,
} from "@/lib/server/flow-prompts";
import { collectSourceUrls, extractJson, normaliseUrl, WEB_SEARCH_TOOL } from "@/lib/server/search";
import savedExample from "@/lib/opportunities-example.json";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PAUSE_RESUMES = 3;
/** Below this many verified cards, unsourced ones are kept to fill the deck. */
const MIN_DECK = 4;

interface OpportunitiesRequest {
  whereIComeFrom?: string;
  skills?: Skill[];
  extraSkill?: string;
  lightsUp?: string[];
  keeps?: string[];
  handsOver?: string[];
  flowMarkdown?: string;
  alreadyShown?: string[];
  surprise?: boolean;
  isExample?: boolean;
}

export async function POST(request: Request) {
  let body: OpportunitiesRequest;
  try {
    body = (await request.json()) as OpportunitiesRequest;
  } catch {
    return Response.json({ error: "Could not read the request." }, { status: 400 });
  }

  const skills = body.skills ?? [];
  const whereIComeFrom = (body.whereIComeFrom ?? "").trim();
  const flowMarkdown = (body.flowMarkdown ?? "").trim();
  if (!flowMarkdown && (skills.length === 0 || !whereIComeFrom)) {
    return Response.json(
      { error: "There is nothing to search on yet." },
      { status: 400 },
    );
  }

  const surprise = Boolean(body.surprise);
  const count = surprise ? 3 : 6;
  const asked = surprise ? 4 : 8;
  const alreadyShown = body.alreadyShown ?? [];

  const fallback = (message: string, status: number) => {
    const saved = savedExample.opportunities as Opportunity[];
    if (body.isExample && saved.length > 0) {
      const unseen = saved.filter((item) => !alreadyShown.includes(item.title));
      const pool = unseen.length > 0 ? unseen : saved;
      return Response.json({
        opportunities: pool.slice(0, count),
        savedExample: true,
      });
    }
    return Response.json({ error: message }, { status });
  };

  try {
    const client = getClient();
    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: opportunitiesUserPrompt({
          whereIComeFrom,
          skills,
          extraSkill: body.extraSkill,
          lightsUp: body.lightsUp,
          keeps: body.keeps,
          handsOver: body.handsOver,
          flowMarkdown,
          alreadyShown,
          surprise,
          count: asked,
        }),
      },
    ];

    const sources = new Map<string, string>();
    let text = "";

    for (let resume = 0; resume <= MAX_PAUSE_RESUMES; resume += 1) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 12000,
        output_config: { effort: "medium" },
        system: OPPORTUNITIES_SYSTEM_PROMPT,
        tools: [WEB_SEARCH_TOOL],
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
        return fallback("Claude declined that search.", 502);
      }
      if (response.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: response.content });
    }

    const parsed = OpportunitiesSchema.safeParse(extractJson(text));
    if (!parsed.success) {
      return fallback("The search came back in an unexpected shape.", 502);
    }

    const seen = new Set(alreadyShown.map((title) => title.toLowerCase()));
    const candidates = parsed.data.opportunities
      .filter((item) => item.title.trim() && item.why_you.trim())
      .filter((item) => !seen.has(item.title.trim().toLowerCase()))
      .map((item) => {
        const sourceSeen = sources.has(normaliseUrl(item.source_url));
        const learningSeen = sources.has(normaliseUrl(item.learning_resource_url));
        return {
          ...item,
          // A link that was not in the search results is removed, never shown.
          source_url: sourceSeen ? item.source_url : "",
          source_title: sourceSeen
            ? item.source_title || sources.get(normaliseUrl(item.source_url))!
            : "",
          learning_resource_url: learningSeen ? item.learning_resource_url : "",
          learning_resource_title: learningSeen ? item.learning_resource_title : "",
        };
      });

    // Cards with a verified source come first. An unsourced card is kept only
    // to reach a usable deck, and then with its link stripped rather than
    // shown, so nothing unverified is ever presented as a source.
    const sourced = candidates.filter((item) => item.source_url);
    const unsourced = candidates.filter((item) => !item.source_url);
    const opportunities = (
      sourced.length >= MIN_DECK ? sourced : [...sourced, ...unsourced]
    ).slice(0, count);

    console.log(
      `opportunities: ${parsed.data.opportunities.length} returned, ${sourced.length} sourced, ${opportunities.length} shown`,
    );

    // A thin live run would demo badly, so the example person falls back to
    // the saved deck rather than a single card.
    const tooThin = !surprise && opportunities.length < MIN_DECK;
    if (opportunities.length === 0 || (tooThin && body.isExample)) {
      return fallback("Nothing came back that stands up.", 502);
    }

    return Response.json({ opportunities, savedExample: false });
  } catch (error) {
    const { status, message } = describeError(error);
    return fallback(message, status);
  }
}
