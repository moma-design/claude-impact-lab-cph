"use client";

import { useState } from "react";

import { primaryButton, quietLink, secondaryButton } from "./ui";

interface Question {
  prompt: string;
  label: string;
  chips: string[];
  placeholder: string;
}

const QUESTIONS: Question[] = [
  {
    prompt: "What do you do when nobody is asking you to?",
    label: "Weekends and evenings",
    chips: [
      "Cooking", "Gardening", "Making music", "Gaming", "Writing", "Sport",
      "Crafts", "Travelling", "Reading", "Volunteering", "Fixing things",
      "Photography", "Coding for fun", "Organising events",
    ],
    placeholder: "Anything else? A side project, a collection, a club...",
  },
  {
    prompt: "What do friends and family ask you for help with?",
    label: "The person people come to",
    chips: [
      "Tech problems", "Life advice", "Planning trips", "Money questions",
      "Writing things", "Translating", "Fixing stuff", "Settling arguments",
      "Recommendations", "Getting organised",
    ],
    placeholder: "Something only you get asked...",
  },
  {
    prompt: "What topics make you lose track of time?",
    label: "Curiosity",
    chips: [
      "Climate", "Health", "History", "Design", "Space", "Psychology", "Food",
      "Cities", "Animals", "Politics", "Money", "Art", "AI", "Education",
    ],
    placeholder: "The rabbit hole you keep falling into...",
  },
  {
    prompt: "Which languages and places are part of you?",
    label: "Where you come from",
    chips: [],
    placeholder: "e.g. Italian at home, grew up in Naples, lived in Copenhagen...",
  },
  {
    prompt: "A free year and a small budget. What would you learn or build?",
    label: "The wild card",
    chips: [],
    placeholder: "No wrong answers. Say it out loud.",
  },
];

interface LifeQuestionsProps {
  onDone: (life: string) => void;
}

export function LifeQuestions({ onDone }: LifeQuestionsProps) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[][]>(QUESTIONS.map(() => []));
  const [text, setText] = useState<string[]>(QUESTIONS.map(() => ""));

  const question = QUESTIONS[step];
  const last = step === QUESTIONS.length - 1;

  function toggle(chip: string) {
    setPicked((prev) =>
      prev.map((list, i) =>
        i !== step ? list : list.includes(chip) ? list.filter((c) => c !== chip) : [...list, chip],
      ),
    );
  }

  function finish() {
    const lines = QUESTIONS.map((q, i) => {
      const parts = [...picked[i], text[i].trim()].filter(Boolean);
      return parts.length ? `${q.prompt} ${parts.join(", ")}` : "";
    }).filter(Boolean);
    onDone(lines.join("\n"));
  }

  const answered = picked[step].length > 0 || text[step].trim().length > 0;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[820px] flex-col justify-center px-6 py-10">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[11px] font-bold tracking-[0.14em] uppercase">
          Step 1 of 4 · Beyond your job
        </p>
        <p className="text-[11px] text-muted">
          {step + 1} / {QUESTIONS.length}
        </p>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden="true">
        {QUESTIONS.map((q, i) => (
          <span
            key={q.label}
            className={`h-1.5 flex-1 rounded-full border border-ink ${i <= step ? "bg-ink" : ""}`}
          />
        ))}
      </div>

      <section key={step} className="card-in mt-10">
        <p className="inline-block rounded-sm bg-pink px-2 py-0.5 text-[11px] font-bold tracking-[0.12em] uppercase">
          {question.label}
        </p>
        <h1 className="font-display mt-4 text-[clamp(32px,5vw,58px)] leading-[0.95] uppercase">
          {question.prompt}
        </h1>

        {question.chips.length ? (
          <ul className="mt-8 flex flex-wrap gap-2">
            {question.chips.map((chip) => {
              const on = picked[step].includes(chip);
              return (
                <li key={chip}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(chip)}
                    className={`rounded-full border-2 border-ink px-4 py-2 text-[12px] font-bold uppercase transition-transform hover:-translate-y-0.5 ${
                      on ? "bg-yellow hard-shadow" : "bg-surface"
                    }`}
                  >
                    {chip}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        <label htmlFor="life-text" className="sr-only">
          {question.prompt}
        </label>
        <textarea
          id="life-text"
          rows={question.chips.length ? 2 : 4}
          value={text[step]}
          onChange={(event) =>
            setText((prev) => prev.map((t, i) => (i === step ? event.target.value : t)))
          }
          placeholder={question.placeholder}
          className="mt-6 w-full rounded-sm border-2 border-ink bg-surface p-4 text-[14px] leading-relaxed hard-shadow placeholder:text-muted/70"
        />
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-5">
        {step > 0 ? (
          <button type="button" className={secondaryButton} onClick={() => setStep(step - 1)}>
            Back
          </button>
        ) : null}
        <button
          type="button"
          className={primaryButton}
          onClick={() => (last ? finish() : setStep(step + 1))}
        >
          {last ? "Deal me the cards" : answered ? "Next" : "Skip"}
        </button>
        {!last && step > 0 ? (
          <button type="button" className={quietLink} onClick={finish}>
            That&apos;s enough, deal the cards
          </button>
        ) : null}
      </div>
    </main>
  );
}
