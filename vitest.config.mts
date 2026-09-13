import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // scripts/: the repo scripts' own parsers (e.g. the route-auth audit).
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"],
    environment: "node",
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
});
