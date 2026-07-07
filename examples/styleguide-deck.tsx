import type { Deck } from "@binarylawyer/deck-kit";
import {
    SlidePage,
    Opener,
    Cover,
    Kicker,
    Plate,
    Callout,
    Stat,
    StatBand,
    TwoCol,
    Quote,
    Bullets,
    DataTable,
    BarChart,
} from "@binarylawyer/deck-kit";

/**
 * Styleguide deck — one slide per authoring block, so you can see the kit's
 * building blocks and copy from them. Render it like any deck.
 */

function Title() {
    return (
        <Cover
            eyebrow="@binarylawyer/deck-kit · Styleguide"
            title={<>The <em>blocks</em>.</>}
            sub="Every reusable content component, one per slide. Copy from these to build any deck."
            meta={[{ dt: "Version", dd: "0.2.0" }, { dt: "Artboard", dd: "1100 × 850" }]}
        />
    );
}

function Stats() {
    return (
        <SlidePage idx="02 / 05" label="02 · Stats">
            <Opener eyebrow="StatBand + Stat" lede="A band of evenly-divided stat tiles.">The <em>numbers</em></Opener>
            <div style={{ marginTop: 24 }}>
                <StatBand>
                    <Stat value="38%" label="QoQ growth" sub="Up from 21% last quarter." />
                    <Stat value="120%" label="Net retention" sub="Expansion outpaced churn." />
                    <Stat value="$4.2M" label="ARR" sub="Crossed in June." />
                </StatBand>
            </div>
        </SlidePage>
    );
}

function Chart() {
    return (
        <SlidePage idx="03 / 05" label="03 · Chart">
            <Opener eyebrow="BarChart" lede="Bars sized by value ÷ max; highlight one with hi.">The <em>trend</em></Opener>
            <div style={{ marginTop: 28 }}>
                <BarChart
                    unit="$"
                    data={[
                        { label: "Q1", value: 1800000 },
                        { label: "Q2", value: 2600000 },
                        { label: "Q3", value: 4200000, hi: true },
                        { label: "Q4e", value: 5500000 },
                    ]}
                />
            </div>
        </SlidePage>
    );
}

function Table() {
    return (
        <SlidePage idx="04 / 05" label="04 · Table">
            <Opener eyebrow="DataTable" lede="Header + rows; per-column alignment.">The <em>plan</em></Opener>
            <div style={{ marginTop: 22 }}>
                <DataTable
                    head={["Tier", "Seats", "Price", "MRR"]}
                    align={["left", "right", "right", "right"]}
                    rows={[
                        ["Starter", "1–5", "$29", "$1,450"],
                        ["Team", "6–25", "$99", "$4,950"],
                        ["Scale", "26+", "Custom", "$12,000"],
                    ]}
                />
            </div>
        </SlidePage>
    );
}

function Prose() {
    return (
        <SlidePage idx="05 / 05" label="05 · Prose">
            <Opener eyebrow="TwoCol · Bullets · Callout · Quote" lede="The narrative blocks.">The <em>story</em></Opener>
            <div style={{ marginTop: 20 }}>
                <TwoCol
                    ratio={0.52}
                    left={
                        <>
                            <Kicker>Why now</Kicker>
                            <div style={{ height: 12 }} />
                            <Bullets items={["The market inflected this year.", "Our wedge is defensible.", "The team has shipped this before."]} />
                        </>
                    }
                    right={<Quote cite="— A customer">This replaced three tools we were paying for.</Quote>}
                />
                <div style={{ height: 20 }} />
                <Callout>The one line you want them to remember, set apart.</Callout>
            </div>
        </SlidePage>
    );
}

export const styleguideDeck: Deck = {
    slug: "styleguide",
    title: "deck-kit · Styleguide",
    summary: "One slide per authoring block.",
    slides: [
        { id: "title", label: "Title", render: () => <Title /> },
        { id: "stats", label: "Stats", render: () => <Stats /> },
        { id: "chart", label: "Chart", render: () => <Chart /> },
        { id: "table", label: "Table", render: () => <Table /> },
        { id: "prose", label: "Prose", render: () => <Prose /> },
    ],
};
