import type { BlockJson, DeckJson, SlideJson } from "../json/schema";
import * as ops from "../json/ops";

/**
 * Headless editor state model — a pure reducer over `DeckJson` built on the
 * json edit-ops, plus selection. This is the testable core of the editor UI;
 * `DeckEditor.tsx` is a thin React shell over it. Keeping the logic here means
 * the "non-dev editing" behavior is unit-tested without rendering.
 */
export interface EditorState {
    deck: DeckJson;
    selectedSlideId: string | null;
}

export function initEditor(deck: DeckJson): EditorState {
    return { deck, selectedSlideId: deck.slides[0]?.id ?? null };
}

export type EditorAction =
    | { type: "setDeck"; deck: DeckJson }
    | { type: "select"; id: string | null }
    | { type: "addSlide"; kind: "cover" | "slide"; atIndex?: number }
    | { type: "removeSlide"; id: string }
    | { type: "moveSlide"; id: string; toIndex: number }
    | { type: "duplicateSlide"; id: string }
    | { type: "updateSlide"; id: string; patch: Partial<SlideJson> }
    | { type: "addBlock"; slideId: string; block: BlockJson; atIndex?: number }
    | { type: "removeBlock"; slideId: string; index: number }
    | { type: "moveBlock"; slideId: string; from: number; to: number }
    | { type: "updateBlock"; slideId: string; index: number; patch: Partial<BlockJson> };

/** A sensible new slide of the given kind, with a unique id. */
export function newSlide(deck: DeckJson, kind: "cover" | "slide"): SlideJson {
    if (kind === "cover") {
        return { id: ops.uniqueSlideId(deck, "cover"), label: "Cover", kind: "cover", eyebrow: "Eyebrow", title: "New *cover*" };
    }
    return {
        id: ops.uniqueSlideId(deck, "slide"),
        label: "New slide",
        kind: "slide",
        blocks: [{ block: "opener", eyebrow: "Section", headline: "New *slide*" }],
    };
}

function reselectAfterRemove(deck: DeckJson, removedId: string, selected: string | null): string | null {
    if (selected !== removedId) return selected;
    const idx = deck.slides.findIndex((s) => s.id === removedId);
    const rest = deck.slides.filter((s) => s.id !== removedId);
    if (rest.length === 0) return null;
    return (rest[Math.min(idx, rest.length - 1)] ?? rest[0])!.id;
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
    const d = state.deck;
    switch (action.type) {
        case "setDeck": {
            const stillThere = action.deck.slides.some((s) => s.id === state.selectedSlideId);
            return { deck: action.deck, selectedSlideId: stillThere ? state.selectedSlideId : (action.deck.slides[0]?.id ?? null) };
        }
        case "select":
            return { ...state, selectedSlideId: action.id };
        case "addSlide": {
            const slide = newSlide(d, action.kind);
            return { deck: ops.addSlide(d, slide, action.atIndex), selectedSlideId: slide.id };
        }
        case "removeSlide":
            return { deck: ops.removeSlide(d, action.id), selectedSlideId: reselectAfterRemove(d, action.id, state.selectedSlideId) };
        case "moveSlide":
            return { ...state, deck: ops.moveSlide(d, action.id, action.toIndex) };
        case "duplicateSlide": {
            const idx = d.slides.findIndex((s) => s.id === action.id);
            const deck = ops.duplicateSlide(d, action.id);
            const copy = deck.slides[idx + 1];
            return { deck, selectedSlideId: copy ? copy.id : state.selectedSlideId };
        }
        case "updateSlide":
            return { ...state, deck: ops.updateSlide(d, action.id, action.patch) };
        case "addBlock":
            return { ...state, deck: ops.addBlock(d, action.slideId, action.block, action.atIndex) };
        case "removeBlock":
            return { ...state, deck: ops.removeBlock(d, action.slideId, action.index) };
        case "moveBlock":
            return { ...state, deck: ops.moveBlock(d, action.slideId, action.from, action.to) };
        case "updateBlock":
            return { ...state, deck: ops.updateBlock(d, action.slideId, action.index, action.patch) };
        default:
            return state;
    }
}
