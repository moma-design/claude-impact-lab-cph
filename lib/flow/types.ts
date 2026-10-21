import { z } from "zod";

/**
 * Shapes for the playful flow. Deliberately free of length and range
 * constraints so the JSON schema stays inside the supported subset; counts are
 * checked in the route handlers after parsing.
 */

/* Step 2: here's what I see */

export const SKILL_KINDS = ["stated", "hidden"] as const;

export const SkillsSchema = z.object({
  where_i_come_from: z.string(),
  skills: z.array(
    z.object({
      name: z.string(),
      kind: z.enum(SKILL_KINDS),
      reasoning: z.string(),
    }),
  ),
  tasks: z.array(z.string()),
});

export type SkillsPayload = z.infer<typeof SkillsSchema>;
export type Skill = SkillsPayload["skills"][number];
export type SkillKind = (typeof SKILL_KINDS)[number];

/* Step 4: opportunities I found for you */

export const OPPORTUNITY_TYPES = [
  "opening",
  "emerging role",
  "fractional",
  "polywork",
  "new field",
] as const;

export const SKILL_BADGE_STATUSES = ["held", "hidden", "to collect"] as const;
export type SkillBadgeStatus = (typeof SKILL_BADGE_STATUSES)[number];

export const SKILL_BADGE_LABELS: Record<SkillBadgeStatus, string> = {
  held: "Held",
  hidden: "Hidden",
  "to collect": "To collect",
};

export interface SkillBadge {
  name: string;
  status: SkillBadgeStatus;
}

export const OpportunitySchema = z.object({
  title: z.string(),
  /** Four to six skills the role needs. Status is decided server-side. */
  skills: z.array(
    z.object({
      name: z.string(),
      status: z.enum(SKILL_BADGE_STATUSES),
    }),
  ),
  type: z.enum(OPPORTUNITY_TYPES),
  why_you: z.string(),
  /** The fuller version, shown only in the glass panel. */
  why_you_long: z.string(),
  skill_to_add: z.string(),
  learning_resource_title: z.string(),
  learning_resource_url: z.string(),
  source_title: z.string(),
  source_url: z.string(),
});

export const OpportunitiesSchema = z.object({
  opportunities: z.array(OpportunitySchema),
});

export type Opportunity = z.infer<typeof OpportunitySchema>;
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  opening: "Opening",
  "emerging role": "Emerging role",
  fractional: "Fractional",
  polywork: "Polywork",
  "new field": "New field",
};

/* Step 5: your flow */

export const FlowSchema = z.object({
  /** The centre of the rings: one role synthesised from what they confirmed. */
  dream_job: z.object({
    title: z.string(),
    week: z.array(z.string()),
  }),
  step_this_week: z.object({
    action: z.string(),
    minutes: z.string(),
    who_to_talk_to: z.string(),
  }),
  what_lights_me_up: z.string(),
  watching_for: z.array(z.string()),
  closing_line: z.string(),
});

export type FlowPayload = z.infer<typeof FlowSchema>;

/* Client-side state carried between steps */

export type Reaction = "interested" | "not-for-me";

export interface TaskChoice {
  label: string;
  /** true when the person keeps it, false when they hand it to AI, null until they decide. */
  keep: boolean | null;
}

export interface FlowContext {
  whereIComeFrom: string;
  confirmedSkills: Skill[];
  extraSkill: string;
  lightsUp: string[];
  tasks: TaskChoice[];
  interested: Opportunity[];
  levelUps: LevelUpSummary[];
}

/** What flow.md records for each role the person opened Level up on. */
export interface LevelUpSummary {
  roleTitle: string;
  opportunityTitle: string;
  held: string[];
  toCollect: string[];
  plan: string[];
}

/* Step 4b: level up */

export const PERSON_KINDS = ["video", "article", "community"] as const;

export const LevelUpSchema = z.object({
  role_title: z.string(),
  cards: z.array(
    z.object({
      name: z.string(),
      /** The person's own skill this card matches, or an empty string. */
      matches_skill: z.string(),
      how_to_earn: z.string(),
      resource_title: z.string(),
      resource_url: z.string(),
    }),
  ),
  people: z.array(
    z.object({
      kind: z.enum(PERSON_KINDS),
      title: z.string(),
      why_watch: z.string(),
      source_url: z.string(),
    }),
  ),
});

export type LevelUpPayload = z.infer<typeof LevelUpSchema>;
export type PersonKind = (typeof PERSON_KINDS)[number];

/** A card after the server has decided whether the person already holds it. */
export interface LevelUpCard {
  name: string;
  held: boolean;
  matches_skill: string;
  how_to_earn: string;
  resource_title: string;
  resource_url: string;
}

export interface LevelUpStory {
  kind: PersonKind;
  title: string;
  why_watch: string;
  source_url: string;
  /** Set when the source is a YouTube or Vimeo page found in the results. */
  embed_url: string;
}

export interface LevelUp {
  opportunityTitle: string;
  roleTitle: string;
  cards: LevelUpCard[];
  stories: LevelUpStory[];
  savedExample: boolean;
  /** Card names the person tapped "I'll collect this" on. */
  collecting: string[];
}
