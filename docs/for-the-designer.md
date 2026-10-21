# For the designer

Restyle freely, keep the props, and leave `lib/flow/` alone. Every screen is a plain
component that receives finished data: no fetching, no state machine, no API calls
inside the markup. If you need a different shape, ask rather than reaching into the
logic, because the routes validate against it.

The whole flow is driven by `lib/flow/use-playful-flow.ts`, wired up in `app/page.tsx`.
Five screens plus one detour.

## The screens

| Screen | File |
|---|---|
| Start | `components/start-screen.tsx` |
| Here is what I see | `components/steps/skill-cards.tsx` |
| What lights you up | `components/steps/lights-up.tsx` |
| Opportunities I found for you | `components/steps/opportunities.tsx` |
| Level up (opens on Interested) | `components/steps/level-up.tsx` |
| Your flow | `components/steps/your-flow.tsx` |
| One published story, used on two screens | `components/steps/story.tsx` |

`components/conversation.tsx` and `components/results.tsx` are the earlier version and
are no longer in the flow. Leave them where they are.

## Start

Unchanged from your version. `onStart(profile, feeling)` and `onExample()`. The feeling
score is 1 to 10, where 1 is worried and 10 is excited, and it is optional.

## Here is what I see

- `whereIComeFrom`: two short sentences read from the LinkedIn profile. Capped at about
  35 words, so it fits on one line of a card if you want it there.
