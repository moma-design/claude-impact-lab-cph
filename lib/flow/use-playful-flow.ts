"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Profile } from "@/lib/app-config";
import { EXAMPLE_PERSON_PROFILE } from "@/lib/example-person";
import { MAX_LIGHTS_UP } from "./lights-up";
import { buildWorld } from "./world";
import type {
  FlowContext,
  FlowPayload,
  LevelUp,
  LevelUpCard,
  LevelUpStory,
  LevelUpSummary,
  Opportunity,
  SkillBadge,
  Skill,
  SkillsPayload,
  TaskChoice,
} from "./types";

export type Stage = "start" | "skills" | "lights" | "opportunities" | "levelUp" | "flow";

const GENERIC_ERROR = "Something went wrong. Try again.";
const UNREACHABLE = "Could not reach the server. Is the dev server still running?";

/** Shown one after another in the existing Thinking component while searching. */
export const SEARCH_NOTES = [
  "Looking at current openings",
  "Looking at fractional roles",
  "Looking at new fields",
  "Checking sources",
];

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!response.ok || !payload) {
    throw new Error(payload?.error ?? GENERIC_ERROR);
  }
  return payload;
}

export function usePlayfulFlow() {
  const [stage, setStage] = useState<Stage>("start");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExample, setIsExample] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);

  /* Step 2 */
  const [whereIComeFrom, setWhereIComeFrom] = useState("");
  const [proposedSkills, setProposedSkills] = useState<Skill[]>([]);
  const [skillIndex, setSkillIndex] = useState(0);
  const [confirmedSkills, setConfirmedSkills] = useState<Skill[]>([]);
  const [extraSkill, setExtraSkill] = useState("");

  /* Step 3 */
  const [lightsUp, setLightsUp] = useState<string[]>([]);
  const [tasks, setTasks] = useState<TaskChoice[]>([]);

  /* Step 4 */
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [opportunityIndex, setOpportunityIndex] = useState(0);
  const [interested, setInterested] = useState<Opportunity[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchNote, setSearchNote] = useState(SEARCH_NOTES[0]);
  const [savedExample, setSavedExample] = useState(false);
  /** Titles that came back from Surprise me, so they land on the far ring. */
  const [surpriseTitles, setSurpriseTitles] = useState<string[]>([]);

  /** One story per role, fetched on demand and kept for the session. */
  const [roleStories, setRoleStories] = useState<Record<string, LevelUpStory | null>>({});
  const roleStoriesLoading = useRef<Set<string>>(new Set());

  /* Step 4b */
  const [levelUp, setLevelUp] = useState<LevelUp | null>(null);
  const [levelUpReturn, setLevelUpReturn] = useState<Stage>("opportunities");
  const [levelUps, setLevelUps] = useState<LevelUpSummary[]>([]);

  /* Step 5 */
  const [flow, setFlow] = useState<FlowPayload | null>(null);
  const [flowMarkdown, setFlowMarkdown] = useState("");

  /** Guards against a second early search while the first is still in flight. */
  const searchStarted = useRef(false);

  useEffect(() => {
    if (!searching) return;
    let index = 0;
    const timer = window.setInterval(() => {
      index = (index + 1) % SEARCH_NOTES.length;
      setSearchNote(SEARCH_NOTES[index]);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [searching]);

  const runSearch = useCallback(
    async (options: {
      surprise?: boolean;
      flowMarkdown?: string;
      skills: Skill[];
      where: string;
      picks?: string[];
      taskChoices?: TaskChoice[];
      shown: string[];
      example: boolean;
      append: boolean;
    }) => {
      setSearching(true);
      setError(null);
      try {
        const payload = await postJson<{
          opportunities: Opportunity[];
          savedExample: boolean;
        }>("/api/opportunities", {
          isExample: options.example,
          surprise: options.surprise ?? false,
          whereIComeFrom: options.where,
          skills: options.skills,
          extraSkill: extraSkill.trim() || undefined,
          lightsUp: options.picks,
          keeps: options.taskChoices?.filter((t) => t.keep === true).map((t) => t.label),
          handsOver: options.taskChoices?.filter((t) => t.keep === false).map((t) => t.label),
          flowMarkdown: options.flowMarkdown,
          alreadyShown: options.shown,
        });
        setSavedExample(payload.savedExample);
        if (options.surprise) {
          setSurpriseTitles((current) => [
            ...current,
            ...payload.opportunities.map((item) => item.title),
          ]);
        }
        setOpportunities((current) =>
          options.append ? [...current, ...payload.opportunities] : payload.opportunities,
        );
        if (!options.append) setOpportunityIndex(0);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : UNREACHABLE);
      } finally {
        setSearching(false);
      }
    },
    [extraSkill],
  );

  const loadSkills = useCallback(async (nextProfile: Profile) => {
    setBusy(true);
    setError(null);
    try {
      const payload = await postJson<SkillsPayload>("/api/skills", {
        profile: nextProfile,
      });
      setWhereIComeFrom(payload.where_i_come_from);
      setProposedSkills(payload.skills);
      setTasks(payload.tasks.map((label) => ({ label, keep: null })));
      setSkillIndex(0);
      setConfirmedSkills([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : UNREACHABLE);
    } finally {
      setBusy(false);
    }
  }, []);

  const start = useCallback(
    (nextProfile: Profile) => {
      setProfile(nextProfile);
      setIsExample(false);
      setStage("skills");
      void loadSkills(nextProfile);
    },
    [loadSkills],
  );

  const startExample = useCallback(() => {
    setProfile(EXAMPLE_PERSON_PROFILE);
    setIsExample(true);
    setStage("skills");
    void loadSkills(EXAMPLE_PERSON_PROFILE);
  }, [loadSkills]);

  const reactToSkill = useCallback(
    (thatsMe: boolean) => {
      const skill = proposedSkills[skillIndex];
      if (!skill) return;
      if (thatsMe) setConfirmedSkills((current) => [...current, skill]);
      setSkillIndex((current) => current + 1);
    },
    [proposedSkills, skillIndex],
  );

  /** Confirms step 2 and starts the live research behind step 3. */
  const confirmSkills = useCallback(() => {
    setStage("lights");
    if (searchStarted.current) return;
    searchStarted.current = true;
    void runSearch({
      skills: confirmedSkills,
      where: whereIComeFrom,
      shown: [],
      example: isExample,
      append: false,
    });
  }, [confirmedSkills, isExample, runSearch, whereIComeFrom]);

  const toggleLight = useCallback((value: string) => {
    setLightsUp((current) => {
      if (current.includes(value)) return current.filter((item) => item !== value);
      if (current.length >= MAX_LIGHTS_UP) return current;
      return [...current, value];
    });
  }, []);

  const setTaskKeep = useCallback((label: string, keep: boolean) => {
    setTasks((current) =>
      current.map((task) => (task.label === label ? { ...task, keep } : task)),
    );
  }, []);

  const confirmLights = useCallback(() => {
    setStage("opportunities");
    // The early search is usually still running or already back. Only retry
    // here if it failed, and then with this step's picks folded in.
    if (!searching && opportunities.length === 0) {
      void runSearch({
        skills: confirmedSkills,
        where: whereIComeFrom,
        picks: lightsUp,
        taskChoices: tasks,
        shown: [],
        example: isExample,
        append: false,
      });
    }
  }, [
    confirmedSkills,
    isExample,
    lightsUp,
    opportunities.length,
    runSearch,
    searching,
    tasks,
    whereIComeFrom,
  ]);

  const surpriseMe = useCallback(() => {
    void runSearch({
      surprise: true,
      skills: confirmedSkills,
      where: whereIComeFrom,
      picks: lightsUp,
      taskChoices: tasks,
      shown: opportunities.map((item) => item.title),
      example: isExample,
      append: true,
    });
  }, [confirmedSkills, isExample, lightsUp, opportunities, runSearch, tasks, whereIComeFrom]);

  const loadRoleStory = useCallback(
    async (roleTitle: string) => {
      const key = roleTitle.trim();
      if (!key || key in roleStories || roleStoriesLoading.current.has(key)) return;
      roleStoriesLoading.current.add(key);
      try {
        const payload = await postJson<{ story: LevelUpStory | null }>("/api/role-video", {
          roleTitle: key,
          isExample,
        });
        setRoleStories((current) => ({ ...current, [key]: payload.story }));
      } catch {
        // A missing story is not an error the person needs to see: the card
        // simply shows without one.
        setRoleStories((current) => ({ ...current, [key]: null }));
      } finally {
        roleStoriesLoading.current.delete(key);
      }
    },
    [isExample, roleStories],
  );

  const openLevelUp = useCallback(
    async (opportunity: Opportunity, from: Stage) => {
      setLevelUpReturn(from);
      setStage("levelUp");
      setLevelUp(null);
      setSearching(true);
      setError(null);
      try {
        const payload = await postJson<{
          role_title: string;
          cards: LevelUpCard[];
          stories: LevelUpStory[];
          savedExample: boolean;
        }>("/api/level-up", {
          isExample,
          opportunityTitle: opportunity.title,
          opportunityType: opportunity.type,
          whyYou: opportunity.why_you,
          skills: confirmedSkills,
          badges: opportunity.skills as SkillBadge[],
        });
        const next: LevelUp = {
          opportunityTitle: opportunity.title,
          roleTitle: payload.role_title || opportunity.title,
          cards: payload.cards,
          stories: payload.stories,
          savedExample: payload.savedExample,
          collecting: [],
        };
        setLevelUp(next);
        setLevelUps((current) => [
          ...current.filter((item) => item.opportunityTitle !== opportunity.title),
          {
            roleTitle: next.roleTitle,
            opportunityTitle: next.opportunityTitle,
            held: next.cards.filter((card) => card.held).map((card) => card.name),
            toCollect: next.cards.filter((card) => !card.held).map((card) => card.name),
            plan: [],
          },
        ]);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : UNREACHABLE);
      } finally {
        setSearching(false);
      }
    },
    [confirmedSkills, isExample],
  );

  const collectCard = useCallback((cardName: string) => {
    setLevelUp((current) => {
      if (!current) return current;
      const collecting = current.collecting.includes(cardName)
        ? current.collecting.filter((name) => name !== cardName)
        : [...current.collecting, cardName];
      setLevelUps((roles) =>
        roles.map((role) =>
          role.opportunityTitle === current.opportunityTitle
            ? { ...role, plan: collecting }
            : role,
        ),
      );
      return { ...current, collecting };
    });
  }, []);

  const closeLevelUp = useCallback(() => {
    setError(null);
    setStage(levelUpReturn);
  }, [levelUpReturn]);

  const reactToOpportunity = useCallback(
    (reaction: "interested" | "not-for-me") => {
      const opportunity = opportunities[opportunityIndex];
      if (!opportunity) return;
      setOpportunityIndex((current) => current + 1);
      if (reaction === "interested") {
        setInterested((current) => [...current, opportunity]);
        void openLevelUp(opportunity, "opportunities");
      }
    },
    [opportunities, opportunityIndex, openLevelUp],
  );

  const buildContext = useCallback(
    (): FlowContext => ({
      whereIComeFrom,
      confirmedSkills,
      extraSkill,
      lightsUp,
      tasks,
      interested,
      levelUps,
    }),
    [confirmedSkills, extraSkill, interested, levelUps, lightsUp, tasks, whereIComeFrom],
  );

  const finish = useCallback(async () => {
    setStage("flow");
    setBusy(true);
    setError(null);
    try {
      const payload = await postJson<{ flow: FlowPayload; flowMarkdown: string }>(
        "/api/flow",
        { context: buildContext() },
      );
      setFlow(payload.flow);
      setFlowMarkdown(payload.flowMarkdown);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : UNREACHABLE);
    } finally {
      setBusy(false);
    }
  }, [buildContext]);

  /** Step 5: run the research again, this time from flow.md. */
  const findNewOpportunities = useCallback(() => {
    setStage("opportunities");
    void runSearch({
      skills: confirmedSkills,
      where: whereIComeFrom,
      picks: lightsUp,
      taskChoices: tasks,
      flowMarkdown,
      shown: opportunities.map((item) => item.title),
      example: isExample,
      append: true,
    });
  }, [
    confirmedSkills,
    flowMarkdown,
    isExample,
    lightsUp,
    opportunities,
    runSearch,
    tasks,
    whereIComeFrom,
  ]);

  const restart = useCallback(() => {
    searchStarted.current = false;
    setStage("start");
    setBusy(false);
    setError(null);
    setIsExample(false);
    setProfile(null);
    setWhereIComeFrom("");
    setProposedSkills([]);
    setSkillIndex(0);
    setConfirmedSkills([]);
    setExtraSkill("");
    setLightsUp([]);
    setTasks([]);
    setOpportunities([]);
    setOpportunityIndex(0);
    setInterested([]);
    setSearching(false);
    setSavedExample(false);
    setSurpriseTitles([]);
    setFlow(null);
    setFlowMarkdown("");
    setLevelUp(null);
    setLevelUps([]);
    setLevelUpReturn("opportunities");
    setRoleStories({});
  }, []);

  const retrySkills = useCallback(() => {
    if (profile) void loadSkills(profile);
  }, [loadSkills, profile]);

  const worldItems = buildWorld({
    confirmedSkills,
    extraSkill,
    lightsUp,
    tasks,
    interested,
    surpriseTitles,
    levelUps,
    flow,
    levelUp,
  });

  const heldCount = levelUps.reduce((total, role) => total + role.held.length, 0);
  const toCollectCount = levelUps.reduce((total, role) => total + role.toCollect.length, 0);

  return {
    worldItems,
    heldCount,
    toCollectCount,
    surpriseTitles,

    stage,
    busy,
    error,
    isExample,
    start,
    startExample,
    restart,

    whereIComeFrom,
    proposedSkills,
    skillIndex,
    confirmedSkills,
    extraSkill,
    setExtraSkill,
    reactToSkill,
    confirmSkills,
    retrySkills,

    lightsUp,
    toggleLight,
    tasks,
    setTaskKeep,
    confirmLights,

    opportunities,
    opportunityIndex,
    interested,
    searching,
    searchNote,
    savedExample,
    reactToOpportunity,
    surpriseMe,
    finish,

    roleStories,
    loadRoleStory,

    levelUp,
    openLevelUp,
    collectCard,
    closeLevelUp,

    flow,
    flowMarkdown,
    findNewOpportunities,
  };
}

export type PlayfulFlow = ReturnType<typeof usePlayfulFlow>;
