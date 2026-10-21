# Project context

**Career advisor** is a personal career advisor built on the Claude API. It starts from the person's LinkedIn profile (PDF or pasted text), asks five questions about what the profile does not show, and returns a career map, a flow.md file they keep, and a live, sourced read on what is changing in their field.

**Run it:** `npm install`, add your key to `.env` as `ANTHROPIC_API_KEY=...`, then `npm run dev -- -p 3100`.

**No data is stored.** Everything lives in browser state for the length of one session: no database, no files written, no logging of profiles or answers. The API key is read server-side only, inside the route handlers.

## Rules

- Never commit `.env` or any API key.
- Test data is fictional unless the person it describes agrees to its use.
- Small commits, pushed often, so the whole team stays in sync.
