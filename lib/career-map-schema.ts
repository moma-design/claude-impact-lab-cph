import { z } from "zod";

/**
 * The shape of a generated set of results.
 *
 * Kept deliberately free of length and range constraints so the JSON schema
 * sent to the API stays inside the supported subset. Counts are checked in
 * `app/api/map/route.ts` after parsing instead.
 */
export const WORK_TYPES = ["fractional", "polywork", "new field"] as const;

export const CareerMapSchema = z.object({
  strengths: z.array(
    z.object({
      title: z.string(),
      line: z.string(),
    }),
  ),
  paths: z.array(
    z.object({
      type: z.enum(WORK_TYPES),
      title: z.string(),
      why_it_fits: z.string(),
      week: z.array(z.string()),
      human_part: z.string(),
    }),
  ),
  step_this_week: z.object({
    action: z.string(),
    minutes: z.string(),
    who_to_talk_to: z.string(),
  }),
  /** Raw material for flow.md. The file itself is assembled in TypeScript. */
  flow: z.object({
    where_i_come_from: z.string(),
    what_linkedin_does_not_show: z.string(),
    what_i_want_next: z.string(),
    watching_for: z.array(z.string()),
  }),
  closing_line: z.string(),
});

export type CareerMap = z.infer<typeof CareerMapSchema>;
export type WorkType = (typeof WORK_TYPES)[number];

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  fractional: "Fractional role",
  polywork: "Polywork combination",
  "new field": "New field",
};

/** Builds flow.md from the validated results, so the headings are guaranteed. */
export function buildFlowMarkdown(map: CareerMap): string {
  const directions = map.paths
    .map(
      (path) =>
        `### ${path.title} (${WORK_TYPE_LABELS[path.type]})\n\n` +
        `${path.why_it_fits}\n\n` +
        `A week could look like:\n${path.week.map((line) => `- ${line}`).join("\n")}\n\n` +
        `The human part: ${path.human_part}`,
    )
    .join("\n\n");

  const strengths = map.strengths
    .map((strength) => `- **${strength.title}.** ${strength.line}`)
    .join("\n");

  return `# My flow

## Where I come from

${map.flow.where_i_come_from}

## What LinkedIn doesn't show

${map.flow.what_linkedin_does_not_show}

What is mine:

${strengths}

## What I want next

${map.flow.what_i_want_next}

## Directions

${directions}

## This week's step

${map.step_this_week.action} (${map.step_this_week.minutes})

Who to talk to: ${map.step_this_week.who_to_talk_to}

## Watching for

${map.flow.watching_for.map((line) => `- ${line}`).join("\n")}
`;
}
