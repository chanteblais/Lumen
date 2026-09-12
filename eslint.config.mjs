import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // src/core is framework-agnostic: domain logic + AI assembly only.
    // It must stay liftable into a package for a mobile client or worker.
    files: ["src/core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["next", "next/*"], message: "src/core must not import Next.js." },
            { group: ["react", "react/*", "react-dom", "react-dom/*"], message: "src/core must not import React." },
            { group: ["@/app/*", "@/components/*"], message: "src/core must not import app or UI code." },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
