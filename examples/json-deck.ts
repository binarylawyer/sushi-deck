import type { DeckJson } from "@binarylawyer/deck-kit/json";

/**
 * A deck as pure DATA — no React, no code. This is what an admin editor would
 * read and write. Render it with:
 *
 *   import { deckFromJson } from "@binarylawyer/deck-kit/json";
 *   import { DeckRuntime } from "@binarylawyer/deck-kit";
 *   const deck = deckFromJson(q3Json);
 *   <DeckRuntime deck={deck} theme={q3Json.theme} />
 *
 * Inline `*emphasis*` renders as italic-accent. Slide indices ("01 / 03") are
 * generated automatically.
 */
export const q3Json: DeckJson = {
    v: 1,
    slug: "q3",
    title: "Q3 Investor Update",
    summary: "A data-driven sample deck.",
    theme: { navy: "#0A2342", gold: "#C99D56" },
    slides: [
        {
            id: "cover",
            label: "Cover",
            kind: "cover",
            notes: "Open warm. Frame growth, the trend, and the ask.",
            eyebrow: "Q3 Investor Update · Confidential",
            title: "Momentum, in *numbers*.",
            sub: "A short walk through the quarter — growth, the pipeline, and what we're raising for.",
            meta: [
                { dt: "Prepared for", dd: "The Board" },
                { dt: "By", dd: "Acme Co." },
                { dt: "Date", dd: "Q3 2026" },
            ],
        },
        {
            id: "numbers",
            label: "The numbers",
            kind: "slide",
            mark: { label: "Acme", sup: "CO" },
            idxPrefix: "Investor update · ",
            notes: "38% QoQ, NRR 120%, $4.2M ARR.",
            blocks: [
                { block: "opener", eyebrow: "The quarter", headline: "Growth *held*", lede: "The three numbers that matter." },
                {
                    block: "statband",
                    stats: [
                        { value: "38%", label: "QoQ growth", sub: "Up from 21%." },
                        { value: "120%", label: "Net retention", sub: "Expansion beat churn." },
                        { value: "$4.2M", label: "ARR", sub: "Crossed in June." },
                    ],
                },
            ],
        },
        {
            id: "ask",
            label: "The ask",
            kind: "slide",
            mark: { label: "Acme", sup: "CO" },
            idxPrefix: "Investor update · ",
            blocks: [
                { block: "opener", eyebrow: "The ask", headline: "What we're *raising*", lede: "$4M seed extension to reach profitability." },
                { block: "callout", text: "Profitable by *Q2 next year* on this raise." },
            ],
        },
    ],
};
