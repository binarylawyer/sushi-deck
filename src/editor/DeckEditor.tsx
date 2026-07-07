"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { BlockJson, DeckJson, ContentSlideJson, CoverSlideJson } from "../json/schema";
import { BLOCK_TYPES } from "../json/schema";
import { deckFromJson } from "../json/render";
import { ScaledPage } from "../ScaledPage";
import { themeVars, type DeckTheme } from "../theme";
import { editorReducer, initEditor } from "./model";
import "../deck.css";
import "./editor.css";

/**
 * A portable, headless-logic-backed deck editor. Renders a three-pane UI
 * (slides · live preview · inspector) over the tested `editorReducer`. The host
 * app persists via `onSave` (e.g. PUT to the deck API); `onChange` fires on
 * every edit for autosave/dirty tracking.
 */
export interface DeckEditorProps {
    initialDeck: DeckJson;
    onChange?: (deck: DeckJson) => void;
    onSave?: (deck: DeckJson) => void | Promise<void>;
    theme?: DeckTheme;
    saving?: boolean;
}

export function DeckEditor({ initialDeck, onChange, onSave, theme, saving }: DeckEditorProps) {
    const [state, dispatch] = useReducer(editorReducer, initialDeck, initEditor);
    const firstRender = useRef(true);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        onChange?.(state.deck);
    }, [state.deck, onChange]);

    const runtime = deckFromJson(state.deck);
    const selectedIdx = state.deck.slides.findIndex((s) => s.id === state.selectedSlideId);
    const selected = state.deck.slides[selectedIdx];

    return (
        <div className="dke">
            <header className="dke-top">
                <div className="dke-title">{state.deck.title || "Untitled deck"}</div>
                {onSave ? (
                    <button className="dke-save" disabled={saving} onClick={() => onSave(state.deck)}>
                        {saving ? "Saving…" : "Save"}
                    </button>
                ) : null}
            </header>

            <div className="dke-body">
                {/* Slides rail */}
                <aside className="dke-rail">
                    <div className="dke-rail__add">
                        <button onClick={() => dispatch({ type: "addSlide", kind: "cover" })}>+ Cover</button>
                        <button onClick={() => dispatch({ type: "addSlide", kind: "slide" })}>+ Slide</button>
                    </div>
                    <ol className="dke-slides">
                        {state.deck.slides.map((s, i) => (
                            <li key={s.id} className={`dke-slide${s.id === state.selectedSlideId ? " is-sel" : ""}`}>
                                <button className="dke-slide__pick" onClick={() => dispatch({ type: "select", id: s.id })}>
                                    <span className="dke-slide__n">{String(i + 1).padStart(2, "0")}</span>
                                    <span className="dke-slide__label">{s.label || s.kind}</span>
                                </button>
                                <span className="dke-slide__acts">
                                    <button title="Move up" disabled={i === 0} onClick={() => dispatch({ type: "moveSlide", id: s.id, toIndex: i - 1 })}>↑</button>
                                    <button title="Move down" disabled={i === state.deck.slides.length - 1} onClick={() => dispatch({ type: "moveSlide", id: s.id, toIndex: i + 1 })}>↓</button>
                                    <button title="Duplicate" onClick={() => dispatch({ type: "duplicateSlide", id: s.id })}>⧉</button>
                                    <button title="Delete" onClick={() => dispatch({ type: "removeSlide", id: s.id })}>✕</button>
                                </span>
                            </li>
                        ))}
                    </ol>
                </aside>

                {/* Live preview of the selected slide */}
                <main className="dke-preview">
                    <div className="dk" style={themeVars(theme)}>
                        {selected ? <Preview>{runtime.slides[selectedIdx]!.render()}</Preview> : <p className="dke-empty">No slide selected.</p>}
                    </div>
                </main>

                {/* Inspector */}
                <aside className="dke-inspect">
                    {selected ? (
                        <SlideInspector
                            slide={selected}
                            onSlidePatch={(patch) => dispatch({ type: "updateSlide", id: selected.id, patch })}
                            onAddBlock={(block) => dispatch({ type: "addBlock", slideId: selected.id, block })}
                            onBlockPatch={(index, patch) => dispatch({ type: "updateBlock", slideId: selected.id, index, patch })}
                            onBlockMove={(from, to) => dispatch({ type: "moveBlock", slideId: selected.id, from, to })}
                            onBlockRemove={(index) => dispatch({ type: "removeBlock", slideId: selected.id, index })}
                        />
                    ) : (
                        <p className="dke-empty">Add or select a slide to edit it.</p>
                    )}
                </aside>
            </div>
        </div>
    );
}

/** Scales the selected slide's artboard to fit the preview pane. */
function Preview({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.5);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            const r = el.getBoundingClientRect();
            setScale(Math.max(0.1, Math.min((r.width - 24) / 1100, (r.height - 24) / 850)));
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    return (
        <div ref={ref} className="dke-preview__fit">
            <ScaledPage scale={scale} width={1100} height={850}>{children}</ScaledPage>
        </div>
    );
}

/* ─── Inspector ─── */

