import { InMemoryDeckStore } from "./InMemoryDeckStore";
import { deckStoreContract } from "./contract";

/**
 * Run the shared DeckStore contract against the in-memory implementation.
 * A deterministic id generator + advancing clock make list ordering and ids
 * predictable in tests. The future SupabaseDeckStore will reuse this same
 * `deckStoreContract` call.
 */
deckStoreContract("InMemoryDeckStore", () => {
    let n = 0;
    let t = 0;
    return new InMemoryDeckStore({
        idGen: () => `deck-${++n}`,
        clock: () => new Date(1_700_000_000_000 + ++t * 1000).toISOString(),
    });
});
