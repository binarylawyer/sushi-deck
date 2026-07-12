import type { Deck } from "@binarylawyer/sushi-deck";
import { Cover, Opener, SlidePage, Mark } from "@binarylawyer/sushi-deck";

/**
 * A tiny 3-slide sample deck showing the authoring model. Slides are plain
 * components built from the primitives; the `Deck` object lists them with
 * labels + speaker notes.
 */

const brand = <Mark label="Acme" sup="CO" />;

function Title() {
    return (
        <Cover
            eyebrow="Q3 Investor Update · Confidential"
            title={<>Momentum,<br />in <em>numbers</em>.</>}
            sub="A short walk through the quarter — growth, the pipeline, and what we're raising for."
            meta={[
                { dt: "Prepared for", dd: "The Board" },
                { dt: "By", dd: "Acme Co." },
                { dt: "Date", dd: "Q3 2026" },
            ]}
        />
    );
}

function Growth() {
    return (
        <SlidePage idx="02 / 03" label="02 · Growth" mark={brand} idxPrefix="Investor update · ">
            <Opener eyebrow="The quarter" lede="Revenue up 38% QoQ; net retention crossed 120%.">
                Growth held <em>through</em> the quarter
            </Opener>
            <p style={{ fontFamily: "var(--dk-sans)", fontSize: 16, color: "rgba(11,26,46,0.8)", lineHeight: 1.7, marginTop: 20, maxWidth: "62ch" }}>
                Replace this slide body with your own layout — tables, charts, stat tiles.
                Everything inside a <code>SlidePage</code> is yours; the kit only owns the
                frame, the navigation, and the theme.
            </p>
        </SlidePage>
    );
}

function Ask() {
    return (
        <SlidePage idx="03 / 03" label="03 · The ask" mark={brand} idxPrefix="Investor update · ">
            <Opener eyebrow="The ask" lede="$4M seed extension to reach profitability by Q2 next year.">
                What we&rsquo;re <em>raising</em>
            </Opener>
        </SlidePage>
    );
}

export const sampleDeck: Deck = {
    slug: "q3-update",
    title: "Q3 Investor Update",
    summary: "A short sample deck built with @binarylawyer/sushi-deck.",
    slides: [
        { id: "title", label: "Title", render: () => <Title />, notes: "Open warm. Frame the three things: growth, pipeline, the ask." },
        { id: "growth", label: "Growth", render: () => <Growth />, notes: "38% QoQ, NRR 120%. Tie growth to the two launches." },
        { id: "ask", label: "The ask", render: () => <Ask />, notes: "$4M extension → profitability by Q2. Close on the milestone." },
    ],
};
