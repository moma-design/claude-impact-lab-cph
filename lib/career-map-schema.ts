import { z } from "zod";

/**
 * The shape of a generated set of results.
 *
 * Kept deliberately free of length and range constraints so the JSON schema
 * sent to the API stays inside the supported subset. Counts are checked in
 * `app/api/map/route.ts` after parsing instead.
 */
export const CareerMapSchema = z.object({
  strengths: z.array(
    z.object({
      title: z.string(),
      line: z.string(),
    }),
  ),
  /** Jobs they could do now, from what they already have. */
  now_jobs: z.array(
    z.object({
      title: z.string(),
      why_it_fits: z.string(),
      skills_used: z.array(z.string()),
    }),
  ),
  /** Jobs within reach after some learning, each with a plan. */
  reach: z.array(
    z.object({
      title: z.string(),
      why_it_fits: z.string(),
      gap: z.array(z.string()),
      plan: z.array(z.object({ when: z.string(), what: z.string() })),
      search_for: z.array(z.string()),
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
  invented_role: z.object({
    name: z.string(),
    pitch: z.string(),
    first_move: z.string(),
  }),
  closing_line: z.string(),
});

export type CareerMap = z.infer<typeof CareerMapSchema>;

/** Builds flow.md from the validated results, so the headings are guaranteed. */
export function buildFlowMarkdown(map: CareerMap): string {
  const strengths = map.strengths
    .map((strength) => `- **${strength.title}.** ${strength.line}`)
    .join("\n");

  const nowJobs = map.now_jobs
    .map(
      (job) =>
        `### ${job.title}\n\n${job.why_it_fits}\n\nUses: ${job.skills_used.join(", ")}`,
    )
    .join("\n\n");

  const reach = map.reach
    .map(
      (job) =>
        `### ${job.title}\n\n${job.why_it_fits}\n\n` +
        `To learn: ${job.gap.join(", ")}\n\n` +
        `Plan:\n${job.plan.map((step) => `- ${step.when}: ${step.what}`).join("\n")}\n\n` +
        `Search for: ${job.search_for.join("; ")}`,
    )
    .join("\n\n");

  return `# My flow

## Where I come from

${map.flow.where_i_come_from}

## What my CV doesn't show

${map.flow.what_linkedin_does_not_show}

What is mine:

${strengths}

## What I want next

${map.flow.what_i_want_next}

## The role I invented

### ${map.invented_role.name}

${map.invented_role.pitch}

First move: ${map.invented_role.first_move}

## Jobs I could do now

${nowJobs}

## Within reach, with some learning

${reach}

## This week's step

${map.step_this_week.action} (${map.step_this_week.minutes})

Who to talk to: ${map.step_this_week.who_to_talk_to}

## Watching for

${map.flow.watching_for.map((line) => `- ${line}`).join("\n")}
`;
}
