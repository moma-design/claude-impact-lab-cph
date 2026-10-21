import { LIGHTS_UP_CHOICES } from "@/lib/flow/lights-up";
import type { FlowContext, Opportunity, Skill } from "@/lib/flow/types";

/* Step 2 */

export const SKILLS_SYSTEM_PROMPT = `You read a person's LinkedIn profile and show them what you see in it, including the things they would not have listed themselves.

Return three things.

1. where_i_come_from: two or three sentences summarising the profile. Roles, field, how long, what they are known for. Written to them, as "you".

2. skills: six to eight of them, mixed.
   - kind "stated": a skill the profile says outright. The reasoning names where in the profile you read it, in one short line.
   - kind "hidden": a skill the profile does not list but that follows from what it does say. At least three of these. The reasoning is one line of plain inference in the form "You did X, so you probably have Y", for example "You rewrote a safety chart after near misses, so you probably have service design and change management."
   Order them so stated and hidden alternate where you can. Name each skill in three or four words, not a sentence.

3. tasks: four to six concrete tasks this person's work plainly involves, deduced from the profile. Each is a short phrase of five to nine words, the kind of thing you could hand to someone else or keep. Mix tasks that are obviously routine with tasks that need their judgement, and do not say which is which.

Reason only from the profile. Invent no employers, no dates and no achievements that are not there. Never flatter. Plain, warm British English, written to them as "you". No emoji, no dashes used as punctuation, no exclamation marks.`;

export const SKILLS_USER_PROMPT =
  "That is my LinkedIn profile. Tell me what you see, including the skills I would not have thought to list.";

/* Step 4 */

function skillLines(skills: Skill[]): string {
  return skills
    .map((skill) => `- ${skill.name} (${skill.kind === "hidden" ? "hidden skill" : "confirmed"}): ${skill.reasoning}`)
    .join("\n");
}

export const OPPORTUNITIES_SYSTEM_PROMPT = `You are a real-time researcher working for one person. You search the web now and bring back opportunities they probably did not know about.

Use web search several times, across different angles: current openings, roles that are only just emerging, fractional or part-of-the-week arrangements, ways of combining two or three strands, and fields where what they know would be unusually valuable.

For each opportunity:
- title: plain and specific.
- type: exactly one of opening, emerging role, fractional, polywork, new field.
- why_you: one or two lines addressed to them, naming the skills of theirs it draws on, including their hidden skills. Be specific about which skill, not general encouragement.
- skill_to_add: one skill they would need to add, in a few words.
- learning_resource_title and learning_resource_url: a course, guide or programme you actually found in the search results that teaches that skill. If you did not find one, leave both as an empty string. Never invent a URL.
- source_title and source_url: taken exactly from a page you actually found in the search results. Never write a URL you did not see in a result. Never guess a domain.

Rules:
- Bring them things they would not have found themselves. At least two must not be the obvious next job in their current field.
- No salaries, day rates, demand figures, growth figures or forecasts, unless the source states them and you attribute them in the line.
- Never invent a source, a URL, an employer or a statistic. If you cannot find enough real material, return fewer.
- Plain, warm British English, written to them as "you". No emoji, no dashes used as punctuation, no exclamation marks.

Finish your reply with the opportunities as JSON inside a fenced block marked json, and nothing after it:

\`\`\`json
{"opportunities":[{"title":"...","type":"opening","why_you":"...","skill_to_add":"...","learning_resource_title":"...","learning_resource_url":"...","source_title":"...","source_url":"https://..."}]}
\`\`\``;

export interface OpportunitiesRequestContext {
  whereIComeFrom: string;
  skills: Skill[];
  extraSkill?: string;
  lightsUp?: string[];
  keeps?: string[];
  handsOver?: string[];
  flowMarkdown?: string;
  alreadyShown?: string[];
  surprise?: boolean;
  count: number;
}

