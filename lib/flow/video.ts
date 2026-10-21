/**
 * Turns a YouTube or Vimeo page URL into a privacy-friendly embed URL.
 * Returns an empty string for anything else, so only known video hosts can
 * ever be framed. The player is only ever loaded after the person taps Play.
 */
/** Reads a start time from a YouTube or Vimeo link: t=90, t=1m30s, #t=90. */
export function startSeconds(rawUrl: string): number {
  const raw =
    rawUrl.match(/[?&#](?:t|start)=([0-9hms]+)/i)?.[1] ??
    rawUrl.match(/#t=([0-9hms]+)/i)?.[1];
  if (!raw) return 0;
  if (/^\d+$/.test(raw)) return Number(raw);
  const hours = Number(raw.match(/(\d+)h/i)?.[1] ?? 0);
  const minutes = Number(raw.match(/(\d+)m/i)?.[1] ?? 0);
  const seconds = Number(raw.match(/(\d+)s/i)?.[1] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

/** Builds the player URL used only after the person taps Play. */
export function playerUrl(embedUrl: string, sourceUrl: string): string {
  const start = startSeconds(sourceUrl);
  const params = new URLSearchParams({ autoplay: "1" });
  if (start > 0) params.set("start", String(start));
  return `${embedUrl}?${params.toString()}`;
}

export function toEmbedUrl(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return "";
  }
  if (url.protocol !== "https:") return "";
  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : "";
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : "";
    }
    const embedMatch = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/);
    if (embedMatch) {
      return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(embedMatch[1])}`;
    }
    return "";
  }
  if (host === "vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return /^\d+$/.test(id ?? "") ? `https://player.vimeo.com/video/${id}` : "";
  }
  if (host === "player.vimeo.com") {
    const id = url.pathname.match(/^\/video\/(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : "";
  }
  return "";
}
