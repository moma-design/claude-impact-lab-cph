"use client";

import { useRef, useState } from "react";

import { DepthResults } from "@/components/depth-results";
import { Directions } from "@/components/directions";
import { Entry } from "@/components/entry";
import { LifeQuestions } from "@/components/life-questions";
import { RoleLab } from "@/components/role-lab";
import { SkillDeck } from "@/components/skill-deck";
import { ErrorNote, quietLink, Thinking } from "@/components/ui";
import type { Profile } from "@/lib/app-config";
import type { CareerMap } from "@/lib/career-map-schema";
import type { Direction, InventedRole, Skill } from "@/lib/discover-schema";
import { EXAMPLE_PERSON_PROFILE } from "@/lib/example-person";

type Screen = "entry" | "life" | "skills" | "directions" | "roles" | "generating" | "results";

const GENERIC_ERROR = "Something went wrong. Try again.";

async function post<T>(url: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Could not reach the server. Is the dev server still running?");
  }
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!response.ok || !payload) {
    throw new Error(payload?.error ?? GENERIC_ERROR);
  }
  return payload;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("entry");
  const [seed, setSeed] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [life, setLife] = useState("");
  const [skills, setSkills] = useState<Skill[] | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [kept, setKept] = useState<string[]>([]);
  const [maybe, setMaybe] = useState<string[]>([]);
  const [directions, setDirections] = useState<Direction[] | null>(null);
  const [chosenDirections, setChosenDirections] = useState<string[]>([]);
  const [roles, setRoles] = useState<InventedRole[] | null>(null);
  const [remixing, setRemixing] = useState(false);
  const [map, setMap] = useState<CareerMap | null>(null);
  const [flowMarkdown, setFlowMarkdown] = useState("");
  const [error, setError] = useState<string | null>(null);
  const retry = useRef<() => void>(() => {});

  function fail(err: unknown, again: () => void) {
    setError(err instanceof Error ? err.message : GENERIC_ERROR);
    retry.current = again;
  }

  async function dealSkills(nextSeed: string, nextProfile: Profile | null, nextLife: string) {
    setError(null);
    setSkills(null);
    try {
      const out = await post<{ skills: Skill[] }>("/api/discover", {
        stage: "skills",
        seed: nextSeed,
        profile: nextProfile,
        life: nextLife,
      });
      setSkills(out.skills);
    } catch (err) {
      fail(err, () => void dealSkills(nextSeed, nextProfile, nextLife));
    }
  }

  async function dealMore(seen: string[]) {
    setLoadingMore(true);
    setError(null);
    try {
      const out = await post<{ skills: Skill[] }>("/api/discover", {
        stage: "skills",
        seed,
        profile,
        life,
        avoid: seen,
      });
      setSkills((prev) => [...(prev ?? []), ...out.skills]);
    } catch (err) {
      fail(err, () => void dealMore(seen));
    } finally {
      setLoadingMore(false);
    }
  }

  async function mapDirections(nextKept: string[], nextMaybe: string[]) {
    setError(null);
    setDirections(null);
    try {
      const out = await post<{ directions: Direction[] }>("/api/discover", {
        stage: "directions",
        seed,
        profile,
        life,
        kept: nextKept,
        maybe: nextMaybe,
      });
      setDirections(out.directions);
    } catch (err) {
      fail(err, () => void mapDirections(nextKept, nextMaybe));
    }
  }

  async function inventRoles(nextKept: string[], chosen: string[], avoid: string[]) {
    setError(null);
    if (avoid.length) setRemixing(true);
    else setRoles(null);
    try {
      const out = await post<{ roles: InventedRole[] }>("/api/discover", {
        stage: "roles",
        seed,
        profile,
        life,
        kept: nextKept,
        directions: chosen,
        avoid,
      });
      setRoles(out.roles);
    } catch (err) {
      fail(err, () => void inventRoles(nextKept, chosen, avoid));
    } finally {
      setRemixing(false);
    }
  }

  async function buildMap(name: string, pitch: string) {
    setScreen("generating");
    setError(null);
    const summary = [
      `What I do: ${seed || "see the profile"}.`,
      `My life outside work: ${life || "not said"}`,
      `Skills that are definitely me: ${kept.join("; ") || "none"}.`,
      `Skills that are a bit me: ${maybe.join("; ") || "none"}.`,
      `Directions that intrigued me: ${chosenDirections.join("; ") || "none picked"}.`,
      `The role I invented: ${name}. ${pitch}`,
    ].join("\n");
    try {
      const out = await post<{ map: CareerMap; flowMarkdown: string }>("/api/map", {
        profile,
        messages: [
          { role: "assistant", content: "Deal the cards, map the directions, invent a role." },
          { role: "user", content: summary },
        ],
      });
      setMap(out.map);
      setFlowMarkdown(out.flowMarkdown);
      setScreen("results");
    } catch (err) {
      fail(err, () => void buildMap(name, pitch));
    }
  }

  function begin(nextSeed: string, nextProfile: Profile | null, example = false) {
    setSeed(nextSeed);
    setProfile(nextProfile);
    setLife("");
    if (example) {
      setScreen("skills");
      void dealSkills(nextSeed, nextProfile, "");
    } else {
      setScreen("life");
    }
  }

  function restart() {
    setScreen("entry");
    setSeed("");
    setProfile(null);
    setLife("");
    setSkills(null);
    setKept([]);
    setMaybe([]);
    setDirections(null);
    setChosenDirections([]);
    setRoles(null);
    setMap(null);
    setFlowMarkdown("");
    setError(null);
  }

  if (screen === "entry") {
    return (
      <Entry
        onBegin={(s, p) => begin(s, p)}
        onExample={() => begin("", EXAMPLE_PERSON_PROFILE, true)}
        error={error}
      />
    );
  }

  if (screen === "life") {
    return (
      <LifeQuestions
        onDone={(answers) => {
          setLife(answers);
          setScreen("skills");
          void dealSkills(seed, profile, answers);
        }}
      />
    );
  }

  if (screen === "skills") {
    return (
      <SkillDeck
        skills={skills}
        loadingMore={loadingMore}
        error={error}
        onMore={(seen) => void dealMore(seen)}
        onRetry={() => retry.current()}
        onFinish={(nextKept, nextMaybe) => {
          setKept(nextKept);
          setMaybe(nextMaybe);
          setScreen("directions");
          void mapDirections(nextKept, nextMaybe);
        }}
      />
    );
  }

  if (screen === "directions") {
    return (
      <Directions
        directions={directions}
        error={error}
        onRetry={() => retry.current()}
        onDone={(chosen) => {
          setChosenDirections(chosen);
          setScreen("roles");
          void inventRoles(kept, chosen, []);
        }}
      />
    );
  }

  if (screen === "roles") {
    return (
      <RoleLab
        roles={roles}
        remixing={remixing}
        error={error}
        onRetry={() => retry.current()}
        onRemix={(seen) => void inventRoles(kept, chosenDirections, seen)}
        onPick={(name, pitch) => void buildMap(name, pitch)}
      />
    );
  }

  if (screen === "generating" || !map) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[680px] flex-col justify-center px-6">
        <h1 className="font-display text-[clamp(40px,7vw,80px)] leading-[0.92] uppercase">
          Building your map
        </h1>
        <div className="mt-6">
          {error ? <ErrorNote message={error} /> : <Thinking label="Takes about twenty seconds." />}
        </div>
        {error ? (
          <div className="mt-6 flex gap-6">
            <button type="button" onClick={() => retry.current()} className={quietLink}>
              Try again
            </button>
            <button type="button" onClick={restart} className={quietLink}>
              Start again
            </button>
          </div>
        ) : null}
      </main>
    );
  }

  return (
    <DepthResults
      map={map}
      flowMarkdown={flowMarkdown}
      onRestart={restart}
    />
  );
}
