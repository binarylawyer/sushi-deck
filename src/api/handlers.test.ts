import { beforeEach, describe, expect, it } from "vitest";
import type { DeckJson } from "../json/schema";
import { InMemoryDeckStore } from "../store/InMemoryDeckStore";
import type { LlmClient } from "../generate/generate";
import { createDeckHandlers } from "./handlers";

function deck(title = "T"): DeckJson {
    return {
        v: 1,
        title,
        slides: [{ id: "cover", label: "Cover", kind: "cover", eyebrow: "E", title }],
    };
}

function req(body?: unknown): Request {
    return new Request("http://test/api/decks", {
        method: "POST",
        body: body === undefined ? undefined : JSON.stringify(body),
        headers: { "content-type": "application/json" },
    });
}

const okLlm: LlmClient = { complete: async () => JSON.stringify(deck("AI Deck")) };

describe("deck API handlers", () => {
    let store: InMemoryDeckStore;
    let api: ReturnType<typeof createDeckHandlers>;
    beforeEach(() => {
        let n = 0;
        store = new InMemoryDeckStore({ idGen: () => `id-${++n}` });
        api = createDeckHandlers({ store, llm: okLlm });
    });

    it("create → 201 with the stored deck; list → the item", async () => {
        const res = await api.create(req({ deck: deck("Hello") }));
        expect(res.status).toBe(201);
        const rec = await res.json();
        expect(rec.id).toBe("id-1");
        expect(rec.slug).toBe("hello");

        const list = await (await api.list(req())).json();
        expect(list).toHaveLength(1);
        expect(list[0].slug).toBe("hello");
    });

    it("create with invalid deck → 422 with errors", async () => {
        const res = await api.create(req({ deck: { v: 1, title: "", slides: 3 } }));
        expect(res.status).toBe(422);
        expect((await res.json()).error).toBe("invalid_deck");
    });

    it("create with duplicate slug → 409", async () => {
        await api.create(req({ slug: "dup", deck: deck() }));
        const res = await api.create(req({ slug: "dup", deck: deck() }));
        expect(res.status).toBe(409);
    });

    it("get by id and by slug; missing → 404", async () => {
        const rec = await (await api.create(req({ slug: "findme", deck: deck() }))).json();
        expect((await api.get(req(), { id: rec.id })).status).toBe(200);
        expect((await api.getBySlug(req(), { slug: "findme" })).status).toBe(200);
        expect((await api.get(req(), { id: "nope" })).status).toBe(404);
        expect((await api.getBySlug(req(), { slug: "nope" })).status).toBe(404);
    });

    it("update bumps version; version conflict → 409; missing → 404", async () => {
        const rec = await (await api.create(req({ deck: deck("V1") }))).json();
        const updated = await (await api.update(req({ deck: deck("V2"), expectedVersion: 1 }), { id: rec.id })).json();
        expect(updated.version).toBe(2);
        expect((await api.update(req({ deck: deck("V3"), expectedVersion: 1 }), { id: rec.id })).status).toBe(409);
        expect((await api.update(req({ deck: deck() }), { id: "nope" })).status).toBe(404);
    });

    it("remove → 204; removing again → 404", async () => {
        const rec = await (await api.create(req({ deck: deck() }))).json();
        expect((await api.remove(req(), { id: rec.id })).status).toBe(204);
        expect((await api.remove(req(), { id: rec.id })).status).toBe(404);
    });

    it("generate → 200 with a valid DeckJson", async () => {
        const res = await api.generate(req({ brief: "quarterly update" }));
        expect(res.status).toBe(200);
        expect((await res.json()).title).toBe("AI Deck");
    });

    it("generate without an llm → 501", async () => {
        const noLlm = createDeckHandlers({ store });
        expect((await noLlm.generate(req({ brief: "x" }))).status).toBe(501);
    });

    it("read handlers map a store error to a 500 JSON body (not an opaque throw)", async () => {
        // Regression: list/get/getBySlug used to lack a try/catch, so a Supabase
        // failure propagated as an opaque empty 500 — the real cause only showed
        // in server logs. They must return the mapped JSON error instead.
        const boom = new Error("decks.list failed: permission denied for table decks [42501]");
        const failing = {
            list: async () => { throw boom; },
            get: async () => { throw boom; },
            getBySlug: async () => { throw boom; },
            create: async () => { throw boom; },
            update: async () => { throw boom; },
            remove: async () => { throw boom; },
        };
        const failApi = createDeckHandlers({ store: failing as never });
        for (const call of [
            () => failApi.list(req()),
            () => failApi.get(req(), { id: "x" }),
            () => failApi.getBySlug(req(), { slug: "x" }),
        ]) {
            const res = await call();
            expect(res.status).toBe(500);
            const body = await res.json();
            expect(body.error).toBe("internal");
            expect(body.message).toContain("permission denied");
        }
    });
});
