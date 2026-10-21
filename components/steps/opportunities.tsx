"use client";

import { useEffect, useState } from "react";

import {
  OPPORTUNITY_TYPE_LABELS,
  SKILL_BADGE_LABELS,
  type LevelUpStory,
  type Opportunity,
} from "@/lib/flow/types";

import { DetailPanel, type PanelContent } from "../detail-panel";
import { ErrorNote, primaryButton, quietLink, secondaryButton, Thinking } from "../ui";
import { VideoTile } from "./story";

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

const BADGE_TONE: Record<string, string> = {
  held: "paper-card",
  hidden: "paper-card card-yellow",
  "to collect": "card-outline",
};

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
  const [panel, setPanel] = useState<PanelContent | null>(null);
  const card = opportunities[index];
  const cardTitle = card?.title;

  // The story is fetched when the card is shown, not up front, so the deck
  // stays fast. The hook caches it per role for the session.
  useEffect(() => {
    if (cardTitle) onLoadRoleStory(cardTitle);
  }, [cardTitle, onLoadRoleStory]);

  const story = cardTitle ? roleStories[cardTitle] : undefined;
  const deckDone = !searching && opportunities.length > 0 && index >= opportunities.length;

  /** Everything that does not belong on the card. */
  function openDetails() {
    if (!card) return;
    const links: { label: string; href: string }[] = [];
    if (card.learning_resource_url) {
      links.push({ label: card.learning_resource_title, href: card.learning_resource_url });
    }
    if (card.source_url) links.push({ label: card.source_title, href: card.source_url });
    if (story?.source_url) links.push({ label: "Open the video", href: story.source_url });

    setPanel({
      kind: OPPORTUNITY_TYPE_LABELS[card.type],
      title: card.title,
      paragraphs: [
        card.why_you_long || card.why_you,
        `One skill to add: ${card.skill_to_add}.`,
        story?.why_watch ?? "",
        card.source_url ? "" : "No source link came back for this one, so treat it as a direction rather than a listing.",
      ],
      links,
    });
  }

  return (
    <main className="mx-auto w-full max-w-[680px] px-6 py-10">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-dashed border-line pb-4">
        {opportunities.length > 0 ? (
          <p className="label" aria-live="polite">
            {deckDone
              ? `${interestedCount} marked interesting`
              : `Card ${index + 1} of ${opportunities.length}`}
          </p>
        ) : (
          <p className="label">Searching</p>
        )}
        {savedExample ? <p className="label">Saved example</p> : null}
      </header>

      <h1 className="display mt-6 text-[34px] sm:text-[42px]">
        Opportunities I found for you
      </h1>

      {searching ? (
        <div className="mt-5" aria-live="polite">
          <Thinking label={searchNote} />
        </div>
      ) : null}

      {error && opportunities.length === 0 ? (
        <div className="mt-5">
          <ErrorNote message={error} />
        </div>
      ) : null}

      {card ? (
        <article className="paper-card mt-6 rounded-[4px] p-6">
          <p className="label text-ink">{OPPORTUNITY_TYPE_LABELS[card.type]}</p>

          <h2 className="display mt-1 line-clamp-2 text-[28px] leading-[1.02] sm:text-[34px]">
            {card.title}
          </h2>

          {(card.skills ?? []).length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {(card.skills ?? []).map((skill) => (
                <li
                  key={skill.name}
                  data-status={skill.status}
                  className={`rounded-[3px] px-3 py-1.5 text-[13px] text-ink ${BADGE_TONE[skill.status]}`}
                >
                  {skill.name}{" "}
                  <span className="label inline-block text-[11px]">
                    {SKILL_BADGE_LABELS[skill.status]}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <p className="mt-4 text-[15px] leading-[1.5] text-ink">{card.why_you}</p>

          <div className="mt-4 border-t border-dashed border-line pt-4">
            {story === undefined ? (
              <Thinking label="Finding someone who does this" />
            ) : story === null ? (
              <p className="label">No story found for this role</p>
            ) : (
              <VideoTile story={story} />
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
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
            <button type="button" onClick={onSurprise} className={quietLink} disabled={searching}>
              Surprise me
            </button>
            <button type="button" onClick={openDetails} className={quietLink}>
              Details
            </button>
          </div>
        </article>
      ) : null}

      {deckDone ? (
        <div className="mt-8 space-y-5">
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

      <DetailPanel item={panel} onClose={() => setPanel(null)} />
    </main>
  );
}
