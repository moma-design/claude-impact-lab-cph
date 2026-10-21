"use client";

import { useState } from "react";

import type { LevelUpStory } from "@/lib/flow/types";
import { playerUrl } from "@/lib/flow/video";

import { primaryButton } from "../ui";

const KIND_LABELS: Record<LevelUpStory["kind"], string> = {
  video: "Video",
  article: "Story",
  community: "Community",
};

/**
 * One published story about someone doing the role. Nothing from YouTube or
 * Vimeo loads until the person taps Play: the iframe is only created then, and
 * the host is the no-cookie one.
 */
export function Story({ story }: { story: LevelUpStory }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div>
      <p className="text-[13px] font-medium text-accent">{KIND_LABELS[story.kind]}</p>
      <h3 className="mt-2 text-[19px] leading-snug font-semibold text-ink">{story.title}</h3>

      {story.embed_url ? (
        playing ? (
          <div className="mt-4">
            <iframe
              src={playerUrl(story.embed_url, story.source_url)}
              title={story.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full rounded-lg border border-line"
            />
          </div>
        ) : (
          <div className="mt-4">
            <button type="button" onClick={() => setPlaying(true)} className={primaryButton}>
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
    </div>
  );
}
