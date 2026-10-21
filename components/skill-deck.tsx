"use client";

import { useCallback, useEffect, useState } from "react";

import { SKILL_KIND_LABELS, type Skill, type SkillKind } from "@/lib/discover-schema";

import { ErrorNote, primaryButton, quietLink, secondaryButton, Thinking } from "./ui";

type Answer = "yes" | "bit" | "no";

interface SkillDeckProps {
  /** Null while the first deal is loading. */
  skills: Skill[] | null;
  loadingMore: boolean;
  error: string | null;
  onMore: (seen: string[]) => void;
  onFinish: (kept: string[], maybe: string[]) => void;
  onRetry: () => void;
}

const KIND_STYLE: Record<SkillKind, string> = {
  hidden: "bg-pink",
  listed: "bg-surface",
  wild: "bg-yellow",
  life: "bg-orange",
};

const LOADING_LINES = [
  "Shuffling your skills",
  "Digging out the ones you never list",
  "Looking in other worlds",
];

export function SkillDeck({
  skills,
  loadingMore,
  error,
  onMore,
  onFinish,
  onRetry,
}: SkillDeckProps) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<Answer | null>(null);
  const [extra, setExtra] = useState("");
  const [extras, setExtras] = useState<string[]>([]);
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (skills) return;
    const id = window.setInterval(() => setLineIndex((i) => (i + 1) % LOADING_LINES.length), 1800);
    return () => window.clearInterval(id);
  }, [skills]);

  const list = skills ?? [];
  const current = list[index];
  const finished = skills !== null && index >= list.length;

  const kept = [
    ...list.filter((s) => answers[s.name] === "yes").map((s) => s.name),
    ...extras,
  ];
  const maybe = list.filter((s) => answers[s.name] === "bit").map((s) => s.name);

  const answer = useCallback(
    (value: Answer) => {
      if (!current || leaving) return;
      setLeaving(value);
      window.setTimeout(() => {
        setAnswers((prev) => ({ ...prev, [current.name]: value }));
        setIndex((i) => i + 1);
        setLeaving(null);
      }, 260);
    },
    [current, leaving],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "ArrowRight") answer("yes");
      else if (event.key === "ArrowDown") answer("bit");
      else if (event.key === "ArrowLeft") answer("no");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer]);

  const exit =
    leaving === "yes"
      ? "translate-x-[60vw] rotate-12 opacity-0"
      : leaving === "no"
        ? "-translate-x-[60vw] -rotate-12 opacity-0"
        : leaving === "bit"
          ? "translate-y-[40vh] opacity-0"
          : "";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1000px] flex-col px-6 py-10">
      <header className="flex items-baseline justify-between gap-4">
        <p className="text-[11px] font-bold tracking-[0.14em] uppercase">Step 2 of 4 · Skills</p>
        <p className="text-[11px] text-muted">
          {skills ? `${Math.min(index + 1, list.length)} / ${list.length}` : ""}
        </p>
      </header>

      <h1 className="font-display mt-4 text-[clamp(32px,5vw,56px)] leading-[0.95] uppercase">
        Which of these <span className="bg-yellow px-2">is you?</span>
      </h1>

      {error ? (
        <div className="mt-8 max-w-[56ch]">
          <ErrorNote message={error} />
          <button type="button" onClick={onRetry} className={`${quietLink} mt-4`}>
            Try again
          </button>
        </div>
      ) : null}

      {!skills && !error ? (
        <div className="mt-16">
          <Thinking label={LOADING_LINES[lineIndex]} />
        </div>
      ) : null}

      <div className="mt-8 grid flex-1 gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section aria-live="polite">
          {current ? (
            <>
              <div className="relative mx-auto max-w-[460px]">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 translate-x-3 translate-y-3 rotate-2 rounded-sm border-2 border-ink bg-surface"
                />
                <article
                  key={current.name}
                  className={`card-in relative rounded-sm border-2 border-ink p-8 transition-all duration-[260ms] ${KIND_STYLE[current.kind]} ${exit} hard-shadow`}
                >
                  <p className="text-[11px] font-bold tracking-[0.14em] uppercase">
                    {SKILL_KIND_LABELS[current.kind]}
                  </p>
                  <h2 className="font-display mt-6 text-[44px] leading-[0.98] uppercase">
                    {current.name}
                  </h2>
                  <p className="mt-5 text-[14px] leading-relaxed">{current.line}</p>
                </article>
              </div>

              <div className="mx-auto mt-10 flex max-w-[460px] items-stretch gap-3">
                <button
                  type="button"
                  onClick={() => answer("no")}
                  className={`${secondaryButton} flex-1 flex-col gap-1 py-4`}
                >
                  Not me
                  <span className="text-[10px] font-normal opacity-60">←</span>
                </button>
                <button
                  type="button"
                  onClick={() => answer("bit")}
                  className={`${secondaryButton} flex-1 flex-col gap-1 py-4`}
                >
                  A bit
                  <span className="text-[10px] font-normal opacity-60">↓</span>
                </button>
                <button
                  type="button"
                  onClick={() => answer("yes")}
                  className={`${primaryButton} flex-1 flex-col gap-1 py-4`}
                >
                  That&apos;s me
                  <span className="text-[10px] font-normal opacity-60">→</span>
                </button>
              </div>
            </>
          ) : null}

          {finished ? (
            <div className="mx-auto max-w-[460px]">
              <p className="font-display text-[40px] leading-none uppercase">
                {kept.length} skills claimed
              </p>
              <p className="mt-3 text-[13px] text-muted">
                That&apos;s more than your CV says. Anything we missed?
              </p>
              <form
                className="mt-4 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const value = extra.trim();
                  if (value) setExtras((prev) => [...prev, value]);
                  setExtra("");
                }}
              >
                <input
                  value={extra}
                  onChange={(event) => setExtra(event.target.value)}
                  placeholder="Add your own skill"
                  className="min-w-0 flex-1 rounded-sm border-2 border-ink bg-surface px-3 py-2 text-[13px]"
                />
                <button type="submit" className={secondaryButton}>
                  Add
                </button>
              </form>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  className={primaryButton}
                  disabled={kept.length + maybe.length === 0}
                  onClick={() => onFinish(kept, maybe)}
                >
                  Where do these lead?
                </button>
                <button
                  type="button"
                  className={secondaryButton}
                  disabled={loadingMore}
                  onClick={() => onMore(list.map((s) => s.name))}
                >
                  {loadingMore ? "Dealing" : "Deal more"}
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="lg:pt-2">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase">Your pile</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {kept.map((name) => (
              <li
                key={name}
                className="card-in rounded-full border-2 border-ink bg-ink px-3 py-1 text-[11px] font-bold text-accent-soft uppercase"
              >
                {name}
              </li>
            ))}
            {maybe.map((name) => (
              <li
                key={name}
                className="card-in rounded-full border-2 border-dashed border-ink px-3 py-1 text-[11px] font-bold uppercase"
              >
                {name}
              </li>
            ))}
          </ul>
          {kept.length + maybe.length === 0 ? (
            <p className="mt-3 text-[12px] text-muted">Claimed skills collect here.</p>
          ) : null}
          {!finished && kept.length + maybe.length >= 5 ? (
            <button
              type="button"
              onClick={() => onFinish(kept, maybe)}
              className={`${quietLink} mt-6 block`}
            >
              Enough, show me where these lead
            </button>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

