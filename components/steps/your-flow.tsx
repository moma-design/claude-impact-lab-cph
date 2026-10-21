"use client";

import { useState } from "react";

import { APP_NAME } from "@/lib/app-config";
import { OPPORTUNITY_TYPE_LABELS, type FlowPayload, type Opportunity } from "@/lib/flow/types";

import { FeelingScale } from "../feeling-scale";
import { ErrorNote, Eyebrow, primaryButton, quietLink, secondaryButton, Thinking } from "../ui";

interface YourFlowProps {
  flow: FlowPayload | null;
  flowMarkdown: string;
  interested: Opportunity[];
  feelingBefore: number | null;
  feelingNow: number | null;
  isExample: boolean;
  busy: boolean;
  error: string | null;
  onFeelingNow: (value: number) => void;
  onFindNew: () => void;
  onLevelUp?: (opportunity: Opportunity) => void;
  onRestart: () => void;
}

export function YourFlow({
  flow,
  flowMarkdown,
  interested,
  feelingBefore,
  feelingNow,
  isExample,
  busy,
  error,
  onFeelingNow,
  onFindNew,
  onLevelUp,
  onRestart,
}: YourFlowProps) {
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

  return (
    <main className="mx-auto w-full max-w-[960px] px-6 py-12 sm:py-16">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-5">
        <Eyebrow>{APP_NAME}</Eyebrow>
        {isExample ? (
          <p className="text-[13px] text-accent">Example person, invented for this demo</p>
        ) : null}
      </header>

      <h1 className="mt-10 text-[30px] leading-tight font-semibold text-ink sm:text-[38px]">
        Your flow
      </h1>

      {busy ? (
        <div className="mt-6">
          <Thinking label="Writing your flow" />
        </div>
      ) : null}

      {error ? (
        <div className="mt-6">
          <ErrorNote message={error} />
        </div>
      ) : null}

      {flow ? (
        <>
          <p className="mt-4 max-w-[68ch] text-[17px] leading-relaxed text-muted">
            {flow.closing_line}
          </p>

          <section className="mt-12 rounded-xl bg-accent-soft p-8 print-plain">
            <h2 className="text-[24px] font-semibold text-ink">Your step this week</h2>
            <p className="mt-4 max-w-[68ch] text-[17px] leading-relaxed text-ink">
              {flow.step_this_week.action}
            </p>
            <p className="mt-4 text-[15px] text-muted">
              About {flow.step_this_week.minutes}.
            </p>
            <p className="mt-1 text-[15px] text-muted">
              <span className="font-medium text-ink">Who to talk to. </span>
              {flow.step_this_week.who_to_talk_to}
            </p>
          </section>

          {interested.length > 0 ? (
            <section className="mt-16 border-t border-line pt-10">
              <h2 className="text-[24px] font-semibold text-ink">
                Opportunities you marked interesting
              </h2>
              <ul className="mt-6 space-y-4">
                {interested.map((opportunity) => (
                  <li
                    key={opportunity.title}
                    className="print-break-avoid rounded-xl border border-line bg-surface p-6 print-plain"
                  >
                    <p className="text-[13px] font-medium text-accent">
                      {OPPORTUNITY_TYPE_LABELS[opportunity.type]}
                    </p>
                    <h3 className="mt-2 text-[19px] leading-snug font-semibold text-ink">
                      {opportunity.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted">
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
                          {opportunity.source_title}
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-16 border-t border-line pt-10">
            <h2 className="text-[24px] font-semibold text-ink">Your flow.md</h2>
            <p className="mt-2 max-w-[68ch] text-[15px] leading-relaxed text-muted">
              One file that holds who you are, what you want next and what to watch for.
            </p>
            <pre className="mt-6 max-h-[420px] overflow-auto rounded-xl border border-line bg-surface p-6 text-[13px] leading-relaxed whitespace-pre-wrap text-ink print-plain">
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

          <section className="mt-16 border-t border-line pt-10">
            <FeelingScale
              name="feeling-after"
              legend="How do you feel now?"
              value={feelingNow}
              onChange={onFeelingNow}
            />
            {feelingNow !== null ? (
              <p className="mt-8 text-[32px] font-semibold text-ink sm:text-[40px]">
                Before {feelingBefore ?? "not said"} <span className="text-accent">·</span>{" "}
                Now {feelingNow}
              </p>
            ) : null}
          </section>

          <footer className="mt-16 flex flex-wrap items-center gap-6 border-t border-line pt-8 no-print">
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
        </>
      ) : null}
    </main>
  );
}
