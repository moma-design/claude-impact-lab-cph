"use client";

import { APP_NAME } from "@/lib/app-config";
import { LIGHTS_UP_CHOICES, MAX_LIGHTS_UP } from "@/lib/flow/lights-up";
import type { TaskChoice } from "@/lib/flow/types";

import { Eyebrow, primaryButton } from "../ui";

interface LightsUpProps {
  lightsUp: string[];
  tasks: TaskChoice[];
  onToggleLight: (value: string) => void;
  onSetTaskKeep: (label: string, keep: boolean) => void;
  onContinue: () => void;
}

export function LightsUp({
  lightsUp,
  tasks,
  onToggleLight,
  onSetTaskKeep,
  onContinue,
}: LightsUpProps) {
  return (
    <main className="mx-auto w-full max-w-[680px] px-6 py-12 sm:py-16">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-5">
        <Eyebrow>{APP_NAME}</Eyebrow>
        <p className="text-[13px] text-muted" aria-live="polite">
          {lightsUp.length} of {MAX_LIGHTS_UP} chosen
        </p>
      </header>

      <h1 className="mt-10 text-[30px] leading-tight font-semibold text-ink">
        What lights you up
      </h1>

      <fieldset className="mt-10">
        <legend className="text-[15px] font-medium text-ink">
          Pick up to three
        </legend>
        <div className="mt-4 flex flex-wrap gap-2">
          {LIGHTS_UP_CHOICES.map((choice) => {
            const chosen = lightsUp.includes(choice);
            const full = !chosen && lightsUp.length >= MAX_LIGHTS_UP;
            return (
              <label
                key={choice}
                className={`cursor-pointer rounded-full border px-5 py-2.5 text-[15px] ${
                  chosen
                    ? "border-accent bg-accent font-medium text-white"
                    : "border-line bg-surface text-muted"
                } ${full ? "opacity-40" : ""} has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent`}
              >
                <input
                  type="checkbox"
                  checked={chosen}
                  disabled={full}
                  onChange={() => onToggleLight(choice)}
                  className="sr-only"
                />
                {choice}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-12 border-t border-line pt-10">
        <h2 className="text-[15px] font-medium text-ink">
          Which of these would you hand to AI tomorrow?
        </h2>
        <ul className="mt-4 space-y-3">
          {tasks.map((task) => (
            <li
              key={task.label}
              className="rounded-xl border border-line bg-surface p-4"
            >
              <p className="text-[16px] leading-relaxed text-ink">{task.label}</p>
              <fieldset className="mt-3">
                <legend className="sr-only">{task.label}</legend>
                <div className="flex flex-wrap gap-2">
                  {[
                    { keep: false, label: "Happy to hand to AI" },
                    { keep: true, label: "I keep this" },
                  ].map((option) => {
                    const chosen = task.keep === option.keep;
                    return (
                      <label
                        key={option.label}
                        className={`cursor-pointer rounded-full border px-5 py-2.5 text-[14px] ${
                          chosen
                            ? "border-accent bg-accent-soft font-medium text-accent"
                            : "border-line bg-surface text-muted"
                        } has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent`}
                      >
                        <input
                          type="radio"
                          name={`task-${task.label}`}
                          checked={chosen}
                          onChange={() => onSetTaskKeep(task.label, option.keep)}
                          className="sr-only"
                        />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <button type="button" onClick={onContinue} className={primaryButton}>
          Show me what you found
        </button>
      </div>
    </main>
  );
}
