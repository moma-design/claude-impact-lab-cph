import type Anthropic from "@anthropic-ai/sdk";

import { toEmbedUrl } from "@/lib/flow/video";
import {
  LevelUpSchema,
  type LevelUpCard,
  type LevelUpStory,
  type Skill,
} from "@/lib/flow/types";
import { describeError, getClient, MODEL } from "@/lib/server/claude";
import { LEVEL_UP_SYSTEM_PROMPT, levelUpUserPrompt } from "@/lib/server/flow-prompts";
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

const MAX_PAUSE_RESUMES = 3;

interface LevelUpRequest {
  opportunityTitle?: string;
  opportunityType?: string;
  whyYou?: string;
  skills?: Skill[];
  isExample?: boolean;
}

export async function POST(request: Request) {
  let body: LevelUpRequest;
  try {
    body = (await request.json()) as LevelUpRequest;
  } catch {
    return Response.json({ error: "Could not read the request." }, { status: 400 });
  }

  const opportunityTitle = (body.opportunityTitle ?? "").trim();
  const skills = body.skills ?? [];
  if (!opportunityTitle || skills.length === 0) {
    return Response.json({ error: "There is no role to level up to yet." }, { status: 400 });
  }

  const fallback = (message: string, status: number) => {
    if (body.isExample && savedExample.decks.length > 0) {
      // Match the saved deck to the role they tapped, so the screen stays honest.
      const match =
        savedExample.decks.find(
          (deck) => deck.opportunity_title.toLowerCase() === opportunityTitle.toLowerCase(),
        ) ?? savedExample.decks[0];
      return Response.json({
        role_title: match.role_title,
        cards: match.cards,
        stories: match.stories,
        savedExample: true,
      });
    }
    return Response.json({ error: message }, { status });
  };

  const skillNames = new Set(skills.map((skill) => skill.name.trim().toLowerCase()));

  try {
    const client = getClient();
    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: levelUpUserPrompt({
          opportunityTitle,
          opportunityType: body.opportunityType ?? "role",
          whyYou: body.whyYou ?? "",
          skills,
        }),
      },
    ];

    const lenient = new Map<string, string>();
    const strict = new Set<string>();
    let text = "";

    for (let resume = 0; resume <= MAX_PAUSE_RESUMES; resume += 1) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 12000,
        output_config: { effort: "medium" },
        system: LEVEL_UP_SYSTEM_PROMPT,
        tools: [WEB_SEARCH_TOOL],
        messages,
      });

      for (const [url, title] of collectSourceUrls(response.content)) lenient.set(url, title);
      for (const url of collectStrictUrls(response.content)) strict.add(url);
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

    const parsed = LevelUpSchema.safeParse(extractJson(text));
    if (!parsed.success) {
      return fallback("The skill deck came back in an unexpected shape.", 502);
    }

    const cards: LevelUpCard[] = parsed.data.cards
      .filter((card) => card.name.trim())
      .slice(0, 8)
      .map((card) => {
        const match = card.matches_skill.trim();
        const held = match.length > 0 && skillNames.has(match.toLowerCase());
        const resourceSeen = lenient.has(normaliseUrl(card.resource_url));
        return {
          name: card.name,
          held,
          matches_skill: held ? match : "",
          how_to_earn: card.how_to_earn,
          // A link that was not in the results is dropped, not invented.
          resource_title: resourceSeen ? card.resource_title : "",
          resource_url: resourceSeen ? card.resource_url : "",
        };
      });

    if (cards.length < 6) {
      return fallback("The skill deck came back incomplete.", 502);
    }

    const stories: LevelUpStory[] = parsed.data.people
      .filter((person) => person.title.trim() && person.source_url.trim())
      // A video must match the search result exactly: for a YouTube watch URL
      // the video id lives in the query string.
      .filter((person) =>
        toEmbedUrl(person.source_url)
          ? strict.has(strictUrlKey(person.source_url))
          : lenient.has(normaliseUrl(person.source_url)),
      )
      .slice(0, 2)
      .map((person) => {
        const embed = toEmbedUrl(person.source_url);
        return {
          kind: embed ? "video" : person.kind === "video" ? "article" : person.kind,
          title: person.title,
          why_watch: person.why_watch,
          source_url: person.source_url,
          embed_url: embed,
        };
      });

    return Response.json({
      role_title: parsed.data.role_title || opportunityTitle,
      cards,
      stories,
      savedExample: false,
    });
  } catch (error) {
    console.error("level-up route failed:", error);
    const { status, message } = describeError(error);
    return fallback(message, status);
  }
}
