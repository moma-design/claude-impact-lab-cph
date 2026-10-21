"use client";

import { useRef, useState } from "react";

import {
  MAX_PDF_BYTES,
  SUPPORTING_LINE,
  TAGLINE,
  type Profile,
} from "@/lib/app-config";
import { EXAMPLE_PERSON_NAME } from "@/lib/example-person";

import { ErrorNote, primaryButton, quietLink } from "./ui";

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
  const fileInput = useRef<HTMLInputElement>(null);

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
    <main className="relative mx-auto w-full max-w-[680px] px-6 py-16 sm:py-24">

      <h1 className="display mt-6 text-[44px] sm:text-[64px]">
        The world
        <br />
        is yours.
      </h1>
      <p className="strap mt-6 max-w-[34ch] text-ink">{TAGLINE}</p>
      <p className="mt-5 max-w-[60ch] text-[14px] leading-relaxed text-muted">
        {SUPPORTING_LINE}
      </p>

      <form onSubmit={handleSubmit} className="mt-12 space-y-10">
        <div className="border-t border-dashed border-line pt-10">
          <label htmlFor="linkedin-pdf" className="label block">
            Your LinkedIn profile, as a PDF
          </label>
          <p id="linkedin-pdf-help" className="mt-2 text-[14px] leading-relaxed text-muted">
            On your LinkedIn profile, click Resources, then Save to PDF.
          </p>
          <input
            ref={fileInput}
            id="linkedin-pdf"
            name="linkedin-pdf"
            type="file"
            accept="application/pdf,.pdf"
            aria-describedby="linkedin-pdf-help"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setLocalError(null);
            }}
            className="paper-card mt-4 block w-full cursor-pointer rounded-[4px] p-3 text-[14px] text-muted file:mr-4 file:cursor-pointer file:rounded-[3px] file:border-0 file:bg-ink file:px-4 file:py-2 file:text-[12px] file:font-bold file:tracking-[0.12em] file:text-canvas file:uppercase"
          />
        </div>

        <div>
          <label htmlFor="profile-text" className="label block">
            Or paste your profile text
          </label>
          <p id="profile-text-help" className="mt-2 text-[14px] leading-relaxed text-muted">
            Headline, about, roles and skills is plenty.
          </p>
          <textarea
            id="profile-text"
            name="profile-text"
            rows={6}
            value={pastedText}
            aria-describedby="profile-text-help"
            onChange={(event) => {
              setPastedText(event.target.value);
              setLocalError(null);
            }}
            className="paper-card mt-4 w-full resize-y rounded-[4px] p-4 text-[14px] leading-relaxed text-ink placeholder:text-muted"
            placeholder="Senior clinical pharmacist, acute medicine. Nineteen years in hospital pharmacy..."
          />
        </div>

        {shownError ? <ErrorNote message={shownError} /> : null}

        <div className="flex flex-col gap-5">
          <button type="submit" className={primaryButton} disabled={busy}>
            {busy ? "Starting" : "Start"}
          </button>
          <p className="text-[12px] tracking-[0.1em] text-muted uppercase">Nothing is saved.</p>
        </div>
      </form>

      <div className="mt-12 border-t border-dashed border-line pt-8">
        <button type="button" onClick={onExample} className={quietLink} disabled={busy}>
          Try with an example person
        </button>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          {EXAMPLE_PERSON_NAME}. A fictional profile, written for this demo.
        </p>
      </div>
    </main>
  );
}
