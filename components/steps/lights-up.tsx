"use client";

import { LIGHTS_UP_CHOICES, MAX_LIGHTS_UP } from "@/lib/flow/lights-up";
import type { TaskChoice } from "@/lib/flow/types";

import { primaryButton } from "../ui";

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
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-dashed border-line pb-5">
        <p className="label" aria-live="polite">
          {lightsUp.length} of {MAX_LIGHTS_UP} chosen
        </p>
      </header>

      <h1 className="display mt-10 text-[40px] sm:text-[52px]">What lights you up</h1>

      <fieldset className="mt-10">
        <legend className="label">Pick up to three</legend>
        <div className="mt-4 flex flex-wrap gap-2">
          {LIGHTS_UP_CHOICES.map((choice) => {
            const chosen = lightsUp.includes(choice);
            const full = !chosen && lightsUp.length >= MAX_LIGHTS_UP;
            return (
              <label
                key={choice}
                className={`cursor-pointer rounded-[3px] px-5 py-2.5 text-[14px] font-bold tracking-[0.08em] uppercase transition-[scale] hover:scale-[1.03] ${
                  chosen ? "paper-card card-pink text-ink" : "paper-card text-ink"
                } ${full ? "opacity-50" : ""} has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-ink`}
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

      <div className="mt-12 border-t border-dashed border-line pt-10">
        <h2 className="label">Which of these would you hand to AI tomorrow?</h2>
        <ul className="mt-4 space-y-3">
          {tasks.map((task) => (
            <li
              key={task.label}
              className="paper-card rounded-[4px] p-4"
            >
              <p className="text-[14px] leading-[1.6] text-ink">{task.label}</p>
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
                        className={`cursor-pointer rounded-[3px] border px-5 py-2.5 text-[12px] font-bold tracking-[0.1em] uppercase ${
                          chosen
                            ? "border-ink bg-ink text-amber"
                            : "border-ink/30 bg-transparent text-ink"
                        } has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-ink`}
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
