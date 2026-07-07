import type { DeckJson } from "../json/schema";
import { validateDeckJson } from "../json/ops";
import { buildDeckPrompt, type GenerateInput } from "./prompt";

export type { GenerateInput } from "./prompt";

/** The only thing generation needs from a model: prompt in, text out. */
export interface LlmClient {
    complete(prompt: string): Promise<string>;
}

export class GenerationError extends Error {
    constructor(message: string, public errors?: string[]) {
        super(message);
        this.name = "GenerationError";
    }
}

/**
 * Extract a JSON object from model output, tolerating ```json fences or leading
 * prose by taking the outermost {...}. Returns null if none is found/parseable.
 */
export function extractJson(text: string): unknown | null {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced?.[1] ?? text;
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) return null;
    try {
        return JSON.parse(candidate.slice(start, end + 1));
    } catch {
        return null;
    }
}

function attach(deck: DeckJson, input: GenerateInput): DeckJson {
    // Carry the brand theme onto the generated deck (not a model concern).
    return input.brand ? { ...deck, theme: input.brand } : deck;
}

/**
 * Generate a validated DeckJson from a brief. Calls the model, parses + validates;
 * on invalid output it makes ONE repair attempt with the validation errors, then
 * throws GenerationError if still invalid.
 */
export async function generateDeck(input: GenerateInput, llm: LlmClient): Promise<DeckJson> {
    const prompt = buildDeckPrompt(input);

    const first = extractJson(await llm.complete(prompt));
    const firstCheck = validateDeckJson(first);
    if (firstCheck.ok) return attach(first as DeckJson, input);

    const repairPrompt = [
        prompt,
        "",
        "Your previous output was invalid for these reasons:",
        ...firstCheck.errors.map((e) => `- ${e}`),
        "",
        "Return corrected JSON only.",
    ].join("\n");

    const second = extractJson(await llm.complete(repairPrompt));
    const secondCheck = validateDeckJson(second);
    if (secondCheck.ok) return attach(second as DeckJson, input);

    throw new GenerationError("Model did not return a valid deck after one repair attempt.", secondCheck.errors);
}
