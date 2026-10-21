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
      <legend className="text-[15px] font-medium text-ink">{legend}</legend>
      <div className="mt-4 flex flex-wrap gap-2" role="none">
        {VALUES.map((option) => {
          const checked = value === option;
          return (
            <label
              key={option}
              className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border text-[15px] transition-colors ${
                checked
                  ? "border-accent bg-accent font-medium text-white"
                  : "border-line bg-surface text-muted hover:border-ink hover:text-ink"
              } has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent`}
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
      <p className="mt-3 flex justify-between text-[13px] text-muted">
        <span>1, worried</span>
        <span aria-live="polite">
          {value === null ? "Nothing chosen yet" : `Chosen: ${value} of 10`}
        </span>
        <span>10, excited</span>
      </p>
    </fieldset>
  );
}
