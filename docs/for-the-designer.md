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
