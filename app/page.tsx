"use client";

import { useCallback, useState } from "react";

import { Conversation } from "@/components/conversation";
import { Results } from "@/components/results";
import { StartScreen } from "@/components/start-screen";
import { ErrorNote, quietLink, Thinking } from "@/components/ui";
import {
  APP_NAME,
  readProgress,
  type ChatMessage,
  type Profile,
} from "@/lib/app-config";
import type { CareerMap } from "@/lib/career-map-schema";
import {
  EXAMPLE_PERSON_FEELING,
  EXAMPLE_PERSON_PROFILE,
  EXAMPLE_PERSON_TRANSCRIPT,
} from "@/lib/example-person";

type Screen = "start" | "conversation" | "generating" | "results";

const GENERIC_ERROR = "Something went wrong. Try again.";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("start");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [feeling, setFeeling] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState("");
  const [question, setQuestion] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<CareerMap | null>(null);
  const [flowMarkdown, setFlowMarkdown] = useState("");
  const [isExample, setIsExample] = useState(false);

  /** One streamed turn of the conversation. */
  const runTurn = useCallback(
    async (history: ChatMessage[], withProfile: Profile | null, withFeeling: number | null) => {
      setBusy(true);
      setError(null);
      setStreaming("");
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            profile: withProfile,
            feeling: withFeeling,
          }),
        });

        if (!response.ok || !response.body) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          setError(payload?.error ?? GENERIC_ERROR);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let text = "";
        for (;;) {
          const { value, done: finished } = await reader.read();
          if (finished) break;
          text += decoder.decode(value, { stream: true });
          setStreaming(text);
        }

        setStreaming("");
        if (!text.trim()) {
          setError(GENERIC_ERROR);
          return;
        }
        setMessages([...history, { role: "assistant", content: text }]);
        const progress = readProgress(text);
        if (progress.question !== null) setQuestion(progress.question);
        if (progress.done) setDone(true);
      } catch {
        setError("Could not reach the server. Is the dev server still running?");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const generate = useCallback(
    async (transcript: ChatMessage[], withProfile: Profile | null) => {
      setScreen("generating");
      setError(null);
      try {
        const response = await fetch("/api/map", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: transcript, profile: withProfile }),
        });
        const payload = (await response.json().catch(() => null)) as
          | { map?: CareerMap; flowMarkdown?: string; error?: string }
          | null;

        if (!response.ok || !payload?.map || !payload.flowMarkdown) {
          setError(payload?.error ?? GENERIC_ERROR);
          return;
        }
        setMap(payload.map);
        setFlowMarkdown(payload.flowMarkdown);
        setScreen("results");
      } catch {
        setError("Could not reach the server. Is the dev server still running?");
      }
    },
    [],
  );

  function handleStart(nextProfile: Profile, nextFeeling: number | null) {
    setProfile(nextProfile);
    setFeeling(nextFeeling);
    setMessages([]);
    setQuestion(null);
    setDone(false);
    setIsExample(false);
    setScreen("conversation");
    void runTurn([], nextProfile, nextFeeling);
  }

  function handleExample() {
    setProfile(EXAMPLE_PERSON_PROFILE);
    setFeeling(EXAMPLE_PERSON_FEELING);
    setMessages(EXAMPLE_PERSON_TRANSCRIPT);
    setIsExample(true);
    setDone(true);
    void generate(EXAMPLE_PERSON_TRANSCRIPT, EXAMPLE_PERSON_PROFILE);
  }

  function handleSend(text: string) {
    const history: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    void runTurn(history, profile, feeling);
  }

  function handleRestart() {
    setScreen("start");
    setProfile(null);
    setFeeling(null);
    setMessages([]);
    setStreaming("");
    setQuestion(null);
    setDone(false);
    setError(null);
    setMap(null);
    setFlowMarkdown("");
    setIsExample(false);
  }

  if (screen === "start") {
    return (
      <StartScreen
        onStart={handleStart}
        onExample={handleExample}
        busy={busy}
        error={error}
      />
    );
  }

  if (screen === "conversation") {
    return (
      <Conversation
        messages={messages}
        streaming={streaming}
        question={question}
        done={done}
        busy={busy}
        error={error}
        onSend={handleSend}
        onSeeResults={() => generate(messages, profile)}
      />
    );
  }

  if (screen === "generating") {
    return (
      <main className="mx-auto w-full max-w-[680px] px-6 py-24">
        <p className="text-[13px] font-medium text-muted">{APP_NAME}</p>
        <h1 className="mt-6 text-[28px] leading-tight font-semibold text-ink">
          Building your results
        </h1>
        <div className="mt-6">
          {error ? <ErrorNote message={error} /> : <Thinking label="This takes a few seconds." />}
        </div>
        {error ? (
          <div className="mt-6 flex gap-6">
            <button
              type="button"
              onClick={() => generate(messages, profile)}
              className={quietLink}
            >
              Try again
            </button>
            <button type="button" onClick={handleRestart} className={quietLink}>
              Start again
            </button>
          </div>
        ) : null}
      </main>
    );
  }

  if (map) {
    return (
      <Results
        map={map}
        flowMarkdown={flowMarkdown}
        feelingBefore={feeling}
        isExample={isExample}
        onRestart={handleRestart}
      />
    );
  }

  return null;
}
