"use client";

import type { Skill } from "@/lib/flow/types";

import { ErrorNote, primaryButton, quietLink, secondaryButton, Thinking } from "../ui";

interface SkillCardsProps {
  whereIComeFrom: string;
  skills: Skill[];
  index: number;
  confirmedCount: number;
  extraSkill: string;
  busy: boolean;
  error: string | null;
  onExtraSkill: (value: string) => void;
  onReact: (thatsMe: boolean) => void;
  onContinue: () => void;
  onRetry: () => void;
}

export function SkillCards({
  whereIComeFrom,
  skills,
  index,
  confirmedCount,
  extraSkill,
  busy,
  error,
  onExtraSkill,
  onReact,
  onContinue,
  onRetry,
}: SkillCardsProps) {
  const card = skills[index];
  const atEnd = skills.length > 0 && index >= skills.length;

  return (
    <main className="mx-auto w-full max-w-[680px] px-6 py-12 sm:py-16">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-dashed border-line pb-5">
        {skills.length > 0 ? (
          <p className="label" aria-live="polite">
            {atEnd ? `${confirmedCount} of ${skills.length} are you` : `Card ${index + 1} of ${skills.length}`}
          </p>
        ) : null}
      </header>

      <h1 className="display mt-10 text-[40px] sm:text-[52px]">Here is what I see</h1>

      {busy && skills.length === 0 ? (
        <div className="mt-6">
          <Thinking label="Reading your profile" />
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 space-y-4">
          <ErrorNote message={error} />
          <button type="button" onClick={onRetry} className={quietLink}>
            Try again
          </button>
        </div>
      ) : null}

      {whereIComeFrom ? (
        <p className="strap mt-5 max-w-[46ch] text-ink">{whereIComeFrom}</p>
      ) : null}

      {card ? (
        <div
          key={index}
          className={`paper-card mt-10 rounded-[4px] p-6 ${
            card.kind === "hidden" ? "card-yellow" : ""
          }`}
        >
          <p className="label text-ink">
            {card.kind === "hidden" ? "Hidden skill" : "From your profile"}
          </p>
          <h2 className="display mt-2 text-[32px] sm:text-[40px]">{card.name}</h2>
          <p className="mt-4 text-[14px] leading-[1.6] text-ink">{card.reasoning}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => onReact(true)} className={primaryButton}>
              That&apos;s me
            </button>
            <button type="button" onClick={() => onReact(false)} className={secondaryButton}>
              Not really
            </button>
          </div>
        </div>
      ) : null}

      {atEnd ? (
        <div className="mt-10">
          <label htmlFor="missed" className="label block">
            Anything I missed?
          </label>
          <input
            id="missed"
            name="missed"
            type="text"
            value={extraSkill}
            onChange={(event) => onExtraSkill(event.target.value)}
            placeholder="Optional, one line"
            className="paper-card mt-3 w-full rounded-[4px] p-4 text-[14px] text-ink placeholder:text-muted"
          />
          <div className="mt-8">
            <button type="button" onClick={onContinue} className={primaryButton}>
              Next
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
