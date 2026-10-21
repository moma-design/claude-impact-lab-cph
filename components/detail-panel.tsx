"use client";

import { useEffect, useRef } from "react";

import type { WorldItem } from "@/lib/flow/world";

/** His frosted detail panel, opened by clicking a card on a ring. */
export interface PanelContent {
  kind: string;
  title: string;
  paragraphs: string[];
  links?: { label: string; href: string }[];
}

export function toPanel(item: WorldItem): PanelContent {
  return { kind: item.kind, title: item.title, paragraphs: [item.body] };
}

export function DetailPanel({
  item,
  onClose,
}: {
  item: PanelContent | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!item) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="scrim fixed inset-0 z-[19] cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        className="detail-panel fixed top-1/2 left-1/2 z-20 w-[min(460px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-[10px] px-[30px] pt-[30px] pb-[26px]"
      >
        <div aria-hidden="true" className="detail-glow pointer-events-none absolute -inset-px rounded-[10px]" />
        <button
          ref={closeRef}
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 h-[30px] w-[30px] rounded-full border border-ink/25 bg-white/40 text-[16px] text-ink"
        >
          ×
        </button>
        <p className="label relative pr-10">{item.kind}</p>
        <h2 id="detail-title" className="display relative my-2.5 mb-3.5 text-[40px] leading-[0.98]">
          {item.title}
        </h2>
        {item.paragraphs.filter(Boolean).map((paragraph, index) => (
          <p key={index} className="relative mt-3 text-[14px] leading-[1.6] text-ink first:mt-0">
            {paragraph}
          </p>
        ))}
        {item.links?.length ? (
          <ul className="relative mt-5 space-y-2">
            {item.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] font-bold tracking-[0.08em] text-ink uppercase underline underline-offset-4"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  );
}
