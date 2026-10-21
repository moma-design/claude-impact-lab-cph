import {
  OPPORTUNITY_TYPE_LABELS,
  type FlowContext,
  type FlowPayload,
} from "./types";

function list(lines: string[]): string {
  return lines.length > 0 ? lines.map((line) => `- ${line}`).join("\n") : "- Nothing yet";
}

/**
 * Builds flow.md from the validated results, so the sections are guaranteed
 * whatever the model returns.
 */
export function buildFlowMarkdown(context: FlowContext, flow: FlowPayload): string {
  const confirmed = context.confirmedSkills.filter((skill) => skill.kind === "stated");
  const hidden = context.confirmedSkills.filter((skill) => skill.kind === "hidden");
  const kept = context.tasks.filter((task) => task.keep === true).map((task) => task.label);
  const handed = context.tasks.filter((task) => task.keep === false).map((task) => task.label);

  const extra = context.extraSkill.trim()
    ? `\n- ${context.extraSkill.trim()} (added by me)`
    : "";

  const opportunities =
    context.interested.length > 0
      ? context.interested
          .map(
            (opportunity) =>
              `### ${opportunity.title} (${OPPORTUNITY_TYPE_LABELS[opportunity.type]})\n\n` +
              `${opportunity.why_you}\n\n` +
              `One skill to add: ${opportunity.skill_to_add}` +
              (opportunity.learning_resource_url
                ? `\n\nLearning: [${opportunity.learning_resource_title}](${opportunity.learning_resource_url})`
                : "") +
              `\n\nSource: [${opportunity.source_title}](${opportunity.source_url})`,
          )
          .join("\n\n")
      : "Nothing marked interested yet.";

  const levelUps =
    context.levelUps.length > 0
      ? context.levelUps
          .map(
            (role) =>
              `### ${role.roleTitle}\n\n` +
              `From: ${role.opportunityTitle}\n\n` +
              `Cards I hold (${role.held.length} of ${role.held.length + role.toCollect.length}):\n${list(role.held)}\n\n` +
              `Cards to collect:\n${list(role.toCollect)}\n\n` +
              `My plan:\n${list(role.plan)}`,
          )
          .join("\n\n")
      : "Nothing yet.";

  return `# My flow

## My dream job

**${flow.dream_job.title}**

A week could look like:

${list(flow.dream_job.week)}

## Where I come from

${context.whereIComeFrom}

## Skills I confirmed

${list(confirmed.map((skill) => `**${skill.name}.** ${skill.reasoning}`))}${extra}

## Hidden skills

${list(hidden.map((skill) => `**${skill.name}.** ${skill.reasoning}`))}

## What lights me up

${context.lightsUp.length > 0 ? context.lightsUp.join(", ") : "Not said"}

${flow.what_lights_me_up}

## What I keep, what I hand to AI

I keep:

${list(kept)}

Happy to hand to AI:

${list(handed)}

## Opportunities I'm interested in

${opportunities}

## Roles I'm levelling up to

${levelUps}

## This week's step

${flow.step_this_week.action} (${flow.step_this_week.minutes})

Who to talk to: ${flow.step_this_week.who_to_talk_to}

## Watching for

${list(flow.watching_for)}
`;
}
