import type { CSSProperties, ReactNode } from "react";

/**
 * Authoring blocks — the reusable content components decks are built from,
 * on top of the slide primitives. All are styled with inline styles that read
 * the `--dk-*` theme tokens (they render inside the `.dk` root), so they reskin
 * with the theme and need no extra stylesheet.
 */

const T = {
    ink: "var(--dk-ink)",
    ink80: "color-mix(in srgb, var(--dk-ink) 80%, transparent)",
    ink60: "color-mix(in srgb, var(--dk-ink) 60%, transparent)",
    gold: "var(--dk-gold-deep)",
    wax: "var(--dk-wax)",
    paper: "var(--dk-paper)",
    parchment: "var(--dk-parchment)",
    line: "var(--dk-line-strong)",
    display: "var(--dk-display)",
    sans: "var(--dk-sans)",
    mono: "var(--dk-mono)",
};

/** Mono uppercase kicker/eyebrow, standalone (outside an Opener). */
export function Kicker({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "wax" | "ink" }) {
    const color = tone === "wax" ? T.wax : tone === "ink" ? T.ink60 : T.gold;
    return (
        <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color, fontWeight: 700 }}>
            {children}
        </div>
    );
}

/** Bordered container — the structural "plate" look. */
export function Plate({
    children,
    tint = "paper",
    shadow,
    style,
}: {
    children: ReactNode;
    tint?: "paper" | "parchment";
    /** Hard-offset shadow color token, e.g. "gold" | "ink". */
    shadow?: "gold" | "ink";
    style?: CSSProperties;
}) {
    const box: CSSProperties = {
        border: "3px solid var(--dk-ink)",
        background: tint === "parchment" ? T.parchment : T.paper,
        ...(shadow ? { boxShadow: `12px 12px 0 ${shadow === "gold" ? "var(--dk-gold-deep)" : "var(--dk-ink)"}` } : {}),
        ...style,
    };
    return <div style={box}>{children}</div>;
}

/** Inset callout — parchment with an accent left border. */
export function Callout({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "wax" }) {
    return (
        <div style={{ background: T.parchment, borderLeft: `4px solid ${tone === "wax" ? T.wax : T.gold}`, padding: "20px 26px", fontFamily: T.display, fontStyle: "italic", fontSize: 20, lineHeight: 1.45, color: T.ink }}>
            {children}
        </div>
    );
}

/** A single stat tile. */
export function Stat({ value, label, sub }: { value: ReactNode; label: ReactNode; sub?: ReactNode }) {
    return (
        <div style={{ padding: "20px 22px 22px" }}>
            <div style={{ fontFamily: T.display, fontSize: 44, lineHeight: 1, color: T.ink, fontWeight: 500, letterSpacing: "-0.02em" }}>{value}</div>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: T.wax, fontWeight: 700, margin: "10px 0 6px" }}>{label}</div>
            {sub ? <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink80, lineHeight: 1.5 }}>{sub}</div> : null}
        </div>
    );
}

/** A band of stat tiles in a bordered plate, evenly divided. */
export function StatBand({ children }: { children: ReactNode }) {
    const items = Array.isArray(children) ? children : [children];
    return (
        <Plate>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
                {items.map((c, i) => (
                    <div key={i} style={{ borderLeft: i ? `1px solid ${T.line}` : "none" }}>{c}</div>
                ))}
            </div>
        </Plate>
    );
}

/** Two-column layout. `ratio` is the left fraction (0–1). */
export function TwoCol({ left, right, ratio = 0.5, gap = 24 }: { left: ReactNode; right: ReactNode; ratio?: number; gap?: number }) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: `${ratio}fr ${1 - ratio}fr`, gap }}>
            <div>{left}</div>
            <div>{right}</div>
        </div>
    );
}

/** Pull quote with optional citation. */
export function Quote({ children, cite }: { children: ReactNode; cite?: ReactNode }) {
    return (
        <figure style={{ margin: 0, padding: "8px 0" }}>
            <blockquote style={{ margin: 0, fontFamily: T.display, fontStyle: "italic", fontSize: 30, lineHeight: 1.3, color: T.ink, maxWidth: "34ch" }}>
                {children}
            </blockquote>
            {cite ? <figcaption style={{ marginTop: 14, fontFamily: T.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: T.ink60, fontWeight: 700 }}>{cite}</figcaption> : null}
        </figure>
    );
}

/** Bulleted list with accent markers. */
export function Bullets({ items, marker = "§" }: { items: ReactNode[]; marker?: string }) {
    return (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
            {items.map((it, i) => (
                <li key={i} style={{ display: "grid", gridTemplateColumns: "22px 1fr", gap: 10, fontFamily: T.sans, fontSize: 15, lineHeight: 1.55, color: T.ink80 }}>
                    <span style={{ fontFamily: T.display, color: T.gold, fontSize: 16, lineHeight: 1.4 }}>{marker}</span>
                    <span>{it}</span>
                </li>
            ))}
        </ul>
    );
}

/** A styled data table. `align` per column ("left" | "right"). */
export function DataTable({
    head,
    rows,
    align = [],
}: {
    head: ReactNode[];
    rows: ReactNode[][];
    align?: ("left" | "right")[];
}) {
    const cols = head.length;
    const at = (i: number): "left" | "right" => align[i] ?? (i === 0 ? "left" : "right");
    return (
        <Plate>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, background: "var(--dk-ink)" }}>
                {head.map((h, i) => (
                    <div key={i} style={{ padding: "10px 16px", fontFamily: T.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--dk-gold-soft)", fontWeight: 700, textAlign: at(i) }}>{h}</div>
                ))}
            </div>
            {rows.map((r, ri) => (
                <div key={ri} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, borderTop: `1px solid ${T.line}` }}>
                    {r.map((c, ci) => (
                        <div key={ci} style={{ padding: "12px 16px", fontFamily: ci === 0 ? T.display : T.sans, fontSize: ci === 0 ? 16 : 14, color: T.ink80, textAlign: at(ci), fontVariantNumeric: "tabular-nums", borderLeft: ci ? `1px solid ${T.line}` : "none" }}>{c}</div>
                    ))}
                </div>
            ))}
        </Plate>
    );
}

/** Simple vertical bar chart. Bars sized by value ÷ max. */
export function BarChart({
    data,
    max,
    height = 240,
    unit = "",
}: {
    data: { label: ReactNode; value: number; hi?: boolean }[];
    max?: number;
    height?: number;
    unit?: string;
}) {
    const top = max ?? Math.max(1, ...data.map((d) => d.value));
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 20, height, borderBottom: `2px solid var(--dk-ink)`, padding: "0 4px" }}>
            {data.map((d, i) => {
                const h = Math.max(2, (d.value / top) * (height - 40));
                return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                        <div style={{ fontFamily: T.mono, fontSize: 12, color: T.ink, fontWeight: 700, marginBottom: 6, fontVariantNumeric: "tabular-nums" }}>{unit}{d.value.toLocaleString()}</div>
                        <div style={{ width: "72%", height: h, background: d.hi ? "var(--dk-gold-deep)" : "var(--dk-navy)" }} />
                        <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink60, fontWeight: 700, marginTop: 8, textAlign: "center" }}>{d.label}</div>
                    </div>
                );
            })}
        </div>
    );
}
