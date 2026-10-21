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
          count,
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
    const opportunities = parsed.data.opportunities
      // Keep only cards whose source really appeared in the search results.
      .filter((item) => sources.has(normaliseUrl(item.source_url)))
      .filter((item) => !seen.has(item.title.trim().toLowerCase()))
      .map((item) => ({
        ...item,
        source_title: item.source_title || sources.get(normaliseUrl(item.source_url))!,
        // A learning link that was not in the results is dropped, not invented.
        learning_resource_url: sources.has(normaliseUrl(item.learning_resource_url))
          ? item.learning_resource_url
          : "",
        learning_resource_title: sources.has(normaliseUrl(item.learning_resource_url))
          ? item.learning_resource_title
          : "",
      }))
      .slice(0, count);

    if (opportunities.length === 0) {
      return fallback("Nothing came back with a source that checks out.", 502);
    }

    return Response.json({ opportunities, savedExample: false });
  } catch (error) {
    const { status, message } = describeError(error);
    return fallback(message, status);
  }
}
