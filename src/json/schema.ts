/**
 * Data-driven deck format (JSON).
 *
 * A `DeckJson` is a fully serializable description of a deck — every slide is
 * described by *data* (block type + props) rather than a render function. This
 * is what makes decks editable by non-developers: an admin UI reads/writes this
 * JSON (add / remove / reorder slides and blocks) and the kit renders it.
 *
 * `deckFromJson()` converts a `DeckJson` into a runtime `Deck` you can hand to
 * `DeckRuntime` / `ScrollView`. `ops.ts` provides pure edit operations.
 */

import type { DeckTheme } from "../theme";

/** Inline emphasis: `*like this*` renders as italic-accent <em>. */
export type RichText = string;

/* ---- Blocks (discriminated by `block`) ---- */

export interface OpenerBlock {
    block: "opener";
    eyebrow: string;
    headline: RichText;
    lede?: RichText;
}
export interface ParagraphBlock {
    block: "paragraph";
    text: RichText;
}
export interface BulletsBlock {
    block: "bullets";
    items: RichText[];
    marker?: string;
}
export interface StatBandBlock {
    block: "statband";
    stats: { value: string; label: string; sub?: string }[];
}
export interface BarChartBlock {
    block: "barchart";
    unit?: string;
    height?: number;
    data: { label: string; value: number; hi?: boolean }[];
}
export interface DataTableBlock {
    block: "datatable";
    head: string[];
    align?: ("left" | "right")[];
    rows: string[][];
}
export interface CalloutBlock {
    block: "callout";
    text: RichText;
    tone?: "gold" | "wax";
}
export interface QuoteBlock {
    block: "quote";
    text: RichText;
    cite?: string;
}
export interface SpacerBlock {
    block: "spacer";
    size?: number;
}

export type BlockJson =
    | OpenerBlock
    | ParagraphBlock
    | BulletsBlock
    | StatBandBlock
    | BarChartBlock
    | DataTableBlock
    | CalloutBlock
    | QuoteBlock
    | SpacerBlock;

/** All supported block type strings (for editor palettes / validation). */
export const BLOCK_TYPES: BlockJson["block"][] = [
    "opener",
    "paragraph",
    "bullets",
    "statband",
    "barchart",
    "datatable",
    "callout",
    "quote",
    "spacer",
];

/* ---- Slides (discriminated by `kind`) ---- */

export interface CoverSlideJson {
    id: string;
    label: string;
    kind: "cover";
    notes?: string;
    eyebrow: string;
    title: RichText;
    sub?: RichText;
    meta?: { dt: string; dd: string }[];
}
export interface ContentSlideJson {
    id: string;
    label: string;
    kind: "slide";
    notes?: string;
    /** Brand mark shown in the header. */
    mark?: { label: string; sup?: string };
    /** Text before the auto-generated "NN / TOTAL" index, e.g. "Investor update · ". */
    idxPrefix?: string;
    /** Footer disclaimer; omitted if absent. */
    disclaimer?: string;
    blocks: BlockJson[];
}

export type SlideJson = CoverSlideJson | ContentSlideJson;

/* ---- Deck ---- */

export interface DeckJson {
    /** Format version, for forward-compat migrations. */
    v: 1;
    slug?: string;
    title: string;
    summary?: string;
    width?: number;
    height?: number;
    /** Brand theme overrides applied when rendering. */
    theme?: DeckTheme;
    slides: SlideJson[];
}
