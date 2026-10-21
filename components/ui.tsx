import type { ReactNode } from "react";

export const primaryButton =
  "inline-flex items-center justify-center rounded-sm bg-ink px-6 py-3 text-[13px] font-bold tracking-[0.1em] text-accent-soft uppercase transition-transform hover:-translate-y-0.5 hover:bg-pink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0";

export const secondaryButton =
  "inline-flex items-center justify-center rounded-sm border-2 border-ink bg-surface px-5 py-2.5 text-[12px] font-bold tracking-[0.1em] text-ink uppercase transition-colors hover:bg-yellow disabled:cursor-not-allowed disabled:opacity-40";

export const quietLink =
  "rounded-sm text-[12px] font-bold tracking-[0.1em] text-ink uppercase underline underline-offset-4 transition-colors hover:text-orange";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">{children}</p>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-sm border-2 border-ink bg-pink px-4 py-3 text-[13px] text-ink"
    >
      {message}
    </p>
  );
}

export function Thinking({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-[13px] text-muted">
      <span aria-hidden="true" className="flex gap-1">
        <span className="thinking-dot h-2 w-2 rounded-full bg-ink" />
        <span className="thinking-dot h-2 w-2 rounded-full bg-ink" />
        <span className="thinking-dot h-2 w-2 rounded-full bg-ink" />
      </span>
      {label}
    </p>
  );
}
