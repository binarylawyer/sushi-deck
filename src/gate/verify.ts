/**
 * Optional shared-password gate — server helpers (Node runtime).
 *
 * A "Vimeo-style" single-password gate: one password unlocks the deck, checked
 * server-side, remembered in a signed httpOnly cookie. The kit's core is
 * auth-agnostic; this is a convenience adapter for the common "share with
 * named people" case. Wire it in a tiny route handler (see README).
 *
 * No dependencies — Node's crypto only.
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function sha256Hex(input: string): string {
    return createHash("sha256").update(input, "utf8").digest("hex");
}

/** Hash a password for storage (e.g. in an env var). Store the hex output. */
export function hashPassword(password: string): string {
    return sha256Hex(password);
}

/** Constant-time check of a submitted password against a stored SHA-256 hash. */
export function verifyPassword(input: string, storedHashHex: string): boolean {
    const a = Buffer.from(sha256Hex(input), "hex");
    const b = Buffer.from(storedHashHex, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}

function b64url(buf: Buffer): string {
    return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64urlDecode(s: string): Buffer {
    const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
    return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

/**
 * Mint a signed cookie value that grants access for `ttlSeconds` (default 12h).
 * `secret` must be a strong per-deployment string (>= 32 chars).
 */
export function signGateCookie(secret: string, ttlSeconds = 12 * 3600): string {
    requireSecret(secret);
    const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
    const body = b64url(Buffer.from(JSON.stringify({ exp }), "utf8"));
    const sig = b64url(createHmac("sha256", secret).update(body).digest());
    return `${body}.${sig}`;
}

/** Verify a gate cookie value; true if the signature matches and it's unexpired. */
export function verifyGateCookie(value: string | null | undefined, secret: string): boolean {
    if (!value || typeof value !== "string") return false;
    requireSecret(secret);
    const dot = value.indexOf(".");
    if (dot <= 0 || dot === value.length - 1) return false;
    const body = value.slice(0, dot);
    const provided = value.slice(dot + 1);
    let providedBuf: Buffer;
    let expectedBuf: Buffer;
    try {
        providedBuf = b64urlDecode(provided);
        expectedBuf = b64urlDecode(b64url(createHmac("sha256", secret).update(body).digest()));
    } catch {
        return false;
    }
    if (providedBuf.length !== expectedBuf.length) return false;
    if (!timingSafeEqual(providedBuf, expectedBuf)) return false;
    try {
        const parsed = JSON.parse(b64urlDecode(body).toString("utf8")) as { exp?: number };
        return typeof parsed.exp === "number" && parsed.exp * 1000 > Date.now();
    } catch {
        return false;
    }
}

function requireSecret(secret: string): void {
    if (!secret || secret.length < 32) {
        throw new Error("sushi-deck gate: secret is unset or too short (>= 32 chars). Generate one with `openssl rand -base64 48`.");
    }
}

/** Suggested cookie name for a deck's gate. */
export function gateCookieName(deckSlug = "deck"): string {
    return `deck_gate_${deckSlug}`;
}
