# Claude Impact Lab, Copenhagen

Team repo for the Claude Impact Lab, Wednesday 21 October 2026.

## When and where

Doors open at 15:00. We start at 16:00 and end at 21:00. Two building rounds with dinner at 18:00 in between, finishing with demos.
CodeNode Copenhagen, Gdanskgade 2, 2150 Nordhavn.

## The theme

*What does AI mean for my job?* How is AI changing the way we work, and what should we build in response?

## The four paths

- **The person.** Stay good at your work as AI takes over the tasks.
- **The organization.** Turn personal AI gains into shared practice, and decide which work stays human.
- **The community and the city.** Build tools that help people outside tech, and the city they live in, adapt as work changes.
- **The open path.** Bring your own problem about AI and work, and build it with a team.

Teams of three to five form on the night.

## What we are building

**Career advisor.** A personal career advisor that starts from your LinkedIn profile, asks the five things the profile does not show, and gives you back a career map, a `flow.md` file of your own, and a live read on what is changing in your field, with every source shown.

Three screens and a button: start, conversation, results, then "What's new for me?".

## Run it

```bash
npm install
cp .env.example .env     # paste your key as ANTHROPIC_API_KEY=...
npm run dev -- -p 3100
```

Then open http://localhost:3100. `npm run build` and `npm run lint` both need to pass before you push.

Nothing is stored: no database, no files written, no logging of anyone's profile or answers. The key is used server-side only, inside the route handlers. If the key is missing the app says so in the interface instead of crashing. The model is set by `ANTHROPIC_MODEL` and defaults to `claude-sonnet-5-5`.

A "Try with an example person" link on the start screen runs the whole thing on a fictional, clearly labelled profile, which is the safe way to demo it.

## Setup

1. Ask to be added as a collaborator, then clone the repo.
2. Create an account at console.anthropic.com and redeem the event's API credits there.
3. Copy `.env.example` to `.env` and paste your API key. `.env` is never committed.
4. Install Claude Code if you plan to use it.
