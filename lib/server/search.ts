import type Anthropic from "@anthropic-ai/sdk";

/** Every URL the search actually returned, so no invented source can survive. */
export function collectSourceUrls(content: Anthropic.ContentBlock[]): Map<string, string> {
  const found = new Map<string, string>();
  for (const block of content) {
    if (block.type !== "web_search_tool_result") continue;
    // An error result is an object, a success result is a list.
    if (!Array.isArray(block.content)) continue;
    for (const result of block.content) {
      if (result.type === "web_search_result" && result.url) {
        found.set(normaliseUrl(result.url), result.title || result.url);
      }
    }
  }
  return found;
}

export function normaliseUrl(url: string): string {
  return url.trim().replace(/[#?].*$/, "").replace(/\/+$/, "").toLowerCase();
}

/** Pulls the JSON object out of a reply that may also contain prose. */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate =
    fenced?.[1] ?? text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  if (!candidate.trim()) return null;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

export const WEB_SEARCH_TOOL = {
  type: "web_search_20260209",
  name: "web_search",
  max_uses: 8,
} as const satisfies Anthropic.ToolUnion;
