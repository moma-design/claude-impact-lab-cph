import type Anthropic from "@anthropic-ai/sdk";

import type { Profile } from "@/lib/app-config";

const MAX_PROFILE_TEXT = 20000;

/**
 * Turns the uploaded LinkedIn PDF or pasted profile text into content blocks.
 * The PDF goes straight to Claude as a base64 document block: nothing is parsed
 * locally, and nothing is written to disk.
 */
export function profileBlocks(profile: Profile | null | undefined): Anthropic.ContentBlockParam[] {
  if (!profile) return [];

  if (profile.kind === "pdf") {
    if (!profile.data) return [];
    return [
      {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: profile.data,
        },
      },
      { type: "text", text: "That document is my LinkedIn profile." },
    ];
  }

  const text = profile.text.trim().slice(0, MAX_PROFILE_TEXT);
  if (!text) return [];
  return [{ type: "text", text: `My LinkedIn profile:\n"""\n${text}\n"""` }];
}

export function hasProfile(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  return profile.kind === "pdf" ? Boolean(profile.data) : Boolean(profile.text.trim());
}
