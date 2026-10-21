"use client";

import { useState } from "react";

import type { FlowPayload, Opportunity } from "@/lib/flow/types";
import type { WorldItem } from "@/lib/flow/world";

import { DetailPanel, toPanel } from "../detail-panel";
import { ErrorNote, primaryButton, quietLink, secondaryButton, Thinking } from "../ui";
import { World } from "../world";

interface YourFlowProps {
  flow: FlowPayload | null;
  flowMarkdown: string;
  interested: Opportunity[];
  worldItems: WorldItem[];
  isExample: boolean;
  busy: boolean;
  error: string | null;
  heldCount: number;
  toCollectCount: number;
  onFindNew: () => void;
  onLevelUp?: (opportunity: Opportunity) => void;
  onRestart: () => void;
}

export function YourFlow({
  flow,
  flowMarkdown,
  interested,
  worldItems,
  isExample,
  busy,
  error,
  heldCount,
  toCollectCount,
  onFindNew,
  onLevelUp,
  onRestart,
}: YourFlowProps) {
  const [open, setOpen] = useState<WorldItem | null>(null);
  const [showFlow, setShowFlow] = useState(false);
  const [copied, setCopied] = useState(false);

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

  if (busy || !flow) {
    return (
      <main className="mx-auto w-full max-w-[680px] px-6 py-24">
        <h1 className="display text-[40px]">Configuring your dream job</h1>
        <div className="mt-6">
          {error ? <ErrorNote message={error} /> : <Thinking label="A few seconds" />}
        </div>
        {error ? (
          <div className="mt-6">
            <button type="button" onClick={onRestart} className={quietLink}>
              Start again
            </button>
          </div>
        ) : null}
      </main>
    );
  }

  /* The sun at the centre, opened: the dream job built from what they confirmed. */
  const dreamJob = (
    <div className="detail-panel w-[min(560px,92vw)] rounded-[10px] p-8">
      <div aria-hidden="true" className="detail-glow pointer-events-none absolute -inset-px rounded-[10px]" />
      <p className="label relative">Your dream job</p>
      <h2 className="display relative mt-2 text-[34px] leading-[0.98] sm:text-[40px]">
        {flow.dream_job.title}
      </h2>
      <ul className="relative mt-5 space-y-1.5">
        {flow.dream_job.week.map((line, index) => (
          <li key={index} className="text-[14px] leading-[1.6] text-ink">
            {line}
          </li>
        ))}
      </ul>
      <p className="relative mt-5 text-[14px] leading-[1.6] text-ink">
        <span className="label inline-block">Cards.</span>{" "}
        {heldCount} held, {toCollectCount} still to collect.
      </p>
      <p className="relative mt-3 text-[14px] leading-[1.6] text-ink">
        <span className="label inline-block">This week.</span>{" "}
        {flow.step_this_week.action}
      </p>
      <div className="relative mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => setShowFlow(true)} className={primaryButton}>
          Your flow.md
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="dots pointer-events-none fixed inset-0 -z-20" aria-hidden="true" />

      <header className="pointer-events-none fixed top-6 left-8 z-10 max-w-[34ch]">
        <h1 className="display text-[40px] sm:text-[56px]">
          The world
          <br />
          is yours.
        </h1>
        <p className="strap mt-3 text-ink">
          Scroll into it. What&apos;s close, what&apos;s in reach, and what&apos;s coming.
        </p>
        {isExample ? <p className="label mt-3">Example person, invented for this demo</p> : null}
      </header>

      <World
        items={worldItems}
        mode="full"
        warmth={1}
        onOpen={setOpen}
        centre={dreamJob}
      />

      <DetailPanel item={open ? toPanel(open) : null} onClose={() => setOpen(null)} />

      {/* After the rings: the file, the score, and another search. */}
      {showFlow ? (
        <div className="fixed inset-0 z-30 overflow-y-auto bg-canvas">
          <main className="mx-auto w-full max-w-[960px] px-6 py-12">
            <div className="flex items-center justify-between gap-4 no-print">
              <h2 className="display text-[30px] sm:text-[38px]">Your flow</h2>
              <button type="button" onClick={() => setShowFlow(false)} className={secondaryButton}>
                Back to the rings
              </button>
            </div>

            {interested.length > 0 ? (
              <section className="mt-12">
                <h3 className="ring-label inline-block">Marked interesting</h3>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {interested.map((opportunity) => (
                    <li
                      key={opportunity.title}
                      className="paper-card print-break-avoid rounded-[4px] p-6 print-plain"
                    >
                      <p className="label text-ink">{opportunity.type}</p>
                      <h4 className="display mt-2 text-[22px]">{opportunity.title}</h4>
                      <p className="mt-3 text-[14px] leading-[1.6] text-ink">
                        {opportunity.why_you}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-4 no-print">
                        {onLevelUp ? (
                          <button
                            type="button"
                            onClick={() => onLevelUp(opportunity)}
                            className={secondaryButton}
                          >
                            Level up
                          </button>
                        ) : null}
                        {opportunity.source_url ? (
                          <a
                            href={opportunity.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className={quietLink}
                          >
                            Source
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="mt-16 border-t border-dashed border-line pt-10">
              <h3 className="display text-[28px] sm:text-[34px]">Your flow.md</h3>
              <p className="mt-2 max-w-[68ch] text-[14px] leading-[1.6] text-muted">
                One file that holds who you are, what you want next and what to watch for.
              </p>
              <pre className="paper-card mt-6 max-h-[420px] overflow-auto rounded-[4px] p-6 text-[13px] leading-relaxed whitespace-pre-wrap text-ink print-plain">
                {flowMarkdown}
              </pre>
              <div className="mt-5 flex flex-wrap items-center gap-4 no-print">
                <button type="button" onClick={download} className={primaryButton}>
                  Download flow.md
                </button>
                <button type="button" onClick={copy} className={secondaryButton}>
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-4 text-[14px] text-muted">
                Yours to keep. Paste it into any AI tool.
              </p>
            </section>

            <footer className="mt-16 flex flex-wrap items-center gap-6 border-t border-dashed border-line pt-8 no-print">
              <button type="button" onClick={onFindNew} className={primaryButton}>
                Find new opportunities
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className={secondaryButton}
              >
                Print or save as PDF
              </button>
              <button type="button" onClick={onRestart} className={quietLink}>
                Start again
              </button>
            </footer>
          </main>
        </div>
      ) : null}
    </>
  );
}
