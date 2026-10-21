/**
 * The interface holds every card to two lines, so the data is clamped here
 * rather than hidden with CSS. Limits are applied after parsing, not in the
 * JSON schema sent to the API, because maxLength is outside the supported
 * subset and a rejected request mid-demo costs more than a trimmed sentence.
 */

/** Trims to a word boundary, without leaving a dangling full stop. */
export function clampWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(" ").replace(/[,;:]$/, "") + ".";
}

export function clampChars(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  const cut = trimmed.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.]$/, "") + ".";
}
