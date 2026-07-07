# @binarylawyer/deck-kit

A portable presentation / slide-deck kit. Typed React slides on a fixed, scaled
artboard, shown as a **deck** (present mode), a **scroll** page, or **printed to
PDF** — with an **overview grid** and a **presenter view** (speaker notes +
timer). Auth-agnostic and fully **themeable**, so it drops into any of your apps
and reskins per brand with zero code changes.

Extracted from the presentation engine built for Moye Law OS (itself derived
from the "Meridian" deck platform).

---

## Install

Private package — install from the repo (or your registry):

```bash
npm i github:binarylawyer/deck-kit
# or, once published:  npm i @binarylawyer/deck-kit
```

**v1 ships TypeScript source** (no build step, so `"use client"` is always
correct). In a Next app, transpile it:

```js
// next.config.js
const nextConfig = { transpilePackages: ["@binarylawyer/deck-kit"] };
export default nextConfig;
```

Peer deps: `react` / `react-dom` >= 18.

---

## Quick start

**1 — Author a deck** (`decks/q3.tsx`): plain components from the primitives.

```tsx
import type { Deck } from "@binarylawyer/deck-kit";
import { Cover, SlidePage, Opener } from "@binarylawyer/deck-kit";

export const q3: Deck = {
  slug: "q3", title: "Q3 Update",
  slides: [
    { id: "cover", label: "Cover", render: () => (
        <Cover eyebrow="Confidential" title={<>Momentum, in <em>numbers</em>.</>} />
      ), notes: "Open warm." },
    { id: "growth", label: "Growth", render: () => (
        <SlidePage idx="02 / 02" label="02 · Growth">
          <Opener eyebrow="The quarter" lede="Revenue up 38% QoQ.">Growth <em>held</em></Opener>
        </SlidePage>
      ) },
  ],
};
```

**2 — Mount it** in a client route. Import the stylesheet once.

```tsx
"use client";
import { DeckRuntime } from "@binarylawyer/deck-kit";
import "@binarylawyer/deck-kit/styles.css";
import { q3 } from "@/decks/q3";
import Link from "next/link"; // optional

export default function Page() {
  return <DeckRuntime deck={q3} homeHref="/" scrollHref="/q3/scroll" components={{ Link }} />;
}
```

Scroll view:

```tsx
"use client";
import { ScrollView } from "@binarylawyer/deck-kit";
import "@binarylawyer/deck-kit/styles.css";
import { q3 } from "@/decks/q3";
export default () => <ScrollView deck={q3} presentHref="/q3" />;
```

> **Why a client route?** A slide's `render()` is a function, so the deck can't
> cross the server→client boundary as a prop. Import the deck in a client
> component (as above), or pass only a slug and resolve it client-side.

### Keyboard (present mode)
`←`/`→`/`Space` prev-next · `Home`/`End` first-last · `Esc` overview ·
`P` presenter · `F` fullscreen. **PDF:** browser Print (one artboard per
landscape page).

---

## Theming

Every color/font is a `--dk-*` token with a default. Override per brand via the
`theme` prop (or set the CSS vars on a wrapping `.dk` element):

```tsx
<DeckRuntime deck={q3} theme={{
  navy: "#10243F", gold: "#2E7D6B", goldDeep: "#20614F",
  fontDisplay: "'Fraunces', Georgia, serif",
  fontSans: "'Inter', system-ui, sans-serif",
}} />
```

Default type is system fonts (no external dependency); point `fontDisplay` /
`fontSans` / `fontMono` at your brand faces (load them however your app already
does). See `DeckTheme` in `src/theme.ts` for the full token list.

---

## Optional password gate

The core has **no** auth. For the common "one password unlocks the deck" case,
`@binarylawyer/deck-kit/gate` provides server crypto helpers + a client form.

```ts
// one-time: store the hash, not the password
import { hashPassword } from "@binarylawyer/deck-kit/gate";
console.log(hashPassword("your-deck-password")); // → put in DECK_PASSWORD_HASH
```

```ts
// app/api/deck-gate/route.ts  (Node runtime)
import { verifyPassword, signGateCookie, gateCookieName } from "@binarylawyer/deck-kit/gate";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { password } = await req.json();
  if (!verifyPassword(password, process.env.DECK_PASSWORD_HASH!)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  (await cookies()).set(gateCookieName("q3"), signGateCookie(process.env.DECK_GATE_SECRET!), {
    httpOnly: true, sameSite: "lax", secure: true, path: "/q3",
  });
  return Response.json({ ok: true });
}
```

```tsx
// the deck page: gate first, then render
import { verifyGateCookie, gateCookieName, PasswordGate } from "@binarylawyer/deck-kit/gate";
import { cookies } from "next/headers";

export default async function Page() {
  const ok = verifyGateCookie((await cookies()).get(gateCookieName("q3"))?.value, process.env.DECK_GATE_SECRET!);
  if (!ok) return <PasswordGate onSubmit={async (p) => (await fetch("/api/deck-gate", { method: "POST", body: JSON.stringify({ password: p }) })).ok} />;
  return <DeckClient />; // the "use client" DeckRuntime wrapper
}
```

For per-recipient magic links + access logs (heavier), keep that in the app —
Moye Law OS does exactly this and renders the same `DeckRuntime`.

---

## API

| Export | What |
|---|---|
| `DeckRuntime` | Present / overview / presenter / fullscreen runtime. Props: `deck`, `homeHref?`, `scrollHref?`, `components?`, `theme?`. |
| `ScrollView` | Scrollable stacked view. Props: `deck`, `presentHref?`, `homeHref?`, `components?`, `theme?`. |
| `SlidePage`, `Opener`, `Cover`, `Mark` | Slide primitives (frame + header). |
| `Plate`, `Callout`, `Kicker`, `Stat`, `StatBand`, `TwoCol`, `Quote`, `Bullets`, `DataTable`, `BarChart` | Authoring blocks — the reusable content components. See `examples/styleguide-deck.tsx`. |
| `ScaledPage` | Low-level artboard scaler. |
| `themeVars`, `DeckTheme` | Theme → CSS-var helper + type. |
| `Deck`, `SlideDef`, `DeckComponents` | Types. |
| `@binarylawyer/deck-kit/gate` | Optional password gate (server helpers + `PasswordGate`). |

Artboard defaults to **1100×850** (Letter landscape); override per deck with
`width` / `height`.

## Roadmap

- v0.2 — ✅ authoring blocks (stat / chart / table / callout / quote / two-col)
  + styleguide example. Still to come: a compiled `dist` build for non-Next
  consumers.
- v0.3 — a data-driven deck format (JSON) enabling non-dev, in-admin slide
  add/remove/reorder across apps.
