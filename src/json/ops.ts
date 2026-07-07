/**
 * Pure edit operations on a `DeckJson` — the primitives an admin editor calls
 * to let non-developers add / remove / reorder / update slides and blocks.
 * Every function is immutable: it returns a new deck, never mutates the input.
 */
import { BLOCK_TYPES, type BlockJson, type ContentSlideJson, type DeckJson, type SlideJson } from "./schema";

function clone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T;
}

/** A unique slide id derived from `base`, avoiding collisions in the deck. */
export function uniqueSlideId(deck: DeckJson, base = "slide"): string {
    const ids = new Set(deck.slides.map((s) => s.id));
    if (!ids.has(base)) return base;
    let n = 2;
    while (ids.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
}

function clampIndex(len: number, i?: number): number {
    if (i == null) return len;
    return Math.max(0, Math.min(len, i));
}

/* ---- Slide ops ---- */

export function addSlide(deck: DeckJson, slide: SlideJson, atIndex?: number): DeckJson {
    const slides = clone(deck.slides);
    slides.splice(clampIndex(slides.length, atIndex), 0, clone(slide));
    return { ...deck, slides };
}

export function removeSlide(deck: DeckJson, id: string): DeckJson {
    return { ...deck, slides: deck.slides.filter((s) => s.id !== id) };
}

export function moveSlide(deck: DeckJson, id: string, toIndex: number): DeckJson {
    const slides = clone(deck.slides);
    const from = slides.findIndex((s) => s.id === id);
    if (from === -1) return deck;
    const [moved] = slides.splice(from, 1);
    if (!moved) return deck;
    slides.splice(Math.max(0, Math.min(slides.length, toIndex)), 0, moved);
    return { ...deck, slides };
}

export function duplicateSlide(deck: DeckJson, id: string): DeckJson {
    const idx = deck.slides.findIndex((s) => s.id === id);
    if (idx === -1) return deck;
    const original = deck.slides[idx]!;
    const copy = clone(original);
    copy.id = uniqueSlideId(deck, `${original.id}-copy`);
    copy.label = `${original.label} (copy)`;
    const slides = clone(deck.slides);
    slides.splice(idx + 1, 0, copy);
    return { ...deck, slides };
}

export function updateSlide(deck: DeckJson, id: string, patch: Partial<SlideJson>): DeckJson {
    return {
        ...deck,
        slides: deck.slides.map((s) => (s.id === id ? ({ ...s, ...patch } as SlideJson) : s)),
    };
}

/* ---- Block ops (content slides only) ---- */

function mapContent(deck: DeckJson, slideId: string, fn: (s: ContentSlideJson) => ContentSlideJson): DeckJson {
    return {
        ...deck,
        slides: deck.slides.map((s) => (s.id === slideId && s.kind === "slide" ? fn(clone(s)) : s)),
    };
}

export function addBlock(deck: DeckJson, slideId: string, block: BlockJson, atIndex?: number): DeckJson {
    return mapContent(deck, slideId, (s) => {
        s.blocks.splice(clampIndex(s.blocks.length, atIndex), 0, clone(block));
        return s;
    });
}

export function removeBlock(deck: DeckJson, slideId: string, blockIndex: number): DeckJson {
    return mapContent(deck, slideId, (s) => {
        s.blocks.splice(blockIndex, 1);
        return s;
    });
}

export function moveBlock(deck: DeckJson, slideId: string, from: number, to: number): DeckJson {
    return mapContent(deck, slideId, (s) => {
        if (from < 0 || from >= s.blocks.length) return s;
        const [moved] = s.blocks.splice(from, 1);
        if (!moved) return s;
        s.blocks.splice(Math.max(0, Math.min(s.blocks.length, to)), 0, moved);
        return s;
    });
}

export function updateBlock(deck: DeckJson, slideId: string, blockIndex: number, patch: Partial<BlockJson>): DeckJson {
    return mapContent(deck, slideId, (s) => {
        const current = s.blocks[blockIndex];
        if (current) s.blocks[blockIndex] = { ...current, ...patch } as BlockJson;
        return s;
    });
}

/* ---- Validation ---- */

export interface ValidationResult {
    ok: boolean;
    errors: string[];
}

/** Lightweight structural validation of untrusted deck JSON (e.g. from an editor or API). */
export function validateDeckJson(input: unknown): ValidationResult {
    const errors: string[] = [];
    const deck = input as Partial<DeckJson>;
    if (!deck || typeof deck !== "object") return { ok: false, errors: ["deck is not an object"] };
    if (deck.v !== 1) errors.push('deck.v must be 1');
    if (typeof deck.title !== "string" || !deck.title) errors.push("deck.title is required");
    if (!Array.isArray(deck.slides)) {
        errors.push("deck.slides must be an array");
        return { ok: false, errors };
    }
    const ids = new Set<string>();
    deck.slides.forEach((s, i) => {
        const at = `slides[${i}]`;
        if (!s || typeof s !== "object") { errors.push(`${at} is not an object`); return; }
        if (typeof s.id !== "string" || !s.id) errors.push(`${at}.id is required`);
        else if (ids.has(s.id)) errors.push(`${at}.id "${s.id}" is duplicated`);
        else ids.add(s.id);
        if (typeof s.label !== "string") errors.push(`${at}.label is required`);
        if (s.kind === "cover") {
            if (typeof s.eyebrow !== "string") errors.push(`${at}.eyebrow is required`);
            if (typeof s.title !== "string") errors.push(`${at}.title is required`);
        } else if (s.kind === "slide") {
            if (!Array.isArray(s.blocks)) errors.push(`${at}.blocks must be an array`);
            else s.blocks.forEach((b, bi) => {
                if (!b || !BLOCK_TYPES.includes(b.block)) errors.push(`${at}.blocks[${bi}] has unknown block type`);
            });
        } else {
            errors.push(`${at}.kind must be "cover" or "slide"`);
        }
    });
    return { ok: errors.length === 0, errors };
}
