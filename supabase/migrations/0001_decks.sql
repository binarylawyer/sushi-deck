-- Sushi Deck — decks storage
-- Backs SupabaseDeckStore. Behavior is pinned by the shared deckStoreContract.

create extension if not exists "pgcrypto";

create table if not exists public.decks (
    id          uuid primary key default gen_random_uuid(),
    slug        text not null unique,
    title       text not null,
    deck        jsonb not null,          -- the DeckJson
    theme       jsonb,                   -- optional brand overrides
    owner       text,                    -- app / tenant id (multi-tenant)
    version     integer not null default 1,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create index if not exists decks_owner_updated_idx on public.decks (owner, updated_at desc);
create index if not exists decks_updated_idx on public.decks (updated_at desc);

-- RLS is left to the consuming app's auth model. The server-side store uses the
-- service role; enable RLS + per-tenant policies when a client-facing path exists.
