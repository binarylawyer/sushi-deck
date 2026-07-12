# M5 — One API, Two Consumers (kickoff for the next build)

> Companion to `PRD.md` / `ARCHITECTURE.md`. This is the plan for the next
> conversation. State at handoff: M0–M4 built; PRs #3 (API) + #4 (editor)
> merged; #5 (export fix) open. Package `@binarylawyer/sushi-deck` @ 0.6.1.

## The shape

One deck **API** (on the existing **Sushi-Kitchen** Supabase), consumed by two
front-ends:

```
                 ┌───────────────────────────── Sushi Deck app (free-standing product) ─────────┐
                 │  front-end: deck gallery · present/scroll · Print→PDF                          │
                 │  admin:     <DeckEditor> (create/edit/generate)                                │
   HOSTS ▶       │  API:       /api/decks (CRUD) · /api/generate   ← createDeckHandlers({store,llm})│
                 └───────────────┬────────────────────────────────────────────────────────────────┘
                                 │  Supabase (Sushi-Kitchen) · decks table   │  Claude API (generate)
                 ┌───────────────┴──────────── moye-law-os (second consumer) ─┘
   CONSUMES ▶    │  present/edit with the same package UI; calls the Sushi Deck
                 │  API with a service token; firm auth + tenancy (owner = firm)
                 └───────────────────────────────────────────────────────────
```

**Decision to confirm first:** does the **Sushi Deck app host the API** (recommended
— it needs the routes for its own admin, one source of truth, moye-law-os calls
it with an API key), or does each app mount the package handlers against the
shared DB (no hosted API)? The plan below assumes the hosted-API option.

## Build order (test-first)

1. **DB** — add the `decks` table to Sushi-Kitchen (`supabase/migrations/0001_decks.sql`).
   Confirm `SupabaseDeckStore` green against it (`SUSHI_TEST_SUPABASE_*` → run the
   shared `deckStoreContract`).
2. **Sushi Deck app** (new Next app, consumes the package):
   - API routes mounting `createDeckHandlers({ store: new SupabaseDeckStore(...), llm })`.
   - Auth: an API-key/service-token check on the API; `owner` tenancy on rows.
   - Front-end: deck index → present (`DeckRuntime`) / scroll (`ScrollView`) / PDF.
   - Admin: `<DeckEditor>` wired to `onSave` → `PUT /api/decks/:id`; a generate
     action → `POST /api/generate`.
   - LLM adapter: wrap the Claude API in the `LlmClient` interface.
3. **moye-law-os consumer:**
   - A deck client that calls the Sushi Deck API (list/get/create/update/generate)
     with the firm's service token.
   - Present + edit surfaces using the same package components, themed to Moye
     Mondrian tokens.
   - Optionally: author/edit the Lentini "Pulse" deck as `DeckJson` through it.
4. **Portability check:** a third (throwaway) consumer proves the API + package
   drop into any app.

## Auth across consumers

- Sushi Deck app admin: its own login (or the optional `@…/gate`).
- moye-law-os → Sushi Deck API: a service token / API key, `owner` scoped to the
  firm. The API never trusts a client-supplied tenant.
- Recipient viewing (present): per-app (moye uses its magic-link envelopes; the
  standalone app can use the password gate or public links).

## Loose ends to clear at kickoff

- Merge PR #5 (restores `./generate` + `./api` exports).
- Repo rename `deck-kit → sushi-deck` is done; update `add_repo`/remotes to the
  new name in the new session.
- Reuse Sushi-Kitchen Supabase (moving to a dedicated project later = re-run the
  migration + `pg_dump | psql`, easy).
