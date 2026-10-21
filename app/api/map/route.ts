import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import type { ChatMessage, Profile } from "@/lib/app-config";
import { stripMarkers } from "@/lib/app-config";
import {
  buildFlowMarkdown,
  CareerMapSchema,
  WORK_TYPES,
  type CareerMap,
  type WorkType,
} from "@/lib/career-map-schema";
import { describeError, getClient, MODEL } from "@/lib/server/claude";
import { profileBlocks } from "@/lib/server/profile";
import { MAP_SYSTEM_PROMPT, mapUserPrompt } from "@/lib/server/prompts";

export const runtime = "nodejs";
export const maxDuration = 180;

interface MapRequest {
  messages?: ChatMessage[];
  profile?: Profile | null;
}

function toTranscript(messages: ChatMessage[]): string {
  return messages
    .filter((m) => typeof m.content === "string" && m.content.trim().length > 0)
    .map(
      (m) =>
        `${m.role === "assistant" ? "Advisor" : "Them"}: ${stripMarkers(m.content).trim()}`,
    )
    .join("\n\n");
}

/**
 * Server-side validation beyond the schema: the counts the interface relies on.
 * Trims rather than rejects, so a slightly over-generous answer still renders.
 */
function normalise(map: CareerMap): CareerMap | null {
  const strengths = map.strengths.filter((s) => s.title && s.line).slice(0, 5);
  if (strengths.length < 3) return null;

  const byType = new Map<WorkType, CareerMap["paths"][number]>();
  for (const path of map.paths) {
    if (!byType.has(path.type) && path.title && path.why_it_fits) {
      byType.set(path.type, { ...path, week: path.week.filter(Boolean).slice(0, 3) });
    }
  }
  if (byType.size !== WORK_TYPES.length) return null;
  const paths = WORK_TYPES.map((type) => byType.get(type)!);

  if (!map.step_this_week.action || !map.step_this_week.who_to_talk_to) return null;

  const watching = map.flow.watching_for.filter(Boolean).slice(0, 6);
  if (watching.length === 0) return null;

  return { ...map, strengths, paths, flow: { ...map.flow, watching_for: watching } };
}

export async function POST(request: Request) {
  let body: MapRequest;
  try {
    body = (await request.json()) as MapRequest;
  } catch {
    return Response.json({ error: "Could not read the request." }, { status: 400 });
  }

  const transcript = toTranscript(body.messages ?? []);
  if (transcript.length < 40) {
    return Response.json(
      { error: "There is not enough of a conversation yet to build your results." },
      { status: 400 },
    );
  }

  try {
    const client = getClient();
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      output_config: {
        effort: "medium",
        format: zodOutputFormat(CareerMapSchema),
      },
      system: MAP_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            ...profileBlocks(body.profile),
            { type: "text", text: mapUserPrompt(transcript) },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return Response.json(
        { error: "Claude declined to answer that. Try starting again." },
        { status: 502 },
      );
    }

    const parsed = response.parsed_output;
    if (!parsed) {
      return Response.json(
        { error: "The results came back in an unexpected shape. Try again." },
        { status: 502 },
      );
    }

    const map = normalise(parsed);
    if (!map) {
      return Response.json(
        { error: "The results came back incomplete. Try again." },
        { status: 502 },
      );
    }

    return Response.json({ map, flowMarkdown: buildFlowMarkdown(map) });
  } catch (error) {
    const { status, message } = describeError(error);
    return Response.json({ error: message }, { status });
  }
}
