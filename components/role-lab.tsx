"use client";

import { useState } from "react";

import type { InventedRole } from "@/lib/discover-schema";

import { ErrorNote, primaryButton, quietLink, secondaryButton, Thinking } from "./ui";

interface RoleLabProps {
  roles: InventedRole[] | null;
  remixing: boolean;
  error: string | null;
  onRemix: (seen: string[]) => void;
  onPick: (name: string, pitch: string) => void;
  onRetry: () => void;
}

const TINTS = ["bg-yellow", "bg-pink", "bg-orange", "bg-surface"];

export function RoleLab({ roles, remixing, error, onRemix, onPick, onRetry }: RoleLabProps) {
  const [name, setName] = useState("");
  const [pitch, setPitch] = useState("");
  const [seen, setSeen] = useState<string[]>([]);

  const list = roles ?? [];

  function choose(role: InventedRole) {
    setName(role.name);
    setPitch(role.pitch);
  }

  function remix() {
    setSeen((prev) => [...prev, ...list.map((r) => r.name)]);
    onRemix([...seen, ...list.map((r) => r.name)]);
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] px-6 py-10">
      <p className="text-[11px] font-bold tracking-[0.14em] uppercase">Step 4 of 4 · Invent</p>
      <h1 className="font-display mt-4 text-[clamp(32px,5vw,56px)] leading-[0.95] uppercase">
        A job that doesn&apos;t exist <span className="bg-yellow px-2">yet</span>
      </h1>
      <p className="mt-4 max-w-[60ch] text-[13px] text-muted">
        Pick one, remix the batch, or just rename it. This is your role. Make it yours.
      </p>

      {error ? (
        <div className="mt-8 max-w-[56ch]">
          <ErrorNote message={error} />
          <button type="button" onClick={onRetry} className={`${quietLink} mt-4`}>
            Try again
          </button>
        </div>
      ) : null}

      {!roles && !error ? (
        <div className="mt-16">
          <Thinking label="Mashing your skills together" />
        </div>
      ) : null}

      {roles ? (
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <ul className="grid gap-4 sm:grid-cols-2">
            {list.map((role, i) => {
              const on = name === role.name;
              return (
                <li key={role.name}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => choose(role)}
                    style={{ animationDelay: `${i * 90}ms` }}
                    className={`card-in h-full w-full rounded-sm border-2 border-ink p-5 text-left transition-transform hover:-translate-y-1 ${TINTS[i % TINTS.length]} ${
                      on ? "hard-shadow -translate-y-1" : ""
                    }`}
                  >
                    <span className="font-display block text-[30px] leading-[0.98] uppercase">
                      {role.name}
                    </span>
                    <span className="mt-3 block text-[12px] leading-relaxed">{role.pitch}</span>
                    <span className="mt-4 flex flex-wrap gap-1.5">
                      {role.built_from.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-ink px-2 py-0.5 text-[10px] uppercase"
                        >
                          {skill}
                        </span>
                      ))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <aside className="h-fit rounded-sm border-2 border-ink bg-surface p-6 hard-shadow">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase">Your role</p>
            <label htmlFor="role-name" className="sr-only">
              Role name
            </label>
            <input
              id="role-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name it"
              className="font-display mt-3 w-full border-b-2 border-ink bg-transparent pb-2 text-[34px] uppercase placeholder:text-muted/50"
            />
            <label htmlFor="role-pitch" className="sr-only">
              What you do
            </label>
            <textarea
              id="role-pitch"
              rows={5}
              value={pitch}
              onChange={(event) => setPitch(event.target.value)}
              placeholder="What do you do, for whom, and why only you?"
              className="mt-4 w-full rounded-sm border-2 border-ink bg-canvas p-3 text-[13px] leading-relaxed"
            />
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <button
                type="button"
                className={primaryButton}
                disabled={name.trim().length < 3}
                onClick={() => onPick(name.trim(), pitch.trim())}
              >
                Build my map
              </button>
              <button
                type="button"
                className={secondaryButton}
                disabled={remixing}
                onClick={remix}
              >
                {remixing ? "Remixing" : "Remix"}
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}

