import type { DeckTheme } from "../theme";
import { BLOCK_TYPES } from "../json/schema";

export interface GenerateInput {
    /** What the deck is about / the ask. */
    brief: string;
    /** Optional deck title; the model picks one if omitted. */
    title?: string;
    /** Target number of content slides (excluding cover). */
    slides?: number;
    /** Brand theme carried onto the generated deck (not sent to the model as constraints). */
    brand?: DeckTheme;
}

/**
 * Build the generation prompt. It teaches the model the DeckJson shape and the
 * hard rules (strict JSON, allowed block types, `*emphasis*` markers) so the
 * output can be parsed + validated by the kit.
 */
export function buildDeckPrompt(input: GenerateInput): string {
    const slides = input.slides ?? 5;
    return [
        "You generate presentation decks as strict JSON in the Sushi Deck format.",
        "",
        "Return ONLY a single JSON object — no prose, no markdown fences.",
        "",
        "Shape:",
        '{ "v": 1, "title": string, "slides": Slide[] }',
        "Slide is one of:",
        '- Cover:  { "id": string, "label": string, "kind": "cover", "eyebrow": string, "title": string, "sub"?: string, "meta"?: {"dt":string,"dd":string}[] }',
        '- Content:{ "id": string, "label": string, "kind": "slide", "mark"?: {"label":string,"sup"?:string}, "idxPrefix"?: string, "blocks": Block[] }',
        `Block.block is one of: ${BLOCK_TYPES.join(", ")}.`,
        "Common blocks:",
        '- { "block":"opener", "eyebrow":string, "headline":string, "lede"?:string }',
        '- { "block":"paragraph", "text":string }',
        '- { "block":"bullets", "items":string[] }',
        '- { "block":"statband", "stats":[{"value":string,"label":string,"sub"?:string}] }',
        '- { "block":"barchart", "unit"?:string, "data":[{"label":string,"value":number,"hi"?:boolean}] }',
        '- { "block":"datatable", "head":string[], "align"?:("left"|"right")[], "rows":string[][] }',
        '- { "block":"callout", "text":string } | { "block":"quote", "text":string, "cite"?:string }',
        "",
        "Rules:",
        "- Every slide id must be unique and url-safe.",
        "- The first slide should be a cover.",
        "- Wrap one or two key words per headline in *asterisks* for emphasis.",
        "- Each content slide should start with an opener block.",
        `- Produce a cover plus about ${slides} content slides.`,
        "",
        input.title ? `Title: ${input.title}` : "Pick a strong, concise title.",
        "",
        "Brief:",
        input.brief,
    ].join("\n");
}
