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

export const OpportunitySchema = z.object({
  title: z.string(),
  type: z.enum(OPPORTUNITY_TYPES),
  why_you: z.string(),
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
  /** true when the person keeps it, false when they hand it to AI. */
  keep: boolean;
}

export interface FlowContext {
  whereIComeFrom: string;
  confirmedSkills: Skill[];
  extraSkill: string;
  lightsUp: string[];
  tasks: TaskChoice[];
  interested: Opportunity[];
}
