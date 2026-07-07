import { Fragment, type ReactNode } from "react";
import type { Deck } from "../types";
import { Cover, Opener, SlidePage, Mark } from "../primitives";
import { StatBand, Stat, BarChart, DataTable, Callout, Quote, Bullets } from "../blocks";
import type { BlockJson, ContentSlideJson, DeckJson, RichText, SlideJson } from "./schema";

/** Parse inline `*emphasis*` into italic-accent <em>. */
export function richText(text: RichText): ReactNode {
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((p, i) => {
        if (p.startsWith("*") && p.endsWith("*") && p.length > 2) {
            return <em key={i}>{p.slice(1, -1)}</em>;
        }
        return <Fragment key={i}>{p}</Fragment>;
    });
}

function renderBlock(b: BlockJson, key: number): ReactNode {
    switch (b.block) {
        case "opener":
            return <Opener key={key} eyebrow={b.eyebrow} lede={b.lede ? richText(b.lede) : undefined}>{richText(b.headline)}</Opener>;
        case "paragraph":
            return (
                <p key={key} style={{ fontFamily: "var(--dk-sans)", fontSize: 16, lineHeight: 1.7, color: "color-mix(in srgb, var(--dk-ink) 80%, transparent)", margin: 0, maxWidth: "64ch" }}>
                    {richText(b.text)}
                </p>
            );
        case "bullets":
            return <Bullets key={key} items={b.items.map((it) => richText(it))} marker={b.marker} />;
        case "statband":
            return (
                <StatBand key={key}>
                    {b.stats.map((s, i) => <Stat key={i} value={s.value} label={s.label} sub={s.sub} />)}
                </StatBand>
            );
        case "barchart":
            return <BarChart key={key} data={b.data} unit={b.unit} height={b.height} />;
        case "datatable":
            return <DataTable key={key} head={b.head} rows={b.rows} align={b.align} />;
        case "callout":
            return <Callout key={key} tone={b.tone}>{richText(b.text)}</Callout>;
        case "quote":
            return <Quote key={key} cite={b.cite}>{richText(b.text)}</Quote>;
        case "spacer":
            return <div key={key} style={{ height: b.size ?? 20 }} />;
        default: {
            // Exhaustiveness guard: unknown block types render nothing.
            return null;
        }
    }
}

function renderContentSlide(s: ContentSlideJson, idx: string): ReactNode {
    return (
        <SlidePage
            idx={idx}
            label={s.label}
            idxPrefix={s.idxPrefix}
            mark={s.mark ? <Mark label={s.mark.label} sup={s.mark.sup} /> : undefined}
            disclaimer={s.disclaimer}
        >
            <div style={{ display: "grid", gap: 20 }}>
                {s.blocks.map((b, i) => renderBlock(b, i))}
            </div>
        </SlidePage>
    );
}

function renderSlide(s: SlideJson, index: number, total: number): ReactNode {
    const idx = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    if (s.kind === "cover") {
        return (
            <Cover
                label={s.label}
                eyebrow={s.eyebrow}
                title={richText(s.title)}
                sub={s.sub ? richText(s.sub) : undefined}
                meta={s.meta}
            />
        );
    }
    return renderContentSlide(s, idx);
}

/**
 * Convert a serializable `DeckJson` into a runtime `Deck` for DeckRuntime /
 * ScrollView. The deck's theme (if any) is returned on the Deck via a closure —
 * pass `deck.theme` yourself, or read it from the json. (Themes aren't part of
 * the runtime Deck type; apply it via the `theme` prop.)
 */
export function deckFromJson(json: DeckJson): Deck {
    const total = json.slides.length;
    return {
        slug: json.slug,
        title: json.title,
        summary: json.summary,
        width: json.width,
        height: json.height,
        slides: json.slides.map((s, i) => ({
            id: s.id,
            label: s.label,
            notes: s.notes,
            render: () => renderSlide(s, i, total),
        })),
    };
}
