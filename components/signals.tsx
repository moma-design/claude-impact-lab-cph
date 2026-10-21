"use client";

import { useState } from "react";

import type { Signal, SignalsResponse } from "@/lib/signals-schema";

import { ErrorNote, primaryButton, Thinking } from "./ui";

interface SignalsPanelProps {
  flowMarkdown: string;
  isExample: boolean;
}

export function SignalsPanel({ flowMarkdown, isExample }: SignalsPanelProps) {
  const [signals, setSignals] = useState<Signal[] | null>(null);
  const [savedExample, setSavedExample] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flowMarkdown, isExample }),
      });
      const payload = (await response.json()) as Partial<SignalsResponse> & {
        error?: string;
      };
      if (!response.ok || !payload.signals?.length) {
        setError(
          payload.error ??
            "The market check did not come back this time. Try again in a moment.",
        );
        return;
      }
      setSignals(payload.signals);
      setSavedExample(Boolean(payload.savedExample));
    } catch {
      setError("The market check could not be reached. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-16 border-t border-line pt-10">
      <h2 className="text-[22px] font-semibold text-ink">What&apos;s new for me?</h2>
      <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-muted">
        A live read on what is changing around the things in your file. Signals, not
        forecasts. Sources shown.
      </p>

      {signals === null ? (
        <div className="mt-6 no-print">
          <button type="button" onClick={load} className={primaryButton} disabled={busy}>
            {busy ? "Checking" : "What's new for me?"}
          </button>
          {busy ? (
            <div className="mt-4">
              <Thinking label="Searching the web. This takes twenty to forty seconds." />
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 max-w-[62ch]">
              <ErrorNote message={error} />
            </div>
          ) : null}
        </div>
      ) : (
        <>
          {savedExample ? (
            <p className="mt-6 max-w-[62ch] text-[13px] font-medium text-accent">
              Saved example. A real result kept from an earlier run, shown because the
              live check did not return.
            </p>
          ) : null}
          <ol className="mt-6 space-y-6">
            {signals.map((signal, index) => (
              <li
                key={index}
                className="print-break-avoid rounded-xl border border-line bg-surface p-6 print-plain"
              >
                <h3 className="text-[17px] font-semibold text-ink">{signal.headline}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">
                  {signal.what_is_changing}
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-ink">
                  <span className="font-medium">For you. </span>
                  {signal.what_it_means_for_you}
                </p>
                <p className="mt-4 text-[14px]">
                  <a
                    href={signal.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline underline-offset-4 hover:text-ink"
                  >
                    {signal.source_title}
                  </a>
                </p>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
