"use client";

import { useState } from "react";

import { APP_NAME } from "@/lib/app-config";
import { WORK_TYPE_LABELS, type CareerMap } from "@/lib/career-map-schema";

import { FeelingScale } from "./feeling-scale";
import { SignalsPanel } from "./signals";
import { primaryButton, quietLink, secondaryButton } from "./ui";

interface ResultsProps {
  map: CareerMap;
  flowMarkdown: string;
  feelingBefore: number | null;
  isExample: boolean;
  onRestart: () => void;
}

export function Results({
  map,
  flowMarkdown,
  feelingBefore,
  isExample,
  onRestart,
}: ResultsProps) {
  const [feelingNow, setFeelingNow] = useState<number | null>(null);
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
        <p className="text-[13px] font-medium text-muted">{APP_NAME}</p>
        {isExample ? (
          <p className="text-[13px] text-accent">Example person, invented for this demo</p>
        ) : null}
      </header>

      <h1 className="mt-10 text-[30px] leading-tight font-semibold text-ink sm:text-[38px]">
        What is yours
      </h1>
      <p className="mt-4 max-w-[68ch] text-[17px] leading-relaxed text-muted">
        {map.closing_line}
      </p>

      <ul className="mt-10 grid gap-5 sm:grid-cols-2">
        {map.strengths.map((strength, index) => (
          <li
            key={index}
            className="print-break-avoid rounded-xl border border-line bg-surface p-6 print-plain"
          >
            <h2 className="text-[17px] font-semibold text-ink">{strength.title}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{strength.line}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-16 text-[24px] font-semibold text-ink">
        Three new kinds of work
      </h2>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {map.paths.map((path) => (
          <article
            key={path.type}
            className="print-break-avoid flex flex-col rounded-xl border border-line bg-surface p-6 print-plain"
          >
            <p className="text-[13px] font-medium text-accent">
              {WORK_TYPE_LABELS[path.type]}
            </p>
            <h3 className="mt-3 text-[19px] leading-snug font-semibold text-ink">
              {path.title}
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              {path.why_it_fits}
            </p>
            <div className="mt-5">
              <p className="text-[13px] font-medium text-ink">A week could look like</p>
              <ul className="mt-2 space-y-1.5">
                {path.week.map((line, index) => (
                  <li key={index} className="text-[15px] leading-relaxed text-muted">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-5 border-t border-line pt-4 text-[15px] leading-relaxed text-ink">
              <span className="font-medium">The human part. </span>
              {path.human_part}
            </p>
          </article>
        ))}
      </div>

      <section className="mt-16 rounded-xl bg-accent-soft p-8 print-plain">
        <h2 className="text-[24px] font-semibold text-ink">Your step this week</h2>
        <p className="mt-4 max-w-[68ch] text-[17px] leading-relaxed text-ink">
          {map.step_this_week.action}
        </p>
        <p className="mt-4 text-[15px] text-muted">About {map.step_this_week.minutes}.</p>
        <p className="mt-1 text-[15px] text-muted">
          <span className="font-medium text-ink">Who to talk to. </span>
          {map.step_this_week.who_to_talk_to}
        </p>
      </section>

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
          <span aria-live="polite" className="sr-only">
            {copied ? "flow.md copied to the clipboard" : ""}
          </span>
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
          onChange={setFeelingNow}
        />
        {feelingNow !== null ? (
          <p className="mt-8 text-[32px] font-semibold text-ink sm:text-[40px]">
            Before {feelingBefore ?? "not said"} <span className="text-accent">·</span> Now{" "}
            {feelingNow}
          </p>
        ) : null}
      </section>

      <SignalsPanel flowMarkdown={flowMarkdown} isExample={isExample} />

      <footer className="mt-16 flex flex-wrap items-center gap-6 border-t border-line pt-8 no-print">
        <button type="button" onClick={() => window.print()} className={secondaryButton}>
          Print or save as PDF
        </button>
        <button type="button" onClick={onRestart} className={quietLink}>
          Start again
        </button>
      </footer>
    </main>
  );
}
