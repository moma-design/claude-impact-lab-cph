"use client";

import { useEffect, useRef, useState } from "react";

import type { OpenRole } from "@/lib/flow/types";

import type { PanelContent } from "../detail-panel";
import { Thinking } from "../ui";

interface OpenRolesProps {
  dreamJobTitle: string;
  whereIComeFrom: string;
  isExample: boolean;
  onRoles: (roles: OpenRole[]) => void;
  onDetails: (panel: PanelContent) => void;
}

/**
 * Current public postings close to the dream job. One line each; the reason
 * it is close lives in the glass panel. Searched once, when the sun opens.
 */
export function OpenRoles({
  dreamJobTitle,
  whereIComeFrom,
  isExample,
  onRoles,
  onDetails,
}: OpenRolesProps) {
  const [roles, setRoles] = useState<OpenRole[] | null>(null);
  const [savedExample, setSavedExample] = useState(false);
  const [failed, setFailed] = useState(false);
  const asked = useRef(false);

  useEffect(() => {
    if (asked.current || !dreamJobTitle) return;
    asked.current = true;

    void (async () => {
      try {
        const response = await fetch("/api/open-roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dreamJobTitle, whereIComeFrom, isExample }),
        });
        const payload = (await response.json().catch(() => null)) as
          | { roles?: OpenRole[]; savedExample?: boolean }
          | null;
        if (!response.ok || !payload?.roles?.length) {
          setFailed(true);
          return;
        }
        setRoles(payload.roles);
        setSavedExample(Boolean(payload.savedExample));
        onRoles(payload.roles);
      } catch {
        setFailed(true);
      }
    })();
  }, [dreamJobTitle, isExample, onRoles, whereIComeFrom]);

  return (
    <section className="relative mt-6 border-t border-dashed border-line pt-4">
      <p className="label">Open roles close to your dream job</p>

      {roles === null && !failed ? (
        <div className="mt-3">
          <Thinking label="Searching job boards" />
        </div>
      ) : null}

      {failed ? (
        <p className="mt-2 text-[14px] leading-[1.6] text-ink">
          Nothing current turned up this time.
        </p>
      ) : null}

      {roles ? (
        <>
          <ul className="mt-3 space-y-1.5">
            {roles.map((role) => (
              <li key={role.url} className="text-[14px] leading-[1.5]">
                <a
                  href={role.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink underline underline-offset-4"
                >
                  {role.title}
                </a>
                <span className="text-muted">
                  {" "}
                  · {role.organisation} · {role.location}
                </span>{" "}
                <button
                  type="button"
                  onClick={() =>
                    onDetails({
                      kind: "Open role",
                      title: role.title,
                      paragraphs: [
                        `${role.organisation}, ${role.location}.`,
                        role.why_close,
                        "Found today. Check before applying.",
                      ],
                      links: [{ label: "Open the posting", href: role.url }],
                    })
                  }
                  className="text-[12px] font-bold tracking-[0.1em] text-ink uppercase underline underline-offset-4"
                >
                  Why
                </button>
              </li>
            ))}
          </ul>
          <p className="label mt-3">
            {savedExample ? "Saved example. " : ""}Found today. Check before applying.
          </p>
        </>
      ) : null}
    </section>
  );
}
