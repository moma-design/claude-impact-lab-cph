import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import type { Profile } from "@/lib/app-config";
import { SkillsSchema, type SkillsPayload } from "@/lib/flow/types";
import { describeError, getClient, MODEL } from "@/lib/server/claude";
import { SKILLS_SYSTEM_PROMPT, SKILLS_USER_PROMPT } from "@/lib/server/flow-prompts";
import { hasProfile, profileBlocks } from "@/lib/server/profile";

export const runtime = "nodejs";
export const maxDuration = 180;

interface SkillsRequest {
  profile?: Profile | null;
}

/** Counts the interface relies on. Trims rather than rejects where it can. */
function normalise(payload: SkillsPayload): SkillsPayload | null {
  const skills = payload.skills
    .filter((skill) => skill.name.trim() && skill.reasoning.trim())
    .slice(0, 8);
  if (skills.length < 6) return null;
  if (!skills.some((skill) => skill.kind === "hidden")) return null;

  const tasks = payload.tasks.map((task) => task.trim()).filter(Boolean).slice(0, 6);
  if (tasks.length < 4) return null;

  if (!payload.where_i_come_from.trim()) return null;

  return { ...payload, skills, tasks };
}

export async function POST(request: Request) {
  let body: SkillsRequest;
  try {
    body = (await request.json()) as SkillsRequest;
  } catch {
    return Response.json({ error: "Could not read the request." }, { status: 400 });
  }

  if (!hasProfile(body.profile)) {
    return Response.json(
      { error: "Add your LinkedIn PDF, or paste your profile text, to begin." },
      { status: 400 },
    );
  }

  try {
    const client = getClient();
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "low", format: zodOutputFormat(SkillsSchema) },
      system: SKILLS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            ...profileBlocks(body.profile),
            { type: "text", text: SKILLS_USER_PROMPT },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return Response.json(
        { error: "Claude declined to read that profile. Try starting again." },
        { status: 502 },
      );
    }

    const parsed = response.parsed_output;
    if (!parsed) {
      return Response.json(
        { error: "That came back in an unexpected shape. Try again." },
        { status: 502 },
      );
    }

    const payload = normalise(parsed);
    if (!payload) {
      return Response.json(
        { error: "That came back incomplete. Try again." },
        { status: 502 },
      );
    }

    return Response.json(payload);
  } catch (error) {
    const { status, message } = describeError(error);
    return Response.json({ error: message }, { status });
  }
}
