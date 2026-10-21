import Anthropic from "@anthropic-ai/sdk";

// Server only. Import this from route handlers, never from a client component.

/** Default is fast enough to stream comfortably in a live demo. */
export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

export const MISSING_KEY_MESSAGE =
  "No API key found. Add ANTHROPIC_API_KEY to .env in the project root, then restart the dev server.";

export class MissingApiKeyError extends Error {
  constructor() {
    super(MISSING_KEY_MESSAGE);
    this.name = "MissingApiKeyError";
  }
}

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/**
 * Server-side only. The key never reaches the browser: every call to Claude
 * goes through a route handler.
 */
export function getClient(): Anthropic {
  if (!hasApiKey()) throw new MissingApiKeyError();
  return new Anthropic();
}

/** Turns any failure into a short, friendly line for the interface. */
export function describeError(error: unknown): { status: number; message: string } {
  if (error instanceof MissingApiKeyError) {
    return { status: 503, message: MISSING_KEY_MESSAGE };
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return {
      status: 503,
      message: "The API key was rejected. Check ANTHROPIC_API_KEY in .env.",
    };
  }
  if (error instanceof Anthropic.RateLimitError) {
    return { status: 429, message: "Rate limited. Wait a moment and try again." };
  }
  if (error instanceof Anthropic.APIError) {
    return { status: 502, message: `Claude returned an error: ${error.message}` };
  }
  return { status: 500, message: "Something went wrong. Try again." };
}
