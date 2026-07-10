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

-- Grant table privileges to service_role. A table created via raw SQL does NOT
-- automatically get Supabase's role grants, so without this the service/secret
-- key (which connects as service_role) hits "permission denied for table decks"
-- [42501] on every query — even though it bypasses RLS. anon/authenticated are
-- deliberately left WITHOUT grants: with RLS on and no policies, only the
-- full-access secret key should ever touch decks (all access flows through the
-- server-side store).
grant select, insert, update, delete on table public.decks to service_role;

-- RLS is left to the consuming app's auth model. The server-side store uses the
-- service role (granted above); enable RLS + per-tenant policies when a
-- client-facing (anon/authenticated) path exists.
alter table public.decks enable row level security;
