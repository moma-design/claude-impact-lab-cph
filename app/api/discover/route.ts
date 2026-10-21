import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import type { Profile } from "@/lib/app-config";
import {
  DirectionsSchema,
  RolesSchema,
  SkillsSchema,
  type DiscoverRequest,
} from "@/lib/discover-schema";
import { describeError, getClient, MODEL } from "@/lib/server/claude";
import { profileBlocks } from "@/lib/server/profile";
import {
  DIRECTIONS_SYSTEM_PROMPT,
  directionsUserPrompt,
  ROLES_SYSTEM_PROMPT,
  rolesUserPrompt,
  SKILLS_SYSTEM_PROMPT,
  skillsUserPrompt,
} from "@/lib/server/prompts";

export const runtime = "nodejs";
export const maxDuration = 120;

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    : [];

export async function POST(request: Request) {
  let body: DiscoverRequest;
  try {
    body = (await request.json()) as DiscoverRequest;
  } catch {
    return Response.json({ error: "Could not read the request." }, { status: 400 });
  }

  const seed = typeof body.seed === "string" ? body.seed.trim().slice(0, 400) : "";
  const life = typeof body.life === "string" ? body.life.trim().slice(0, 3000) : "";
  const profile = (body.profile ?? null) as Profile | null;
  const blocks = profileBlocks(profile);
  if (!seed && blocks.length === 0) {
    return Response.json({ error: "Tell us what you do, in a few words." }, { status: 400 });
  }

  let system: string;
  let prompt: string;
  let format;
  switch (body.stage) {
    case "skills":
      system = SKILLS_SYSTEM_PROMPT;
      prompt = skillsUserPrompt(seed, life, strings(body.avoid));
      format = zodOutputFormat(SkillsSchema);
      break;
    case "directions":
      system = DIRECTIONS_SYSTEM_PROMPT;
      prompt = directionsUserPrompt(seed, life, strings(body.kept), strings(body.maybe));
      format = zodOutputFormat(DirectionsSchema);
      break;
    case "roles":
      system = ROLES_SYSTEM_PROMPT;
      prompt = rolesUserPrompt(
        seed,
        life,
        strings(body.kept),
        strings(body.directions),
        strings(body.avoid),
      );
      format = zodOutputFormat(RolesSchema);
      break;
    default:
      return Response.json({ error: "Unknown stage." }, { status: 400 });
  }

  try {
    const client = getClient();
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "low", format },
      system,
      messages: [{ role: "user", content: [...blocks, { type: "text", text: prompt }] }],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return Response.json(
        { error: "That did not come back right. Try again." },
        { status: 502 },
      );
    }

    const out = response.parsed_output as Record<string, unknown[]>;
    return Response.json(out);
  } catch (error) {
    const { status, message } = describeError(error);
    return Response.json({ error: message }, { status });
  }
}
