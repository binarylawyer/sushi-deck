import { describe, expect, it } from "vitest";
import type { DeckJson } from "./schema";
import {
    addBlock,
    addSlide,
    duplicateSlide,
    moveBlock,
    moveSlide,
    removeBlock,
    removeSlide,
    uniqueSlideId,
    updateBlock,
    updateSlide,
    validateDeckJson,
} from "./ops";

function deck(): DeckJson {
    return {
        v: 1,
        title: "Deck",
        slides: [
            { id: "cover", label: "Cover", kind: "cover", eyebrow: "E", title: "T" },
            { id: "a", label: "A", kind: "slide", blocks: [{ block: "opener", eyebrow: "x", headline: "y" }] },
            { id: "b", label: "B", kind: "slide", blocks: [] },
        ],
    };
}

describe("slide ops (immutable)", () => {
    it("addSlide inserts at index and leaves the original untouched", () => {
        const d = deck();
        const next = addSlide(d, { id: "z", label: "Z", kind: "slide", blocks: [] }, 1);
        expect(next.slides.map((s) => s.id)).toEqual(["cover", "z", "a", "b"]);
        expect(d.slides).toHaveLength(3); // original unchanged
    });

    it("addSlide appends when index omitted", () => {
        expect(addSlide(deck(), { id: "z", label: "Z", kind: "slide", blocks: [] }).slides.at(-1)?.id).toBe("z");
    });

    it("removeSlide removes by id", () => {
        expect(removeSlide(deck(), "a").slides.map((s) => s.id)).toEqual(["cover", "b"]);
    });

    it("moveSlide reorders", () => {
        expect(moveSlide(deck(), "b", 0).slides.map((s) => s.id)).toEqual(["b", "cover", "a"]);
    });

    it("moveSlide on a missing id is a no-op", () => {
        expect(moveSlide(deck(), "nope", 0).slides.map((s) => s.id)).toEqual(["cover", "a", "b"]);
    });

    it("duplicateSlide inserts a unique-id copy after the original", () => {
        const next = duplicateSlide(deck(), "a");
        expect(next.slides.map((s) => s.id)).toEqual(["cover", "a", "a-copy", "b"]);
        expect(next.slides[2]?.label).toBe("A (copy)");
    });

    it("updateSlide patches fields", () => {
        expect(updateSlide(deck(), "a", { label: "AA" }).slides[1]?.label).toBe("AA");
    });

    it("uniqueSlideId avoids collisions", () => {
        const d = deck();
        expect(uniqueSlideId(d, "new")).toBe("new");
        expect(uniqueSlideId(d, "a")).toBe("a-2");
    });
});

describe("block ops (content slides only)", () => {
    it("addBlock / moveBlock / removeBlock / updateBlock", () => {
        let d = deck();
        d = addBlock(d, "a", { block: "paragraph", text: "p" });
        d = addBlock(d, "a", { block: "quote", text: "q" }, 0);
        const a = () => d.slides.find((s) => s.id === "a")!;
        expect((a() as { blocks: { block: string }[] }).blocks.map((b) => b.block)).toEqual(["quote", "opener", "paragraph"]);
        d = moveBlock(d, "a", 0, 2);
        expect((a() as { blocks: { block: string }[] }).blocks.map((b) => b.block)).toEqual(["opener", "paragraph", "quote"]);
        d = updateBlock(d, "a", 1, { text: "P2" } as never);
        expect((a() as { blocks: { text?: string }[] }).blocks[1]?.text).toBe("P2");
        d = removeBlock(d, "a", 0);
        expect((a() as { blocks: { block: string }[] }).blocks.map((b) => b.block)).toEqual(["paragraph", "quote"]);
    });

    it("block ops ignore cover slides", () => {
        const d = addBlock(deck(), "cover", { block: "paragraph", text: "x" });
        expect(d.slides[0]).toEqual(deck().slides[0]);
    });
});

describe("validateDeckJson", () => {
    it("accepts a valid deck", () => {
        expect(validateDeckJson(deck())).toEqual({ ok: true, errors: [] });
    });

    it("flags wrong version, missing title, non-array slides", () => {
        const r = validateDeckJson({ v: 2, slides: {} });
        expect(r.ok).toBe(false);
        expect(r.errors.length).toBeGreaterThan(0);
    });

    it("flags duplicate slide ids and unknown block types", () => {
        const bad: unknown = {
            v: 1,
            title: "x",
            slides: [
                { id: "d", label: "1", kind: "slide", blocks: [{ block: "nope" }] },
                { id: "d", label: "2", kind: "cover", eyebrow: "e", title: "t" },
            ],
        };
        const r = validateDeckJson(bad);
        expect(r.ok).toBe(false);
        expect(r.errors.some((e) => e.includes("duplicated"))).toBe(true);
        expect(r.errors.some((e) => e.includes("unknown block type"))).toBe(true);
    });
});
