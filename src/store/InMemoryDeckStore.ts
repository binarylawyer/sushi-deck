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
 * In-memory DeckStore — the reference implementation. Used for unit tests and
 * local development. Deterministic when constructed with injected `idGen` /
 * `clock`, which is what makes it a clean test double.
 */
export interface InMemoryDeckStoreOptions {
    /** Deterministic id generator for tests. Defaults to crypto.randomUUID. */
    idGen?: () => string;
    /** Injectable clock for tests. Defaults to `() => new Date().toISOString()`. */
    clock?: () => string;
}

export class InMemoryDeckStore implements DeckStore {
    private byId = new Map<string, StoredDeck>();
    private idGen: () => string;
    private clock: () => string;

    constructor(opts: InMemoryDeckStoreOptions = {}) {
        this.idGen = opts.idGen ?? (() => globalThis.crypto.randomUUID());
        this.clock = opts.clock ?? (() => new Date().toISOString());
    }

    private assertValid(deck: unknown): void {
        const { ok, errors } = validateDeckJson(deck);
        if (!ok) throw new DeckValidationError(errors);
    }

    private slugTaken(slug: string, exceptId?: string): boolean {
        for (const d of this.byId.values()) {
            if (d.slug === slug && d.id !== exceptId) return true;
        }
        return false;
    }

    async create(input: CreateDeckInput): Promise<StoredDeck> {
        this.assertValid(input.deck);
        const slug = input.slug ?? slugify(input.deck.title);
        if (this.slugTaken(slug)) throw new DeckConflictError(`Slug already in use: ${slug}`);
        const now = this.clock();
        const record: StoredDeck = {
            id: this.idGen(),
            slug,
            title: input.deck.title,
            deck: input.deck,
            createdAt: now,
            updatedAt: now,
            version: 1,
        };
        this.byId.set(record.id, record);
        return structuredClone(record);
    }

    async get(id: string): Promise<StoredDeck | null> {
        const r = this.byId.get(id);
        return r ? structuredClone(r) : null;
    }

    async getBySlug(slug: string): Promise<StoredDeck | null> {
        for (const d of this.byId.values()) {
            if (d.slug === slug) return structuredClone(d);
        }
        return null;
    }

    async list(): Promise<DeckListItem[]> {
        return Array.from(this.byId.values())
            .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
            .map((d) => ({ id: d.id, slug: d.slug, title: d.title, updatedAt: d.updatedAt, version: d.version }));
    }

    async update(id: string, input: UpdateDeckInput): Promise<StoredDeck> {
        const existing = this.byId.get(id);
        if (!existing) throw new DeckNotFoundError(id);
        if (input.expectedVersion != null && input.expectedVersion !== existing.version) {
            throw new DeckConflictError(`Version mismatch: expected ${input.expectedVersion}, have ${existing.version}`);
        }
        if (input.deck) this.assertValid(input.deck);
        const slug = input.slug ?? existing.slug;
        if (slug !== existing.slug && this.slugTaken(slug, id)) {
            throw new DeckConflictError(`Slug already in use: ${slug}`);
        }
        const updated: StoredDeck = {
            ...existing,
            slug,
            deck: input.deck ?? existing.deck,
            title: (input.deck ?? existing.deck).title,
            updatedAt: this.clock(),
            version: existing.version + 1,
        };
        this.byId.set(id, updated);
        return structuredClone(updated);
    }

    async remove(id: string): Promise<void> {
        if (!this.byId.has(id)) throw new DeckNotFoundError(id);
        this.byId.delete(id);
    }
}
