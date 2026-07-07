/**
 * @binarylawyer/sushi-deck/store — the deck storage layer.
 *
 * A `DeckStore` interface plus the in-memory reference implementation. The API
 * routes and every consuming project depend on the interface; production wires
 * a Supabase-backed implementation (which reuses the same behavioral contract).
 */
export type {
    DeckStore,
    StoredDeck,
    DeckListItem,
    CreateDeckInput,
    UpdateDeckInput,
} from "./DeckStore";
export {
    DeckNotFoundError,
    DeckConflictError,
    DeckValidationError,
    slugify,
} from "./DeckStore";
export { InMemoryDeckStore } from "./InMemoryDeckStore";
export type { InMemoryDeckStoreOptions } from "./InMemoryDeckStore";
