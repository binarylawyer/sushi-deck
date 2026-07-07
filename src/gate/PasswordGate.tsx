"use client";

import { useState, type FormEvent, type ReactNode } from "react";

/**
 * Optional password-gate form (client). Renders a minimal, on-brand password
 * prompt. On submit it calls `onSubmit(password)` — wire that to POST to your
 * verify route (which sets the signed gate cookie via the server helpers) and
 * return `true` on success. On success the page is reloaded so the now-cookied
 * request renders the deck.
 *
 * This component is intentionally self-contained (inline styles) so it needs
 * no stylesheet and can front any deck or app.
 */
export function PasswordGate({
    onSubmit,
    title = "This presentation is private",
    subtitle = "Enter the password you were given to continue.",
    brand,
    accent = "#C99D56",
}: {
    /** Verify the password; return true on success. */
    onSubmit: (password: string) => boolean | Promise<boolean>;
    title?: string;
    subtitle?: string;
    /** Optional brand line above the title. */
    brand?: ReactNode;
    /** Accent color for the button + focus. */
    accent?: string;
}) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function handle(e: FormEvent) {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setError(null);
        try {
            const ok = await onSubmit(password);
            if (ok) {
                window.location.reload();
            } else {
                setError("That password wasn't recognized.");
                setBusy(false);
            }
        } catch {
            setError("Something went wrong. Try again.");
            setBusy(false);
        }
    }

    return (
        <div style={wrap}>
            <form onSubmit={handle} style={card}>
                {brand ? <div style={brandLine}>{brand}</div> : null}
                <h1 style={h1}>{title}</h1>
                <p style={sub}>{subtitle}</p>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoFocus
                    style={{ ...input, outlineColor: accent }}
                    aria-label="Password"
                />
                {error ? <div style={err}>{error}</div> : null}
                <button type="submit" disabled={busy || !password} style={{ ...btn, background: accent, opacity: busy || !password ? 0.6 : 1 }}>
                    {busy ? "Checking…" : "Enter"}
                </button>
            </form>
        </div>
    );
}

const wrap: React.CSSProperties = {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "#0a0f16", padding: 24,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
};
const card: React.CSSProperties = { width: "100%", maxWidth: 380 };
const brandLine: React.CSSProperties = { fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(232,212,168,0.85)", marginBottom: 12 };
const h1: React.CSSProperties = { color: "#f4ecda", fontSize: 24, fontWeight: 500, margin: "0 0 8px" };
const sub: React.CSSProperties = { color: "rgba(244,236,218,0.7)", fontSize: 14, lineHeight: 1.5, margin: "0 0 20px" };
const input: React.CSSProperties = { width: "100%", padding: "12px 14px", fontSize: 15, border: "1px solid rgba(232,212,168,0.3)", background: "rgba(255,255,255,0.04)", color: "#f4ecda", borderRadius: 0, boxSizing: "border-box" };
const err: React.CSSProperties = { color: "#e88", fontSize: 13, marginTop: 10 };
const btn: React.CSSProperties = { width: "100%", marginTop: 16, padding: "12px 14px", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0a0f16", border: 0, cursor: "pointer", borderRadius: 0 };
