"use client";

import { useState } from "react";

import { MAX_PDF_BYTES, SUPPORTING_LINE, type Profile } from "@/lib/app-config";
import { EXAMPLE_PERSON_NAME } from "@/lib/example-person";

import { ErrorNote, primaryButton, quietLink } from "./ui";

interface EntryProps {
  onBegin: (seed: string, profile: Profile | null) => void;
  onExample: () => void;
  error: string | null;
}

const STARTERS = [
  "Teacher",
  "Nurse",
  "Accountant",
  "Software developer",
  "Marketing manager",
  "Warehouse supervisor",
  "Lawyer",
  "Chef",
];

const FLOATERS = [
  { text: "Calming a room", tilt: "-6deg", style: "left-[4%] top-[14%]", bg: "bg-pink" },
  { text: "Spotting what's missing", tilt: "5deg", style: "right-[5%] top-[22%]", bg: "bg-yellow" },
  { text: "Translating expert to human", tilt: "-3deg", style: "left-[7%] bottom-[12%]", bg: "bg-surface" },
  { text: "Deciding with half the facts", tilt: "7deg", style: "right-[6%] bottom-[16%]", bg: "bg-orange" },
];

async function toBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function Entry({ onBegin, onExample, error }: EntryProps) {
  const [seed, setSeed] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [pasted, setPasted] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLocalError(null);

    let profile: Profile | null = null;
    if (file) {
      if (file.size > MAX_PDF_BYTES) {
        setLocalError("That PDF is larger than 20 MB. Paste the text instead.");
        return;
      }
      profile = { kind: "pdf", name: file.name, data: await toBase64(file) };
    } else if (pasted.trim().length > 40) {
      profile = { kind: "text", text: pasted };
    }

    if (!seed.trim() && !profile) {
      setLocalError("Say what you do in a few words, or pick one below.");
      return;
    }
    onBegin(seed.trim(), profile);
  }

  const shownError = localError ?? error;

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-[760px] flex-col justify-center px-6 py-16">
      {FLOATERS.map((card) => (
        <div
          key={card.text}
          aria-hidden="true"
          style={{ "--tilt": card.tilt } as React.CSSProperties}
          className={`float-card pointer-events-none absolute hidden w-[170px] rounded-sm border-2 border-ink p-3 text-[11px] font-bold uppercase lg:block ${card.style} ${card.bg} hard-shadow`}
        >
          {card.text}
        </div>
      ))}

      <h1 className="font-display text-[clamp(44px,8vw,92px)] leading-[0.92] uppercase">
        What are you <span className="bg-yellow px-2">actually</span> good at?
      </h1>
      <p className="mt-6 max-w-[56ch] text-[14px] leading-relaxed text-muted">
        {SUPPORTING_LINE}
      </p>

      <form onSubmit={submit} className="mt-10">
        <label htmlFor="seed" className="text-[11px] font-bold tracking-[0.14em] uppercase">
          I work as / I used to be
        </label>
        <input
          id="seed"
          value={seed}
          onChange={(event) => {
            setSeed(event.target.value);
            setLocalError(null);
          }}
          placeholder="e.g. a hospital pharmacist for 19 years"
          className="mt-2 w-full rounded-sm border-2 border-ink bg-surface px-4 py-4 text-[16px] text-ink hard-shadow placeholder:text-muted/70"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {STARTERS.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => setSeed(starter)}
              className="rounded-full border-2 border-ink bg-surface px-3 py-1 text-[11px] font-bold uppercase transition-colors hover:bg-yellow"
            >
              {starter}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className={`${quietLink} mt-6 block`}
          aria-expanded={showMore}
        >
          {showMore ? "Hide" : "Add"} my CV or LinkedIn PDF (optional, makes it sharper)
        </button>

        {showMore ? (
          <div className="mt-4 space-y-4 rounded-sm border-2 border-dashed border-ink p-4">
            <div>
              <label htmlFor="pdf" className="text-[12px] font-bold uppercase">
                CV or LinkedIn PDF
              </label>
              <input
                id="pdf"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="mt-2 block w-full text-[12px]"
              />
            </div>
            <div>
              <label htmlFor="pasted" className="text-[12px] font-bold uppercase">
                Or paste the text
              </label>
              <textarea
                id="pasted"
                rows={4}
                value={pasted}
                onChange={(event) => setPasted(event.target.value)}
                className="mt-2 w-full rounded-sm border-2 border-ink bg-surface p-3 text-[13px]"
              />
            </div>
          </div>
        ) : null}

        {shownError ? (
          <div className="mt-6">
            <ErrorNote message={shownError} />
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-6">
          <button type="submit" className={primaryButton}>
            Deal me in
          </button>
          <button type="button" onClick={onExample} className={quietLink}>
            Try an example person
          </button>
        </div>
        <p className="mt-4 text-[11px] text-muted">
          Nothing is saved. {EXAMPLE_PERSON_NAME} is fictional.
        </p>
      </form>
    </main>
  );
}
