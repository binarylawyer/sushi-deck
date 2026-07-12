/**
 * @binarylawyer/sushi-deck-kit/editor — a portable, non-dev deck editor.
 *
 * `<DeckEditor initialDeck onChange onSave theme />` renders a three-pane UI
 * (slides · live preview · inspector) over the tested `editorReducer`. Drop it
 * into any app's admin; persist the JSON via the deck API. The editing logic is
 * headless (see model.ts) and unit-tested.
 */
export { DeckEditor } from "./DeckEditor";
export type { DeckEditorProps } from "./DeckEditor";
export {
    editorReducer,
    initEditor,
    newSlide,
    type EditorState,
    type EditorAction,
} from "./model";
