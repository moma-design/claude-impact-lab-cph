"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { CareerMap } from "@/lib/career-map-schema";
import type { Future } from "@/lib/futures-schema";

import { primaryButton, secondaryButton } from "./ui";

/** Distance between levels along the z axis, in px. */
const GAP = 1500;

const LEVELS = [
  { name: "Already yours", blurb: "Jobs you could do now, from what you already have." },
  { name: "Within reach", blurb: "Jobs a bit of learning away, with a plan for each." },
  { name: "On the horizon", blurb: "Jobs that could exist in 5 to 10 years, from real research." },
  { name: "Your role", blurb: "The job only you could invent." },
] as const;

type Variant = "strength" | "quote" | "step" | "path" | "reach" | "signal" | "pending" | "sun";

interface Item {
  id: string;
  level: number;
  variant: Variant;
  kicker: string;
  title: string;
  short: string;
  body?: string[];
  list?: { label: string; items: string[] };
  list2?: { label: string; items: string[] };
  link?: { title: string; url: string };
  retry?: boolean;
}

interface Placed extends Item {
  x: number;
  y: number;
  z: number;
}

interface DepthResultsProps {
  map: CareerMap;
  flowMarkdown: string;
  onRestart: () => void;
}

const rnd = (seed: number) => {
  const v = Math.sin(seed * 12.9898) * 43758.5453;
  return v - Math.floor(v);
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const CARD_STYLE: Record<Variant, string> = {
  strength: "bg-surface",
  quote: "bg-pink",
  step: "bg-ink text-accent-soft",
  path: "bg-yellow",
  reach: "bg-surface border-l-4 !border-l-orange",
  signal: "bg-surface border-l-4 !border-l-ink",
  pending: "bg-surface animate-pulse",
  sun: "bg-yellow",
};

type FuturesState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; futures: Future[] };

