import type { ReactNode } from "react";

/**
 * Composable slide building blocks. Author slides from these instead of raw
 * HTML and they stay on-brand + reskin with the theme. They render the class
 * names styled in `deck.css` (scoped under `.dk`).
 */

/** Brand mark — a small structural glyph + label (+ optional superscript). */
export function Mark({ label = "Deck", sup }: { label?: string; sup?: string }) {
    return (
        <div className="dk-mark">
            <span className="dk-mark__glyph" aria-hidden />
            {label}
            {sup ? <sup>{sup}</sup> : null}
        </div>
    );
}

/**
 * Standard interior slide: header (mark + index), rule, body slot, and an
 * optional disclaimer footer. `data-screen-label` feeds the overview grid.
 */
export function SlidePage({
    idx,
    label,
    children,
    mark,
    idxPrefix = "",
    disclaimer,
}: {
    /** e.g. "02 / 18" */
    idx: string;
    /** e.g. "02 · The landscape" (used as the overview label) */
    label: string;
    children: ReactNode;
    /** Brand element in the header. Defaults to <Mark />. */
    mark?: ReactNode;
    /** Optional text before the index, e.g. "Decision aid · ". */
    idxPrefix?: string;
    /** Optional footer disclaimer; omitted if not provided. */
    disclaimer?: ReactNode;
}) {
    return (
        <section className="dk-page" data-screen-label={label}>
            <div className="dk-head">
                {mark ?? <Mark />}
                <div className="dk-idx">
                    {idxPrefix}
                    {idx}
                </div>
            </div>
            <div className="dk-headrule" />
            <div className="dk-body">{children}</div>
            {disclaimer != null ? (
                <div className="dk-foot">
                    <p className="dk-disclaimer">{disclaimer}</p>
                </div>
            ) : null}
        </section>
    );
}

/** Opener block: eyebrow + headline (+ optional lede). */
export function Opener({
    eyebrow,
    children,
    lede,
}: {
    eyebrow: string;
    children: ReactNode;
    lede?: ReactNode;
}) {
    return (
        <div className="dk-opener">
            <div className="dk-eyebrow">{eyebrow}</div>
            <h2>{children}</h2>
            {lede ? <p className="dk-lede">{lede}</p> : null}
        </div>
    );
}

/** Cover slide: dark field, eyebrow, display title, sub, and a meta foot. */
export function Cover({
    eyebrow,
    title,
    sub,
    meta,
    label = "Cover",
}: {
    eyebrow: string;
    title: ReactNode;
    sub?: ReactNode;
    meta?: { dt: string; dd: ReactNode }[];
    label?: string;
}) {
    return (
        <section className="dk-page dk-cover" data-screen-label={label}>
            <div className="dk-cover-inner">
                <div className="dk-cover-eyebrow">{eyebrow}</div>
                <div className="dk-cover-rule" />
                <h1>{title}</h1>
                {sub ? <p className="dk-cover-sub">{sub}</p> : null}
                {meta && meta.length > 0 ? (
                    <dl className="dk-cover-foot">
                        {meta.map((m, i) => (
                            <div key={i}>
                                <dt>{m.dt}</dt>
                                <dd>{m.dd}</dd>
                            </div>
                        ))}
                    </dl>
                ) : null}
            </div>
        </section>
    );
}
