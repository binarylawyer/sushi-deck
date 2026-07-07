import type { DeckJson } from "../json/schema";

/**
 * Storage contract for decks. The API layer and every consuming project talk
 * to this interface, not a concrete database — so the same behavior is proven
 * once (see contract.ts) and reused by every implementation (in-memory for
 * tests + local, Supabase for production).
 */

export interface StoredDeck {
    id: string;
    slug: string;
    title: string;
    deck: DeckJson;
    createdAt: string;
    updatedAt: string;
    /** Bumped on every update; used for optimistic concurrency. */
    version: number;
}

export interface DeckListItem {
    id: string;
    slug: string;
    title: string;
    updatedAt: string;
    version: number;
}

export interface CreateDeckInput {
    /** Optional; derived from the deck title if omitted. Must be unique. */
    slug?: string;
    deck: DeckJson;
}

export interface UpdateDeckInput {
    deck?: DeckJson;
    slug?: string;
    /** If set and it doesn't match the stored version, the update is rejected. */
    expectedVersion?: number;
}

export interface DeckStore {
    create(input: CreateDeckInput): Promise<StoredDeck>;
    get(id: string): Promise<StoredDeck | null>;
    getBySlug(slug: string): Promise<StoredDeck | null>;
    list(): Promise<DeckListItem[]>;
    update(id: string, input: UpdateDeckInput): Promise<StoredDeck>;
    remove(id: string): Promise<void>;
}

export class DeckNotFoundError extends Error {
    constructor(id: string) {
        super(`Deck not found: ${id}`);
        this.name = "DeckNotFoundError";
    }
}

export class DeckConflictError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DeckConflictError";
    }
}

export class DeckValidationError extends Error {
    constructor(public errors: string[]) {
        super(`Invalid deck: ${errors.join("; ")}`);
        this.name = "DeckValidationError";
    }
}

/** Turn a title (or any string) into a url-safe slug. */
export function slugify(input: string): string {
    const s = input
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return s || "deck";
}
