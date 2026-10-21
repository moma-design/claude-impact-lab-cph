import type { ReactNode } from "react";

export const primaryButton =
  "inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#10514c] disabled:cursor-not-allowed disabled:opacity-40";

export const secondaryButton =
  "inline-flex items-center justify-center rounded-full border border-line bg-surface px-5 py-2.5 text-[14px] font-medium text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40";

export const quietLink =
  "rounded-sm text-[14px] text-accent underline underline-offset-4 transition-colors hover:text-ink";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13px] font-medium text-muted">{children}</p>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-line bg-surface px-4 py-3 text-[14px] text-ink"
    >
      {message}
    </p>
  );
}

export function Thinking({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-[14px] text-muted">
      <span aria-hidden="true" className="flex gap-1">
        <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-muted" />
        <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-muted" />
        <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-muted" />
      </span>
      {label}
    </p>
  );
}
