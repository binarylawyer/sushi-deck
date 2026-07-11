import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DeckRuntime } from "./DeckRuntime";
import type { Deck } from "./types";

/**
 * DeckRuntime renders its effects only on mount (window/resize), so a static
 * server render exercises the initial present-mode markup — enough to prove the
 * backward-compatible `sidebar` / `contentAlign` additions without a DOM.
 */
const deck: Deck = {
    title: "Sample",
    slides: [
        { id: "a", label: "One", render: () => <div className="slide-a">A</div> },
        { id: "b", label: "Two", render: () => <div className="slide-b">B</div> },
    ],
};

describe("DeckRuntime sidebar", () => {
    it("renders no rail by default", () => {
        const html = renderToStaticMarkup(<DeckRuntime deck={deck} />);
        expect(html).not.toContain("dk-rail");
        expect(html).not.toContain("data-has-sidebar");
    });

    it("renders a sidebar node beside the stage in present mode", () => {
        const html = renderToStaticMarkup(
            <DeckRuntime deck={deck} sidebar={<nav className="my-rail">RAIL</nav>} />,
        );
        expect(html).toContain("dk-rail");
        expect(html).toContain('data-has-sidebar="1"');
        expect(html).toContain("my-rail");
    });

    it("passes {index,total} to a sidebar render function", () => {
        const html = renderToStaticMarkup(
            <DeckRuntime
                deck={deck}
                index={1}
                sidebar={({ index, total }) => (
                    <div className="rail-state">{`pos:${index}/${total}`}</div>
                )}
            />,
        );
        // controlled index=1 of 2 slides
        expect(html).toContain("pos:1/2");
    });
});

describe("DeckRuntime contentAlign", () => {
    it("omits the align attribute by default", () => {
        const html = renderToStaticMarkup(<DeckRuntime deck={deck} />);
        expect(html).not.toContain("data-content-align");
    });

    it('sets data-content-align="center" when requested', () => {
        const html = renderToStaticMarkup(<DeckRuntime deck={deck} contentAlign="center" />);
        expect(html).toContain('data-content-align="center"');
    });
});
