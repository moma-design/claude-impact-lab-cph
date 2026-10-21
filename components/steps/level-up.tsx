"use client";

import { useState } from "react";

import { APP_NAME } from "@/lib/app-config";
import type { LevelUp, LevelUpStory } from "@/lib/flow/types";

import { ErrorNote, Eyebrow, primaryButton, quietLink, secondaryButton, Thinking } from "../ui";

interface LevelUpScreenProps {
  levelUp: LevelUp | null;
  searching: boolean;
  searchNote: string;
  error: string | null;
  onCollect: (cardName: string) => void;
  onBack: () => void;
}

/**
 * Nothing from YouTube or Vimeo loads until the person taps Play: the iframe
 * is only created on that tap, and the embed host is the no-cookie one.
 */
function Story({ story }: { story: LevelUpStory }) {
  const [playing, setPlaying] = useState(false);

  return (
    <li className="rounded-xl border border-line bg-surface p-6">
      <p className="text-[13px] font-medium text-accent">
        {story.kind === "video"
          ? "Video"
          : story.kind === "community"
            ? "Community"
            : "Story"}
      </p>
      <h3 className="mt-2 text-[19px] leading-snug font-semibold text-ink">{story.title}</h3>

      {story.embed_url ? (
        playing ? (
          <div className="mt-4">
            <iframe
              src={`${story.embed_url}?autoplay=1`}
              title={story.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full rounded-lg border border-line"
            />
          </div>
        ) : (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className={primaryButton}
            >
              Play
            </button>
          </div>
        )
      ) : null}

      <p className="mt-4 text-[15px] leading-relaxed text-ink">
        <span className="font-medium">Why watch this. </span>
        {story.why_watch}
      </p>

      <p className="mt-3 text-[14px]">
        <a
          href={story.source_url}
          target="_blank"
          rel="noreferrer"
          className="text-accent underline underline-offset-4 hover:text-ink"
        >
          Open the original
        </a>
      </p>
    </li>
  );
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
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-5">
        <Eyebrow>{APP_NAME}</Eyebrow>
        {levelUp ? (
          <p className="text-[13px] text-muted" aria-live="polite">
            You hold {held.length} of {levelUp.cards.length} cards for {levelUp.roleTitle}
          </p>
        ) : null}
      </header>

      <h1 className="mt-10 text-[30px] leading-tight font-semibold text-ink">Level up</h1>

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
          <p className="mt-4 max-w-[68ch] text-[17px] leading-relaxed text-muted">
            {levelUp.opportunityTitle}
          </p>

          {levelUp.savedExample ? (
            <p className="mt-4 max-w-[62ch] text-[13px] font-medium text-accent">
              Saved example. A real result kept from an earlier run, shown because the live
              search did not return.
            </p>
          ) : null}

          <section className="mt-12">
            <h2 className="text-[24px] font-semibold text-ink">Cards you already hold</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {held.map((card) => (
                <li key={card.name} className="rounded-xl bg-accent-soft p-6">
                  <p className="text-[13px] font-medium text-accent">Collected</p>
                  <h3 className="mt-2 text-[17px] font-semibold text-ink">{card.name}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">
                    {card.how_to_earn}
                  </p>
                </li>
              ))}
              {held.length === 0 ? (
                <li className="text-[15px] leading-relaxed text-muted">
                  None of your confirmed skills map straight onto this one yet.
                </li>
              ) : null}
            </ul>
          </section>

          <section className="mt-16">
            <h2 className="text-[24px] font-semibold text-ink">Cards still to collect</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {toCollect.map((card) => {
                const collecting = levelUp.collecting.includes(card.name);
                return (
                  <li key={card.name} className="rounded-xl border border-line bg-surface p-6">
                    <p className="text-[13px] font-medium text-muted">To collect</p>
                    <h3 className="mt-2 text-[17px] font-semibold text-ink">{card.name}</h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted">
                      {card.how_to_earn}
                    </p>
                    {card.resource_url ? (
                      <p className="mt-3 text-[14px]">
                        <a
                          href={card.resource_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent underline underline-offset-4 hover:text-ink"
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

          <section className="mt-16 border-t border-line pt-10">
            <h2 className="text-[24px] font-semibold text-ink">
              Meet professionals in this role
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {levelUp.stories.map((story) => (
                <Story key={story.source_url} story={story} />
              ))}
              {levelUp.stories.length === 0 ? (
                <li className="text-[15px] leading-relaxed text-muted">
                  Nothing published turned up this time. Try again later.
                </li>
              ) : null}
            </ul>
          </section>

          <footer className="mt-16 border-t border-line pt-8">
            <button type="button" onClick={onBack} className={primaryButton}>
              Back to my flow
            </button>
          </footer>
        </>
      ) : null}
    </main>
  );
}
