import { describe, expect, it } from "vitest";
import type { DeckJson } from "../json/schema";
import { editorReducer, initEditor, newSlide, type EditorState } from "./model";

function deck(): DeckJson {
    return {
        v: 1,
        title: "Deck",
        slides: [
            { id: "cover", label: "Cover", kind: "cover", eyebrow: "E", title: "T" },
            { id: "a", label: "A", kind: "slide", blocks: [{ block: "opener", eyebrow: "x", headline: "y" }] },
        ],
    };
}
const start = (): EditorState => initEditor(deck());

describe("editor model", () => {
    it("selects the first slide on init", () => {
        expect(start().selectedSlideId).toBe("cover");
    });

    it("addSlide inserts a valid slide and selects it", () => {
        const s = editorReducer(start(), { type: "addSlide", kind: "slide" });
        expect(s.deck.slides).toHaveLength(3);
        expect(s.selectedSlideId).toBe(s.deck.slides[2]!.id);
        // new content slide starts with an opener block
        const added = s.deck.slides[2]!;
        expect(added.kind).toBe("slide");
    });

    it("newSlide produces unique ids", () => {
        const d = deck();
        expect(newSlide(d, "cover").id).toBe("cover-2"); // 'cover' taken
        expect(newSlide(d, "slide").id).toBe("slide");
    });

    it("removeSlide reselects a neighbor when the selected slide is removed", () => {
        let s = editorReducer(start(), { type: "select", id: "a" });
        s = editorReducer(s, { type: "removeSlide", id: "a" });
        expect(s.deck.slides.map((x) => x.id)).toEqual(["cover"]);
        expect(s.selectedSlideId).toBe("cover");
    });

    it("moveSlide reorders without changing selection", () => {
        const s = editorReducer(start(), { type: "moveSlide", id: "a", toIndex: 0 });
        expect(s.deck.slides.map((x) => x.id)).toEqual(["a", "cover"]);
        expect(s.selectedSlideId).toBe("cover");
    });

    it("duplicateSlide selects the copy", () => {
        const s = editorReducer(start(), { type: "duplicateSlide", id: "a" });
        expect(s.deck.slides.map((x) => x.id)).toEqual(["cover", "a", "a-copy"]);
        expect(s.selectedSlideId).toBe("a-copy");
    });

    it("block edits go to the right slide", () => {
        let s = start();
        s = editorReducer(s, { type: "addBlock", slideId: "a", block: { block: "paragraph", text: "p" } });
        s = editorReducer(s, { type: "updateBlock", slideId: "a", index: 1, patch: { text: "P2" } as never });
        const a = s.deck.slides.find((x) => x.id === "a")! as { blocks: { text?: string }[] };
        expect(a.blocks[1]?.text).toBe("P2");
        s = editorReducer(s, { type: "removeBlock", slideId: "a", index: 0 });
        expect((s.deck.slides.find((x) => x.id === "a")! as { blocks: unknown[] }).blocks).toHaveLength(1);
    });

    it("setDeck keeps selection when the slide still exists, else picks the first", () => {
        const s1 = editorReducer({ deck: deck(), selectedSlideId: "a" }, { type: "setDeck", deck: deck() });
        expect(s1.selectedSlideId).toBe("a");
        const trimmed: DeckJson = { v: 1, title: "D", slides: [{ id: "z", label: "Z", kind: "slide", blocks: [] }] };
        const s2 = editorReducer({ deck: deck(), selectedSlideId: "a" }, { type: "setDeck", deck: trimmed });
        expect(s2.selectedSlideId).toBe("z");
    });
});
