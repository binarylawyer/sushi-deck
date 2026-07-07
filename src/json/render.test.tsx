import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { DeckJson } from "./schema";
import { deckFromJson, richText } from "./render";

function html(node: ReactNode): string {
    return renderToStaticMarkup(<>{node}</>);
}

describe("richText", () => {
    it("wraps *emphasis* in <em> and leaves plain text alone", () => {
        expect(html(richText("Growth *held* strong"))).toBe("Growth <em>held</em> strong");
        expect(html(richText("no markers"))).toBe("no markers");
    });
});

describe("deckFromJson", () => {
    const json: DeckJson = {
        v: 1,
        title: "Q3",
        slides: [
            { id: "cover", label: "Cover", kind: "cover", eyebrow: "Confidential", title: "Momentum, in *numbers*." },
            {
                id: "n",
                label: "Numbers",
                kind: "slide",
                blocks: [
                    { block: "opener", eyebrow: "The quarter", headline: "Growth *held*" },
                    { block: "statband", stats: [{ value: "38%", label: "growth" }] },
                ],
            },
        ],
    };

    it("maps json to a runtime Deck with matching metadata", () => {
        const deck = deckFromJson(json);
        expect(deck.title).toBe("Q3");
        expect(deck.slides.map((s) => s.id)).toEqual(["cover", "n"]);
        expect(deck.slides.map((s) => s.label)).toEqual(["Cover", "Numbers"]);
    });

    it("renders the cover with emphasized title", () => {
        const out = html(deckFromJson(json).slides[0]!.render());
        expect(out).toContain("Momentum, in ");
        expect(out).toContain("<em>numbers</em>");
    });

    it("renders content blocks and an auto-generated index", () => {
        const out = html(deckFromJson(json).slides[1]!.render());
        expect(out).toContain("Growth <em>held</em>");
        expect(out).toContain("38%");
        expect(out).toContain("02 / 02"); // index auto-generated from position/total
    });
});
