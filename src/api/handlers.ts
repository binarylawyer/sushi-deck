import type { DeckStore } from "../store/DeckStore";
import { DeckConflictError, DeckNotFoundError, DeckValidationError } from "../store/DeckStore";
import type { GenerateInput, LlmClient } from "../generate/generate";
import { GenerationError, generateDeck } from "../generate/generate";

/**
 * Framework-agnostic deck API. `createDeckHandlers` returns a set of
 * `(Request, params?) => Response` functions built on web Fetch types, so they
 * mount directly in Next route handlers (or any Fetch-compatible runtime). The
 * behavior lives here and is unit-tested with an in-memory store + fake LLM —
 * apps just wire routes to these.
 */
export interface DeckApiDeps {
    store: DeckStore;
    /** Required only for the generate handler. */
    llm?: LlmClient;
}

export type ApiHandler = (req: Request, params?: Record<string, string | undefined>) => Promise<Response>;

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });
}

function mapError(err: unknown): Response {
    if (err instanceof DeckValidationError) return json({ error: "invalid_deck", errors: err.errors }, 422);
    if (err instanceof DeckConflictError) return json({ error: "conflict", message: err.message }, 409);
    if (err instanceof DeckNotFoundError) return json({ error: "not_found", message: err.message }, 404);
    if (err instanceof GenerationError) return json({ error: "generation_failed", errors: err.errors }, 422);
    return json({ error: "internal", message: err instanceof Error ? err.message : "error" }, 500);
}

async function readBody(req: Request): Promise<Record<string, unknown>> {
    try {
        return (await req.json()) as Record<string, unknown>;
    } catch {
        return {};
    }
}

export function createDeckHandlers(deps: DeckApiDeps): {
    list: ApiHandler;
    create: ApiHandler;
    get: ApiHandler;
    getBySlug: ApiHandler;
    update: ApiHandler;
    remove: ApiHandler;
    generate: ApiHandler;
} {
    const { store, llm } = deps;

    return {
        list: async () => {
            try {
                return json(await store.list());
            } catch (err) {
                return mapError(err);
            }
        },

        create: async (req) => {
            try {
                const body = await readBody(req);
                const rec = await store.create({ slug: body.slug as string | undefined, deck: body.deck as never });
                return json(rec, 201);
            } catch (err) {
                return mapError(err);
            }
        },

        get: async (_req, params) => {
            try {
                const rec = await store.get(params?.id ?? "");
                return rec ? json(rec) : json({ error: "not_found" }, 404);
            } catch (err) {
                return mapError(err);
            }
        },

        getBySlug: async (_req, params) => {
            try {
                const rec = await store.getBySlug(params?.slug ?? "");
                return rec ? json(rec) : json({ error: "not_found" }, 404);
            } catch (err) {
                return mapError(err);
            }
        },

        update: async (req, params) => {
            try {
                const body = await readBody(req);
                const rec = await store.update(params?.id ?? "", {
                    deck: body.deck as never,
                    slug: body.slug as string | undefined,
                    expectedVersion: body.expectedVersion as number | undefined,
                });
                return json(rec);
            } catch (err) {
                return mapError(err);
            }
        },

        remove: async (_req, params) => {
            try {
                await store.remove(params?.id ?? "");
                return new Response(null, { status: 204 });
            } catch (err) {
                return mapError(err);
            }
        },

        generate: async (req) => {
            if (!llm) return json({ error: "generation_unavailable" }, 501);
            try {
                const body = await readBody(req);
                const deck = await generateDeck(body as unknown as GenerateInput, llm);
                return json(deck);
            } catch (err) {
                return mapError(err);
            }
        },
    };
}
