"use client";

import { APP_NAME } from "@/lib/app-config";
import { OPPORTUNITY_TYPE_LABELS, type Opportunity } from "@/lib/flow/types";

import { ErrorNote, Eyebrow, primaryButton, quietLink, secondaryButton, Thinking } from "../ui";

interface OpportunitiesProps {
  opportunities: Opportunity[];
  index: number;
  interestedCount: number;
  searching: boolean;
  searchNote: string;
  savedExample: boolean;
  error: string | null;
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
  onReact,
  onSurprise,
  onFinish,
}: OpportunitiesProps) {
  const card = opportunities[index];
  const deckDone = !searching && opportunities.length > 0 && index >= opportunities.length;

  return (
    <main className="mx-auto w-full max-w-[680px] px-6 py-12 sm:py-16">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-5">
        <Eyebrow>{APP_NAME}</Eyebrow>
        {opportunities.length > 0 ? (
          <p className="text-[13px] text-muted" aria-live="polite">
            {deckDone
              ? `${interestedCount} marked interesting`
              : `Card ${index + 1} of ${opportunities.length}`}
          </p>
        ) : null}
      </header>

      <h1 className="mt-10 text-[30px] leading-tight font-semibold text-ink">
        Opportunities I found for you
      </h1>

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
        <article className="mt-10 rounded-xl border border-line bg-surface p-6">
          <p className="text-[13px] font-medium text-accent">
            {OPPORTUNITY_TYPE_LABELS[card.type]}
          </p>
          <h2 className="mt-3 text-[24px] leading-snug font-semibold text-ink">
            {card.title}
          </h2>

          <p className="mt-5 text-[17px] leading-relaxed text-ink">
            <span className="font-medium">Why you. </span>
            {card.why_you}
          </p>

          <div className="mt-5 border-t border-line pt-4">
            <p className="text-[13px] font-medium text-ink">One skill to add</p>
            <p className="mt-2 text-[16px] leading-relaxed text-muted">
              {card.skill_to_add}
            </p>
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
          <p className="text-[17px] leading-relaxed text-muted">
            That is everything I found. You can look further afield, or go to your flow.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={onFinish} className={primaryButton}>
              Go to my flow
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
