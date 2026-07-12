/**
 * @binarylawyer/sushi-deck/generate — AI deck generation.
 *
 * Turn a brief (+ optional brand) into a validated `DeckJson`. The LLM is
 * injected (an `LlmClient` interface), so this is deterministic and
 * network-free in tests (pass a fake) and provider-agnostic in production
 * (wrap the Claude API, or any model, in the interface).
 */
export type { LlmClient, GenerateInput } from "./generate";
export { generateDeck, GenerationError, extractJson } from "./generate";
export { buildDeckPrompt } from "./prompt";
