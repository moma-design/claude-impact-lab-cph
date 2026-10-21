"use client";

import { useState } from "react";

import { MAX_PDF_BYTES, SUPPORTING_LINE, type Profile } from "@/lib/app-config";
import { EXAMPLE_PERSON_NAME } from "@/lib/example-person";

import { StartScene } from "./start-scene";
import { ErrorNote, quietLink } from "./ui";

interface StartScreenProps {
  onStart: (profile: Profile) => void;
  onExample: () => void;
  busy: boolean;
  error: string | null;
}

async function toBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function StartScreen({ onStart, onExample, busy, error }: StartScreenProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLocalError(null);

    if (file) {
      if (file.size > MAX_PDF_BYTES) {
        setLocalError("That PDF is larger than 20 MB. Paste the text instead.");
        return;
      }
      const data = await toBase64(file);
      onStart({ kind: "pdf", name: file.name, data });
      return;
    }

    if (pastedText.trim().length > 40) {
      onStart({ kind: "text", text: pastedText });
      return;
    }

    setLocalError("Add your LinkedIn PDF, or paste your profile text, to begin.");
  }

  const shownError = localError ?? error;

  return (
    <div className="start-wrap">
      <main>
        <h1 className="display text-[clamp(42px,5vw,68px)] leading-[0.94]">
          The world
          <br />
          is yours.
        </h1>
        <p className="mt-5 mb-7 max-w-[52ch] text-[14px] leading-[1.6] text-ink">
          {SUPPORTING_LINE}
        </p>

        <form onSubmit={handleSubmit} className="paper-card rounded-[4px] p-6">
          <div className="mb-3.5 flex items-baseline gap-3">
            <span aria-hidden="true" className="step-num">
              01
            </span>
            <span className="label text-ink" id="pdf-label">
              Your LinkedIn profile
            </span>
          </div>
          <p id="pdf-help" className="-mt-1.5 mb-3.5 text-[13px] leading-[1.5] text-muted">
            On your LinkedIn profile, click Resources, then Save to PDF.
          </p>

          <label className="drop">
            <span aria-hidden="true" className="drop-icon">
              PDF
            </span>
            <span>
              <b className="block text-[14px]">
                {file ? file.name : "Choose your profile PDF"}
              </b>
              <span className="text-[13px] text-muted">
                {file ? "Ready to go" : "Or drop it here"}
              </span>
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              aria-labelledby="pdf-label"
              aria-describedby="pdf-help"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setLocalError(null);
              }}
              className="hidden"
            />
          </label>

          <details className="mt-3.5">
            <summary className="label cursor-pointer text-ink">
              Or paste your profile text
            </summary>
            <textarea
              aria-label="Your profile text"
              value={pastedText}
              onChange={(event) => {
                setPastedText(event.target.value);
                setLocalError(null);
              }}
              className="mt-3 min-h-[120px] w-full resize-y rounded-[4px] border border-ink/25 bg-white p-3 text-[13px] leading-[1.55] text-ink placeholder:text-muted"
              placeholder="Senior clinical pharmacist, acute medicine. Nineteen years in hospital pharmacy..."
            />
          </details>

          <div className="divide" />

          <div className="mb-3.5 flex items-baseline gap-3">
            <span aria-hidden="true" className="step-num">
              02
            </span>
            <span className="label text-ink">Start</span>
          </div>
          <p className="-mt-1.5 text-[13px] leading-[1.5] text-muted">
            Claude reads it, then shows you what it sees.
          </p>

          {shownError ? (
            <div className="mt-4">
              <ErrorNote message={shownError} />
            </div>
          ) : null}

          <button type="submit" className="go" disabled={busy}>
            <span>{busy ? "Starting" : "Start"}</span>
            <span aria-hidden="true" className="arrow">
              →
            </span>
          </button>

          <p className="mt-3 text-[12px] tracking-[0.06em] text-muted uppercase">
            Nothing is saved.
          </p>
        </form>

        <p className="mt-6 text-[13px] leading-[1.6] text-ink">
          <button type="button" onClick={onExample} className={quietLink} disabled={busy}>
            Try with an example person
          </button>
          <br />
          <span className="text-muted">
            {EXAMPLE_PERSON_NAME}. A fictional profile, written for this demo.
          </span>
        </p>
      </main>

      <StartScene />
    </div>
  );
}
