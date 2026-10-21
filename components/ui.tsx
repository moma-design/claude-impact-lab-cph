import type { ReactNode } from "react";

/**
 * Primitives in Martin Rud's visual language, derived from his gh-pages
 * mockup. Tokens live in app/globals.css.
 */

/** His ink block, as a button. Mono, uppercase, tracked. */
export const primaryButton =
  "inline-flex items-center justify-center rounded-[3px] bg-ink px-6 py-3 text-[13px] font-bold tracking-[0.12em] text-canvas uppercase transition-[scale,box-shadow] hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40";

/** The same block, outlined, for the quieter of two choices. */
export const secondaryButton =
  "inline-flex items-center justify-center rounded-[3px] border border-ink bg-transparent px-6 py-3 text-[13px] font-bold tracking-[0.12em] text-ink uppercase transition-[scale,background-color] hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40";

export const quietLink =
  "rounded-sm text-[13px] font-bold tracking-[0.12em] text-ink uppercase underline underline-offset-4 transition-opacity hover:opacity-70";

/** His .k label. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="label">{children}</p>;
}

/** His display headline. */
export function Display({
  children,
  className = "text-[40px] sm:text-[56px]",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <h1 className={`display ${className}`}>{children}</h1>;
}

/** A paper card, his .card with the shadow. */
export function PaperCard({
  children,
  tone = "paper",
  className = "",
}: {
  children: ReactNode;
  tone?: "paper" | "pink" | "yellow" | "ink" | "reach" | "signal" | "outline";
  className?: string;
}) {
  const tones: Record<string, string> = {
    paper: "paper-card",
    pink: "paper-card card-pink",
    yellow: "paper-card card-yellow",
    ink: "paper-card card-ink",
    reach: "paper-card card-reach",
    signal: "paper-card card-signal",
    outline: "card-outline rounded-[4px]",
  };
  return <div className={`${tones[tone]} ${className}`}>{children}</div>;
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="paper-card card-pink rounded-[4px] px-4 py-3 text-[14px] leading-relaxed text-ink"
    >
      {message}
    </p>
  );
}

export function Thinking({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-[14px] tracking-[0.04em] text-muted uppercase">
      <span aria-hidden="true" className="flex gap-1">
        <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-ink" />
        <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-ink" />
        <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-ink" />
      </span>
      {label}
    </p>
  );
}

/** His glowing blob. Grows as the person confirms more about themselves. */
export function Blob({ scale = 1, className = "" }: { scale?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`blob pointer-events-none ${className}`}
      style={{ transform: `scale(${scale})`, transition: "transform 900ms cubic-bezier(.2,.9,.25,1.15)" }}
    />
  );
}

/** His right-hand level navigation. */
export function LevelNav({
  levels,
  active,
  onSelect,
}: {
  levels: string[];
  active: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav
      aria-label="Levels"
      className="level-nav fixed top-1/2 right-7 z-10 flex -translate-y-1/2 flex-col gap-2.5"
    >
      {levels.map((level, index) => (
        <button
          key={level}
          type="button"
          aria-current={index === active}
          onClick={() => onSelect(index)}
        >
          {level}
        </button>
      ))}
    </nav>
  );
}
