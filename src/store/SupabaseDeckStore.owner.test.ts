import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseDeckStore } from "./SupabaseDeckStore";
import { sampleDeck } from "./contract";

/**
 * Owner-isolation + error-surfacing tests for SupabaseDeckStore. These use a
 * fake Postgrest query builder so they run in unit CI with no database — the
 * full behavioral parity with InMemoryDeckStore is still covered by the shared
 * `deckStoreContract` against a real project (SupabaseDeckStore.test.ts).
 *
 * The fake records every `.eq(column, value)` filter applied to the query, so
 * we can assert that an owner-scoped store adds `owner = <owner>` to reads and
 * writes and an unscoped store does not.
 */
type Result = { data: unknown; error: unknown };

class FakeBuilder {
    eqCalls: Array<[string, unknown]> = [];
    inserted: unknown = undefined;
    updated: unknown = undefined;
    deleted = false;
    constructor(
        private readonly rows: unknown[],
        private readonly error: unknown = null,
    ) {}
    private result(): Result {
        return this.error ? { data: null, error: this.error } : { data: this.rows, error: null };
    }
    private single(): Result {
        return this.error ? { data: null, error: this.error } : { data: this.rows[0] ?? null, error: null };
    }
    select(): this {
        return this;
    }
    insert(v: unknown): this {
        this.inserted = v;
        return this;
    }
    update(v: unknown): this {
        this.updated = v;
        return this;
    }
    delete(): this {
        this.deleted = true;
        return this;
    }
    order(): this {
        return this;
    }
    eq(column: string, value: unknown): this {
        this.eqCalls.push([column, value]);
        return this;
    }
    maybeSingle(): Promise<Result> {
        return Promise.resolve(this.single());
    }
    // Postgrest builders are thenable — awaiting runs the query.
    then<T>(onF: (r: Result) => T): Promise<T> {
        return Promise.resolve(this.result()).then(onF);
    }
}

function fakeDb(rows: unknown[], error: unknown = null): { db: SupabaseClient; builder: FakeBuilder } {
    const builder = new FakeBuilder(rows, error);
    const db = { from: () => builder } as unknown as SupabaseClient;
    return { db, builder };
}

const OWNER = "moye-law-os";
const row = {
    id: "11111111-1111-1111-1111-111111111111",
    slug: "q3",
    title: "Q3",
    deck: sampleDeck("Q3"),
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
};

describe("SupabaseDeckStore owner isolation", () => {
    it("list filters by owner when the store is owner-scoped", async () => {
        const { db, builder } = fakeDb([row]);
        await new SupabaseDeckStore(db, "decks", OWNER).list();
        expect(builder.eqCalls).toContainEqual(["owner", OWNER]);
    });

    it("list does NOT filter by owner when unscoped", async () => {
        const { db, builder } = fakeDb([row]);
        await new SupabaseDeckStore(db, "decks", null).list();
        expect(builder.eqCalls.find(([c]) => c === "owner")).toBeUndefined();
    });

    it("get scopes to owner", async () => {
        const { db, builder } = fakeDb([row]);
        await new SupabaseDeckStore(db, "decks", OWNER).get(row.id);
        expect(builder.eqCalls).toContainEqual(["id", row.id]);
        expect(builder.eqCalls).toContainEqual(["owner", OWNER]);
    });

    it("getBySlug scopes to owner", async () => {
        const { db, builder } = fakeDb([row]);
        await new SupabaseDeckStore(db, "decks", OWNER).getBySlug("q3");
        expect(builder.eqCalls).toContainEqual(["slug", "q3"]);
        expect(builder.eqCalls).toContainEqual(["owner", OWNER]);
    });

    it("remove scopes to owner", async () => {
        const { db, builder } = fakeDb([{ id: row.id }]);
        await new SupabaseDeckStore(db, "decks", OWNER).remove(row.id);
        expect(builder.eqCalls).toContainEqual(["id", row.id]);
        expect(builder.eqCalls).toContainEqual(["owner", OWNER]);
    });

    it("create stamps the owner onto the inserted row", async () => {
        const { db, builder } = fakeDb([row]);
        await new SupabaseDeckStore(db, "decks", OWNER).create({ deck: sampleDeck("Q3") });
        expect((builder.inserted as { owner?: string }).owner).toBe(OWNER);
    });
});

describe("SupabaseDeckStore error surfacing", () => {
    it("wraps a non-Error Supabase error as a real Error carrying message + code", async () => {
        const { db } = fakeDb([], { message: "JWT expired", code: "PGRST301", hint: "check the key" });
        await expect(new SupabaseDeckStore(db, "decks", OWNER).list()).rejects.toMatchObject({
            message: expect.stringContaining("JWT expired"),
        });
        await expect(new SupabaseDeckStore(db, "decks", OWNER).list()).rejects.toMatchObject({
            message: expect.stringContaining("PGRST301"),
        });
    });
});
