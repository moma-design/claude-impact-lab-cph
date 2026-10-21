"use client";

const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface FeelingScaleProps {
  name: string;
  legend: string;
  value: number | null;
  onChange: (value: number) => void;
}

export function FeelingScale({ name, legend, value, onChange }: FeelingScaleProps) {
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div className="mt-4 flex flex-wrap gap-2" role="none">
        {VALUES.map((option) => {
          const checked = value === option;
          return (
            <label
              key={option}
              className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-[3px] text-[14px] font-bold transition-[scale] hover:scale-[1.06] ${
                checked
                  ? "bg-ink text-amber"
                  : "paper-card text-ink"
              } has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-ink`}
            >
              <input
                type="radio"
                name={name}
                value={option}
                checked={checked}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              {option}
            </label>
          );
        })}
      </div>
      <p className="mt-3 flex justify-between text-[12px] tracking-[0.1em] text-muted uppercase">
        <span>1, worried</span>
        <span aria-live="polite">
          {value === null ? "Nothing chosen yet" : `Chosen: ${value} of 10`}
        </span>
        <span>10, excited</span>
      </p>
    </fieldset>
  );
}
