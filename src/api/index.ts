/**
 * @binarylawyer/sushi-deck-kit/api — framework-agnostic deck API handlers.
 *
 * `createDeckHandlers({ store, llm })` returns Fetch `(Request) => Response`
 * handlers for CRUD + generate. Mount them in your app's routes; the behavior
 * is unit-tested here against an in-memory store, so every app gets the same,
 * proven API.
 */
export { createDeckHandlers } from "./handlers";
export type { DeckApiDeps, ApiHandler } from "./handlers";
