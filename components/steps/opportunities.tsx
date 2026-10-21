"use client";

import { useEffect } from "react";

import {
  OPPORTUNITY_TYPE_LABELS,
  SKILL_BADGE_LABELS,
  type LevelUpStory,
  type Opportunity,
} from "@/lib/flow/types";

import { Story } from "./story";
import { ErrorNote, primaryButton, quietLink, secondaryButton, Thinking } from "../ui";

interface OpportunitiesProps {
  opportunities: Opportunity[];
  index: number;
  interestedCount: number;
  searching: boolean;
  searchNote: string;
  savedExample: boolean;
  error: string | null;
  /** Cached per role title. undefined means not fetched yet, null means none. */
  roleStories: Record<string, LevelUpStory | null>;
  onLoadRoleStory: (roleTitle: string) => void;
  onReact: (reaction: "interested" | "not-for-me") => void;
  onSurprise: () => void;
  onFinish: () => void;
}

export function Opportunities({
  opportunities,
  index,
  interestedCount,
  searching,
  searchNote,
  savedExample,
  error,
  roleStories,
  onLoadRoleStory,
  onReact,
  onSurprise,
  onFinish,
}: OpportunitiesProps) {
  const card = opportunities[index];
  const cardTitle = card?.title;

  // The story is fetched when the card is shown, not up front, so the deck
  // stays fast. The hook caches it per role for the session.
  useEffect(() => {
    if (cardTitle) onLoadRoleStory(cardTitle);
  }, [cardTitle, onLoadRoleStory]);

  const story = cardTitle ? roleStories[cardTitle] : undefined;
  const deckDone = !searching && opportunities.length > 0 && index >= opportunities.length;

  return (
    <main className="mx-auto w-full max-w-[680px] px-6 py-12 sm:py-16">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-dashed border-line pb-5">
        {opportunities.length > 0 ? (
          <p className="label" aria-live="polite">
            {deckDone
              ? `${interestedCount} marked interesting`
              : `Card ${index + 1} of ${opportunities.length}`}
          </p>
        ) : null}
      </header>

      <h1 className="display mt-10 text-[40px] sm:text-[52px]">Opportunities I found for you</h1>

      {savedExample ? (
        <p className="mt-4 max-w-[62ch] text-[13px] font-medium text-accent">
          Saved example. A real result kept from an earlier run, shown because the live
          search did not return.
        </p>
      ) : null}

      {searching ? (
        <div className="mt-6" aria-live="polite">
          <Thinking label={searchNote} />
        </div>
      ) : null}

      {error && opportunities.length === 0 ? (
        <div className="mt-6">
          <ErrorNote message={error} />
        </div>
      ) : null}

      {card ? (
        <article className="paper-card paper-card-lift mt-10 rounded-[4px] p-6">
          <p className="label text-ink">{OPPORTUNITY_TYPE_LABELS[card.type]}</p>
          <h2 className="display mt-2 text-[30px] sm:text-[38px]">{card.title}</h2>

          {(card.skills ?? []).length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-2">
              {(card.skills ?? []).map((skill) => (
                <li
                  key={skill.name}
                  className={`rounded-[3px] px-4 py-2 text-[14px] text-ink ${
                    skill.status === "held"
                      ? "paper-card"
                      : skill.status === "hidden"
                        ? "paper-card card-yellow"
                        : "card-outline"
                  }`}
                  data-status={skill.status}
                >
                  {skill.name}{" "}
                  <span className="label inline-block">{SKILL_BADGE_LABELS[skill.status]}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <p className="mt-5 text-[14px] leading-[1.6] text-ink">
            <span className="label inline-block">Why you.</span>{" "}
            {card.why_you}
          </p>

          <div className="mt-5 border-t border-dashed border-line pt-4">
            <p className="label text-ink">One skill to add</p>
            <p className="mt-2 text-[14px] leading-[1.6] text-ink">{card.skill_to_add}</p>
            {card.learning_resource_url ? (
              <p className="mt-2 text-[14px]">
                <a
                  href={card.learning_resource_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline underline-offset-4 hover:text-ink"
                >
                  {card.learning_resource_title}
                </a>
              </p>
            ) : null}
          </div>

          {card.source_url ? (
            <p className="mt-5 text-[14px]">
              <a
                href={card.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-accent underline underline-offset-4 hover:text-ink"
              >
                {card.source_title}
              </a>
            </p>
          ) : (
            <p className="mt-5 text-[14px] leading-[1.6] text-muted">
              No source link for this one, so treat it as a direction rather than a listing.
            </p>
          )}

          <div className="mt-5 border-t border-dashed border-line pt-4">
            <p className="label text-ink">Meet professionals in this role</p>
            {story === undefined ? (
              <div className="mt-3">
                <Thinking label="Looking for someone who does this" />
              </div>
            ) : story === null ? (
              <p className="mt-2 text-[14px] leading-[1.6] text-muted">
                Nothing published turned up for this one.
              </p>
            ) : (
              <div className="mt-3">
                <Story story={story} />
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onReact("interested")}
              className={primaryButton}
            >
              Interested
            </button>
            <button
              type="button"
              onClick={() => onReact("not-for-me")}
              className={secondaryButton}
            >
              Not for me
            </button>
            <button
              type="button"
              onClick={onSurprise}
              className={quietLink}
              disabled={searching}
            >
              Surprise me
            </button>
          </div>
        </article>
      ) : null}

      {deckDone ? (
        <div className="mt-10 space-y-6">
          <p className="strap max-w-[42ch] text-ink">
            That is everything I found. Look further afield, or see your dream job.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={onFinish} className={primaryButton}>
              See my dream job
            </button>
            <button
              type="button"
              onClick={onSurprise}
              className={secondaryButton}
              disabled={searching}
            >
              Surprise me
            </button>
          </div>
          {error ? <ErrorNote message={error} /> : null}
        </div>
      ) : null}
    </main>
  );
}
