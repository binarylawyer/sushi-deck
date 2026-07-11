"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Deck, DeckComponents } from "./types";
import { DEFAULT_PAGE_H, DEFAULT_PAGE_W } from "./types";
import { ScaledPage } from "./ScaledPage";
import { themeVars, type DeckTheme } from "./theme";
import { ChevronLeft, ChevronRight, Grid, Presentation, Scroll, Maximize } from "./icons";

/**
 * The slide-deck runtime: present mode (←/→/Space, Home/End), overview grid
 * (Esc), presenter view with speaker notes + timer (P), and fullscreen (F).
 *
 * Framework-agnostic: it takes the `deck` object directly (a slide's
 * `render()` is a function, so the deck must live client-side — render this in
 * a client context) and, optionally, your framework's `Link` for its chrome
 * links. Reskin the whole thing by passing a `theme`.
 */
const PRESENT_CHROME = 132; // px reserved for the bottom control bar + padding

function useContainScale(w: number, h: number, chrome: number, reserveW = 0) {
    const [scale, setScale] = useState(0.6);
    useEffect(() => {
        function fit() {
            const availW = window.innerWidth - 64 - reserveW;
            const availH = window.innerHeight - chrome;
            setScale(Math.min(availW / w, availH / h));
        }
        fit();
        window.addEventListener("resize", fit);
        return () => window.removeEventListener("resize", fit);
    }, [w, h, chrome, reserveW]);
    return scale;
}

/** Fixed width of the present-mode sidebar rail, in px. */
const SIDEBAR_W = 378;

/** State handed to a `sidebar` render function so it can track position. */
export interface DeckRuntimeSidebarState {
    /** Zero-based index of the current slide. */
    index: number;
    /** Total slide count. */
    total: number;
}

export interface DeckRuntimeProps {
    deck: Deck;
    /** Where the deck title links to (deck index / home). Optional. */
    homeHref?: string;
    /** Where the scroll-view button links to. Omit to hide it. */
    scrollHref?: string;
    /** Inject your framework's Link (Next/React Router). Falls back to <a>. */
    components?: DeckComponents;
    /** Brand theme overrides. */
    theme?: DeckTheme;
    className?: string;
    /**
     * Optional controlled current-slide index. When provided the runtime is
     * controlled — pair it with `onIndexChange` and drive it from the parent.
     * When omitted the runtime owns its index internally (the default).
     */
    index?: number;
    /**
     * Called with the new slide index whenever the runtime navigates. Fires in
     * both controlled and uncontrolled modes, so a parent can observe position
     * (e.g. to drive a `sidebar`) without taking over navigation.
     */
    onIndexChange?: (index: number) => void;
    /**
     * Presentation chrome rendered to the left of the stage in present mode
     * (e.g. a flow-map rail). A render function receives `{ index, total }` so
     * it can highlight the current slide; a plain node is rendered as-is. Not
     * part of the deck data — it stays portable and never affects the slides.
     */
    sidebar?: ReactNode | ((state: DeckRuntimeSidebarState) => ReactNode);
    /**
     * Vertical alignment of each slide's body content within the artboard.
     * `"center"` optically centers content (matching full-frame facade decks);
     * `"top"` (default) keeps the runtime's original top-aligned flow.
     */
    contentAlign?: "top" | "center";
}