export function DepthResults({ map, flowMarkdown, onRestart }: DepthResultsProps) {
  const [size, setSize] = useState({ w: 1200, h: 800 });
  const [selected, setSelected] = useState<Item | null>(null);
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const [futures, setFutures] = useState<FuturesState>({ status: "loading" });

  const world = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const cam = useRef(0);
  const target = useRef(0);
  const selectedRef = useRef<Item | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const loadFutures = useCallback(async () => {
    setFutures({ status: "loading" });
    try {
      const response = await fetch("/api/futures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flowMarkdown }),
      });
      const payload = (await response.json()) as { futures?: Future[]; error?: string };
      if (!response.ok || !payload.futures?.length) {
        setFutures({
          status: "error",
          message: payload.error ?? "The research did not come back this time.",
        });
        return;
      }
      setFutures({ status: "ready", futures: payload.futures });
    } catch {
      setFutures({ status: "error", message: "The research could not be reached." });
    }
  }, [flowMarkdown]);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    void loadFutures();
  }, [loadFutures]);

  const placed = useMemo<Placed[]>(() => {
    const items: Item[] = [];

    map.strengths.forEach((s, i) =>
      items.push({
        id: `strength-${i}`,
        level: 0,
        variant: "strength",
        kicker: "Strength",
        title: s.title,
        short: s.line,
        body: [s.line],
      }),
    );
    items.push({
      id: "quote",
      level: 0,
      variant: "quote",
      kicker: "In one line",
      title: "You, honestly",
      short: map.closing_line,
      body: [map.closing_line],
    });
    items.push({
      id: "step",
      level: 0,
      variant: "step",
      kicker: `This week · about ${map.step_this_week.minutes}`,
      title: "Your first step",
      short: map.step_this_week.action,
      body: [map.step_this_week.action, `Who to talk to: ${map.step_this_week.who_to_talk_to}`],
    });

    map.now_jobs.forEach((job, i) =>
      items.push({
        id: `now-${i}`,
        level: 0,
        variant: "path",
        kicker: "You could do this now",
        title: job.title,
        short: job.why_it_fits,
        body: [job.why_it_fits],
        list: { label: "Skills it uses", items: job.skills_used },
      }),
    );

    map.reach.forEach((job, i) => {
      items.push({
        id: `reach-${i}`,
        level: 1,
        variant: "reach",
        kicker: "A bit of learning away",
        title: job.title,
        short: job.why_it_fits,
        body: [job.why_it_fits],
        list: { label: "What to learn", items: job.gap },
      });
      items.push({
        id: `plan-${i}`,
        level: 1,
        variant: "step",
        kicker: `Plan · ${job.title}`,
        title: "How to get there",
        short: job.plan.map((step) => `${step.when}: ${step.what}`).join(" "),
        body: [],
        list: {
          label: "Your plan",
          items: job.plan.map((step) => `${step.when}: ${step.what}`),
        },
        list2: { label: "Search for", items: job.search_for },
      });
    });

    if (futures.status === "ready") {
      futures.futures.forEach((f, i) =>
        items.push({
          id: `future-${i}`,
          level: 2,
          variant: "signal",
          kicker: f.horizon,
          title: f.title,
          short: f.what_it_is,
          body: [f.what_it_is, `Why it could happen: ${f.trend}`, `Why you: ${f.why_you}`],
          link: { title: f.source_title, url: f.source_url },
        }),
      );
    } else if (futures.status === "error") {
      items.push({
        id: "future-error",
        level: 2,
        variant: "pending",
        kicker: "Research",
        title: "Did not land",
        short: futures.message,
        body: [futures.message],
        retry: true,
      });
    } else {
      for (let i = 0; i < 4; i += 1) {
        items.push({
          id: `future-pending-${i}`,
          level: 2,
          variant: "pending",
          kicker: "Researching",
          title: "Looking ahead",
          short: "Reading the research on where work is heading. Takes up to a minute.",
        });
      }
    }

    const rx = Math.min(size.w * 0.4, 620);
    const ry = Math.min(size.h * 0.34, 320);
    const out: Placed[] = [];
    for (const level of [0, 1, 2]) {
      const group = items.filter((item) => item.level === level);
      group.forEach((item, i) => {
        const seed = level * 31 + i * 17 + 3;
        const angle = (i / group.length) * Math.PI * 2 - Math.PI / 2 + Math.PI / group.length;
        const spread = 0.88 + rnd(seed) * 0.28;
        out.push({
          ...item,
          x: Math.cos(angle) * rx * spread,
          y: Math.sin(angle) * ry * spread,
          z: -level * GAP + (rnd(seed + 1) - 0.5) * 420,
        });
      });
    }
    out.push({
      id: "sun",
      level: 3,
      variant: "sun",
      kicker: "The role only you could have",
      title: map.invented_role.name,
      short: map.invented_role.pitch,
      body: [map.invented_role.pitch, `First move: ${map.invented_role.first_move}`],
      x: 0,
      y: 0,
      z: -3 * GAP,
    });
    return out;
  }, [map, futures, size]);

  // The camera loop: ease toward the target depth, then fade each card by distance.
  useEffect(() => {
    let raf = 0;
    let lastActive = 0;
    const tick = () => {
      cam.current += (target.current - cam.current) * 0.08;
      if (Math.abs(target.current - cam.current) < 0.2) cam.current = target.current;
      if (world.current) world.current.style.transform = `translateZ(${cam.current}px)`;

      const fading = world.current?.querySelectorAll<HTMLElement>("[data-z]") ?? [];
      for (const el of fading) {
        const d = Number(el.dataset.z) + cam.current;
        const o =
          el.dataset.sun === "1"
            ? smooth(-1700, -500, d)
            : smooth(-1500, -700, d) * (1 - smooth(150, 550, d));
        el.style.opacity = String(o);
        el.style.pointerEvents = o > 0.6 ? "auto" : "none";
        el.style.visibility = o < 0.01 ? "hidden" : "visible";
      }
      if (header.current) {
        header.current.style.opacity = String(Math.max(0, 1 - cam.current / 450));
      }
      const level = Math.min(3, Math.max(0, Math.round(cam.current / GAP)));
      if (level !== lastActive) {
        lastActive = level;
        setActive(level);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const max = 3 * GAP;
    const move = (delta: number) => {
      if (selectedRef.current) return;
      target.current = Math.min(max, Math.max(0, target.current + delta));
    };
    const onWheel = (event: WheelEvent) => move(event.deltaY * 1.4);
    let lastY: number | null = null;
    const onTouchStart = (event: TouchEvent) => {
      lastY = event.touches[0].clientY;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (lastY === null) return;
      const y = event.touches[0].clientY;
      move((lastY - y) * 3);
      lastY = y;
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      else if (["ArrowDown", "ArrowRight", " ", "PageDown"].includes(event.key)) {
        event.preventDefault();
        move(GAP / 3);
      } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        move(-GAP / 3);
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
  }, []);

  function download() {
    const blob = new Blob([flowMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "flow.md";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(flowMarkdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  const rx = Math.min(size.w * 0.4, 620);
  const ry = Math.min(size.h * 0.34, 320);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ perspective: "900px" }}>
      <div
        ref={world}
        className="absolute top-1/2 left-1/2 h-0 w-0"
        style={{ transformStyle: "preserve-3d" }}
      >
        {[0, 1, 2].map((level) => (
          <div
            key={`ring-${level}`}
            data-z={-level * GAP}
            className="absolute top-0 left-0"
            style={{
              width: rx * 2.3,
              height: ry * 2.5,
              transform: `translate3d(0, 0, ${-level * GAP}px) translate(-50%, -50%)`,
            }}
          >
            <div className="h-full w-full rounded-[50%] border-[1.5px] border-dashed border-ink/45" />
            <p className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-sm bg-ink px-3 py-1 text-[11px] font-bold tracking-[0.14em] whitespace-nowrap text-accent-soft uppercase">
              {LEVELS[level].name}
            </p>
          </div>
        ))}

        <div
          data-z={-3 * GAP - 60}
          data-sun="1"
          className="absolute top-0 left-0 h-[900px] w-[900px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, #fff6c9 0%, #ffe500 28%, #ff8a4d 55%, rgba(255,111,174,0.5) 72%, transparent 100%)",
            transform: `translate3d(0, 0, ${-3 * GAP - 60}px) translate(-50%, -50%)`,
          }}
        />

        {placed.map((item) => {
          const isSun = item.variant === "sun";
          return (
            <div
              key={item.id}
              data-z={item.z}
              data-sun={isSun ? "1" : "0"}
              className="absolute top-0 left-0"
              style={{
                transform: `translate3d(${item.x}px, ${item.y}px, ${item.z}px) translate(-50%, -50%)`,
              }}
            >
              <button
                type="button"
                onClick={() => setSelected(item)}
                className={`block rounded-[4px] border border-ink/25 p-[13px] text-left shadow-[0_8px_24px_rgba(21,19,19,0.14)] transition-transform duration-200 hover:scale-[1.07] ${
                  isSun ? "w-[380px] !p-8" : "w-[210px]"
                } ${CARD_STYLE[item.variant]}`}
              >
                <span className="block text-[10px] font-bold tracking-[0.12em] uppercase opacity-70">
                  {item.kicker}
                </span>
                <span
                  className={`font-display mt-2 block leading-[1.02] uppercase ${
                    isSun ? "text-[64px]" : "text-[1.6em]"
                  }`}
                >
                  {item.title}
                </span>
                <span
                  className={`mt-2 block leading-relaxed ${
                    isSun ? "text-[14px]" : "line-clamp-5 text-[11px]"
                  }`}
                >
                  {item.short}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div ref={header} className="pointer-events-none fixed top-6 left-6 z-10 max-w-[420px]">
        <h1 className="font-display text-[clamp(40px,5.2vw,72px)] leading-[0.92] uppercase">
          Your map
        </h1>
        <p className="mt-3 text-[12px] leading-relaxed">
          Scroll to fall through it. Tap any card. At the very bottom, the role you invented.
        </p>
      </div>

      <nav
        aria-label="Levels"
        className="fixed top-1/2 right-6 z-10 flex -translate-y-1/2 flex-col items-end gap-4"
      >
        {LEVELS.map((level, i) => (
          <button
            key={level.name}
            type="button"
            onClick={() => {
              target.current = i * GAP;
            }}
            aria-current={active === i}
            className="group flex items-center gap-3 text-[11px] font-bold tracking-[0.12em] uppercase"
          >
            <span className={active === i ? "opacity-100" : "opacity-50 group-hover:opacity-100"}>
              {level.name}
            </span>
            <span
              className={`h-[3px] bg-ink transition-all ${active === i ? "w-[34px]" : "w-[14px]"}`}
            />
          </button>
        ))}
      </nav>

      <div className="no-print fixed right-6 bottom-6 z-10 flex flex-wrap items-center justify-end gap-3">
        <button type="button" onClick={download} className={primaryButton}>
          flow.md ↓
        </button>
        <button type="button" onClick={copy} className={secondaryButton}>
          {copied ? "Copied" : "Copy"}
        </button>
        <button type="button" onClick={onRestart} className={secondaryButton}>
          Start again
        </button>
      </div>

      <p className="pointer-events-none fixed bottom-6 left-6 z-10 max-w-[360px] text-[11px] font-bold tracking-[0.12em] uppercase">
        {LEVELS[active].blurb}
        {active === 0 ? " ↓ Scroll" : ""}
      </p>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/30 p-6 backdrop-blur-[10px]"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={selected.title}
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-[85vh] w-full max-w-[560px] overflow-auto rounded-[10px] border border-ink/20 bg-surface/80 p-[30px] shadow-2xl backdrop-blur-[24px] backdrop-saturate-[1.6]"
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink text-[18px] leading-none hover:bg-yellow"
            >
              ×
            </button>
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase opacity-70">
              {selected.kicker}
            </p>
            <h2 className="font-display mt-3 pr-8 text-[40px] leading-[1] uppercase">
              {selected.title}
            </h2>
            <div className="mt-5 space-y-3 text-[14px] leading-[1.6]">
              {(selected.body ?? [selected.short]).map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            {selected.list ? (
              <div className="mt-5">
                <p className="text-[11px] font-bold tracking-[0.14em] uppercase">
                  {selected.list.label}
                </p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[14px] leading-[1.6]">
                  {selected.list.items.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {selected.list2 ? (
              <div className="mt-5">
                <p className="text-[11px] font-bold tracking-[0.14em] uppercase">
                  {selected.list2.label}
                </p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[14px] leading-[1.6]">
                  {selected.list2.items.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {selected.link ? (
              <p className="mt-5 text-[13px]">
                Source:{" "}
                <a
                  href={selected.link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline underline-offset-4 hover:text-orange"
                >
                  {selected.link.title}
                </a>
              </p>
            ) : null}
            {selected.retry ? (
              <button
                type="button"
                className={`${primaryButton} mt-6`}
                onClick={() => {
                  setSelected(null);
                  void loadFutures();
                }}
              >
                Try again
              </button>
            ) : null}
            {selected.id.startsWith("future-") && futures.status === "ready" ? (
              <p className="mt-4 text-[11px] text-muted">
                A possibility extrapolated from the research above, not a prediction or a job
                listing.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
