/**
 * @binarylawyer/deck-kit — public API.
 *
 * Import the runtime + primitives, and the stylesheet once:
 *   import { DeckRuntime, SlidePage, Opener, Cover } from "@binarylawyer/deck-kit";
 *   import "@binarylawyer/deck-kit/styles.css";
 *
 * The optional password gate lives at "@binarylawyer/deck-kit/gate".
 */

export { DeckRuntime } from "./DeckRuntime";
export type { DeckRuntimeProps } from "./DeckRuntime";
export { ScrollView } from "./ScrollView";
export type { ScrollViewProps } from "./ScrollView";
export { ScaledPage } from "./ScaledPage";
export { SlidePage, Opener, Cover, Mark } from "./primitives";
export {
    Kicker,
    Plate,
    Callout,
    Stat,
    StatBand,
    TwoCol,
    Quote,
    Bullets,
    DataTable,
    BarChart,
} from "./blocks";
export { themeVars } from "./theme";
export type { DeckTheme } from "./theme";
export type { Deck, SlideDef, DeckComponents, LinkProps } from "./types";
export { DEFAULT_PAGE_W, DEFAULT_PAGE_H } from "./types";
