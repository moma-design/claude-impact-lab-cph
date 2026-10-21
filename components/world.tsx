"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { RING_NAMES, type WorldItem } from "@/lib/flow/world";

import { LevelNav } from "./ui";

/**
 * Martin's depth stage, rendered from real data. One component serves two
 * jobs: a quiet backdrop behind each step, and the full results page the
 * person scrolls through. Values come from his gh-pages mockup (61ad038).
 */

const GAP = 1500;
/** Cards a ring can hold without crowding at 1280 and above. */
const PER_RING = 8;
const RIPPLES = 6;

const TONE_CLASS: Record<WorldItem["tone"], string> = {
  paper: "paper-card",
  pink: "paper-card card-pink",
  yellow: "paper-card card-yellow",
  ink: "paper-card card-ink",
  reach: "paper-card card-reach",
  signal: "paper-card card-signal",
};

function usePrefersReducedMotion(): boolean {
  const query = "(prefers-reduced-motion: reduce)";
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export interface WorldProps {
  items: WorldItem[];
  /** "backdrop" sits behind a step, "full" is the results page. */
  mode: "backdrop" | "full";
  /** Which ring the backdrop should look at. */
  focusRing?: number;
  /** How far the dream job at the centre has been configured, 0 to 1. */
  warmth?: number;
  onOpen?: (item: WorldItem) => void;
  /** Rendered when the camera reaches the centre. */
  centre?: React.ReactNode;
  centreLabel?: string;
}

export function World({
  items,
  mode,
  focusRing = 0,
  warmth = 0,
  onOpen,
  centre,
  centreLabel = "Your dream job",
}: WorldProps) {
  const reduced = usePrefersReducedMotion();
  const worldRef = useRef<HTMLDivElement>(null);
  const [activeLevel, setActiveLevel] = useState(focusRing);
  const [atCentre, setAtCentre] = useState(false);
  const targetRef = useRef(focusRing * GAP);

  const levels = useMemo(
    () => (centre ? [...RING_NAMES, centreLabel] : [...RING_NAMES]),
    [centre, centreLabel],
  );
  const maxTarget = centre ? GAP * 3 + 400 : GAP * 2 + 400;

  // Lay the items out around their ring, with a gap at the top for the label.
  // A ring shows at most PER_RING cards; the rest sit behind one "+N more"
  // card that opens the glass panel, so nothing overlaps and every title reads.
  const placed = useMemo(() => {
    const perRing = new Map<number, WorldItem[]>();
    for (const item of items) {
      const list = perRing.get(item.ring) ?? [];
      list.push(item);
      perRing.set(item.ring, list);
    }

    const shown: WorldItem[] = [];
    for (const [ring, list] of perRing) {
      if (list.length <= PER_RING) {
        shown.push(...list);
        continue;
      }
      const overflow = list.slice(PER_RING - 1);
      shown.push(...list.slice(0, PER_RING - 1), {
        id: `more:${ring}`,
        ring,
        tone: "paper",
        kind: "Also here",
        title: `+${overflow.length} more`,
        body: overflow.map((item) => `${item.kind}: ${item.title}`).join(" · "),
      });
    }

    return shown.map((item) => {
      const siblings = shown.filter((other) => other.ring === item.ring);
      const index = siblings.indexOf(item);
      const count = siblings.length;
      return {
        item,
        angle: -Math.PI / 2 + ((index + 1) / (count + 1)) * Math.PI * 2,
        // A stable wobble per card, kept tight so cards stay on their ring.
        jitter: 0.97 + ((index * 37) % 8) / 100,
        depth: (((index * 53) % 100) / 100 - 0.5) * 120,
      };
    });
  }, [items]);

  useEffect(() => {
    targetRef.current = focusRing * GAP;
  }, [focusRing]);

  useEffect(() => {
    if (reduced || mode === "backdrop") return;
    const onWheel = (event: WheelEvent) => {
      targetRef.current = Math.max(
        0,
        Math.min(maxTarget, targetRef.current + event.deltaY * 1.4),
      );
    };
    let touchY: number | null = null;
    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0].clientY;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (touchY === null) return;
      targetRef.current = Math.max(
        0,
        Math.min(maxTarget, targetRef.current + (touchY - event.touches[0].clientY) * 3),
      );
      touchY = event.touches[0].clientY;
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        targetRef.current = Math.min(maxTarget, targetRef.current + 400);
      }
      if (event.key === "ArrowUp" || event.key === "PageUp") {
        targetRef.current = Math.max(0, targetRef.current - 400);
      }
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [maxTarget, mode, reduced]);

  // The animation loop: his easing, his fades, his ripples.
  useEffect(() => {
    if (reduced) return;
    const root = worldRef.current;
    if (!root) return;

    let frame = 0;
    let cam = targetRef.current;

    const clamp = (value: number) => Math.max(0, Math.min(1, value));

    const run = (time: number) => {
      const radius = Math.min(window.innerWidth, window.innerHeight) * 0.42;
      const sway = Math.sin(time / 4000);
      cam += (targetRef.current - cam) * 0.08;

      for (const node of Array.from(root.querySelectorAll<HTMLElement>("[data-z]"))) {
        const z = Number(node.dataset.z);
        const fixed = node.dataset.fixed === "true";
        const d = z + cam - 250;
        let opacity: number;
        let scale = 1;

        if (fixed) {
          opacity = node.dataset.sun
            ? 1
            : clamp((d + 3200) / 1500) * clamp((700 - d) / 300);
        } else {
          opacity = clamp((d + 2600) / 900) * clamp((650 - d) / 350);
          scale = 0.6 + 0.4 * clamp((d + 1800) / 900);
        }

        const angle = node.dataset.angle ? Number(node.dataset.angle) : null;
        const jitter = Number(node.dataset.jitter ?? 1);
        let x = 0;
        let y = 0;
        if (angle !== null) {
          x = Math.cos(angle) * radius * jitter * 1.05;
          y = Math.sin(angle) * radius * jitter;
        } else if (node.dataset.labelRing) {
          y = -radius;
        }

        const drift = fixed ? 0 : sway * 8;
        const centreShift = node.dataset.centred === "true" ? " translate(-50%,-50%)" : "";
        node.style.transform = `translate3d(${x + drift}px, ${y}px, ${d}px) scale(${scale})${centreShift}`;
        node.style.opacity = String(opacity);
        node.style.pointerEvents = opacity > 0.4 ? "auto" : "none";
      }

      // The ring circles and the ripples spreading out from the centre.
      for (const svg of Array.from(root.querySelectorAll<SVGSVGElement>("[data-ring]"))) {
        const ringIndex = Number(svg.dataset.ring);
        const span = radius * 1.2;
        svg.setAttribute("width", String(span * 2));
        svg.setAttribute("height", String(span * 2));
        svg.setAttribute("viewBox", `${-span} ${-span} ${span * 2} ${span * 2}`);
        svg.style.margin = `${-span}px 0 0 ${-span}px`;
        svg.querySelector(".main")?.setAttribute("r", String(radius));
        svg.querySelectorAll<SVGCircleElement>(".ripple").forEach((circle, k) => {
          const p = ((time * 0.00007 + k / RIPPLES + ringIndex * 0.13) % 1 + 1) % 1;
          circle.setAttribute("r", String(p * radius * 1.18));
          circle.style.opacity = String(Math.sin(p * Math.PI) * 0.55);
        });
      }

      if (mode === "full") {
        const level = Math.min(levels.length - 1, Math.floor((cam + GAP / 2) / GAP));
        setActiveLevel(level);
        setAtCentre(cam > GAP * 2 + 250);
      }

      frame = requestAnimationFrame(run);
    };

    frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }, [levels.length, mode, reduced]);

  /* The flat fallback: no flying, no zooming, everything simply present. */
  if (reduced) {
    return (
      <div className={mode === "backdrop" ? "hidden" : "mx-auto w-full max-w-[960px] px-6"}>
        {mode === "full"
          ? RING_NAMES.map((name, ring) => (
              <section key={name} className="mt-12">
                <h2 className="ring-label inline-block">{name}</h2>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {items
                    .filter((item) => item.ring === ring)
                    .map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => onOpen?.(item)}
                          className={`${TONE_CLASS[item.tone]} w-full rounded-[4px] p-4 text-left`}
                        >
                          <span className="label block">{item.kind}</span>
                          <span className="display mt-1 line-clamp-2 block text-[22px]">
                            {item.title}
                          </span>
                          <span className="mt-2 line-clamp-2 block text-[14px] leading-[1.5]">
                            {item.body}
                          </span>
                        </button>
                      </li>
                    ))}
                </ul>
              </section>
            ))
          : null}
        {mode === "full" && centre ? <div className="mt-16">{centre}</div> : null}
      </div>
    );
  }

  const sunScale = 0.5 + 0.5 * Math.min(1, warmth);

  return (
    <>
      <div
        className={`stage ${mode === "backdrop" ? "pointer-events-none -z-10 opacity-60" : "z-0"}`}
        aria-hidden={mode === "backdrop"}
      >
        <div ref={worldRef} className="world">
          {/* The sun waits at the far end: the dream job at the centre. */}
          <div
            className="obj blob"
            data-z={-GAP * 3 - 600}
            data-fixed="true"
            data-sun="true"
            style={{
              width: 900,
              height: 900,
              margin: "-450px 0 0 -450px",
              transform: `scale(${sunScale})`,
            }}
          />

          {RING_NAMES.map((name, ring) => (
            <svg
              key={name}
              className="obj depth-ring"
              data-ring={ring}
              data-z={-ring * GAP}
              data-fixed="true"
              aria-hidden="true"
            >
              <circle className="main" cx={0} cy={0} />
              {Array.from({ length: RIPPLES }, (_, k) => (
                <circle key={k} className="ripple" cx={0} cy={0} />
              ))}
            </svg>
          ))}

          {RING_NAMES.map((name, ring) => (
            <div
              key={`label-${name}`}
              className="obj ring-label"
              data-z={-ring * GAP}
              data-label-ring={ring}
              data-centred="true"
            >
              {name}
            </div>
          ))}

          {placed.map(({ item, angle, jitter, depth }) => (
            <button
              key={item.id}
              type="button"
              className={`obj ${TONE_CLASS[item.tone]} paper-card-lift w-[190px] rounded-[4px] p-[13px] text-left`}
              data-z={-item.ring * GAP + depth}
              data-angle={angle}
              data-jitter={jitter}
              data-centred="true"
              onFocus={() => {
                targetRef.current = item.ring * GAP;
              }}
              onClick={() => onOpen?.(item)}
            >
              <span className="label block text-[12px]">{item.kind}</span>
              {/* Two lines each, so no card grows tall enough to hit its
                  neighbour. The full text is in the glass panel. */}
              <span className="display mt-1 line-clamp-2 block text-[20px] leading-[1.02]">
                {item.title}
              </span>
              <span className="mt-1.5 line-clamp-2 block text-[14px] leading-[1.35]">
                {item.body}
              </span>
            </button>
          ))}
        </div>
      </div>

      {mode === "full" ? (
        <>
          <LevelNav
            levels={levels}
            active={activeLevel}
            onSelect={(index) => {
              targetRef.current = index * GAP;
            }}
          />
          <p
            className="fixed bottom-6 left-1/2 z-10 -translate-x-1/2 text-[12px] tracking-[0.14em] text-muted uppercase"
            style={{ opacity: activeLevel > 0 ? 0 : 1, transition: "opacity .4s" }}
          >
            Scroll to go deeper
          </p>
          {centre && atCentre ? (
            <div className="fixed inset-0 z-20 flex items-center justify-center p-6">
              {centre}
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}
