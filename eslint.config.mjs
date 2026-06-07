import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// eslint-config-next ships native flat configs as of v16, so we compose them
// directly. (The previous FlatCompat-based setup crashed under ESLint 9 with a
// "Converting circular structure to JSON" error.)
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Project-wide rule tuning. `no-explicit-any` and `no-unused-vars` are kept
    // as warnings (not errors) to match the existing codebase style (the
    // payment/delivery provider config pattern uses `Record<string, any>`).
    // These are tracked as lint debt to burn down and re-promote to errors.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Node CommonJS helper scripts are not part of the app bundle.
    files: ["scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
];

export default eslintConfig;
