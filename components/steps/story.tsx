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
      <p className="label text-ink">{KIND_LABELS[story.kind]}</p>
      <h3 className="display mt-2 text-[22px] sm:text-[26px]">{story.title}</h3>

      {story.embed_url ? (
        playing ? (
          <div className="mt-4">
            <iframe
              src={playerUrl(story.embed_url, story.source_url)}
              title={story.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full rounded-[4px] border border-ink/20"
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

      <p className="mt-4 text-[14px] leading-[1.6] text-ink">
        <span className="label inline-block">Why watch this.</span>{" "}
        {story.why_watch}
      </p>

      <p className="mt-3 text-[14px]">
        <a
          href={story.source_url}
          target="_blank"
          rel="noreferrer"
          className="font-bold tracking-[0.08em] text-ink uppercase underline underline-offset-4"
        >
          Open the original
        </a>
      </p>
    </div>
  );
}

/** The compact form used on the opportunity card: a title line and Play. */
export function VideoTile({ story }: { story: LevelUpStory }) {
  const [playing, setPlaying] = useState(false);

  if (playing && story.embed_url) {
    return (
      <iframe
        src={playerUrl(story.embed_url, story.source_url)}
        title={story.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full rounded-[4px] border border-ink/20"
      />
    );
  }

  return (
    <div className="flex items-center gap-3">
      {story.embed_url ? (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="shrink-0 rounded-[3px] bg-ink px-4 py-2 text-[12px] font-bold tracking-[0.12em] text-canvas uppercase"
        >
          Play
        </button>
      ) : null}
      <p className="line-clamp-1 text-[14px] text-ink">{story.title}</p>
    </div>
  );
}
