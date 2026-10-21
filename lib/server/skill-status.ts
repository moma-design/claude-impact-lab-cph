import type { Skill, SkillBadgeStatus } from "@/lib/flow/types";

/**
 * One rule, used by both the opportunity card and the Level up deck, so the
 * two always agree about which skills the person already holds.
 */
export function statusForSkill(
  name: string,
  confirmed: Skill[],
): SkillBadgeStatus {
  const key = name.trim().toLowerCase();
  const match = confirmed.find((skill) => skill.name.trim().toLowerCase() === key);
  if (!match) return "to collect";
  return match.kind === "hidden" ? "hidden" : "held";
}