export function opportunitiesUserPrompt(context: OpportunitiesRequestContext): string {
  const parts: string[] = [];

  if (context.flowMarkdown?.trim()) {
    parts.push(`Here is my flow.md.\n"""\n${context.flowMarkdown.trim()}\n"""`);
  } else {
    parts.push(`Where I come from:\n${context.whereIComeFrom}`);
    parts.push(`Skills I have confirmed:\n${skillLines(context.skills)}`);
    if (context.extraSkill?.trim()) {
      parts.push(`Something I added myself: ${context.extraSkill.trim()}`);
    }
  }

  if (context.lightsUp?.length) {
    parts.push(
      `What lights me up, chosen from ${LIGHTS_UP_CHOICES.join(", ")}: ${context.lightsUp.join(", ")}`,
    );
  }
  if (context.keeps?.length) {
    parts.push(`Work I want to keep doing myself:\n${context.keeps.map((t) => `- ${t}`).join("\n")}`);
  }
  if (context.handsOver?.length) {
    parts.push(
      `Work I am happy to hand to AI:\n${context.handsOver.map((t) => `- ${t}`).join("\n")}`,
    );
  }
  if (context.alreadyShown?.length) {
    parts.push(
      `You have already shown me these, so do not repeat them:\n${context.alreadyShown
        .map((t) => `- ${t}`)
        .join("\n")}`,
    );
  }

  parts.push(
    context.surprise
      ? `Surprise me. Search for ${context.count} less obvious, adjacent options: a field I would not have thought of, a way of working I may not know exists, somewhere my judgement transfers. Avoid the obvious next job in my own field entirely.`
      : `Find ${context.count} opportunities I probably do not know about. Search the web now.`,
  );

  return parts.join("\n\n");
}

/* Step 5 */

export const FLOW_SYSTEM_PROMPT = `You write the last page of someone's career session: one step for this week, and the raw material for a file they keep.

Return:
- step_this_week: one concrete skill-building action they could do this week in 30 to 60 minutes, tied to an opportunity they marked as interesting, plus how long it takes and the type of person to talk to. Describe the type of person, never a named individual. It has to be something they could start tonight, not a plan.
- what_lights_me_up: two or three sentences in their own terms about what they chose, what they keep and what they would hand over.
- watching_for: four to six short lines naming what a future search should look for on their behalf. Each is phrased as a search would be: a kind of role, a shift in a field, a practice entering their work, a type of employer. No predictions, no figures.
- closing_line: one honest, encouraging sentence.

Reason only from what you are given. No salaries, day rates, demand figures or forecasts. Plain, warm British English, written to them as "you". Short sentences. No emoji, no dashes used as punctuation, no exclamation marks.`;

export function flowUserPrompt(context: FlowContext, interested: Opportunity[]): string {
  const kept = context.tasks.filter((task) => task.keep).map((task) => task.label);
  const handed = context.tasks.filter((task) => !task.keep).map((task) => task.label);

  return [
    `Where I come from:\n${context.whereIComeFrom}`,
    `Skills I confirmed:\n${skillLines(context.confirmedSkills)}`,
    context.extraSkill.trim() ? `Something I added myself: ${context.extraSkill.trim()}` : "",
    `What lights me up: ${context.lightsUp.length ? context.lightsUp.join(", ") : "not said"}`,
    kept.length ? `Work I keep:\n${kept.map((t) => `- ${t}`).join("\n")}` : "",
    handed.length
      ? `Work I hand to AI:\n${handed.map((t) => `- ${t}`).join("\n")}`
      : "",
    interested.length
      ? `Opportunities I marked as interesting:\n${interested
          .map((o) => `- ${o.title} (${o.type}). Skill to add: ${o.skill_to_add}`)
          .join("\n")}`
      : "I did not mark any opportunity as interesting.",
    "Write my step for this week and the rest of the material.",
  ]
    .filter(Boolean)
    .join("\n\n");
}
