"use client";

import { useEffect, useState } from "react";
import type { Deck, DeckComponents } from "./types";
import { DEFAULT_PAGE_H, DEFAULT_PAGE_W } from "./types";
import { ScaledPage } from "./ScaledPage";
import { themeVars, type DeckTheme } from "./theme";
import { Play } from "./icons";

/**
 * Scrollable "product presentation" view: the same artboards stacked
 * vertically, scaled to fit width (max 1:1). Shares the exact slide
 * components as present mode.
 */
export interface ScrollViewProps {
    deck: Deck;
    /** Where the "Present" button links to. Omit to hide it. */
    presentHref?: string;
    /** Where the deck title links to. Optional. */
    homeHref?: string;
    components?: DeckComponents;
    theme?: DeckTheme;
    className?: string;
}

export function ScrollView({
    deck,
    presentHref,
    homeHref,
    components,
    theme,
    className,
}: ScrollViewProps) {
    const w = deck.width ?? DEFAULT_PAGE_W;
    const h = deck.height ?? DEFAULT_PAGE_H;
    const [scale, setScale] = useState(0.8);
    const L = components?.Link;

    useEffect(() => {
        function fit() {
            const avail = Math.min(window.innerWidth - 40, w);
            setScale(avail / w);
        }
        fit();
        window.addEventListener("resize", fit);
        return () => window.removeEventListener("resize", fit);
    }, [w]);

    const title = homeHref ? (
        L ? (
            <L href={homeHref} className="dk-scroll__title">{deck.title}</L>
        ) : (
            <a href={homeHref} className="dk-scroll__title">{deck.title}</a>
        )
    ) : (
        <span className="dk-scroll__title">{deck.title}</span>
    );

    const present = presentHref ? (
        L ? (
            <L href={presentHref} className="dk-scroll__present"><Play size={13} /> Present</L>
        ) : (
            <a href={presentHref} className="dk-scroll__present"><Play size={13} /> Present</a>
        )
    ) : null;

    return (
        <div className={`dk dk-scroll${className ? ` ${className}` : ""}`} style={themeVars(theme)}>
            {(homeHref || presentHref) ? (
                <div className="dk-scroll__bar">
                    {title}
                    {present}
                </div>
            ) : null}
            {deck.slides.map((s) => (
                <ScaledPage key={s.id} scale={scale} width={w} height={h}>
                    {s.render()}
                </ScaledPage>
            ))}
        </div>
    );
}
