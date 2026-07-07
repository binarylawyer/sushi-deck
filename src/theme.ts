import type { CSSProperties } from "react";

/**
 * Brand theme. Every field maps to a `--dk-*` CSS custom property consumed by
 * `deck.css`. Pass a partial theme to `themeVars()` (or the `theme` prop on
 * DeckRuntime / ScrollView) and only the fields you set are overridden — the
 * rest fall back to the defaults baked into `deck.css`.
 *
 * The default look is a navy / gold / paper "editorial" palette; override the
 * tokens to reskin the entire kit for any brand with zero code changes.
 */
export interface DeckTheme {
    /** Primary dark / ink for headings + structural borders. */
    ink?: string;
    /** Cover-field / brand navy. */
    navy?: string;
    /** Darker navy for cover backgrounds. */
    navyDeep?: string;
    /** Accent (CTAs, eyebrows on dark). */
    gold?: string;
    /** WCAG-safe accent for text on paper. */
    goldDeep?: string;
    /** Soft accent for hover fills / accents on dark. */
    goldSoft?: string;
    /** Document/paper surface. */
    paper?: string;
    /** Deeper paper for inset callouts. */
    parchment?: string;
    /** Ceremonial oxblood (section marks, totals). */
    wax?: string;
    /** Muted metadata color. */
    slate?: string;
    /** Hairline border. */
    line?: string;
    /** Stronger hairline. */
    lineStrong?: string;
    /** Body color on the navy cover. */
    paperOnNavy?: string;
    /** Dark stage behind the artboard (present/overview/presenter). */
    stage?: string;

    /** Display/serif family (headlines). */
    fontDisplay?: string;
    /** Body/sans family. */
    fontSans?: string;
    /** Mono family (eyebrows, labels). */
    fontMono?: string;
}

const TOKEN_MAP: Record<keyof DeckTheme, string> = {
    ink: "--dk-ink",
    navy: "--dk-navy",
    navyDeep: "--dk-navy-deep",
    gold: "--dk-gold",
    goldDeep: "--dk-gold-deep",
    goldSoft: "--dk-gold-soft",
    paper: "--dk-paper",
    parchment: "--dk-parchment",
    wax: "--dk-wax",
    slate: "--dk-slate",
    line: "--dk-line",
    lineStrong: "--dk-line-strong",
    paperOnNavy: "--dk-paper-on-navy",
    stage: "--dk-stage",
    fontDisplay: "--dk-display",
    fontSans: "--dk-sans",
    fontMono: "--dk-mono",
};

/**
 * Convert a partial theme to an inline style object of `--dk-*` variables,
 * spread onto the `.dk` root. Unset fields are omitted so `deck.css` defaults win.
 */
export function themeVars(theme?: DeckTheme): CSSProperties {
    if (!theme) return {};
    const out: Record<string, string> = {};
    for (const key of Object.keys(theme) as (keyof DeckTheme)[]) {
        const value = theme[key];
        if (value != null) out[TOKEN_MAP[key]] = value;
    }
    return out as CSSProperties;
}
