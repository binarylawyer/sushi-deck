import { describe, expect, it, vi } from "vitest";
import type { DeckJson } from "../json/schema";
import { generateDeck, GenerationError, extractJson, type LlmClient } from "./generate";

const validDeck: DeckJson = {
    v: 1,
    title: "Generated",
    slides: [
        { id: "cover", label: "Cover", kind: "cover", eyebrow: "E", title: "T" },
        { id: "s1", label: "One", kind: "slide", blocks: [{ block: "opener", eyebrow: "a", headline: "b" }] },
    ],
};

/** An LlmClient that returns queued canned responses. */
function fakeLlm(...responses: string[]): LlmClient {
    const queue = [...responses];
    return { complete: vi.fn(async () => queue.shift() ?? "") };
}

describe("extractJson", () => {
    it("parses a bare object, a fenced block, and object with surrounding prose", () => {
        expect(extractJson('{"a":1}')).toEqual({ a: 1 });
        expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
        expect(extractJson('Here you go:\n{"a":1}\nDone.')).toEqual({ a: 1 });
    });
    it("returns null on junk", () => {
        expect(extractJson("no json here")).toBeNull();
        expect(extractJson("{ not valid")).toBeNull();
    });
});

describe("generateDeck", () => {
    it("returns a validated deck on first valid response", async () => {
        const llm = fakeLlm(JSON.stringify(validDeck));
        const deck = await generateDeck({ brief: "quarterly update" }, llm);
        expect(deck.title).toBe("Generated");
        expect(llm.complete).toHaveBeenCalledTimes(1);
    });

    it("carries the brand theme onto the generated deck", async () => {
        const llm = fakeLlm("```json\n" + JSON.stringify(validDeck) + "\n```");
        const deck = await generateDeck({ brief: "x", brand: { navy: "#123456" } }, llm);
        expect(deck.theme?.navy).toBe("#123456");
    });

    it("makes ONE repair attempt when the first output is invalid", async () => {
        const llm = fakeLlm("not json at all", JSON.stringify(validDeck));
        const deck = await generateDeck({ brief: "x" }, llm);
        expect(deck.title).toBe("Generated");
        expect(llm.complete).toHaveBeenCalledTimes(2);
    });

    it("throws GenerationError when still invalid after the repair attempt", async () => {
        const llm = fakeLlm("garbage", '{"v":2,"slides":"nope"}');
        await expect(generateDeck({ brief: "x" }, llm)).rejects.toBeInstanceOf(GenerationError);
        expect(llm.complete).toHaveBeenCalledTimes(2);
    });
});
