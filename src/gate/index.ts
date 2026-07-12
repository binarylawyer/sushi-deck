/**
 * @binarylawyer/sushi-deck-kit/gate — optional shared-password gate.
 *
 * Server helpers (Node runtime) + a client form. The kit's core is
 * auth-agnostic; use this only if you want the simple "one password unlocks
 * the deck" flow. See the README for the ~15-line wiring.
 */
export {
    hashPassword,
    verifyPassword,
    signGateCookie,
    verifyGateCookie,
    gateCookieName,
} from "./verify";
export { PasswordGate } from "./PasswordGate";
