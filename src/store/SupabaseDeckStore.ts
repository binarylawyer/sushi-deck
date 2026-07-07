import type { SupabaseClient } from "@supabase/supabase-js";
import type { DeckJson } from "../json/schema";
import { validateDeckJson } from "../json/ops";
import {
    type CreateDeckInput,
    type DeckListItem,
    type DeckStore,
    type StoredDeck,
    type UpdateDeckInput,
    DeckConflictError,
    DeckNotFoundError,
    DeckValidationError,
    slugify,
} from "./DeckStore";

/**
 * Supabase-backed DeckStore (production). Proven identical to the in-memory
 * store via the shared `deckStoreContract` (see SupabaseDeckStore.test.ts,
 * which runs against a test project when SUSHI_TEST_SUPABASE_* is set).
 *
 * Expected table (see supabase/migrations): decks(id uuid, slug text unique,
 * title text, deck jsonb, theme jsonb, owner text, version int, created_at,
 * updated_at).
 */
interface DeckRow {
    id: string;
    slug: string;
    title: string;
    deck: DeckJson;
    version: number;
    created_at: string;
    updated_at: string;
}

const PG_UNIQUE_VIOLATION = "23505";

function toStored(row: DeckRow): StoredDeck {
    return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        deck: row.deck,
        version: row.version,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export class SupabaseDeckStore implements DeckStore {
    constructor(
        private readonly db: SupabaseClient,
        private readonly table = "decks",
        private readonly owner: string | null = null,
    ) {}

    private assertValid(deck: unknown): void {
        const { ok, errors } = validateDeckJson(deck);
        if (!ok) throw new DeckValidationError(errors);
    }

    async create(input: CreateDeckInput): Promise<StoredDeck> {
        this.assertValid(input.deck);
        const slug = input.slug ?? slugify(input.deck.title);
        const { data, error } = await this.db
            .from(this.table)
            .insert({ slug, title: input.deck.title, deck: input.deck, owner: this.owner, version: 1 })
            .select("*")
            .single();
        if (error) {
            if (error.code === PG_UNIQUE_VIOLATION) throw new DeckConflictError(`Slug already in use: ${slug}`);
            throw error;
        }
        return toStored(data as DeckRow);
    }

    async get(id: string): Promise<StoredDeck | null> {
        const { data, error } = await this.db.from(this.table).select("*").eq("id", id).maybeSingle();
        if (error) throw error;
        return data ? toStored(data as DeckRow) : null;
    }

    async getBySlug(slug: string): Promise<StoredDeck | null> {
        const { data, error } = await this.db.from(this.table).select("*").eq("slug", slug).maybeSingle();
        if (error) throw error;
        return data ? toStored(data as DeckRow) : null;
    }

    async list(): Promise<DeckListItem[]> {
        const { data, error } = await this.db
            .from(this.table)
            .select("id, slug, title, updated_at, version")
            .order("updated_at", { ascending: false });
        if (error) throw error;
        return (data ?? []).map((r) => ({
            id: r.id as string,
            slug: r.slug as string,
            title: r.title as string,
            updatedAt: r.updated_at as string,
            version: r.version as number,
        }));
    }

    async update(id: string, input: UpdateDeckInput): Promise<StoredDeck> {
        const existing = await this.get(id);
        if (!existing) throw new DeckNotFoundError(id);
        if (input.expectedVersion != null && input.expectedVersion !== existing.version) {
            throw new DeckConflictError(`Version mismatch: expected ${input.expectedVersion}, have ${existing.version}`);
        }
        if (input.deck) this.assertValid(input.deck);
        const nextDeck = input.deck ?? existing.deck;
        const slug = input.slug ?? existing.slug;

        const { data, error } = await this.db
            .from(this.table)
            .update({
                slug,
                title: nextDeck.title,
                deck: nextDeck,
                version: existing.version + 1,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("version", existing.version) // optimistic lock
            .select("*")
            .maybeSingle();
        if (error) {
            if (error.code === PG_UNIQUE_VIOLATION) throw new DeckConflictError(`Slug already in use: ${slug}`);
            throw error;
        }
        if (!data) throw new DeckConflictError("Concurrent update — version moved");
        return toStored(data as DeckRow);
    }

    async remove(id: string): Promise<void> {
        const { data, error } = await this.db.from(this.table).delete().eq("id", id).select("id");
        if (error) throw error;
        if (!data || data.length === 0) throw new DeckNotFoundError(id);
    }
}
