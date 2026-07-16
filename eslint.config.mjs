import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    ignores: [
      "node_modules/",
      ".output/",
      ".nitro/",
      ".tanstack/",
      ".claude/",
      "dist/",
      "src/routeTree.gen.ts",
      "convex/_generated/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { "react-hooks": reactHooks },
    // Match the rule set next/core-web-vitals enforced pre-migration; the
    // react-hooks v7 compiler-powered rules flag inherited patterns and can
    // be adopted separately.
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
