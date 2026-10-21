"use client";

import type { LevelUp } from "@/lib/flow/types";

import { Story } from "./story";

import { ErrorNote, primaryButton, quietLink, secondaryButton, Thinking } from "../ui";

interface LevelUpScreenProps {
  levelUp: LevelUp | null;
  searching: boolean;
  searchNote: string;
  error: string | null;
  onCollect: (cardName: string) => void;
  onBack: () => void;
}

export function LevelUpScreen({
  levelUp,
  searching,
  searchNote,
  error,
  onCollect,
  onBack,
}: LevelUpScreenProps) {
  const held = levelUp?.cards.filter((card) => card.held) ?? [];
  const toCollect = levelUp?.cards.filter((card) => !card.held) ?? [];

  return (
    <main className="mx-auto w-full max-w-[960px] px-6 py-12 sm:py-16">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-dashed border-line pb-5">
        {levelUp ? (
          <p className="label" aria-live="polite">
            You hold {held.length} of {levelUp.cards.length} cards for {levelUp.roleTitle}
          </p>
        ) : null}
      </header>

      <h1 className="display mt-10 text-[40px] sm:text-[52px]">Level up</h1>

      {searching ? (
        <div className="mt-6" aria-live="polite">
          <Thinking label={searchNote} />
        </div>
      ) : null}

      {error && !levelUp ? (
        <div className="mt-6 space-y-4">
          <ErrorNote message={error} />
          <button type="button" onClick={onBack} className={quietLink}>
            Back to my flow
          </button>
        </div>
      ) : null}

      {levelUp ? (
        <>
          <p className="strap mt-5 max-w-[42ch] text-ink">{levelUp.opportunityTitle}</p>

          {levelUp.savedExample ? (
            <p className="label mt-4 max-w-[62ch] text-ink">
              Saved example. A real result kept from an earlier run, shown because the live
              search did not return.
            </p>
          ) : null}

          <section className="mt-12">
            <h2 className="display text-[28px] sm:text-[34px]">Cards you already hold</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {held.map((card) => (
                <li key={card.name} className="paper-card rounded-[4px] p-6">
                  <p className="label text-ink">Collected</p>
                  <h3 className="display mt-2 text-[22px]">{card.name}</h3>
                  <p className="mt-3 text-[14px] leading-[1.6] text-ink">{card.how_to_earn}</p>
                </li>
              ))}
              {held.length === 0 ? (
                <li className="text-[14px] leading-[1.6] text-muted">
                  None of your confirmed skills map straight onto this one yet.
                </li>
              ) : null}
            </ul>
          </section>

          <section className="mt-16">
            <h2 className="display text-[28px] sm:text-[34px]">Cards still to collect</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {toCollect.map((card) => {
                const collecting = levelUp.collecting.includes(card.name);
                return (
                  <li key={card.name} className="card-outline rounded-[4px] p-6">
                    <p className="label">To collect</p>
                    <h3 className="display mt-2 text-[22px]">{card.name}</h3>
                    <p className="mt-3 text-[14px] leading-[1.6] text-ink">{card.how_to_earn}</p>
                    {card.resource_url ? (
                      <p className="mt-3 text-[14px]">
                        <a
                          href={card.resource_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold tracking-[0.08em] text-ink uppercase underline underline-offset-4"
                        >
                          {card.resource_title}
                        </a>
                      </p>
                    ) : null}
                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={() => onCollect(card.name)}
                        className={collecting ? secondaryButton : primaryButton}
                      >
                        {collecting ? "In your plan" : "I'll collect this"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="mt-16 border-t border-dashed border-line pt-10">
            <h2 className="display text-[28px] sm:text-[34px]">Meet professionals in this role</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {levelUp.stories.map((story) => (
                <li
                  key={story.source_url}
                  className="paper-card rounded-[4px] p-6"
                >
                  <Story story={story} />
                </li>
              ))}
              {levelUp.stories.length === 0 ? (
                <li className="text-[14px] leading-[1.6] text-muted">
                  Nothing published turned up this time. Try again later.
                </li>
              ) : null}
            </ul>
          </section>

          <footer className="mt-16 border-t border-dashed border-line pt-8">
            <button type="button" onClick={onBack} className={primaryButton}>
              Back to my flow
            </button>
          </footer>
        </>
      ) : null}
    </main>
  );
}
