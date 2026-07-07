/**
 * @binarylawyer/sushi-deck/json — the data-driven deck format.
 *
 * A `DeckJson` is a serializable deck (blocks as data, not code). Convert it to
 * a runtime `Deck` with `deckFromJson()` and edit it with the pure `ops` — the
 * building blocks for a non-dev, in-admin slide editor.
 */
export type {
    DeckJson,
    SlideJson,
    CoverSlideJson,
    ContentSlideJson,
    BlockJson,
    OpenerBlock,
    ParagraphBlock,
    BulletsBlock,
    StatBandBlock,
    BarChartBlock,
    DataTableBlock,
    CalloutBlock,
    QuoteBlock,
    SpacerBlock,
    RichText,
} from "./schema";
export { BLOCK_TYPES } from "./schema";
export { deckFromJson, richText } from "./render";
export {
    uniqueSlideId,
    addSlide,
    removeSlide,
    moveSlide,
    duplicateSlide,
    updateSlide,
    addBlock,
    removeBlock,
    moveBlock,
    updateBlock,
    validateDeckJson,
} from "./ops";
export type { ValidationResult } from "./ops";