- `skills`: six to eight cards, shown one at a time. Each has `name` (three or four
  words), `kind` (`"stated"` means the profile says it outright, `"hidden"` means Claude
  worked it out) and `reasoning` (one line; for a hidden skill it reads "You did X, so
  you probably have Y").
- `index`: which card is showing. When `index` reaches `skills.length` the deck is done
  and the "Anything I missed?" field appears.
- `confirmedCount`: how many they said yes to.
- States: `busy` with an empty `skills` is the first load, `error` is a message to show
  with the `onRetry` button beside it.

## What lights you up

- `lightsUp`: the chosen chips, up to three. The full list is `LIGHTS_UP_CHOICES` in
  `lib/flow/lights-up.ts`.
- `tasks`: four to six tasks, each `{ label, keep }`. `keep` is `true` (I keep this),
  `false` (happy to hand to AI) or `null` until they decide. Nothing starts selected on
  purpose: making the call is the point of the step.

While this screen is open, the live search for the next screen is already running.

## Opportunities I found for you

A deck, one card at a time. Each `Opportunity` carries:

- `title`, `type` (`opening`, `emerging role`, `fractional`, `polywork`, `new field`;
  display names in `OPPORTUNITY_TYPE_LABELS`).
- `skills`: four to six badges, each `{ name, status }`. Status is `"held"` (a skill
  they confirmed), `"hidden"` (a hidden skill they confirmed) or `"to collect"`. Map
  status to colour as you like: the markup only prints the words from
  `SKILL_BADGE_LABELS`, and carries `data-status` on each badge for you to hook into.
  The same names and statuses appear in Level up, so the card and the deck agree.
- `why_you`: one or two lines citing their own skills.
- `skill_to_add`, plus `learning_resource_title` and `learning_resource_url`. The
  resource fields are empty strings when nothing real was found. Never render a link
  from an empty string.
- `source_title` and `source_url`. Also empty strings when the link did not check out:
  the card is kept, the link is removed, and the markup says so in a quiet line.
- `roleStories[card.title]`: the story for this role, fetched when the card appears and
  cached for the session. `undefined` means still loading (show the Thinking state),
  `null` means nothing was found (show the quiet line), an object means show `Story`.

Deck states: `searching` with `searchNote` (one of "Looking at current openings",
"Looking at fractional roles", "Looking at new fields", "Checking sources", rotating
every six seconds), `savedExample` meaning a kept result is standing in for a live
search, and `error` when nothing came back at all.

Reactions: `onReact("interested")` records it and opens Level up for that role,
`onReact("not-for-me")` moves on, `onSurprise()` runs a fresh search for adjacent
options and appends two or three cards.

## Level up

- `levelUp.roleTitle` and `levelUp.opportunityTitle`.
- `levelUp.cards`: six to eight, each `{ name, held, matches_skill, how_to_earn,
  resource_title, resource_url }`. `held` is the same rule as the badge status above.
  `how_to_earn` is one concrete thing to do in 30 to 60 minutes. The resource fields
  are empty strings when nothing real was found.
- `levelUp.collecting`: the card names they tapped "I'll collect this" on. Toggles.
- `levelUp.stories`: one or two published stories. Shown under the heading
  **Meet professionals in this role**. Use that exact wording.
- `levelUp.savedExample`: a kept result is standing in.
- The progress line reads "You hold 4 of 7 cards for <role>".

## Story

`story.kind` is `"video"`, `"article"` or `"community"`. For a video, `embed_url` is a
youtube-nocookie or player.vimeo address and the player is only created when the person
taps Play, with the start time carried over if the link had one. Keep that behaviour:
nothing from YouTube may load before the tap. The iframe needs its `title`, and the
link to the original stays beside it. `why_watch` is the one-line takeaway.

## Your flow

- `flow.step_this_week`: `{ action, minutes, who_to_talk_to }`.
- `flow.closing_line`, `flow.watching_for`.
- `interested`: the opportunities they marked, each with a Level up button.
- `flowMarkdown`: the whole file as text. Download writes `flow.md`, Copy puts it on the
  clipboard. Sections, in order: Where I come from, Skills I confirmed, Hidden skills,
  What lights me up, What I keep what I hand to AI, Opportunities I'm interested in,
  Roles I'm levelling up to, This week's step, Watching for.
- `feelingBefore` and `feelingNow`, shown as "Before 4 · Now 8" once they answer again.
- `onFindNew()` runs the research again from flow.md.

## House rules that are not yours to change

No em dashes or en dashes anywhere in copy, British English, no emoji, no positive
letter-spacing. Keyboard operable, visible focus, contrast at AA, chat and progress
lines in an `aria-live` region, and motion respects `prefers-reduced-motion`.

---

# Martin's design, as built

Followed: **origin/gh-pages `61ad038`, "The Dream Job Configurator"**. Read only, never
checked out. Martin has pushed `1c3159d` since; that one is not in here yet.

## Tokens, all read from his file

In `app/globals.css`, as Tailwind theme variables, so `bg-canvas`, `text-ink`,
`bg-paper`, `card-yellow` and so on work everywhere.

| Token | Value | His source |
|---|---|---|
| `--color-canvas` | `#f1ece2` | `body` background |
| `--color-ink` | `#151313` | `body` colour |
| `--color-paper` | `#fbf8f1` | `.strength`, `.reach`, `.signal` |
| `--color-pink` | `#ff6fae` | `.quote` |
| `--color-yellow` | `#ffe500` | `.path` |
| `--color-amber` | `#ffe36a` | `.step` text, the sun |
| `--color-orange` | `#ff8a4d` | `.reach` left border, the sun |
| `--color-gold` | `#ffc13a` | the sun |
| `--color-muted` | `#514d49` | his ink at 75 per cent, frozen as a solid value |
| `--dots` | `radial-gradient(circle, rgba(40,30,30,.22) 1px, transparent 1.3px)` at 26px | `.dots` |
| `--card-shadow` | `0 14px 30px -18px rgba(40,20,20,.55)` | `.card` |
| `--card-shadow-lift` | `0 20px 44px -18px rgba(40,20,20,.7)` | `.card:hover` |
| `--ring-line` | `1.5px dashed rgba(30,20,20,.45)` | `.ring` |
| `--font-display` | Anton, via `next/font` | his display face |
| `--font-sans` | JetBrains Mono, via `next/font` | his text face |

Classes: `.display`, `.label`, `.strap`, `.paper-card`, `.paper-card-lift`, `.card-pink`,
`.card-yellow`, `.card-ink`, `.card-reach`, `.card-signal`, `.card-outline`, `.blob`,
`.stage`, `.world`, `.obj`, `.depth-ring`, `.ring-label`, `.level-nav`, `.detail-panel`,
`.detail-glow`, `.scrim`, `.dots`.

Primitives in `components/ui.tsx`: `primaryButton`, `secondaryButton`, `quietLink`,
`Eyebrow`, `Brand`, `Display`, `PaperCard`, `ErrorNote`, `Thinking`, `Blob`, `LevelNav`.

**One rename you need to know about.** His class `.ring` is `.depth-ring` here. Tailwind
owns `ring` as a utility and was painting a 1px box-shadow around every SVG.

## The badge palette, as decided

| Status | Style |
|---|---|
| `held` | paper card |
| `hidden` | yellow card |
| `to collect` | outline, his dashed ring line |

Each badge also carries `data-status`, so you can remap colour without touching markup.

## Extensions, where his file had no answer

Each of these is in his language but is mine, so please check them.

1. **Buttons.** His file has no button except the close × and the level navigation. Ink
   block for the primary, outlined for the secondary, mono uppercase at 13px with
   0.12em tracking, which is his `.nav` treatment at a readable size.
2. **Form fields.** The file upload and the textarea are paper cards with his shadow.
   The file button is an ink block.
3. **Chips.** The lights-up chips are paper cards, pink when chosen. The hand-to-AI
   choice is an ink block when chosen, his dashed line when not.
4. **The 1 to 10 score.** Paper squares, ink when chosen, amber numeral.
5. **A fourth level.** His navigation has three; "Your dream job" is a fourth entry that
   takes the camera to the sun.
6. **The dream job panel.** His `.detail` material, at 560px rather than 460px, because
   it carries a title, three lines, the card count and the step.
7. **The flow.md, score and search panel.** Opens over the rings from the dream job
   panel, on his canvas. His file ends at the rings.
8. **Sourceless and empty states.** A quiet muted line in his mono, for a card whose
   link did not check out or a role with no story.

## Accessibility adjustments to his values

Smallest change that clears AA, listed so you can argue with any of them.

1. Card body text from **11px to 14px**, card labels from **11px to 12px**.
2. Inactive level navigation from **40 to 62 per cent ink** (2.5:1 to 4.8:1 on his
   ground). Active is unchanged.
3. The scroll hint from **11px to 12px**, the strapline from 12px to **14px**.
4. Ring cards are **buttons**, not divs, so they take focus; focusing a card moves the
   camera to its ring. Focus ring is 2px ink at 3px offset.
5. `prefers-reduced-motion` gets a **flat fallback**: no flying, no zooming, no ripples,
   the three levels listed as plain card grids with the dream job beneath.

Contrast, measured on his ground: ink on canvas 15.6:1, muted on canvas 7.0:1, amber on
ink 14.4:1, ink on pink 7.1:1, ink on yellow 14.5:1.
