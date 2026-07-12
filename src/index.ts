/**
 * @binarylawyer/sushi-deck — public API.
 *
 * Import the runtime + primitives, and the stylesheet once:
 *   import { DeckRuntime, SlidePage, Opener, Cover } from "@binarylawyer/sushi-deck";
 *   import "@binarylawyer/sushi-deck/styles.css";
 *
 * The optional password gate lives at "@binarylawyer/sushi-deck/gate".
 */

export { DeckRuntime } from "./DeckRuntime";
export type { DeckRuntimeProps, DeckRuntimeSidebarState } from "./DeckRuntime";
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
