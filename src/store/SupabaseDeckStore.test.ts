import { describe, it } from "vitest";
import { deckStoreContract } from "./contract";

/**
 * Runs the shared DeckStore contract against the real Supabase implementation
 * when SUSHI_TEST_SUPABASE_URL + SUSHI_TEST_SUPABASE_KEY are set (a disposable
 * test project). Otherwise it's skipped, so unit CI stays green without a DB.
 *
 * The factory truncates the table before each test so cases are isolated.
 */
const url = process.env.SUSHI_TEST_SUPABASE_URL;
const key = process.env.SUSHI_TEST_SUPABASE_KEY;

if (!url || !key) {
    describe.skip("DeckStore contract: SupabaseDeckStore (set SUSHI_TEST_SUPABASE_URL/KEY to run)", () => {
        it("skipped without a test Supabase project", () => {});
    });
} else {
    deckStoreContract("SupabaseDeckStore", async () => {
        const { createClient } = await import("@supabase/supabase-js");
        const { SupabaseDeckStore } = await import("./SupabaseDeckStore");
        const db = createClient(url, key, { auth: { persistSession: false } });
        await db.from("decks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        return new SupabaseDeckStore(db);
    });
}
