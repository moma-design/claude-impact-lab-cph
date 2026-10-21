/**
 * Shared, client-safe configuration.
 * Nothing secret belongs in this file: it is bundled into the browser.
 */

/** Working title. Rename here and the whole interface follows. */
export const APP_NAME = "Career advisor";

export const TAGLINE = "Your career, read from what you know rather than your job title.";

export const SUPPORTING_LINE =
  "Start with your LinkedIn profile, add the five things it does not show, and leave with a flow.md file of your own and a live read on what is changing.";

/** The interview questions, in order. Shown to the person as "Question n of 5". */
export const QUESTIONS = [
  "What have you done that is not on LinkedIn: side projects, volunteering, things people come to you for?",
  "Which skills do you have that you have never listed?",
  "Which parts of your work give you energy, and which would you happily hand to AI tomorrow?",
  "What do you have to keep doing yourself to stay good at your work?",
  "What matters in what comes next: freedom, stability, variety, impact, place?",
] as const;

export const QUESTION_COUNT = QUESTIONS.length;

/** The question number after which the demo shortcut appears. */
export const SKIP_AVAILABLE_AFTER = 2;

export const MAX_PDF_BYTES = 20 * 1024 * 1024;

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** The LinkedIn profile, as a PDF the person uploaded or as pasted text. */
export type Profile =
  | { kind: "pdf"; name: string; data: string }
  | { kind: "text"; text: string };

/**
 * Claude ends every interview turn with a progress marker, for example
 * `[[q=2]]` or `[[q=done]]`, so the interface can show "Question 2 of 5"
 * without guessing. The marker is stripped before anything is rendered.
 */
const MARKER = /\[\[q=(\d+|done)\]\]/g;
/** Catches a marker that is still arriving mid-stream, e.g. "[[q=" or "[[q=d". */
const PARTIAL_MARKER = /\[{1,2}(q(=(\d+|d|do|don|done)?)?)?$/;

export interface Progress {
  /** 1 to QUESTION_COUNT, or null when no marker has arrived yet. */
  question: number | null;
  done: boolean;
}

export function readProgress(text: string): Progress {
  let question: number | null = null;
  let done = false;
  for (const match of text.matchAll(MARKER)) {
    if (match[1] === "done") {
      done = true;
    } else {
      question = Number(match[1]);
    }
  }
  return { question, done };
}

/** Removes complete and partially streamed markers from text before display. */
export function stripMarkers(text: string): string {
  return text.replace(MARKER, "").replace(PARTIAL_MARKER, "").trimEnd();
}