export function DeckRuntime({
    deck,
    homeHref,
    scrollHref,
    components,
    theme,
    className,
    index: controlledIndex,
    onIndexChange,
    sidebar,
    contentAlign,
}: DeckRuntimeProps) {
    const w = deck.width ?? DEFAULT_PAGE_W;
    const h = deck.height ?? DEFAULT_PAGE_H;
    const slides = deck.slides;
    const isControlled = controlledIndex != null;
    const [internalIndex, setInternalIndex] = useState(0);
    const index = isControlled ? Math.max(0, Math.min(slides.length - 1, controlledIndex)) : internalIndex;
    const [overview, setOverview] = useState(false);
    const [presenter, setPresenter] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const startRef = useRef(Date.now());

    const scale = useContainScale(w, h, PRESENT_CHROME, sidebar ? SIDEBAR_W : 0);
    const rootStyle = themeVars(theme);

    const go = useCallback(
        (n: number) => {
            const clamped = Math.max(0, Math.min(slides.length - 1, n));
            if (!isControlled) setInternalIndex(clamped);
            onIndexChange?.(clamped);
        },
        [slides.length, isControlled, onIndexChange],
    );

    useEffect(() => {
        const fromHash = parseInt((window.location.hash || "").replace("#", ""), 10);
        if (!Number.isNaN(fromHash)) go(fromHash - 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        window.history.replaceState(null, "", `#${index + 1}`);
    }, [index]);

    useEffect(() => {
        if (!presenter) return;
        const t = setInterval(() => setElapsed(Date.now() - startRef.current), 1000);
        return () => clearInterval(t);
    }, [presenter]);

    const onKey = useCallback(
        (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowRight":
                case " ":
                case "PageDown":
                    e.preventDefault();
                    if (overview) setOverview(false);
                    else go(index + 1);
                    break;
                case "ArrowLeft":
                case "PageUp":
                    e.preventDefault();
                    go(index - 1);
                    break;
                case "Home":
                    go(0);
                    break;
                case "End":
                    go(slides.length - 1);
                    break;
                case "Escape":
                    setOverview((o) => !o);
                    break;
                case "p":
                case "P":
                    setPresenter((p) => !p);
                    break;
                case "f":
                case "F":
                    if (document.fullscreenElement) void document.exitFullscreen();
                    else void document.documentElement.requestFullscreen?.();
                    break;
            }
        },
        [index, overview, go, slides.length],
    );

    useEffect(() => {
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onKey]);

    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    const timer = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    const current = slides[index];
    const next = slides[index + 1];
    const L = components?.Link;

    // ---- Overview grid ----
    if (overview) {
        return (
            <div className={`dk dk-stage dk-overview${className ? ` ${className}` : ""}`} style={rootStyle}>
                <div className="dk-overview__head">
                    <Home L={L} href={homeHref} className="dk-overview__title">
                        {deck.title}
                    </Home>
                    <span className="dk-overview__hint">Overview · press Esc or click a slide</span>
                </div>
                <div className="dk-grid">
                    {slides.map((s, i) => (
                        <button
                            key={s.id}
                            onClick={() => {
                                go(i);
                                setOverview(false);
                            }}
                            className="dk-thumb"
                        >
                            <div className="dk-thumb__frame">
                                <Thumb w={w} h={h}>{s.render()}</Thumb>
                            </div>
                            <div className="dk-thumb__label">
                                {String(i + 1).padStart(2, "0")} · {s.label}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // ---- Presenter view ----
    if (presenter) {
        return (
            <div className={`dk dk-stage dk-presenter${className ? ` ${className}` : ""}`} style={rootStyle}>
                <div className="dk-presenter__main">
                    <div className="dk-presenter__cur">Current · {index + 1} / {slides.length}</div>
                    <div className="dk-presenter__stage">
                        <FitBox w={w} h={h}>{current?.render()}</FitBox>
                    </div>
                    <PresentBar
                        deck={deck} L={L} homeHref={homeHref} scrollHref={scrollHref}
                        index={index} count={slides.length} go={go}
                        overview={() => setOverview(true)} presenter={() => setPresenter(false)} presenterActive
                    />
                </div>
                <div className="dk-notes">
                    <div className="dk-notes__top">
                        <span className="dk-notes__label">Speaker notes</span>
                        <span className="dk-notes__timer">{timer}</span>
                    </div>
                    <p className="dk-notes__body">{current?.notes ?? "— no notes for this slide —"}</p>
                    <div className="dk-notes__next">
                        <div className="dk-notes__nextlabel">Next {next ? `· ${next.label}` : "· end"}</div>
                        <div className="dk-notes__nextframe">
                            {next ? <Thumb w={w} h={h}>{next.render()}</Thumb> : <div className="dk-notes__end">End of deck</div>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ---- Present mode ----
    const sidebarNode =
        typeof sidebar === "function" ? sidebar({ index, total: slides.length }) : sidebar;
    return (
        <div
            className={`dk dk-stage dk-present${className ? ` ${className}` : ""}`}
            style={rootStyle}
            data-content-align={contentAlign}
            data-has-sidebar={sidebarNode ? "1" : undefined}
        >
            {sidebarNode ? (
                <div className="dk-rail" style={{ width: SIDEBAR_W }}>{sidebarNode}</div>
            ) : null}
            <div className="dk-present__col">
                <div className="dk-present__stage">
                    <ScaledPage scale={scale} width={w} height={h}>{current?.render()}</ScaledPage>
                </div>
                <PresentBar
                    deck={deck} L={L} homeHref={homeHref} scrollHref={scrollHref}
                    index={index} count={slides.length} go={go}
                    overview={() => setOverview(true)} presenter={() => setPresenter(true)}
                />
            </div>
        </div>
    );
}

/** Renders the deck title as a link (if href) or a plain button. */
function Home({
    L, href, className, children,
}: {
    L?: DeckComponents["Link"]; href?: string; className?: string; children: ReactNode;
}) {
    if (href) {
        if (L) return <L href={href} className={className}>{children}</L>;
        return <a href={href} className={className}>{children}</a>;
    }
    return <span className={className}>{children}</span>;
}

function FitBox({ children, w, h }: { children: ReactNode; w: number; h: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.5);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            const r = el.getBoundingClientRect();
            setScale(Math.min(r.width / w, r.height / h));
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [w, h]);
    return (
        <div ref={ref} style={{ display: "flex", height: "100%", width: "100%", alignItems: "center", justifyContent: "center" }}>
            <ScaledPage scale={scale} width={w} height={h}>{children}</ScaledPage>
        </div>
    );
}

function Thumb({ children, w, h }: { children: ReactNode; w: number; h: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.18);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setScale(el.getBoundingClientRect().width / w));
        ro.observe(el);
        return () => ro.disconnect();
    }, [w]);
    return (
        <div ref={ref} style={{ width: "100%" }}>
            <ScaledPage scale={scale} width={w} height={h} style={{ width: "100%" }}>{children}</ScaledPage>
        </div>
    );
}

function PresentBar({
    deck, L, homeHref, scrollHref, index, count, go, overview, presenter, presenterActive,
}: {
    deck: Deck; L?: DeckComponents["Link"]; homeHref?: string; scrollHref?: string;
    index: number; count: number; go: (n: number) => void;
    overview: () => void; presenter: () => void; presenterActive?: boolean;
}) {
    return (
        <div className="dk-bar">
            <Home L={L} href={homeHref} className="dk-bar__title">{deck.title}</Home>
            <div className="dk-bar__nav">
                <button onClick={() => go(index - 1)} disabled={index === 0} className="dk-btn" aria-label="Previous slide">
                    <ChevronLeft size={20} />
                </button>
                <span className="dk-bar__count">{String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
                <button onClick={() => go(index + 1)} disabled={index === count - 1} className="dk-btn" aria-label="Next slide">
                    <ChevronRight size={20} />
                </button>
            </div>
            <div className="dk-bar__tools">
                <button onClick={overview} className="dk-btn" title="Overview (Esc)" aria-label="Overview"><Grid size={17} /></button>
                <button onClick={presenter} className="dk-btn" data-active={presenterActive ? "1" : undefined} title="Presenter (P)" aria-label="Presenter view"><Presentation size={17} /></button>
                {scrollHref ? (
                    L ? (
                        <L href={scrollHref} className="dk-btn" title="Scroll view" aria-label="Scroll view"><Scroll size={17} /></L>
                    ) : (
                        <a href={scrollHref} className="dk-btn" title="Scroll view" aria-label="Scroll view"><Scroll size={17} /></a>
                    )
                ) : null}
                <button
                    onClick={() => document.fullscreenElement ? void document.exitFullscreen() : void document.documentElement.requestFullscreen?.()}
                    className="dk-btn" title="Fullscreen (F)" aria-label="Fullscreen"
                ><Maximize size={17} /></button>
            </div>
        </div>
    );
}
