"use client";

import { useEffect, useRef, useState } from "react";

import {
  APP_NAME,
  QUESTION_COUNT,
  SKIP_AVAILABLE_AFTER,
  stripMarkers,
  type ChatMessage,
} from "@/lib/app-config";

import { ErrorNote, primaryButton, quietLink, Thinking } from "./ui";

interface ConversationProps {
  messages: ChatMessage[];
  streaming: string;
  question: number | null;
  done: boolean;
  busy: boolean;
  error: string | null;
  onSend: (text: string) => void;
  onSeeResults: () => void;
}

export function Conversation({
  messages,
  streaming,
  question,
  done,
  busy,
  error,
  onSend,
  onSeeResults,
}: ConversationProps) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, streaming, done]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    onSend(text);
  }

  const canSkip = !done && question !== null && question >= SKIP_AVAILABLE_AFTER;
  const progressLabel = done
    ? "All five questions answered"
    : `Question ${question ?? 1} of ${QUESTION_COUNT}`;

  return (
    <main className="mx-auto w-full max-w-[680px] px-6 py-12 sm:py-16">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-5">
        <p className="text-[13px] font-medium text-muted">{APP_NAME}</p>
        <p className="text-[13px] text-muted" aria-live="polite">
          {progressLabel}
        </p>
      </header>

      <div className="mt-10 space-y-8" aria-live="polite" aria-atomic="false">
        {messages.map((message, index) => {
          const text = stripMarkers(message.content);
          if (!text) return null;
          return message.role === "assistant" ? (
            <div key={index}>
              <p className="text-[13px] text-muted">Advisor</p>
              <p className="mt-2 text-[18px] leading-[1.6] whitespace-pre-line text-ink">
                {text}
              </p>
            </div>
          ) : (
            <div key={index} className="rounded-xl bg-accent-soft px-5 py-4">
              <p className="text-[13px] text-accent">You</p>
              <p className="mt-2 text-[16px] leading-[1.6] whitespace-pre-line text-ink">
                {text}
              </p>
            </div>
          );
        })}

        {streaming ? (
          <div>
            <p className="text-[13px] text-muted">Advisor</p>
            <p className="mt-2 text-[18px] leading-[1.6] whitespace-pre-line text-ink">
              {stripMarkers(streaming)}
            </p>
          </div>
        ) : null}

        {busy && !streaming ? <Thinking label="Reading your profile" /> : null}
      </div>

      {error ? (
        <div className="mt-8">
          <ErrorNote message={error} />
        </div>
      ) : null}

      <div ref={endRef} />

      {done ? (
        <div className="mt-12 border-t border-line pt-8">
          <button type="button" onClick={onSeeResults} className={primaryButton}>
            See my results
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-12 border-t border-line pt-8">
          <label htmlFor="answer" className="block text-[15px] font-medium text-ink">
            Your answer
          </label>
          <textarea
            id="answer"
            name="answer"
            rows={4}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                handleSubmit(event);
              }
            }}
            className="mt-3 w-full resize-y rounded-lg border border-line bg-surface p-4 text-[16px] leading-relaxed text-ink placeholder:text-muted"
            placeholder="Take as much or as little space as you like."
          />
          <div className="mt-5 flex flex-wrap items-center gap-6">
            <button type="submit" className={primaryButton} disabled={busy || !draft.trim()}>
              Send
            </button>
            {canSkip ? (
              <button type="button" onClick={onSeeResults} className={quietLink}>
                Skip to my results
              </button>
            ) : null}
          </div>
        </form>
      )}
    </main>
  );
}
