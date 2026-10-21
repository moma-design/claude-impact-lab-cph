import { OPPORTUNITY_TYPE_LABELS } from "./types";
import type { FlowPayload, LevelUp, Opportunity, Skill, TaskChoice } from "./types";

/**
 * The world the person builds as they go: which item sits on which ring.
 * Derived from the flow state, so there is one source of truth and the
 * backdrop on every step and the results page render the same thing.
 */

export type RingTone = "paper" | "pink" | "yellow" | "ink" | "reach" | "signal";

export interface WorldItem {
  id: string;
  ring: number;
  tone: RingTone;
  kind: string;
  title: string;
  body: string;
}

export const RING_NAMES = ["Already yours", "Within reach", "On the horizon"] as const;

interface WorldInput {
  confirmedSkills: Skill[];
  extraSkill: string;
  lightsUp: string[];
  tasks: TaskChoice[];
  interested: Opportunity[];
  surpriseTitles: string[];
  levelUps: { opportunityTitle: string; toCollect: string[] }[];
  flow: FlowPayload | null;
  levelUp: LevelUp | null;
}

export function buildWorld(input: WorldInput): WorldItem[] {
  const items: WorldItem[] = [];

  // Ring 1: what is already theirs.
  for (const skill of input.confirmedSkills) {
    items.push({
      id: `skill:${skill.name}`,
      ring: 0,
      tone: skill.kind === "hidden" ? "yellow" : "paper",
      kind: skill.kind === "hidden" ? "Hidden skill" : "Strength",
      title: skill.name,
      body: skill.reasoning,
    });
  }

  if (input.extraSkill.trim()) {
    items.push({
      id: "skill:extra",
      ring: 0,
      tone: "paper",
      kind: "You added",
      title: input.extraSkill.trim(),
      body: "In your own words, not read from the profile.",
    });
  }

  // Their own picks, never an invented quote.
  if (input.lightsUp.length > 0) {
    items.push({
      id: "you-said:lights",
      ring: 0,
      tone: "pink",
      kind: "You said",
      title: input.lightsUp.join(", "),
      body: "What you chose when asked what lights you up.",
    });
  }

  const kept = input.tasks.filter((task) => task.keep === true).map((task) => task.label);
  if (kept.length > 0) {
    items.push({
      id: "you-said:keep",
      ring: 0,
      tone: "pink",
      kind: "You keep",
      title: kept[0],
      body: kept.length > 1 ? `And ${kept.length - 1} more you would not hand over.` : "You said you keep this one yourself.",
    });
  }

  if (input.flow) {
    items.push({
      id: "this-week",
      ring: 0,
      tone: "ink",
      kind: "This week",
      title: input.flow.step_this_week.minutes,
      body: input.flow.step_this_week.action,
    });
  }

  // Ring 2: within reach.
  const surprise = new Set(input.surpriseTitles.map((title) => title.toLowerCase()));
  for (const opportunity of input.interested) {
    const onHorizon =
      surprise.has(opportunity.title.toLowerCase()) || opportunity.type === "new field";
    items.push({
      id: `opportunity:${opportunity.title}`,
      ring: onHorizon ? 2 : 1,
      tone: onHorizon ? "signal" : "yellow",
      kind: OPPORTUNITY_TYPE_LABELS[opportunity.type],
      title: opportunity.title,
      body: opportunity.why_you,
    });
  }

  for (const role of input.levelUps) {
    for (const card of role.toCollect) {
      items.push({
        id: `collect:${role.opportunityTitle}:${card}`,
        ring: 1,
        tone: "reach",
        kind: "Skill to add",
        title: card,
        body: `For ${role.opportunityTitle}.`,
      });
    }
  }

  return items;
}

/** Which ring a step is looking at, for the backdrop camera. */
export const STAGE_RING: Record<string, number> = {
  start: 0,
  skills: 0,
  lights: 0,
  opportunities: 1,
  levelUp: 1,
  flow: 0,
};
