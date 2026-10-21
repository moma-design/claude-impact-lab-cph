"use client";

import { useRef, useState } from "react";

import {
  APP_NAME,
  MAX_PDF_BYTES,
  SUPPORTING_LINE,
  TAGLINE,
  type Profile,
} from "@/lib/app-config";
import { EXAMPLE_PERSON_NAME } from "@/lib/example-person";

import { FeelingScale } from "./feeling-scale";
import { ErrorNote, primaryButton, quietLink } from "./ui";

interface StartScreenProps {
  onStart: (profile: Profile, feeling: number | null) => void;
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
  const [feeling, setFeeling] = useState<number | null>(null);
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
      onStart({ kind: "pdf", name: file.name, data }, feeling);
      return;
    }

    if (pastedText.trim().length > 40) {
      onStart({ kind: "text", text: pastedText }, feeling);
      return;
    }

    setLocalError("Add your LinkedIn PDF, or paste your profile text, to begin.");
  }

  const shownError = localError ?? error;

  return (
    <main className="mx-auto w-full max-w-[680px] px-6 py-16 sm:py-24">
      <p className="text-[13px] font-medium tracking-normal text-muted">{APP_NAME}</p>

      <h1 className="mt-6 text-[32px] leading-[1.15] font-semibold text-ink sm:text-[42px]">
        {TAGLINE}
      </h1>
      <p className="mt-5 text-[17px] leading-relaxed text-muted">{SUPPORTING_LINE}</p>

      <form onSubmit={handleSubmit} className="mt-12 space-y-10">
        <FeelingScale
          name="feeling-before"
          legend="How do you feel about AI and your work right now?"
          value={feeling}
          onChange={setFeeling}
        />

        <div className="border-t border-line pt-10">
          <label
            htmlFor="linkedin-pdf"
            className="block text-[15px] font-medium text-ink"
          >
            Your LinkedIn profile, as a PDF
          </label>
          <p id="linkedin-pdf-help" className="mt-2 text-[14px] text-muted">
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
            className="mt-4 block w-full cursor-pointer rounded-lg border border-line bg-surface p-3 text-[14px] text-muted file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-[14px] file:font-medium file:text-accent"
          />
        </div>

        <div>
          <label
            htmlFor="profile-text"
            className="block text-[15px] font-medium text-ink"
          >
            Or paste your profile text
          </label>
          <p id="profile-text-help" className="mt-2 text-[14px] text-muted">
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
            className="mt-4 w-full resize-y rounded-lg border border-line bg-surface p-4 text-[15px] leading-relaxed text-ink placeholder:text-muted"
            placeholder="Senior clinical pharmacist, acute medicine. Nineteen years in hospital pharmacy..."
          />
        </div>

        {shownError ? <ErrorNote message={shownError} /> : null}

        <div className="flex flex-col gap-5">
          <button type="submit" className={primaryButton} disabled={busy}>
            {busy ? "Starting" : "Start the conversation"}
          </button>
          <p className="text-[13px] text-muted">Nothing is saved.</p>
        </div>
      </form>

      <div className="mt-12 border-t border-line pt-8">
        <button type="button" onClick={onExample} className={quietLink} disabled={busy}>
          Try with an example person
        </button>
        <p className="mt-2 text-[13px] text-muted">
          {EXAMPLE_PERSON_NAME}. A fictional profile and conversation, written for this
          demo. It goes straight to the results.
        </p>
      </div>
    </main>
  );
}
