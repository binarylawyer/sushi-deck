import { beforeEach, describe, expect, it } from "vitest";
import type { DeckJson } from "../json/schema";
import { type DeckStore, DeckConflictError, DeckNotFoundError, DeckValidationError } from "./DeckStore";

/**
 * Reusable behavioral contract for any DeckStore implementation. Each impl runs
 * this against a factory that returns a fresh, empty store — so the in-memory
 * store and the future Supabase store are proven to behave identically.
 *
 *   deckStoreContract("InMemoryDeckStore", () => new InMemoryDeckStore(...));
 */
export function sampleDeck(title = "Test Deck"): DeckJson {
    return {
        v: 1,
        title,
        slides: [
            { id: "cover", label: "Cover", kind: "cover", eyebrow: "Test", title },
            {
                id: "one",
                label: "One",
                kind: "slide",
                blocks: [{ block: "opener", eyebrow: "A", headline: "B" }],
            },
        ],
    };
}

export function deckStoreContract(
    label: string,
    makeStore: () => DeckStore | Promise<DeckStore>,
): void {
    describe(`DeckStore contract: ${label}`, () => {
        let store: DeckStore;
        beforeEach(async () => {
            store = await makeStore();
        });

        it("creates a deck with id, version 1, timestamps, and a slug from the title", async () => {
            const rec = await store.create({ deck: sampleDeck("My Q3 Deck") });
            expect(rec.id).toBeTruthy();
            expect(rec.version).toBe(1);
            expect(rec.slug).toBe("my-q3-deck");
            expect(rec.title).toBe("My Q3 Deck");
            expect(rec.createdAt).toBeTruthy();
            expect(rec.updatedAt).toBe(rec.createdAt);
        });

        it("honors an explicit slug", async () => {
            const rec = await store.create({ slug: "custom", deck: sampleDeck() });
            expect(rec.slug).toBe("custom");
        });

        it("rejects a duplicate slug with DeckConflictError", async () => {
            await store.create({ slug: "dup", deck: sampleDeck() });
            await expect(store.create({ slug: "dup", deck: sampleDeck() })).rejects.toBeInstanceOf(DeckConflictError);
        });

        it("rejects an invalid deck with DeckValidationError", async () => {
            const bad = { v: 1, title: "", slides: "nope" } as unknown as DeckJson;
            await expect(store.create({ deck: bad })).rejects.toBeInstanceOf(DeckValidationError);
        });

        it("gets a deck by id and by slug; returns null when missing", async () => {
            const rec = await store.create({ slug: "findme", deck: sampleDeck() });
            expect((await store.get(rec.id))?.id).toBe(rec.id);
            expect((await store.getBySlug("findme"))?.id).toBe(rec.id);
            expect(await store.get("nope")).toBeNull();
            expect(await store.getBySlug("nope")).toBeNull();
        });

        it("lists decks, most-recently-updated first", async () => {
            const a = await store.create({ slug: "a", deck: sampleDeck("A") });
            await store.create({ slug: "b", deck: sampleDeck("B") });
            await store.update(a.id, { deck: sampleDeck("A2") }); // touch A so it's newest
            const list = await store.list();
            expect(list.map((d) => d.slug)).toEqual(["a", "b"]);
            expect(list[0]?.title).toBe("A2");
        });

        it("updates a deck: bumps version, changes content + updatedAt", async () => {
            const rec = await store.create({ deck: sampleDeck("V1") });
            const next = await store.update(rec.id, { deck: sampleDeck("V2") });
            expect(next.version).toBe(2);
            expect(next.title).toBe("V2");
            expect(next.deck.title).toBe("V2");
        });

        it("rejects update of a missing deck with DeckNotFoundError", async () => {
            await expect(store.update("nope", { deck: sampleDeck() })).rejects.toBeInstanceOf(DeckNotFoundError);
        });

        it("enforces optimistic concurrency via expectedVersion", async () => {
            const rec = await store.create({ deck: sampleDeck() });
            await expect(store.update(rec.id, { deck: sampleDeck("x"), expectedVersion: 99 })).rejects.toBeInstanceOf(DeckConflictError);
            const ok = await store.update(rec.id, { deck: sampleDeck("x"), expectedVersion: 1 });
            expect(ok.version).toBe(2);
        });

        it("rejects updating to an already-taken slug", async () => {
            await store.create({ slug: "taken", deck: sampleDeck() });
            const b = await store.create({ slug: "free", deck: sampleDeck() });
            await expect(store.update(b.id, { slug: "taken" })).rejects.toBeInstanceOf(DeckConflictError);
        });

        it("removes a deck; removing a missing one throws DeckNotFoundError", async () => {
            const rec = await store.create({ deck: sampleDeck() });
            await store.remove(rec.id);
            expect(await store.get(rec.id)).toBeNull();
            await expect(store.remove(rec.id)).rejects.toBeInstanceOf(DeckNotFoundError);
        });
    });
}
