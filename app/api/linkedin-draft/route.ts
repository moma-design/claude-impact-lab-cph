import type Anthropic from "@anthropic-ai/sdk";

import { LinkedInDraftSchema, type Skill } from "@/lib/flow/types";
import { describeError, getClient, MODEL } from "@/lib/server/claude";
import { clampChars } from "@/lib/server/clamp";
import { LINKEDIN_SYSTEM_PROMPT, linkedInUserPrompt } from "@/lib/server/flow-prompts";
import { extractJson } from "@/lib/server/search";

export const runtime = "nodejs";
export const maxDuration = 180;

interface LinkedInRequest {
  skills?: Skill[];
  extraSkill?: string;
}

export async function POST(request: Request) {
  let body: LinkedInRequest;
  try {
    body = (await request.json()) as LinkedInRequest;
  } catch {
    return Response.json({ error: "Could not read the request." }, { status: 400 });
  }

  const skills = body.skills ?? [];
  if (skills.length === 0) {
    return Response.json(
      { error: "There are no confirmed skills to write from yet." },
      { status: 400 },
    );
  }

  try {
    const client = getClient();
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: linkedInUserPrompt(skills, body.extraSkill ?? "") },
    ];

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "low" },
      system: LINKEDIN_SYSTEM_PROMPT,
      messages,
    });

    if (response.stop_reason === "refusal") {
      return Response.json({ error: "Claude declined that." }, { status: 502 });
    }

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    const parsed = LinkedInDraftSchema.safeParse(extractJson(text));
    if (!parsed.success) {
      return Response.json(
        { error: "The draft came back in an unexpected shape. Try again." },
        { status: 502 },
      );
    }

    // Five short lines at most, as specified.
    const draft = {
      headline: clampChars(parsed.data.headline, 120),
      about: parsed.data.about.filter(Boolean).slice(0, 5).map((line) => clampChars(line, 140)),
      skills: parsed.data.skills.filter(Boolean).slice(0, 12),
    };

    return Response.json({ draft });
  } catch (error) {
    const { status, message } = describeError(error);
    return Response.json({ error: message }, { status });
  }
}
