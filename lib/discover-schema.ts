import { z } from "zod";

/**
 * Shapes for the discovery game: skill cards, career directions and invented
 * roles. Kept free of length constraints so the JSON schema sent to the API
 * stays inside the supported subset. Counts are trimmed in the route instead.
 */
export const SKILL_KINDS = ["hidden", "listed", "wild", "life"] as const;
export const DIRECTION_DISTANCES = ["next door", "a stretch", "unknown"] as const;

export const SkillsSchema = z.object({
  skills: z.array(
    z.object({
      name: z.string(),
      line: z.string(),
      kind: z.enum(SKILL_KINDS),
    }),
  ),
});

export const DirectionsSchema = z.object({
  directions: z.array(
    z.object({
      title: z.string(),
      line: z.string(),
      distance: z.enum(DIRECTION_DISTANCES),
      uses: z.array(z.string()),
    }),
  ),
});

export const RolesSchema = z.object({
  roles: z.array(
    z.object({
      name: z.string(),
      pitch: z.string(),
      built_from: z.array(z.string()),
    }),
  ),
});

export type Skill = z.infer<typeof SkillsSchema>["skills"][number];
export type Direction = z.infer<typeof DirectionsSchema>["directions"][number];
export type InventedRole = z.infer<typeof RolesSchema>["roles"][number];
export type SkillKind = (typeof SKILL_KINDS)[number];
export type DirectionDistance = (typeof DIRECTION_DISTANCES)[number];

export const SKILL_KIND_LABELS: Record<SkillKind, string> = {
  hidden: "Hiding in plain sight",
  listed: "You'd list this",
  wild: "From another world",
  life: "From your other life",
};

export const DISTANCE_LABELS: Record<DirectionDistance, string> = {
  "next door": "Next door",
  "a stretch": "A stretch",
  unknown: "Never heard of it",
};

interface DiscoverBase {
  seed: string;
  /** The person's answers about their life outside work, as plain lines. */
  life?: string;
  profile?: unknown;
}

export type DiscoverRequest =
  | (DiscoverBase & { stage: "skills"; avoid?: string[] })
  | (DiscoverBase & { stage: "directions"; kept: string[]; maybe: string[] })
  | (DiscoverBase & {
      stage: "roles";
      kept: string[];
      directions: string[];
      avoid?: string[];
    });
