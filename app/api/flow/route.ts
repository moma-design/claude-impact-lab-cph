import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { buildFlowMarkdown } from "@/lib/flow/flow-markdown";
import { FlowSchema, type FlowContext } from "@/lib/flow/types";
import { describeError, getClient, MODEL } from "@/lib/server/claude";
import { clampChars, clampWords } from "@/lib/server/clamp";
import { FLOW_SYSTEM_PROMPT, flowUserPrompt } from "@/lib/server/flow-prompts";

export const runtime = "nodejs";
export const maxDuration = 180;

interface FlowRequest {
  context?: FlowContext;
}

export async function POST(request: Request) {
  let body: FlowRequest;
  try {
    body = (await request.json()) as FlowRequest;
  } catch {
    return Response.json({ error: "Could not read the request." }, { status: 400 });
  }

  const context = body.context;
  if (!context || context.confirmedSkills.length === 0) {
    return Response.json(
      { error: "There is nothing to build your flow from yet." },
      { status: 400 },
    );
  }

  try {
    const client = getClient();
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "medium", format: zodOutputFormat(FlowSchema) },
      system: FLOW_SYSTEM_PROMPT,
      messages: [{ role: "user", content: flowUserPrompt(context, context.interested) }],
    });

    if (response.stop_reason === "refusal") {
      return Response.json(
        { error: "Claude declined that. Try starting again." },
        { status: 502 },
      );
    }

    const flow = response.parsed_output;
    if (!flow || !flow.step_this_week.action.trim() || flow.watching_for.length === 0) {
      return Response.json(
        { error: "Your flow came back incomplete. Try again." },
        { status: 502 },
      );
    }

    const clean = {
      ...flow,
      watching_for: flow.watching_for.filter(Boolean).slice(0, 6),
      // Two lines per line, three lines in total, enforced on the data.
      dream_job: {
        title: clampWords(flow.dream_job.title, 8),
        week: flow.dream_job.week.filter(Boolean).slice(0, 3).map((line) => clampChars(line, 110)),
      },
      step_this_week: {
        ...flow.step_this_week,
        action: clampChars(flow.step_this_week.action, 170),
      },
    };

    return Response.json({
      flow: clean,
      flowMarkdown: buildFlowMarkdown(context, clean),
    });
  } catch (error) {
    const { status, message } = describeError(error);
    return Response.json({ error: message }, { status });
  }
}
