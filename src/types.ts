import type { ComponentType, ReactNode } from "react";

/** A single slide: a fixed-canvas artboard plus optional speaker notes. */
export interface SlideDef {
    /** Stable id used in the URL hash / overview. */
    id: string;
    /** Short label shown in the overview and presenter view. */
    label: string;
    /** The slide artboard. Should render a `.dk-page` section (width x height). */
    render: () => ReactNode;
    /** Speaker notes, shown only in presenter mode. */
    notes?: string;
}

/** A deck: metadata + ordered slides. */
export interface Deck {
    /** Optional url-safe id; useful when routing by slug. */
    slug?: string;
    title: string;
    /** One-line description for a deck index. */
    summary?: string;
    /** Fixed artboard dimensions. Defaults to 1100x850 (Letter landscape). */
    width?: number;
    height?: number;
    slides: SlideDef[];
}

/**
 * Optional component overrides so the kit stays framework-agnostic. Pass your
 * framework's link component (e.g. Next's `Link`, React Router's `Link`) and
 * the runtime uses it for its chrome links; otherwise it falls back to `<a>`.
 */
export interface LinkProps {
    href: string;
    className?: string;
    title?: string;
    children?: ReactNode;
    "aria-label"?: string;
}

export interface DeckComponents {
    Link?: ComponentType<LinkProps>;
}

export const DEFAULT_PAGE_W = 1100;
export const DEFAULT_PAGE_H = 850;
