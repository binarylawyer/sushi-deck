# Sushi Deck — Architecture (API ⇄ Frontend)

> Companion to `PRD.md`. Scopes how the pieces fit and how the API and frontend
> work together, so the next build has a clear contract. Draft v0.1.

## 1. The pieces

```
┌─────────────────────────── @binarylawyer/sushi-deck (package) ───────────────────────────┐
│  runtime        DeckRuntime · ScrollView · ScaledPage        (present/scroll/PDF)          │
│  authoring      SlidePage · Opener · Cover · 10 blocks · theme tokens                      │
│  /json          DeckJson schema · deckFromJson() · edit ops · validateDeckJson()           │
│  /store         DeckStore interface · InMemoryDeckStore · deckStoreContract (tests)        │
│  /gate          optional password gate (server helpers + PasswordGate)                     │
└───────────────────────────────────────────────────────────────────────────────────────────┘
        ▲ imported by                                   ▲ imported by
        │                                               │
┌───────┴───────────────┐                    ┌──────────┴──────────────────────────┐
│  Builder app (Next)    │  HTTP (fetch)      │  API layer (Next route handlers)     │
│  - editor UI           │ ─────────────────▶ │  /api/decks        CRUD + list        │
│  - live preview        │ ◀───────────────── │  /api/decks/:id                       │
│  - present/scroll pages│    DeckJson        │  /api/generate     brief → DeckJson   │
└────────────────────────┘                    └──────────┬───────────────────────────┘
                                                          │ DeckStore (SupabaseDeckStore)
                                                          ▼
                                                ┌──────────────────────┐   ┌───────────────┐
                                                │  Supabase (new proj) │   │  LLM (Claude) │
                                                │  decks table (jsonb) │   │  generation   │
                                                └──────────────────────┘   └───────────────┘
```

The **package** is pure and testable. The **API layer** and **builder app** are
thin: they wire the package's store + json modules to Supabase, an LLM, and a UI.
moye-law-os is the first consumer of the API + editor; other apps follow.

## 2. Data model (Supabase — new dedicated project)

```sql
create table public.decks (
    id          uuid primary key default gen_random_uuid(),
    slug        text not null unique,
    title       text not null,
    deck        jsonb not null,          -- the DeckJson
    theme       jsonb,                   -- optional brand overrides
    owner       text,                    -- app/tenant id (multi-tenant)
    version     int  not null default 1, -- optimistic concurrency
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);
create index decks_owner_idx on public.decks (owner, updated_at desc);
```

`SupabaseDeckStore implements DeckStore` and **runs `deckStoreContract`** against
a test schema/branch — so it's proven identical to the in-memory store. Row-level
security scopes rows by `owner`/tenant per the consuming app's auth.

## 3. API surface (v1)

All bodies are JSON; writes validated with `validateDeckJson` before hitting the
store; errors map store exceptions → HTTP codes.

| Method | Path | Body → Result | Notes |
|---|---|---|---|
| `GET` | `/api/decks` | → `DeckListItem[]` | list (scoped by tenant) |
| `POST` | `/api/decks` | `{slug?, deck}` → `StoredDeck` | 409 on dup slug, 422 on invalid |
| `GET` | `/api/decks/:id` | → `StoredDeck` | 404 if missing |
| `GET` | `/api/decks/slug/:slug` | → `StoredDeck` | serve by slug |
| `PUT` | `/api/decks/:id` | `{deck?, slug?, expectedVersion?}` → `StoredDeck` | 409 on version/slug conflict |
| `DELETE` | `/api/decks/:id` | → `204` | 404 if missing |
| `POST` | `/api/generate` | `{brief, brand?, slides?}` → `DeckJson` | LLM → validate → return (caller may then POST to store) |

Error mapping: `DeckValidationError → 422 {errors}`, `DeckConflictError → 409`,
`DeckNotFoundError → 404`.

## 4. Auth (agnostic)

The package owns no auth. Each deployment gates the API + pages its own way:

- **moye-law-os**: reuses its magic-link / firm-role model; the deck API sits
  behind the same session, `owner` = firm/tenant.
- **Other apps / marketing**: the optional `@binarylawyer/sushi-deck/gate`
  shared-password gate, or public.
- The API layer reads the caller's identity from the host app's session and sets
  `owner` — the store never trusts a client-supplied tenant.

## 5. Frontend ⇄ API flow

**Editing (non-dev):**
1. Editor loads a deck: `GET /api/decks/:id` → `DeckJson`.
2. UI edits call the pure **edit ops** locally (`addSlide`, `moveSlide`,
   `addBlock`, …) → new `DeckJson` in component state.
3. **Live preview**: `deckFromJson(state)` → `<DeckRuntime>` / `<ScrollView>`
   renders the exact same output the recipient will see.
4. Save: `PUT /api/decks/:id` with `expectedVersion` → optimistic concurrency.

**Generating:** brief → `POST /api/generate` → `DeckJson` (validated) → editor
loads it as state → user refines → save.

**Presenting:** a deck page does `GET /api/decks/slug/:slug` (server-side),
gates as needed, and renders `<DeckRuntime deck={deckFromJson(json)}
theme={json.theme} />`. Print → PDF from the same page.

> RSC note: `deckFromJson` produces render functions, so the runtime must be
> rendered in a client component — fetch the JSON server-side, pass the plain
> JSON to a client wrapper that calls `deckFromJson` there.

## 6. Generation (pluggable, testable)

```
generateDeck(brief, { brand, slides }, llm) →
    llm.complete(prompt(brief, brand, schema)) → parse JSON → validateDeckJson →
    (retry once on invalid) → DeckJson
```

- `llm` is an injected client (interface), so tests use a **fake** returning
  canned JSON — no network, deterministic. Production wires the Claude API.
- The prompt embeds the `DeckJson` schema + brand tokens and requires strict
  JSON. Output is always run through `validateDeckJson`; invalid → one repair
  retry, then error.

## 7. TDD plan (per layer)

| Layer | Test approach |
|---|---|
| json ops / renderer | unit (done) — pure fns + `react-dom/server` assertions |
| `DeckStore` | shared `deckStoreContract` — in-memory (done) + Supabase (integration, against a test project/branch) |
| generation | unit with a **fake LLM**; assert valid `DeckJson` + retry-on-invalid |
| API routes | handler tests with an in-memory store injected; assert status/body + error mapping |
| editor UI | component tests (later) — ops wiring + preview |

## 8. Deployment

- **Package**: published/git-installed; consumers add to `transpilePackages`.
- **API + builder**: Next app(s) on Vercel; env: `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY` (server-only), `ANTHROPIC_API_KEY`,
  optional gate secrets.
- **DB**: the new dedicated Supabase project; migrations in `supabase/migrations`.

## 9. Open questions for the next build

1. Does the API live **in each consuming app** (Next routes) or as **one shared
   service** (a standalone deck-api app / Supabase Edge Functions)? Leaning:
   start as routes inside moye-law-os, extract to a shared service if a second
   app needs it.
2. Multi-tenancy shape: `owner` = app id, or full per-user RLS?
3. Generation model + cost ceiling; do we cache/rate-limit?
4. Asset/image storage (Supabase Storage) — in scope for v1 or later?
5. Editor UX scope for v1: field forms vs. inline editing; reorder via DnD.
