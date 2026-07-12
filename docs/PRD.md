# Sushi Deck — Product Requirements (PRD)

> Status: draft v0.1 · Owner: Binary Lawyer · Last updated: 2026-07
> Package: `@binarylawyer/sushi-deck-kit` · Repo: `binarylawyer/sushi-deck`

## 1. One line

A portable, **API-driven presentation builder** — typed React slides on a
brand-themeable artboard, a **data-driven JSON deck format**, a multi-tenant
**storage API**, and **AI generation** — so every app and business we own can
create, store, edit, and present on-brand decks from one shared foundation.

## 2. Why (problem)

We run several products and service businesses that each need to produce
presentations (pitch decks, investor updates, client proposals, internal
reviews). Today that means bespoke one-off HTML or slide files per app, with no
shared brand system, no storage, no reuse, and no way for a non-developer to
edit a deck. We want **one presentation foundation** that:

- looks like *each* brand (theming), not a template;
- is editable by non-developers through an admin UI;
- is stored and served via an API so any app can read/write decks;
- can be **generated** from a brief with AI, then refined;
- exports to PDF and presents live.

## 3. Users

| User | Need |
|---|---|
| **Our apps** (moye-law-os, and others) | Consume the library + call the deck API to store/serve/generate decks. |
| **Attorneys / operators (non-dev)** | Create + edit decks in an admin UI without touching code. |
| **Developers** | Author bespoke decks in typed React; extend blocks + themes. |
| **Recipients** (clients/investors) | View a deck (present or scroll), optionally behind a password. |

## 4. Competitive landscape (open source)

Slides-as-code and AI generators exist; none combine brand-token theming + a
typed edit-ops JSON format + a multi-tenant storage/generation API the way we
need. We borrow the best of each and differentiate on integration.

| Project | What it is | What we take / how we differ |
|---|---|---|
| [Slidev](https://sli.dev) (~38k★) | Vue + Markdown, dev demos | Presenter mode, export ideas. We're React + typed blocks, not Markdown. |
| [Reveal.js](https://revealjs.com) | Vanilla JS HTML slides | Keyboard/print model. We're component-based + themeable. |
| [Marp](https://marp.app) | Markdown → PDF/PPTX | PDF export discipline. We add storage + AI + editing. |
| [Spectacle](https://github.com/FormidableLabs/spectacle) (~10k★) | React slide lib | Closest peer. We add JSON format, edit-ops, storage API, generation, brand theming. |
| [Presenton](https://github.com/presenton/presenton) | OSS AI generator + API | Validates the "generate via API + JSON" thesis. Ours is React-native + brand-first + editable, not one-shot PPTX. |
| [ALLWEONE presentation-ai](https://github.com/allweonedev/presentation-ai) | Next.js Gamma alternative | Confirms Next.js + AI stack fit. We're a reusable kit + API, not a single app. |
| [slidegen](https://github.com/sanand0/slidegen) / [SlideDeck-AI](https://github.com/barun-saha/slide-deck-ai) | JSON → slides | JSON-schema approach. Ours is typed, edit-op-driven, and rendered by the same runtime we present with. |

**Our wedge:** brand-token theming + a typed `DeckJson` with immutable **edit
operations** (not just generate-once) + an **auth-agnostic storage API** reused
across our apps + AI generation that outputs *our* format.

## 5. Principles

1. **Auth-agnostic core.** The kit never bundles auth; apps bring their own (a
   drop-in password gate ships as an option; moye-law-os uses magic links).
2. **Themeable, not templated.** Every color/font is a `--dk-*` token; brands
   override tokens, code never forks.
3. **One format, three uses.** `DeckJson` is authored (dev), generated (AI), and
   edited (non-dev) — and rendered by a single runtime for present/scroll/PDF.
4. **Test-first.** Every layer is proven by tests; the storage layer by a
   reusable contract shared across implementations.
5. **Portable.** Shipped as a versioned package; consumed by many apps.

## 6. Scope

### Shipped (v0.1–v0.4)
- Runtime: present / overview / presenter / scroll / Print→PDF.
- Authoring: slide primitives + 10 content blocks + theming.
- Optional password gate.
- **Data-driven JSON format** + renderer + immutable edit operations.
- **TDD foundation** (Vitest + CI) + `DeckStore` contract + in-memory store.

### Next (this build)
- **Supabase `DeckStore`** (production storage; runs the shared contract).
- **Deck API** — CRUD + list, serving `DeckJson`, validated on write.
- **AI generation** — brief (+ brand) → `DeckJson` via an LLM, validated.
- **Reference editor UI** — add/remove/reorder slides + edit block fields, live
  preview (built on the edit-ops), first in moye-law-os.

### Later
- Compiled `dist` build for non-Next consumers.
- Asset handling (images), more block types, charts.
- Export to PPTX (evaluate; PDF covers most needs today).
- Versioning/history, comments, share links + analytics.

## 7. Non-goals

- Not a Markdown deck tool (we're typed/React + JSON).
- Not a standalone SaaS product; it's *our* internal foundation (though
  publishable).
- The kit does not own auth or a database — those are app/deployment concerns.

## 8. Milestones

| Milestone | Deliverable | State |
|---|---|---|
| M0 | Runtime + blocks + theming + gate | ✅ |
| M1 | JSON format + edit ops | ✅ |
| M2 | TDD + DeckStore contract + in-memory | ✅ |
| M3 | Supabase store + CRUD API + generation | ⏳ next |
| M4 | Reference editor UI (moye-law-os) | ⏳ |
| M5 | Adopt across other apps | ⏳ |

## 9. Success metrics

- N apps consuming `@binarylawyer/sushi-deck-kit` (target ≥ 2 within the first two
  builds: moye-law-os + one more).
- A non-developer creates + edits a deck end-to-end without code.
- A branded deck generated from a brief in < 1 minute, then refined.
- 100% of the storage contract green on every implementation; CI green on PRs.
