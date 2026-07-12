import { defineConfig } from "vitest/config";

/**
 * Tests run in a Node environment. Rendering tests use react-dom/server
 * (renderToStaticMarkup) rather than a DOM, so no jsdom is needed. Path
 * aliases mirror tsconfig so tests import the package by name.
 */
export default defineConfig({
    resolve: {
        alias: {
            "@binarylawyer/sushi-deck/json": new URL("./src/json/index.ts", import.meta.url).pathname,
            "@binarylawyer/sushi-deck/store": new URL("./src/store/index.ts", import.meta.url).pathname,
            "@binarylawyer/sushi-deck/gate": new URL("./src/gate/index.ts", import.meta.url).pathname,
            "@binarylawyer/sushi-deck": new URL("./src/index.ts", import.meta.url).pathname,
        },
    },
    test: {
        globals: true,
        environment: "node",
        include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    },
});