function SlideInspector({
    slide, onSlidePatch, onAddBlock, onBlockPatch, onBlockMove, onBlockRemove,
}: {
    slide: CoverSlideJson | ContentSlideJson;
    onSlidePatch: (patch: Partial<CoverSlideJson | ContentSlideJson>) => void;
    onAddBlock: (block: BlockJson) => void;
    onBlockPatch: (index: number, patch: Partial<BlockJson>) => void;
    onBlockMove: (from: number, to: number) => void;
    onBlockRemove: (index: number) => void;
}) {
    return (
        <div className="dke-form">
            <Field label="Label" value={slide.label} onChange={(v) => onSlidePatch({ label: v })} />
            {slide.kind === "cover" ? (
                <>
                    <Field label="Eyebrow" value={slide.eyebrow} onChange={(v) => onSlidePatch({ eyebrow: v })} />
                    <Field label="Title" value={slide.title} onChange={(v) => onSlidePatch({ title: v })} hint="use *word* for emphasis" />
                    <Field label="Sub" value={slide.sub ?? ""} onChange={(v) => onSlidePatch({ sub: v })} area />
                </>
            ) : (
                <>
                    <div className="dke-blocks">
                        {slide.blocks.map((b, i) => (
                            <div key={i} className="dke-block">
                                <div className="dke-block__head">
                                    <span className="dke-block__type">{b.block}</span>
                                    <span className="dke-block__acts">
                                        <button title="Up" disabled={i === 0} onClick={() => onBlockMove(i, i - 1)}>↑</button>
                                        <button title="Down" disabled={i === slide.blocks.length - 1} onClick={() => onBlockMove(i, i + 1)}>↓</button>
                                        <button title="Remove" onClick={() => onBlockRemove(i)}>✕</button>
                                    </span>
                                </div>
                                <BlockFields block={b} onPatch={(patch) => onBlockPatch(i, patch)} />
                            </div>
                        ))}
                    </div>
                    <AddBlock onAdd={onAddBlock} />
                </>
            )}
        </div>
    );
}

function BlockFields({ block, onPatch }: { block: BlockJson; onPatch: (patch: Partial<BlockJson>) => void }) {
    switch (block.block) {
        case "opener":
            return (
                <>
                    <Field label="Eyebrow" value={block.eyebrow} onChange={(v) => onPatch({ eyebrow: v } as Partial<BlockJson>)} />
                    <Field label="Headline" value={block.headline} onChange={(v) => onPatch({ headline: v } as Partial<BlockJson>)} hint="*emphasis*" />
                    <Field label="Lede" value={block.lede ?? ""} onChange={(v) => onPatch({ lede: v } as Partial<BlockJson>)} area />
                </>
            );
        case "paragraph":
            return <Field label="Text" value={block.text} onChange={(v) => onPatch({ text: v } as Partial<BlockJson>)} area />;
        case "callout":
            return <Field label="Text" value={block.text} onChange={(v) => onPatch({ text: v } as Partial<BlockJson>)} area />;
        case "quote":
            return (
                <>
                    <Field label="Text" value={block.text} onChange={(v) => onPatch({ text: v } as Partial<BlockJson>)} area />
                    <Field label="Cite" value={block.cite ?? ""} onChange={(v) => onPatch({ cite: v } as Partial<BlockJson>)} />
                </>
            );
        case "bullets":
            return (
                <Field
                    label="Items (one per line)"
                    value={block.items.join("\n")}
                    onChange={(v) => onPatch({ items: v.split("\n").filter(Boolean) } as Partial<BlockJson>)}
                    area
                />
            );
        default:
            // statband / barchart / datatable / spacer — edit as JSON for now.
            return <JsonField block={block} onPatch={onPatch} />;
    }
}

function JsonField({ block, onPatch }: { block: BlockJson; onPatch: (patch: Partial<BlockJson>) => void }) {
    const [text, setText] = useState(() => JSON.stringify(block, null, 2));
    const [err, setErr] = useState<string | null>(null);
    return (
        <label className="dke-field">
            <span className="dke-field__label">Block data (JSON)</span>
            <textarea
                className="dke-field__input dke-field__mono"
                rows={6}
                value={text}
                onChange={(e) => {
                    setText(e.target.value);
                    try {
                        const parsed = JSON.parse(e.target.value) as Partial<BlockJson>;
                        setErr(null);
                        onPatch(parsed);
                    } catch {
                        setErr("Invalid JSON");
                    }
                }}
            />
            {err ? <span className="dke-field__err">{err}</span> : null}
        </label>
    );
}

function AddBlock({ onAdd }: { onAdd: (block: BlockJson) => void }) {
    const [type, setType] = useState<BlockJson["block"]>("paragraph");
    return (
        <div className="dke-addblock">
            <select value={type} onChange={(e) => setType(e.target.value as BlockJson["block"])}>
                {BLOCK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={() => onAdd(defaultBlock(type))}>+ Add block</button>
        </div>
    );
}

function defaultBlock(type: BlockJson["block"]): BlockJson {
    switch (type) {
        case "opener": return { block: "opener", eyebrow: "Section", headline: "Headline" };
        case "paragraph": return { block: "paragraph", text: "Text…" };
        case "bullets": return { block: "bullets", items: ["First point"] };
        case "statband": return { block: "statband", stats: [{ value: "00", label: "Label" }] };
        case "barchart": return { block: "barchart", data: [{ label: "A", value: 1 }] };
        case "datatable": return { block: "datatable", head: ["Col"], rows: [["—"]] };
        case "callout": return { block: "callout", text: "Callout" };
        case "quote": return { block: "quote", text: "Quote" };
        case "spacer": return { block: "spacer", size: 20 };
    }
}

function Field({
    label, value, onChange, area, hint,
}: {
    label: string; value: string; onChange: (v: string) => void; area?: boolean; hint?: string;
}) {
    const common = { className: "dke-field__input", value, onChange: (e: { target: { value: string } }) => onChange(e.target.value) };
    return (
        <label className="dke-field">
            <span className="dke-field__label">{label}{hint ? <em> · {hint}</em> : null}</span>
            {area ? <textarea rows={2} {...common} /> : <input {...common} />}
        </label>
    );
}

export const _styles: CSSProperties = {}; // keeps the CSS import from being tree-shaken in some bundlers
