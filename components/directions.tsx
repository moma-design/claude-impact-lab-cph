"use client";

import { useState } from "react";

import {
  DIRECTION_DISTANCES,
  DISTANCE_LABELS,
  type Direction,
  type DirectionDistance,
} from "@/lib/discover-schema";

import { ErrorNote, primaryButton, quietLink, Thinking } from "./ui";

interface DirectionsProps {
  directions: Direction[] | null;
  error: string | null;
  onDone: (chosen: string[]) => void;
  onRetry: () => void;
}

const DISTANCE_STYLE: Record<DirectionDistance, { head: string; blurb: string }> = {
  "next door": { head: "bg-surface", blurb: "You could walk there tomorrow." },
  "a stretch": { head: "bg-orange", blurb: "Different world. Your skills travel." },
  unknown: { head: "bg-pink", blurb: "You may not know these exist. Nobody does yet." },
};

export function Directions({ directions, error, onDone, onRetry }: DirectionsProps) {
  const [picked, setPicked] = useState<string[]>([]);

  function toggle(title: string) {
    setPicked((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] px-6 py-10">
      <p className="text-[11px] font-bold tracking-[0.14em] uppercase">
        Step 3 of 4 · Directions
      </p>
      <h1 className="font-display mt-4 text-[clamp(32px,5vw,56px)] leading-[0.95] uppercase">
        Tap what makes you <span className="bg-yellow px-2">curious</span>
      </h1>
      <p className="mt-4 max-w-[60ch] text-[13px] text-muted">
        Some are next door. Some you&apos;ve never heard of. These are places to explore, not
        promises of jobs.
      </p>

      {error ? (
        <div className="mt-8 max-w-[56ch]">
          <ErrorNote message={error} />
          <button type="button" onClick={onRetry} className={`${quietLink} mt-4`}>
            Try again
          </button>
        </div>
      ) : null}

      {!directions && !error ? (
        <div className="mt-16">
          <Thinking label="Mapping where your skills could go" />
        </div>
      ) : null}

      {directions ? (
        <div className="mt-10 space-y-10">
          {DIRECTION_DISTANCES.map((distance) => {
            const group = directions.filter((d) => d.distance === distance);
            if (!group.length) return null;
            const style = DISTANCE_STYLE[distance];
            return (
              <section key={distance}>
                <div className="flex flex-wrap items-baseline gap-4">
                  <h2
                    className={`font-display inline-block rounded-sm border-2 border-ink px-3 py-1 text-[22px] uppercase ${style.head}`}
                  >
                    {DISTANCE_LABELS[distance]}
                  </h2>
                  <p className="text-[12px] text-muted">{style.blurb}</p>
                </div>
                <ul className="mt-5 grid gap-4 md:grid-cols-3">
                  {group.map((direction, i) => {
                    const on = picked.includes(direction.title);
                    return (
                      <li key={direction.title}>
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggle(direction.title)}
                          style={{ animationDelay: `${i * 70}ms` }}
                          className={`card-in h-full w-full rounded-sm border-2 border-ink p-5 text-left transition-transform hover:-translate-y-1 ${
                            on ? "bg-pink hard-shadow" : "bg-surface"
                          }`}
                        >
                          <span className="font-display block text-[26px] leading-[1] uppercase">
                            {direction.title}
                          </span>
                          <span className="mt-3 block text-[12px] leading-relaxed">
                            {direction.line}
                          </span>
                          <span className="mt-4 flex flex-wrap gap-1.5">
                            {direction.uses.map((use) => (
                              <span
                                key={use}
                                className="rounded-full border border-ink px-2 py-0.5 text-[10px] uppercase"
                              >
                                {use}
                              </span>
                            ))}
                          </span>
                          <span className="mt-4 block text-[11px] font-bold uppercase">
                            {on ? "✓ Intrigued" : "Tap if curious"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}

          <div className="flex flex-wrap items-center gap-6 border-t-2 border-ink pt-6">
            <button type="button" className={primaryButton} onClick={() => onDone(picked)}>
              {picked.length ? `Invent my role (${picked.length} picked)` : "Skip, surprise me"}
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

