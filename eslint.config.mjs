import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";

export default [
  // TypeScript files
  ...tseslint.configs.recommended,

  // Astro files
  ...eslintPluginAstro.configs.recommended,

  // Global settings for all files
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      // Remove unused imports automatically with lint:fix
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" },
      ],
      // Disable the TS version since unused-imports/no-unused-vars handles this better
      "@typescript-eslint/no-unused-vars": "off",
      // TypeScript: allow `any` in a few cases since we're not in strict mode yet
      "@typescript-eslint/no-explicit-any": "warn",
      // Prefer const over let when the variable is never reassigned
      "prefer-const": "warn",
      // Catch accidental == instead of ===
      eqeqeq: ["warn", "always", { null: "ignore" }],
    },
  },

  // Ignore build artifacts, generated files, and third-party inline scripts
  {
    ignores: [
      "dist/",
      ".astro/",
      ".netlify/",
      "node_modules/",
      "public/",
      // Contains minified third-party inline scripts (Facebook Pixel) that use
      // old-style JS (var, arguments, .apply) — not our code to lint
      "src/components/BaseHead.astro",
    ],
  },
];
